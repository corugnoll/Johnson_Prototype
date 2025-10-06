# JOHNSON PROTOTYPE: PERCENTAGE OPERATOR & PREVENTION CONDITIONS
## Technical Implementation Specification

**Document Version**: 1.0
**Date**: 2025-10-06
**Status**: Ready for Implementation

---

## EXECUTIVE SUMMARY

This specification outlines the implementation of three interconnected features for the Johnson Prototype:

1. **Percentage Operator (%)**: A new operator for proportional stat modifications that executes after all additive/multiplicative operations
2. **PrevDam Condition**: Triggers effects based on damage prevented by Grit
3. **PrevRisk Condition**: Triggers effects based on risk prevented by Veil

**Critical Design Constraint**: Percentage calculations must occur AFTER all other effects but BEFORE prevention mechanics apply their final stat reductions.

**Key Files Affected**:
- `js/gameState.js` (lines 236-484)
- `js/csvLoader.js` (lines 622-673)
- `editor.html` (lines 98-112)
- `CLAUDE.md` (documentation)

**Estimated Implementation Time**: 27-34 hours (3.5-4.5 working days)

---

## TABLE OF CONTENTS

1. [Feature Requirements](#feature-requirements)
2. [Implementation Phases](#implementation-phases)
3. [Task Breakdown](#task-breakdown)
4. [Technical Specifications](#technical-specifications)
5. [Testing Requirements](#testing-requirements)
6. [Risk Assessment](#risk-assessment)
7. [Implementation Timeline](#implementation-timeline)

---

## FEATURE REQUIREMENTS

### 1. Percentage Operator (%)

**Functional Requirements**:
- Add "%" as a new operator alongside +, -, *, /
- Syntax in CSV: `Condition;%;Amount;Stat` (e.g., `None;%;10;Damage`)
- Must be placeable in the editor as a "normal" operator
- Percentage calculations must execute AFTER all additive/multiplicative operations
- Must work with all existing condition types

**Calculation Semantics**:
- Formula: `new_value = current_value + (current_value * amount / 100)`
- Example: If damage is 10 (from +2 and +8), a 10% increase should add 1 damage (10% of 10)
- Supports both positive and negative percentages
- Works with condition multipliers (e.g., 3x multiplier = 30% instead of 10%)

**Example Usage**:
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color
1,Percentage Boost,+20% Damage,None;%;20;Damage,,Effect,Red
2,Conditional %,+10% Money per 3 Hacker,RunnerStat:hacker>=3;%;10;Money,,Effect,Blue
3,Damage Reduction,-15% Damage,None;%;-15;Damage,,Effect,Green
```

### 2. PrevDam Condition (Prevention-Based)

**Functional Requirements**:
- Triggers based on how much damage was prevented by Grit (2 Grit prevents 1 Damage)
- Format: `PrevDam;[operator];[amount];[stat]`
- Returns multiplier equal to the number of damage points prevented
- Must be available to all operators including the new % operator

**Calculation Semantics**:
- Multiplier = `Math.min(Math.floor(grit / 2), damage)`
- If 6 Grit and 10 Damage → 3 damage prevented → multiplier = 3
- If no damage prevented → multiplier = 0 (effect doesn't trigger)

**Example Usage**:
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color
1,Prevention Reward,+5 Money per prevented damage,PrevDam;+;5;Money,,Effect,Yellow
2,% Bonus from Prevention,+10% Money per prevented damage,PrevDam;%;10;Money,,Effect,Blue
```

### 3. PrevRisk Condition (Prevention-Based)

**Functional Requirements**:
- Identical to PrevDam but for risk prevention via Veil (2 Veil prevents 1 Risk)
- Format: `PrevRisk;[operator];[amount];[stat]`
- Returns multiplier equal to the number of risk points prevented
- Must be available to all operators including the new % operator

**Calculation Semantics**:
- Multiplier = `Math.min(Math.floor(veil / 2), risk)`
- If 8 Veil and 5 Risk → 4 potential prevention, but capped at 5 actual risk → multiplier = 4
- If no risk prevented → multiplier = 0 (effect doesn't trigger)

**Example Usage**:
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color
1,Risk Prevention Bonus,+3 Money per prevented risk,PrevRisk;+;3;Money,,Effect,Purple
2,Grit from Prevention,+1 Grit per prevented risk,PrevRisk;+;1;Grit,,Effect,Red
```

---

## IMPLEMENTATION PHASES

### Phase 1: Core Calculation Engine Refactoring
**Objective**: Restructure effect calculation to support multi-pass processing
**Duration**: 6-9 hours
**Tasks**: #1, #2

### Phase 2: Prevention-Based Conditions
**Objective**: Implement PrevDam and PrevRisk condition types
**Duration**: 7-10 hours
**Tasks**: #3, #4, #5

### Phase 3: Validation & Editor Integration
**Objective**: Update CSV validation and editor UI
**Duration**: 1.5 hours
**Tasks**: #6, #7, #8

### Phase 4: Testing & Validation
**Objective**: Comprehensive testing and regression validation
**Duration**: 12 hours
**Tasks**: #9, #10, #11, #12

### Phase 5: Documentation & Rollout
**Objective**: Update technical documentation
**Duration**: 1 hour
**Tasks**: #13

---

## TASK BREAKDOWN

### PHASE 1: CORE CALCULATION ENGINE REFACTORING

#### TASK #1: Refactor Effect Application Architecture
**PRIORITY**: Critical
**ESTIMATED TIME**: 4-6 hours
**FILE**: `js/gameState.js`
**LINES AFFECTED**: 193-216

**Objective**: Restructure the effect calculation system to support two-pass processing (standard effects, then percentage effects)

**Current Architecture**:
```javascript
calculateCurrentPools() {
    this.currentPools = this.initializePools();

    this.selectedNodes.forEach(nodeId => {
        const node = this.getNodeById(nodeId);
        if (node) {
            this.applyNodeEffects(node);
        }
    });

    this.applyPreventionMechanics();
    return { ...this.currentPools };
}
```

**New Architecture**:
```javascript
calculateCurrentPools() {
    const startTime = performance.now();

    // Reset pools
    this.currentPools = this.initializePools();

    // PASS 1: Collect and separate effects by operator type
    const standardEffects = [];
    const percentageEffects = [];

    this.selectedNodes.forEach(nodeId => {
        const node = this.getNodeById(nodeId);
        if (node && node.type !== 'Gate') {
            // Separate effects by operator type
            [node.effect1, node.effect2].forEach(effect => {
                if (!effect || effect.trim() === '') return;

                const parts = effect.split(';');
                if (parts.length >= 4) {
                    const operator = parts[1];
                    if (operator === '%') {
                        percentageEffects.push(effect);
                    } else {
                        standardEffects.push(effect);
                    }
                }
            });
        }
    });

    // PASS 2: Apply standard effects first (+, -, *, /)
    standardEffects.forEach(effect => this.applyEffect(effect));

    // PASS 3: Calculate preliminary prevention for prevention-based conditions
    this.calculatePreventionAmounts();

    // PASS 4: Apply percentage effects (after all base calculations)
    percentageEffects.forEach(effect => this.applyEffect(effect));

    // PASS 5: Apply final prevention mechanics (unchanged, runs last)
    this.applyPreventionMechanics();

    const endTime = performance.now();
    if (endTime - startTime > 100) {
        console.warn(`Slow calculation detected: ${endTime - startTime}ms for ${this.selectedNodes.length} nodes`);
    }

    return { ...this.currentPools };
}
```

**Implementation Notes**:
- Gate nodes should be skipped (they don't have effects)
- Empty effect strings should be filtered out before processing
- Performance logging should remain for debugging
- Maintain backward compatibility with existing `applyNodeEffects()` method

**Acceptance Criteria**:
- [ ] Two-pass system correctly segregates standard vs percentage effects
- [ ] Percentage effects execute only after all additive/multiplicative operations complete
- [ ] Prevention mechanics still execute last
- [ ] Existing contracts produce identical results (regression test)
- [ ] Performance remains under 100ms for 50-node contracts

---

#### TASK #2: Implement Percentage Operator Logic
**PRIORITY**: Critical
**ESTIMATED TIME**: 2-3 hours
**FILE**: `js/gameState.js`
**LINES AFFECTED**: 275-295 (switch statement in `applyEffect()`)

**Objective**: Add percentage (%) operator to the `applyEffect()` method with proper calculation semantics

**Current Code** (lines 275-295):
```javascript
switch (operator) {
    case '+':
        newValue = currentValue + effectiveAmount;
        break;
    case '-':
        newValue = currentValue - effectiveAmount;
        break;
    case '*':
        newValue = currentValue * effectiveAmount;
        break;
    case '/':
        if (effectiveAmount === 0) {
            console.warn('Division by zero in effect:', effectString);
            return;
        }
        newValue = currentValue / effectiveAmount;
        break;
    default:
        console.warn('Unknown operator in effect:', operator);
        return;
}
```

**New Code**:
```javascript
switch (operator) {
    case '+':
        newValue = currentValue + effectiveAmount;
        break;
    case '-':
        newValue = currentValue - effectiveAmount;
        break;
    case '*':
        newValue = currentValue * effectiveAmount;
        break;
    case '/':
        if (effectiveAmount === 0) {
            console.warn('Division by zero in effect:', effectString);
            return;
        }
        newValue = currentValue / effectiveAmount;
        break;
    case '%':
        // Percentage modification: current + (current * percentage/100)
        // effectiveAmount already includes condition multiplier
        const percentageMultiplier = effectiveAmount / 100;
        newValue = currentValue + (currentValue * percentageMultiplier);
        break;
    default:
        console.warn('Unknown operator in effect:', operator);
        return;
}
```

**Example Calculations**:

1. **Basic percentage increase**:
   - Current Damage = 10
   - Effect: `None;%;20;Damage`
   - Calculation: 10 + (10 * 0.2) = 12
   - Result: Damage = 12

2. **Percentage with condition multiplier**:
   - Current Money = 100
   - Effect: `RunnerStat:hacker>=3;%;10;Money`
   - Hacker stat = 9 → multiplier = 3
   - effectiveAmount = 10 * 3 = 30
   - Calculation: 100 + (100 * 0.3) = 130
   - Result: Money = 130

3. **Negative percentage (reduction)**:
   - Current Risk = 20
   - Effect: `None;%;-25;Risk`
   - Calculation: 20 + (20 * -0.25) = 15
   - Result: Risk = 15

4. **Percentage on zero base**:
   - Current Grit = 0
   - Effect: `None;%;100;Grit`
   - Calculation: 0 + (0 * 1.0) = 0
   - Result: Grit = 0 (no effect)

**Implementation Notes**:
- The `effectiveAmount` variable already includes condition multiplier from line 271
- No special handling needed for negative percentages (they work naturally)
- Division by 100 is safe (no zero division risk)
- Percentage of zero correctly equals zero

**Acceptance Criteria**:
- [ ] Percentage operator correctly calculates proportional changes
- [ ] Works with all condition types (None, RunnerType, RunnerStat, NodeColor, NodeColorCombo)
- [ ] Condition multipliers correctly amplify percentage (3x condition = 30% instead of 10%)
- [ ] Handles edge cases: 0 base value, negative percentages, very large percentages
- [ ] No NaN or Infinity results

---

### PHASE 2: PREVENTION-BASED CONDITIONS

#### TASK #3: Store Prevention Calculation Results
**PRIORITY**: High
**ESTIMATED TIME**: 3-4 hours
**FILE**: `js/gameState.js`
**LINES AFFECTED**: New method insertion around line 217

**Objective**: Create a method to calculate and store prevention amounts before effects are applied, making them available for prevention-based conditions

**Architecture Challenge**:
Prevention-based conditions create a circular dependency:
- Conditions need to know how much damage/risk is prevented
- Prevention amount depends on Grit/Veil values
- Grit/Veil values depend on effect calculations
- Effects need prevention data for PrevDam/PrevRisk conditions

**Solution**: Calculate preliminary prevention based on current pool values (which already includes standard effects but not percentage effects yet)

**New Method to Add**:
```javascript
/**
 * Calculate prevention amounts based on current pool values
 * This runs AFTER standard effects but BEFORE percentage effects
 * Stores results in this.preventionData for use by prevention-based conditions
 */
calculatePreventionAmounts() {
    // Calculate maximum prevention based on current Grit/Veil
    const maxDamagePrevention = Math.floor(this.currentPools.grit / 2);
    const maxRiskPrevention = Math.floor(this.currentPools.veil / 2);

    // Calculate actual prevention (capped at damage/risk values)
    const actualDamagePrevented = Math.min(maxDamagePrevention, this.currentPools.damage);
    const actualRiskPrevented = Math.min(maxRiskPrevention, this.currentPools.risk);

    // Store for use by prevention-based conditions
    // Note: This is preliminary data - final prevention happens in applyPreventionMechanics()
    if (!this.preventionData) {
        this.preventionData = {};
    }

    this.preventionData.preliminaryDamagePrevented = Math.max(0, actualDamagePrevented);
    this.preventionData.preliminaryRiskPrevented = Math.max(0, actualRiskPrevented);

    // Log for debugging
    if (actualDamagePrevented > 0 || actualRiskPrevented > 0) {
        console.log(`Preliminary prevention: ${actualDamagePrevented} damage, ${actualRiskPrevented} risk`);
    }
}
```

**Integration with calculateCurrentPools()**:
```javascript
// From TASK #1, add this line after standard effects:
// PASS 3: Calculate preliminary prevention for prevention-based conditions
this.calculatePreventionAmounts();
```

**Implementation Notes**:
- Use `preliminaryDamagePrevented` and `preliminaryRiskPrevented` to distinguish from final prevention
- The final prevention in `applyPreventionMechanics()` remains unchanged
- Prevention amounts must be non-negative (use Math.max(0, ...))
- Prevention is capped at actual damage/risk values, not just Grit/Veil potential

**Acceptance Criteria**:
- [ ] Prevention amounts calculated before percentage effects
- [ ] `this.preventionData.preliminaryDamagePrevented` and `preliminaryRiskPrevented` available to conditions
- [ ] Prevention calculation uses actual current pool values
- [ ] No infinite loops or circular dependencies
- [ ] Performance impact < 10ms

---

#### TASK #4: Implement PrevDam Condition Type
**PRIORITY**: High
**ESTIMATED TIME**: 2 hours
**FILE**: `js/gameState.js`
**LINES AFFECTED**: 320-368 (in `evaluateCondition()` method)

**Objective**: Add PrevDam condition evaluation to `evaluateCondition()` method

**Current Code Structure** (lines 320-368):
```javascript
evaluateCondition(condition) {
    if (!condition || condition === 'None') {
        return 1;
    }

    try {
        // RunnerType: Check if specific runner type is configured
        if (condition.startsWith('RunnerType:')) {
            // ... existing code ...
        }

        // RunnerStat: Calculate multiplier based on stat total
        if (condition.startsWith('RunnerStat:')) {
            // ... existing code ...
        }

        // NodeColor: Check if specific color nodes are selected
        if (condition.startsWith('NodeColor:')) {
            // ... existing code ...
        }

        // NodeColorCombo: Check if multiple colors are selected
        if (condition.startsWith('NodeColorCombo:')) {
            // ... existing code ...
        }

        console.warn('Unknown condition type:', condition);
        return 1;
    } catch (error) {
        console.error('Error evaluating condition:', condition, error);
        return 0;
    }
}
```

**Add Before Line 360** (before "Unknown condition type" warning):
```javascript
// PrevDam: Returns multiplier based on damage prevented by Grit
if (condition === 'PrevDam' || condition.startsWith('PrevDam;')) {
    // Handle both "PrevDam" and "PrevDam;" formats for flexibility
    if (!this.preventionData || typeof this.preventionData.preliminaryDamagePrevented !== 'number') {
        return 0; // No prevention data available
    }

    const damagePrevented = this.preventionData.preliminaryDamagePrevented;

    // Return the amount of damage prevented as the multiplier
    // If 3 damage prevented, effects using PrevDam will be 3x stronger
    return Math.max(0, damagePrevented);
}
```

**Example Usage Scenarios**:

1. **Basic additive effect**:
   - Setup: Damage = 10, Grit = 8 → 4 damage prevented
   - Effect: `PrevDam;+;5;Money`
   - Calculation: 4 (multiplier) * 5 (amount) = 20
   - Result: +20 Money

2. **Percentage effect**:
   - Setup: Damage = 6, Grit = 10 → 3 damage prevented (capped at 6)
   - Effect: `PrevDam;%;10;Money` (assume Money = 100)
   - Calculation: 3 (multiplier) * 10 (amount) = 30% total
   - Result: Money = 130 (100 + 100 * 0.3)

3. **No prevention**:
   - Setup: Damage = 5, Grit = 0 → 0 damage prevented
   - Effect: `PrevDam;+;10;Money`
   - Calculation: 0 (multiplier) * 10 (amount) = 0
   - Result: +0 Money (no effect)

**Implementation Notes**:
- Use `preliminaryDamagePrevented` from TASK #3
- Return 0 if prevention data is not available (defensive programming)
- The multiplier is the raw prevention amount, not a boolean
- Handle both `PrevDam` and `PrevDam;` formats for CSV compatibility

**Acceptance Criteria**:
- [ ] PrevDam correctly returns damage prevention multiplier
- [ ] Works with all operators (+, -, *, /, %)
- [ ] Returns 0 when no damage is prevented
- [ ] Returns 0 when prevention data is unavailable
- [ ] Edge case: Prevention > actual damage is handled correctly (capped in TASK #3)

---

#### TASK #5: Implement PrevRisk Condition Type
**PRIORITY**: High
**ESTIMATED TIME**: 2 hours
**FILE**: `js/gameState.js`
**LINES AFFECTED**: 320-368 (in `evaluateCondition()` method, after TASK #4 addition)

**Objective**: Add PrevRisk condition evaluation to `evaluateCondition()` method (identical to TASK #4 but for risk prevention)

**Add After PrevDam Implementation** (from TASK #4):
```javascript
// PrevRisk: Returns multiplier based on risk prevented by Veil
if (condition === 'PrevRisk' || condition.startsWith('PrevRisk;')) {
    // Handle both "PrevRisk" and "PrevRisk;" formats for flexibility
    if (!this.preventionData || typeof this.preventionData.preliminaryRiskPrevented !== 'number') {
        return 0; // No prevention data available
    }

    const riskPrevented = this.preventionData.preliminaryRiskPrevented;

    // Return the amount of risk prevented as the multiplier
    // If 4 risk prevented, effects using PrevRisk will be 4x stronger
    return Math.max(0, riskPrevented);
}
```

**Example Usage Scenarios**:

1. **Basic additive effect**:
   - Setup: Risk = 6, Veil = 8 → 4 risk prevented (capped at 6)
   - Effect: `PrevRisk;+;3;Money`
   - Calculation: 4 (multiplier) * 3 (amount) = 12
   - Result: +12 Money

2. **Feedback loop scenario**:
   - Setup: Risk = 10, Veil = 4 → 2 risk prevented
   - Effect: `PrevRisk;+;1;Veil`
   - Calculation: 2 (multiplier) * 1 (amount) = 2
   - Result: Veil increases by 2 (doesn't recalculate prevention mid-calculation)

3. **Percentage with high prevention**:
   - Setup: Risk = 12, Veil = 20 → 6 risk prevented (capped at 12)
   - Effect: `PrevRisk;%;5;Damage` (assume Damage = 20)
   - Calculation: 6 (multiplier) * 5 (amount) = 30% total
   - Result: Damage = 26 (20 + 20 * 0.3)

**Implementation Notes**:
- Identical structure to PrevDam (TASK #4) but uses `preliminaryRiskPrevented`
- Feedback loops are acceptable (PrevRisk adding more Veil won't recalculate mid-pass)
- Prevention calculation in TASK #3 already caps at actual risk value

**Acceptance Criteria**:
- [ ] PrevRisk correctly returns risk prevention multiplier
- [ ] Works with all operators (+, -, *, /, %)
- [ ] Returns 0 when no risk is prevented
- [ ] Returns 0 when prevention data is unavailable
- [ ] Feedback loops don't cause infinite recursion (handled by calculation pass system)

---

### PHASE 3: VALIDATION & EDITOR INTEGRATION

#### TASK #6: Update CSV Validation for Percentage Operator
**PRIORITY**: Critical
**ESTIMATED TIME**: 0.5 hours
**FILE**: `js/csvLoader.js`
**LINES AFFECTED**: 646-649

**Objective**: Extend `validateEffectString()` in csvLoader.js to accept '%' as a valid operator

**Current Code** (line 646):
```javascript
// Validate operator
const validOperators = ['+', '-', '*', '/'];
if (!validOperators.includes(operator)) {
    errors.push(`Row ${rowNumber} ${columnName}: Invalid operator '${operator}'. Must be one of: ${validOperators.join(', ')}`);
}
```

**New Code**:
```javascript
// Validate operator
const validOperators = ['+', '-', '*', '/', '%'];
if (!validOperators.includes(operator)) {
    errors.push(`Row ${rowNumber} ${columnName}: Invalid operator '${operator}'. Must be one of: ${validOperators.join(', ')}`);
}
```

**Implementation Notes**:
- This is a simple one-line change (add '%' to array)
- No additional validation logic needed for percentages
- Amount validation (lines 651-658) already handles positive/negative numbers
- Error messages will automatically include '%' in the valid operators list

**Acceptance Criteria**:
- [ ] CSV files with '%' operator pass validation
- [ ] Error messages list '%' as valid operator
- [ ] Percentage amounts validated as numbers (positive or negative)
- [ ] No regression in existing operator validation

---

#### TASK #7: Update CSV Validation for Prevention Conditions
**PRIORITY**: High
**ESTIMATED TIME**: 0.5 hours
**FILE**: `js/csvLoader.js`
**LINES AFFECTED**: 638-642

**Objective**: Extend `validateEffectString()` to recognize PrevDam and PrevRisk as valid condition types

**Current Code** (lines 638-642):
```javascript
// Validate condition
if (!condition || condition.trim() === '') {
    errors.push(`Row ${rowNumber} ${columnName}: Condition part cannot be empty`);
} else {
    const validConditionTypes = ['None', 'RunnerType:', 'RunnerStat:', 'NodeColor:', 'NodeColorCombo:'];
    const isValidCondition = condition === 'None' || validConditionTypes.some(type => condition.startsWith(type));
    if (!isValidCondition) {
        errors.push(`Row ${rowNumber} ${columnName}: Invalid condition '${condition}'. Must be 'None' or start with: ${validConditionTypes.slice(1).join(', ')}`);
    }
}
```

**New Code**:
```javascript
// Validate condition
if (!condition || condition.trim() === '') {
    errors.push(`Row ${rowNumber} ${columnName}: Condition part cannot be empty`);
} else {
    const validConditionTypes = ['None', 'RunnerType:', 'RunnerStat:', 'NodeColor:', 'NodeColorCombo:', 'PrevDam', 'PrevRisk'];
    const isValidCondition = condition === 'None' ||
                             condition === 'PrevDam' ||
                             condition === 'PrevRisk' ||
                             validConditionTypes.some(type => condition.startsWith(type));
    if (!isValidCondition) {
        errors.push(`Row ${rowNumber} ${columnName}: Invalid condition '${condition}'. Must be 'None', 'PrevDam', 'PrevRisk', or start with: RunnerType:, RunnerStat:, NodeColor:, NodeColorCombo:`);
    }
}
```

**Implementation Notes**:
- PrevDam and PrevRisk are complete conditions (no parameters like RunnerStat)
- They should be checked with `===` equality, not `startsWith()`
- Update error message to clearly list the new conditions
- Accept both `PrevDam` and `PrevDam;` formats (though only `PrevDam` is correct)

**Acceptance Criteria**:
- [ ] CSV files with `PrevDam;...` effects pass validation
- [ ] CSV files with `PrevRisk;...` effects pass validation
- [ ] Error messages updated to list new condition types
- [ ] Invalid formats still rejected (e.g., `PrevDam:something`)

---

#### TASK #8: Editor UI Documentation Update
**PRIORITY**: Low
**ESTIMATED TIME**: 0.5 hours
**FILE**: `editor.html`
**LINES AFFECTED**: 98-112

**Objective**: Update editor.html placeholder text and inline documentation to reference new features

**Current Code** (around lines 98-103):
```html
<label for="nodeEffect1">Effect 1:</label>
<input type="text" id="nodeEffect1"
       placeholder="Example: None;+;5;Damage">

<label for="nodeEffect2">Effect 2:</label>
<input type="text" id="nodeEffect2"
       placeholder="Example: RunnerType:Hacker;-;2;Risk">
```

**New Code**:
```html
<label for="nodeEffect1">Effect 1:</label>
<input type="text" id="nodeEffect1"
       placeholder="Examples: None;+;5;Damage OR None;%;10;Money OR PrevDam;+;5;Money">

<label for="nodeEffect2">Effect 2:</label>
<input type="text" id="nodeEffect2"
       placeholder="Examples: RunnerType:Hacker;-;2;Risk OR PrevRisk;%;10;Grit">

<small style="display:block; color:#888; font-size:11px; margin-top:4px;">
    <strong>Operators:</strong> + (add), - (subtract), * (multiply), / (divide), % (percentage)<br>
    <strong>Conditions:</strong> None, RunnerType:[type], RunnerStat:[stat]>=[threshold], NodeColor:[color], NodeColorCombo:[colors], PrevDam (damage prevented), PrevRisk (risk prevented)
</small>
```

**Implementation Notes**:
- This is a cosmetic change only (no functional code changes)
- Helps users discover the new features
- Keep examples concise to fit in placeholder text
- Add help text below inputs for detailed reference

**Acceptance Criteria**:
- [ ] Users see examples of percentage operator in placeholders
- [ ] PrevDam/PrevRisk mentioned in condition list
- [ ] No functional changes to editor behavior
- [ ] Visual consistency maintained with existing style

---

### PHASE 4: TESTING & VALIDATION

#### TASK #9: Create Unit Tests for Percentage Operator
**PRIORITY**: High
**ESTIMATED TIME**: 3 hours
**FILE**: Create new file `test_percentage_operator.html`

**Objective**: Validate percentage operator calculations across all edge cases

**Test Scenarios**:

**Test 1: Basic Percentage Increase**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;10;Damage', effect2: '' },
    { id: '2', effect1: 'None;%;50;Damage', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
assert(gameState.currentPools.damage === 15, 'Expected 15 damage (10 + 50% of 10)');
```

**Test 2: Percentage with RunnerStat Multiplier**
```javascript
// Setup
gameState.runners[0] = { type: 'Hacker', stats: { hacker: 9, face: 0, muscle: 0, ninja: 0 } };
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;100;Money', effect2: '' },
    { id: '2', effect1: 'RunnerStat:hacker>=3;%;10;Money', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
// 9 hacker / 3 threshold = 3x multiplier
// 100 + (100 * 0.3) = 130
assert(gameState.currentPools.money === 130, 'Expected 130 money (100 + 30%)');
```

**Test 3: Execution Order Verification**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;5;Damage', effect2: '' },      // Damage = 5
    { id: '2', effect1: 'None;+;5;Damage', effect2: '' },      // Damage = 10
    { id: '3', effect1: 'None;*;2;Damage', effect2: '' },      // Damage = 20
    { id: '4', effect1: 'None;%;10;Damage', effect2: '' }      // Damage = 22
]);
gameState.selectNode('1');
gameState.selectNode('2');
gameState.selectNode('3');
gameState.selectNode('4');

// Execute
gameState.calculateCurrentPools();

// Assert
assert(gameState.currentPools.damage === 22, 'Expected 22 damage (20 + 10% of 20)');
// NOT 11, which would result if percentage ran before multiplication
```

**Test 4: Zero Base Value**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;%;100;Risk', effect2: '' }  // 100% of 0
]);
gameState.selectNode('1');

// Execute
gameState.calculateCurrentPools();

// Assert
assert(gameState.currentPools.risk === 0, 'Expected 0 risk (100% of 0 = 0)');
```

**Test 5: Negative Percentage (Reduction)**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;20;Damage', effect2: '' },
    { id: '2', effect1: 'None;%;-25;Damage', effect2: '' }  // -25% reduction
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
assert(gameState.currentPools.damage === 15, 'Expected 15 damage (20 - 25% of 20)');
```

**Test 6: Multiple Percentage Effects (Stacking Behavior)**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;100;Money', effect2: '' },
    { id: '2', effect1: 'None;%;10;Money', effect2: '' },   // +10% = 110
    { id: '3', effect1: 'None;%;10;Money', effect2: '' }    // +10% of 110 = 121
]);
gameState.selectNode('1');
gameState.selectNode('2');
gameState.selectNode('3');

// Execute
gameState.calculateCurrentPools();

// Assert
// Note: This tests how multiple percentage effects stack
// Current implementation: additive (both apply to base 100)
// Result should be 120 (100 + 10 + 10)
// If multiplicative stacking is desired, result would be 121 (100 * 1.1 * 1.1)
// DECISION NEEDED: Additive or multiplicative stacking?
assert(gameState.currentPools.money === 120, 'Expected 120 money (additive stacking)');
```

**Acceptance Criteria**:
- [ ] All 6 test scenarios pass
- [ ] Edge cases handled without errors (zero base, negative %, large %)
- [ ] Execution order verified (percentage effects run after standard)
- [ ] Condition multipliers work correctly with percentages
- [ ] Performance acceptable (< 1ms per effect)
- [ ] DECISION MADE: Clarify percentage stacking behavior (Test 6)

---

#### TASK #10: Create Unit Tests for Prevention Conditions
**PRIORITY**: High
**ESTIMATED TIME**: 3 hours
**FILE**: Create new file `test_prevention_conditions.html`

**Objective**: Validate PrevDam and PrevRisk condition mechanics across all scenarios

**Test Scenarios**:

**Test 1: Basic PrevDam Functionality**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;10;Damage', effect2: 'None;+;8;Grit' },
    { id: '2', effect1: 'PrevDam;+;5;Money', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
// Grit = 8, Damage = 10 → 4 damage prevented
// PrevDam effect: 4 * 5 = 20 money
assert(gameState.currentPools.money === 20, 'Expected 20 money (4 prevented * 5)');
assert(gameState.currentPools.damage === 10, 'Damage should still be 10 before final prevention');
```

**Test 2: PrevRisk with Percentage Operator**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;6;Risk', effect2: 'None;+;10;Veil' },
    { id: '2', effect1: 'None;+;100;Money', effect2: '' },
    { id: '3', effect1: 'PrevRisk;%;10;Money', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');
gameState.selectNode('3');

// Execute
gameState.calculateCurrentPools();

// Assert
// Veil = 10, Risk = 6 → 5 risk prevented (capped at 6)
// Wait, 10 Veil / 2 = 5 prevention, but only 6 risk, so 5 prevented
// Actually: Math.min(Math.floor(10/2), 6) = Math.min(5, 6) = 5
// PrevRisk effect: 5 * 10% = 50% total
// Money: 100 + (100 * 0.5) = 150
assert(gameState.currentPools.money === 150, 'Expected 150 money (100 + 50%)');
```

**Test 3: No Prevention Scenario**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;5;Damage', effect2: '' },  // No Grit
    { id: '2', effect1: 'PrevDam;+;10;Money', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
// Grit = 0 → 0 damage prevented
// PrevDam multiplier = 0 → no money added
assert(gameState.currentPools.money === 0, 'Expected 0 money (no prevention occurred)');
```

**Test 4: Prevention Exceeds Damage (Capping)**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;3;Damage', effect2: 'None;+;10;Grit' },
    { id: '2', effect1: 'PrevDam;+;5;Money', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
// Grit = 10 → max 5 prevention, but only 3 damage
// Actual prevention: Math.min(5, 3) = 3
// PrevDam effect: 3 * 5 = 15 money
assert(gameState.currentPools.money === 15, 'Expected 15 money (3 prevented * 5, capped at damage)');
```

**Test 5: Feedback Loop Handling**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;10;Risk', effect2: 'None;+;4;Veil' },
    { id: '2', effect1: 'PrevRisk;+;1;Veil', effect2: '' }
]);
gameState.selectNode('1');
gameState.selectNode('2');

// Execute
gameState.calculateCurrentPools();

// Assert
// Initial: Veil = 4, Risk = 10 → 2 risk prevented
// PrevRisk effect: 2 * 1 = 2 Veil added
// Final Veil = 6 (but prevention doesn't recalculate)
assert(gameState.currentPools.veil === 6, 'Expected 6 veil (4 + 2 from PrevRisk)');
// Prevention should not recalculate mid-pass
// Final prevention at end should use final Veil = 6 → 3 prevention
```

**Test 6: PrevDam and PrevRisk Together**
```javascript
// Setup
gameState.contractData = loadTestContract([
    { id: '1', effect1: 'None;+;10;Damage', effect2: 'None;+;8;Grit' },
    { id: '2', effect1: 'None;+;8;Risk', effect2: 'None;+;6;Veil' },
    { id: '3', effect1: 'PrevDam;+;5;Money', effect2: 'PrevRisk;+;3;Money' }
]);
gameState.selectNode('1');
gameState.selectNode('2');
gameState.selectNode('3');

// Execute
gameState.calculateCurrentPools();

// Assert
// Damage prevention: 8 Grit → 4 prevented
// Risk prevention: 6 Veil → 3 prevented
// Money from PrevDam: 4 * 5 = 20
// Money from PrevRisk: 3 * 3 = 9
// Total money: 29
assert(gameState.currentPools.money === 29, 'Expected 29 money (20 + 9)');
```

**Acceptance Criteria**:
- [ ] All 6 test scenarios pass
- [ ] Prevention amounts calculated correctly (2:1 ratio)
- [ ] Prevention capped at actual damage/risk values
- [ ] Feedback loops don't cause infinite recursion
- [ ] Edge cases handled gracefully (no prevention, max prevention)
- [ ] Both PrevDam and PrevRisk work independently and together

---

#### TASK #11: Integration Testing with Complex Contracts
**PRIORITY**: High
**ESTIMATED TIME**: 4 hours
**FILE**: Create new file `test_complex_integration.html`

**Objective**: Validate all features work together in realistic contract scenarios

**Test Contract 1: Mixed Effect Types**
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
START,Base Damage,+10 Damage,None;+;10;Damage,None;+;4;Grit,Normal,Red,100,100,BOOST
BOOST,Damage Boost,+20% Damage,None;%;20;Damage,None;+;2;Veil,Normal,Yellow,300,100,REWARD
REWARD,Prevention Reward,+5$ per prevented,PrevDam;+;5;Money,PrevRisk;+;3;Money,Normal,Green,500,100,
```

**Expected Calculation Flow**:
1. **Standard effects**: Damage = 10, Grit = 4
2. **Preliminary prevention**: 4 Grit → 2 damage prevention
3. **Percentage effects**: Damage = 12 (10 + 20% of 10), Veil = 2
4. **PrevDam/PrevRisk effects**: Money = +13 (2*5 + ?*3)
   - Wait, risk prevention: 0 risk, 2 Veil → 0 risk prevented
   - So Money = 10 (2*5 from PrevDam only)
5. **Final prevention**: Apply final prevention mechanics

**Expected Results**:
- Damage before final prevention: 12
- Grit: 4
- Veil: 2
- Money: 10
- Final Damage after prevention: 10 (12 - 2 prevented)

**Test Contract 2: RunnerStat Condition with Percentage**
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
1,Base Money,+100 Money,None;+;100;Money,,Normal,Blue,100,100,2
2,Hacker Bonus,+10% per 3 Hacker,RunnerStat:hacker>=3;%;10;Money,,Normal,Green,300,100,
```

**Runner Setup**:
- Runner 1: Hacker with 9 hacker stat
- Runner 2: Empty
- Runner 3: Empty

**Expected Results**:
- RunnerStat multiplier: 9 / 3 = 3
- Percentage: 3 * 10% = 30%
- Money: 100 + (100 * 0.3) = 130

**Test Contract 3: Complex Prevention Chain**
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
1,High Damage,+20 Damage,None;+;20;Damage,None;+;10;Grit,Normal,Red,100,100,2
2,Damage Reducer,-50% Damage,None;%;-50;Damage,,Normal,Blue,300,100,3
3,Grit Reward,+2 Grit per prevented,PrevDam;+;2;Grit,,Normal,Yellow,500,100,
```

**Expected Calculation Flow**:
1. Standard: Damage = 20, Grit = 10
2. Preliminary prevention: 10 Grit → 5 prevention (capped at 20 damage)
3. Percentage: Damage = 10 (20 - 50% of 20)
4. PrevDam: Grit += 5*2 = 10 → Total Grit = 20
5. Final prevention: 20 Grit → 10 prevention, Damage = 0

**Performance Testing**:
- Create contract with 50+ nodes
- Mix of standard, percentage, and prevention effects
- Measure calculation time (must be < 100ms)

**Acceptance Criteria**:
- [ ] Complex contract produces correct final values
- [ ] All operators work together correctly (+, -, *, /, %)
- [ ] Prevention conditions trigger at right time in calculation flow
- [ ] UI displays accurate preview values
- [ ] Performance under 100ms for 50-node contracts
- [ ] No console errors or warnings during calculation

---

#### TASK #12: Backward Compatibility Regression Testing
**PRIORITY**: Critical
**ESTIMATED TIME**: 2 hours
**FILE**: Create new file `test_regression.html`

**Objective**: Ensure existing contracts continue to work identically after changes

**Testing Methodology**:

**Step 1: Capture Baseline Results** (BEFORE implementation)
```javascript
// For each existing contract in Contracts/ directory:
const existingContracts = [
    'Contract_Example1.csv',
    'Contract_Example2_complex.csv',
    'Contract_Example3_conditions.csv',
    'Contract_Example4_synergy.csv',
    // ... all other contracts
];

const baselineResults = {};

existingContracts.forEach(contractFile => {
    // Load contract
    const contractData = await csvLoader.loadFile(contractFile);
    gameState.setContractData(contractData);

    // Test with standard runner configuration
    gameState.runners[0] = { type: 'Hacker', stats: { hacker: 5, face: 2, muscle: 1, ninja: 0 } };
    gameState.runners[1] = { type: 'Muscle', stats: { hacker: 0, face: 1, muscle: 6, ninja: 1 } };
    gameState.runners[2] = { type: 'Empty', stats: { hacker: 0, face: 0, muscle: 0, ninja: 0 } };

    // Select all available nodes
    const startNodes = contractData.filter(n => n.layer === 0 || n.type === 'Start');
    startNodes.forEach(node => gameState.selectNode(node.id));

    // Calculate pools
    gameState.calculateCurrentPools();

    // Store results
    baselineResults[contractFile] = {
        damage: gameState.currentPools.damage,
        risk: gameState.currentPools.risk,
        money: gameState.currentPools.money,
        grit: gameState.currentPools.grit,
        veil: gameState.currentPools.veil
    };
});

// Save baseline to JSON file or console
console.log('BASELINE RESULTS:', JSON.stringify(baselineResults, null, 2));
```

**Step 2: Compare After Implementation**
```javascript
// Load same contracts with same runner configs
// Compare results to baseline

const regressionErrors = [];

existingContracts.forEach(contractFile => {
    // ... load and calculate (same as baseline) ...

    const baseline = baselineResults[contractFile];
    const current = gameState.currentPools;

    // Compare with tolerance for floating-point precision
    const tolerance = 0.01;

    if (Math.abs(current.damage - baseline.damage) > tolerance) {
        regressionErrors.push(`${contractFile}: Damage mismatch (expected ${baseline.damage}, got ${current.damage})`);
    }
    if (Math.abs(current.risk - baseline.risk) > tolerance) {
        regressionErrors.push(`${contractFile}: Risk mismatch (expected ${baseline.risk}, got ${current.risk})`);
    }
    // ... repeat for money, grit, veil ...
});

if (regressionErrors.length > 0) {
    console.error('REGRESSION DETECTED:', regressionErrors);
    throw new Error(`${regressionErrors.length} regression errors found`);
} else {
    console.log('✓ All contracts produce identical results');
}
```

**Performance Comparison**:
```javascript
// Measure calculation time before and after
const performanceBefore = {};
const performanceAfter = {};

// Compare average calculation times
const slowdownThreshold = 1.05; // 5% slower acceptable

if (avgAfter > avgBefore * slowdownThreshold) {
    console.warn(`Performance degradation: ${avgAfter}ms vs ${avgBefore}ms`);
}
```

**Acceptance Criteria**:
- [ ] All existing contracts produce identical results (within 0.01 precision)
- [ ] No performance degradation > 5%
- [ ] No console errors or warnings with existing contracts
- [ ] CSV loading still works for all existing format variations
- [ ] Editor can still open/save legacy contracts without corruption

---

### PHASE 5: DOCUMENTATION & ROLLOUT

#### TASK #13: Update CLAUDE.md Technical Documentation
**PRIORITY**: Medium
**ESTIMATED TIME**: 1 hour
**FILE**: `CLAUDE.md`
**LINES AFFECTED**: Add new section after effect calculation section

**Objective**: Document new features in project technical reference for future developers

**Documentation to Add**:

```markdown
### Effect Calculation System

#### Calculation Order (Multi-Pass System)
The game uses a multi-pass calculation system to ensure correct execution order:

1. **Standard Effects Pass**: All +, -, *, / operators are applied to pools
2. **Preliminary Prevention Calculation**: Calculate damage/risk prevention for condition evaluation
3. **Percentage Effects Pass**: All % operators are applied to pools
4. **Prevention-Based Effects**: PrevDam/PrevRisk conditions trigger
5. **Final Prevention Mechanics**: Grit/Veil reduce damage/risk in final pools

This ordering ensures that:
- Percentage calculations operate on the final base values after all additions/multiplications
- Prevention-based conditions have access to accurate prevention amounts
- Final prevention applies to the completed pool values

#### Operators

##### Standard Operators
- `+` Addition: Adds amount to stat
- `-` Subtraction: Subtracts amount from stat
- `*` Multiplication: Multiplies stat by amount
- `/` Division: Divides stat by amount

##### Percentage Operator (%)
The percentage operator applies proportional modifications AFTER all additive and multiplicative effects:

- **Format**: `Condition;%;Amount;Stat`
- **Calculation**: `current_value + (current_value * amount/100)`
- **Example**: `None;%;10;Damage` = 10% damage increase
- **With Conditions**: `RunnerStat:hacker>=3;%;10;Money` = 10% per 3 hacker (30% if 9 hacker)
- **Negative**: `None;%;-25;Risk` = 25% risk reduction
- **Execution**: Runs after +, -, *, / operators but before final prevention

**Examples**:
```csv
Effect 1,Description,Calculation
None;%;20;Damage,20% damage increase,"If damage=10, result=12 (10 + 10*0.2)"
None;%;-10;Risk,10% risk reduction,"If risk=20, result=18 (20 - 20*0.1)"
RunnerStat:muscle>=3;%;15;Money,15% per 3 muscle,"If muscle=9, money=100: result=145 (100 + 100*0.45)"
```

#### Conditions

##### Standard Conditions
- `None` - Always applies (multiplier = 1)
- `RunnerType:[type]` - If specific runner type configured (multiplier = 1 if true, 0 if false)
- `RunnerStat:[stat]>=[threshold]` - Based on stat total (multiplier = floor(total/threshold))
- `NodeColor:[color]` - If specific color selected (multiplier = 1 if true, 0 if false)
- `NodeColorCombo:[colors]` - If multiple colors selected (multiplier = 1 if true, 0 if false)

##### Prevention-Based Conditions

###### PrevDam
Triggers based on damage prevented by Grit (2 Grit prevents 1 Damage):

- **Format**: `PrevDam;Operator;Amount;Stat`
- **Multiplier**: Number of damage points prevented
- **Calculation**: `prevented = Math.min(Math.floor(grit/2), damage)`
- **Effect**: `effect_amount = amount * prevented`

**Examples**:
```csv
Effect,Description,Example Calculation
PrevDam;+;5;Money,+5 money per damage prevented,"Grit=8, Damage=10 → 4 prevented → +20 money"
PrevDam;%;10;Money,+10% money per damage prevented,"Grit=6, Damage=10, Money=100 → 3 prevented → +30% → 130 money"
PrevDam;+;1;Veil,+1 Veil per damage prevented,"Grit=4, Damage=5 → 2 prevented → +2 Veil"
```

###### PrevRisk
Triggers based on risk prevented by Veil (2 Veil prevents 1 Risk):

- **Format**: `PrevRisk;Operator;Amount;Stat`
- **Multiplier**: Number of risk points prevented
- **Calculation**: `prevented = Math.min(Math.floor(veil/2), risk)`
- **Effect**: `effect_amount = amount * prevented`

**Examples**:
```csv
Effect,Description,Example Calculation
PrevRisk;+;3;Money,+3 money per risk prevented,"Veil=10, Risk=6 → 5 prevented (capped at 6) → +15 money"
PrevRisk;%;5;Damage,+5% damage per risk prevented,"Veil=8, Risk=10, Damage=20 → 4 prevented → +20% → 24 damage"
PrevRisk;+;1;Grit,+1 Grit per risk prevented,"Veil=6, Risk=8 → 3 prevented → +3 Grit"
```

**Important Notes**:
- Prevention-based conditions use preliminary prevention calculations (before percentage effects)
- Prevention is capped at actual damage/risk values, not just Grit/Veil potential
- Feedback loops (e.g., PrevRisk adding Veil) don't recalculate prevention mid-pass
- If no prevention occurs, multiplier = 0 and effect doesn't trigger

#### Complete Effect String Examples

```csv
Effect String,Full Description
None;+;10;Damage,Add 10 damage (standard effect)
None;%;20;Damage,Add 20% damage (percentage effect - runs after standard)
RunnerType:Hacker;-;2;Risk,Subtract 2 risk if Hacker configured
RunnerStat:muscle>=3;+;5;Damage,Add 5 damage per 3 muscle stat
NodeColor:Red;+;100;Money,Add 100 money if Red node selected
PrevDam;+;5;Money,Add 5 money per damage prevented by Grit
PrevRisk;%;10;Money,Add 10% money per risk prevented by Veil
```

### Data Validation

The CSV loader validates all effect strings to ensure proper format. Valid effect format:
```
[Condition];[Operator];[Amount];[Stat]
```

**Valid Operators**: `+`, `-`, `*`, `/`, `%`

**Valid Conditions**:
- `None`
- `RunnerType:[Face|Muscle|Hacker|Ninja]`
- `RunnerStat:[face|muscle|hacker|ninja][>=|<=|>|<|==][number]`
- `NodeColor:[Red|Yellow|Green|Blue|Purple|Grey]`
- `NodeColorCombo:[color],[color],...`
- `PrevDam`
- `PrevRisk`

**Valid Stats**: `Damage`, `Risk`, `Money`, `Grit`, `Veil` (case-insensitive)
```

**Acceptance Criteria**:
- [ ] CLAUDE.md updated with new operator and conditions
- [ ] Examples provided for common use cases
- [ ] Execution order clearly documented
- [ ] Edge cases and limitations noted
- [ ] Format is readable and well-organized

---

## TECHNICAL SPECIFICATIONS

### Calculation Order Flowchart

```
┌─────────────────────────────────────────┐
│ 1. Initialize Pools (all values = 0)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Collect Effects from Selected Nodes │
│    - Separate by operator type          │
│    - standardEffects: +, -, *, /        │
│    - percentageEffects: %               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Apply Standard Effects               │
│    - Process all +, -, *, / operators   │
│    - Pools now have base values         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Calculate Preliminary Prevention     │
│    - damagePrev = min(floor(grit/2), dmg) │
│    - riskPrev = min(floor(veil/2), risk)  │
│    - Store in preventionData            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Apply Percentage Effects             │
│    - Process all % operators            │
│    - Operate on current pool values     │
│    - PrevDam/PrevRisk use stored data   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Apply Final Prevention Mechanics     │
│    - Reduce damage by Grit prevention   │
│    - Reduce risk by Veil prevention     │
│    - This is final pool state           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Return Final Pool Values             │
└─────────────────────────────────────────┘
```

### Prevention Calculation Formula

```javascript
// Damage Prevention by Grit
const maxDamagePrevention = Math.floor(currentPools.grit / 2);
const actualDamagePrevented = Math.min(maxDamagePrevention, currentPools.damage);

// Risk Prevention by Veil
const maxRiskPrevention = Math.floor(currentPools.veil / 2);
const actualRiskPrevented = Math.min(maxRiskPrevention, currentPools.risk);

// Store for conditions
this.preventionData.preliminaryDamagePrevented = Math.max(0, actualDamagePrevented);
this.preventionData.preliminaryRiskPrevented = Math.max(0, actualRiskPrevented);
```

### Percentage Operator Calculation

```javascript
// Basic formula
new_value = current_value + (current_value * (amount / 100))

// With condition multiplier
effective_amount = base_amount * condition_multiplier
percentage_multiplier = effective_amount / 100
new_value = current_value + (current_value * percentage_multiplier)

// Examples:
// 10% of 100 = 100 + (100 * 0.1) = 110
// 3x multiplier, 10% of 100 = 100 + (100 * 0.3) = 130
// -25% of 20 = 20 + (20 * -0.25) = 15
```

### Prevention Condition Multiplier

```javascript
// PrevDam multiplier
function evaluatePrevDamCondition() {
    if (!this.preventionData || !this.preventionData.preliminaryDamagePrevented) {
        return 0;
    }
    return Math.max(0, this.preventionData.preliminaryDamagePrevented);
}

// PrevRisk multiplier
function evaluatePrevRiskCondition() {
    if (!this.preventionData || !this.preventionData.preliminaryRiskPrevented) {
        return 0;
    }
    return Math.max(0, this.preventionData.preliminaryRiskPrevented);
}

// Usage in effect application
const conditionMultiplier = this.evaluateCondition(condition);
const effectiveAmount = baseAmount * conditionMultiplier;
```

---

## TESTING REQUIREMENTS

### Unit Testing Coverage

**Required Tests for Percentage Operator**:
- [x] Basic percentage increase (positive %)
- [x] Percentage decrease (negative %)
- [x] Percentage on zero base value
- [x] Percentage with RunnerStat multiplier
- [x] Percentage with NodeColor condition
- [x] Multiple percentage effects (stacking behavior)
- [x] Execution order verification (% runs after +, -, *, /)
- [x] Very large percentages (500%)
- [x] Very small percentages (0.1%)

**Required Tests for Prevention Conditions**:
- [x] PrevDam basic functionality
- [x] PrevRisk basic functionality
- [x] PrevDam with percentage operator
- [x] PrevRisk with percentage operator
- [x] No prevention scenario (0 Grit/Veil)
- [x] Prevention exceeds damage/risk (capping)
- [x] Feedback loop handling (PrevRisk adding Veil)
- [x] PrevDam and PrevRisk working together

**Integration Testing**:
- [x] Complex contract with all operator types
- [x] Mixed conditions (RunnerStat + PrevDam + percentage)
- [x] Performance testing (50+ nodes < 100ms)
- [x] UI preview accuracy
- [x] Contract execution with new features

**Regression Testing**:
- [x] All existing contracts produce identical results
- [x] Performance degradation < 5%
- [x] No console errors with legacy contracts
- [x] Editor compatibility maintained

### Test Data Requirements

**Test Contracts Needed**:
1. `test_percentage_basic.csv` - Simple percentage effects
2. `test_percentage_complex.csv` - Multiple percentages with conditions
3. `test_prevention_basic.csv` - PrevDam and PrevRisk examples
4. `test_prevention_advanced.csv` - Feedback loops and edge cases
5. `test_integration_all_features.csv` - Everything combined
6. All existing contracts (for regression)

**Runner Configurations for Testing**:
- Empty configuration (all Empty runners)
- Single runner with high stats (test thresholds)
- Multiple runners with mixed stats (test totals)
- Edge cases (all stats at 10, all at 0)

---

## RISK ASSESSMENT

### HIGH-RISK AREAS

#### RISK #1: Circular Dependency in Prevention Calculations
**Severity**: High
**Likelihood**: Medium

**Issue**: PrevDam/PrevRisk need prevention amounts, but prevention depends on Grit/Veil, which might be affected by PrevDam/PrevRisk effects creating a circular dependency.

**Example Scenario**:
```csv
Effect 1: None;+;10;Damage
Effect 2: None;+;4;Grit
Effect 3: PrevRisk;+;2;Grit  ← This adds Grit based on prevention, but prevention needs Grit value
```

**Mitigation Strategy**:
- Use three-pass system:
  1. Calculate standard effects → get preliminary Grit/Veil
  2. Calculate preliminary prevention based on step 1
  3. Apply percentage + prevention effects (using preliminary prevention data)
  4. Final prevention uses updated Grit/Veil from step 3

**Fallback Option**:
- Document that prevention-based effects should not modify Grit/Veil (design limitation)
- Add warning in editor if PrevDam/PrevRisk modifies Grit/Veil stats

**Testing Strategy**:
- Create specific test cases for feedback loops
- Verify prevention doesn't recalculate mid-pass
- Ensure no infinite recursion occurs

---

#### RISK #2: Floating-Point Precision Issues
**Severity**: Medium
**Likelihood**: High

**Issue**: Percentage calculations introduce more floating-point operations, potentially causing precision errors.

**Example Scenario**:
```
Money = 100
Effect 1: None;%;10;Money → 110
Effect 2: None;%;10;Money → 121 (or 120 depending on stacking)
Effect 3: None;%;10;Money → 133.1 (or 130)
After many operations: 133.10000000000002 (precision error)
```

**Mitigation Strategy**:
- Round final pool values to 2 decimal places in display layer
- Document that percentages use standard JavaScript number precision
- Consider using integer-based calculations (store as cents/points * 100)

**Testing Strategy**:
- Test with many percentage operations (20+ effects)
- Verify no accumulation of rounding errors
- Check edge cases (very small values, very large values)

**Implementation Note**:
```javascript
// In getGameState() or display methods, round for consistency
return {
    damage: Math.round(this.currentPools.damage * 100) / 100,
    risk: Math.round(this.currentPools.risk * 100) / 100,
    money: Math.round(this.currentPools.money * 100) / 100,
    grit: Math.round(this.currentPools.grit * 100) / 100,
    veil: Math.round(this.currentPools.veil * 100) / 100
};
```

---

#### RISK #3: Performance Degradation
**Severity**: Medium
**Likelihood**: Low

**Issue**: Three-pass calculation system adds overhead, potentially slowing down pool calculations.

**Performance Targets**:
- Small contracts (< 20 nodes): < 10ms
- Medium contracts (20-50 nodes): < 50ms
- Large contracts (50+ nodes): < 100ms

**Mitigation Strategy**:
- Profile performance before and after implementation
- Implement early exit if no percentage/prevention effects exist
- Cache prevention calculations if called multiple times
- Use performance.now() logging for debugging

**Optimization Opportunities**:
```javascript
// Early exit if no special effects
const hasPercentageEffects = percentageEffects.length > 0;
const hasPreventionEffects = /* check for PrevDam/PrevRisk */;

if (!hasPercentageEffects && !hasPreventionEffects) {
    // Skip passes 3-4, go straight to final prevention
    this.applyPreventionMechanics();
    return { ...this.currentPools };
}
```

**Testing Strategy**:
- Benchmark with 100-node contracts
- Compare to baseline performance (before changes)
- Identify bottlenecks with profiler
- Test on slower devices (if applicable)

---

#### RISK #4: Backward Compatibility Breaking
**Severity**: High
**Likelihood**: Low (if tested properly)

**Issue**: Changes to calculation flow might alter results for existing contracts, breaking saved games or expected behaviors.

**Critical Areas**:
- Effect application order
- Prevention mechanics timing
- Condition evaluation
- Pool initialization

**Mitigation Strategy**:
- Comprehensive regression testing (TASK #12) before deployment
- Capture baseline results for ALL existing contracts
- Version control: tag current version before changes
- Feature flag to disable new features for debugging

**Rollback Plan**:
- Keep previous version of gameState.js as `gameState.backup.js`
- Document exact commit hash before changes
- Ability to toggle between old/new calculation methods

**Testing Strategy**:
- Load every contract in `Contracts/` directory
- Test with multiple runner configurations
- Compare all pool values to baseline (tolerance: 0.01)
- Check execution results, not just preview

---

### EDGE CASES TO TEST

#### Edge Case #1: Zero Base Values
**Scenario**: Percentage of zero
```csv
Effect: None;%;100;Risk
Starting Risk: 0
Expected: 0 (100% of 0 = 0)
```

#### Edge Case #2: Negative Percentages
**Scenario**: Reduction by percentage
```csv
Effect: None;%;-50;Damage
Starting Damage: 20
Expected: 10 (20 - 50% of 20)
```

#### Edge Case #3: Very Large Percentages
**Scenario**: 500% increase
```csv
Effect: None;%;500;Money
Starting Money: 100
Expected: 600 (100 + 500% of 100)
```

#### Edge Case #4: No Prevention
**Scenario**: PrevDam with 0 Grit
```csv
Effect: PrevDam;+;10;Money
Damage: 10, Grit: 0
Expected: +0 Money (no prevention = 0 multiplier)
```

#### Edge Case #5: Maximum Prevention
**Scenario**: Prevention exceeds damage
```csv
Effect: PrevDam;+;5;Money
Damage: 3, Grit: 10 (max 5 prevention, but only 3 damage)
Expected: +15 Money (capped at 3 prevented)
```

#### Edge Case #6: Feedback Loops
**Scenario**: PrevRisk adding Veil
```csv
Effect 1: None;+;10;Risk
Effect 2: None;+;4;Veil
Effect 3: PrevRisk;+;1;Veil
Preliminary: 4 Veil → 2 risk prevented
PrevRisk effect: +2 Veil → Total Veil = 6
Expected: Prevention doesn't recalculate during pass
Final prevention uses Veil = 6 → 3 prevention at end
```

#### Edge Case #7: Multiple Percentage Effects
**Scenario**: Stacking behavior
```csv
Effect 1: None;+;100;Money
Effect 2: None;%;10;Money
Effect 3: None;%;10;Money
DECISION NEEDED:
- Additive stacking: 100 + 10 + 10 = 120
- Multiplicative stacking: 100 * 1.1 * 1.1 = 121
```

**DECISION REQUIRED**: How should multiple percentage effects stack?
- **Recommended**: Additive (all percentages apply to base value from pass 1)
- **Alternative**: Multiplicative (each percentage compounds on previous result)

#### Edge Case #8: Condition Multipliers with Percentages
**Scenario**: 3x multiplier, 10% = 30%
```csv
Effect: RunnerStat:muscle>=3;%;10;Money
Muscle stat: 9 (multiplier = 3)
Starting Money: 100
Expected: 130 (100 + 100 * 0.3)
```

---

## IMPLEMENTATION TIMELINE

### Recommended Schedule (4-Day Sprint)

#### Day 1: Foundation (8 hours)
**Morning (4 hours)**:
- TASK #1: Refactor calculation architecture (4 hours)
  - Implement two-pass system
  - Test with existing contracts (should produce identical results)
  - Performance profiling

**Afternoon (4 hours)**:
- TASK #2: Implement percentage operator (2 hours)
  - Add % case to switch statement
  - Test basic calculations
- TASK #6: Update CSV validation for % (0.5 hours)
- Initial percentage operator testing (1.5 hours)

**Deliverable**: Working percentage operator with basic validation

---

#### Day 2: Prevention System (8 hours)
**Morning (4 hours)**:
- TASK #3: Prevention data storage (3 hours)
  - Create calculatePreventionAmounts() method
  - Integrate with calculateCurrentPools()
  - Test prevention calculation accuracy
- TASK #4: Implement PrevDam condition (1 hour)

**Afternoon (4 hours)**:
- TASK #5: Implement PrevRisk condition (1 hour)
- TASK #7: Update CSV validation for prevention (0.5 hours)
- Initial prevention testing (2.5 hours)
  - Test PrevDam scenarios
  - Test PrevRisk scenarios
  - Test feedback loops

**Deliverable**: Working prevention-based conditions with validation

---

#### Day 3: Testing & Integration (8 hours)
**Morning (4 hours)**:
- TASK #9: Comprehensive percentage tests (3 hours)
  - All 6+ test scenarios
  - Edge case validation
  - Performance benchmarking
- TASK #10: Comprehensive prevention tests (1 hour start)

**Afternoon (4 hours)**:
- TASK #10: Continue prevention tests (2 hours)
- TASK #11: Integration testing (2 hours)
  - Complex contracts
  - Mixed effect types
  - Performance testing with 50+ nodes

**Deliverable**: Comprehensive test suite with all scenarios passing

---

#### Day 4: Polish & Documentation (4 hours)
**Morning (2 hours)**:
- TASK #12: Regression testing (2 hours)
  - Capture baselines
  - Compare all existing contracts
  - Performance comparison
  - Fix any issues found

**Afternoon (2 hours)**:
- TASK #8: Update editor UI hints (0.5 hours)
- TASK #13: Update CLAUDE.md documentation (1 hour)
- Final validation and deployment preparation (0.5 hours)
  - Code review
  - Final regression check
  - Commit and tag release

**Deliverable**: Production-ready feature with complete documentation

---

### Critical Path

The following tasks are on the critical path (must be completed in order):

```
TASK #1 (Refactor) → TASK #2 (% Operator) → TASK #6 (CSV Validation) →
TASK #9 (% Tests) → TASK #11 (Integration) → TASK #12 (Regression)
```

**Total Critical Path Time**: 15-19 hours

**Parallel Work Available**:
- TASK #8 (Editor UI) can be done anytime
- TASK #13 (Documentation) can be done after implementation completes
- TASK #10 (Prevention tests) can run parallel to TASK #9

---

### Milestone Checkpoints

**Milestone 1: Percentage Operator Working** (End of Day 1)
- [ ] Two-pass calculation system implemented
- [ ] Percentage operator functional
- [ ] CSV validation updated
- [ ] Basic tests passing
- [ ] No regression in existing contracts

**Milestone 2: Prevention Conditions Working** (End of Day 2)
- [ ] Prevention calculation system implemented
- [ ] PrevDam and PrevRisk conditions functional
- [ ] CSV validation updated
- [ ] Basic prevention tests passing

**Milestone 3: All Tests Passing** (End of Day 3)
- [ ] 20+ unit tests passing
- [ ] Integration tests passing
- [ ] Performance targets met
- [ ] Edge cases handled

**Milestone 4: Production Ready** (End of Day 4)
- [ ] Regression tests passing
- [ ] Documentation complete
- [ ] Editor UI updated
- [ ] Code reviewed and committed

---

## DECISION POINTS FOR PRODUCT OWNER

### DECISION #1: Percentage Stacking Behavior
**Question**: How should multiple percentage effects stack?

**Option A: Additive Stacking** (Recommended)
- All percentages apply to the base value from pass 1
- Example: 100 base, +10%, +10% = 100 + 10 + 10 = 120
- **Pros**: Simpler to understand, more predictable
- **Cons**: Less powerful scaling with many percentage nodes

**Option B: Multiplicative Stacking**
- Each percentage compounds on the previous result
- Example: 100 base, +10%, +10% = 100 * 1.1 * 1.1 = 121
- **Pros**: More interesting scaling, rewards stacking percentages
- **Cons**: Can become overpowered with many nodes

**Recommendation**: Start with Additive (Option A), easier to balance

---

### DECISION #2: Prevention-Based Effects Modifying Grit/Veil
**Question**: Should PrevDam/PrevRisk effects be allowed to modify Grit/Veil stats?

**Scenario**: `PrevRisk;+;1;Veil` adds Veil based on risk prevented, which creates a feedback loop.

**Option A: Allow Feedback Loops**
- Effects can modify Grit/Veil
- Prevention is calculated once (preliminary), doesn't recalculate mid-pass
- Final prevention uses the updated Grit/Veil values
- **Pros**: More design flexibility, interesting mechanics
- **Cons**: Potentially confusing, harder to predict final values

**Option B: Prevent Feedback Loops**
- Add validation warning if PrevDam/PrevRisk modifies Grit/Veil
- Document as a design limitation
- **Pros**: Simpler to understand and calculate
- **Cons**: Less design flexibility

**Recommendation**: Allow feedback loops (Option A) with clear documentation

---

### DECISION #3: Performance Threshold
**Question**: What's the acceptable performance threshold for complex contracts?

**Current Target**: < 100ms for 50-node contracts

**Options**:
- **Strict**: < 50ms (requires optimization)
- **Standard**: < 100ms (current target)
- **Relaxed**: < 200ms (easier to achieve)

**Recommendation**: Keep at 100ms, optimize if exceeded

---

### DECISION #4: Percentage Precision
**Question**: Should percentage calculations round to integers or support decimals?

**Option A: Support Decimals**
- Allow fractional stat values (e.g., 12.5 damage)
- Round only for display (UI)
- **Pros**: More accurate calculations, supports complex mechanics
- **Cons**: Floating-point precision issues, potentially confusing UI

**Option B: Round to Integers**
- Round after each percentage calculation
- All stat values are integers
- **Pros**: Cleaner UI, no precision issues
- **Cons**: Loss of precision with multiple percentages

**Recommendation**: Support decimals internally, round for UI display (Option A)

---

## FILES TO MODIFY

### Primary Implementation Files

**`js/gameState.js`** (Major changes)
- Line 193-216: `calculateCurrentPools()` - Refactor to multi-pass system
- Line 236-313: `applyEffect()` - Add percentage operator case
- Line 320-368: `evaluateCondition()` - Add PrevDam/PrevRisk conditions
- New method: `calculatePreventionAmounts()` (after line 217)

**`js/csvLoader.js`** (Minor changes)
- Line 646: Update `validOperators` array to include '%'
- Line 638-642: Update `validConditionTypes` to include 'PrevDam', 'PrevRisk'

### Secondary Files

**`editor.html`** (Cosmetic changes)
- Line 98-103: Update placeholder text with new examples
- Add inline help text for operators and conditions

**`CLAUDE.md`** (Documentation)
- Add new section on percentage operator
- Add new section on prevention-based conditions
- Update effect calculation explanation
- Add examples and edge cases

### Test Files to Create

**`test_percentage_operator.html`**
- Unit tests for percentage calculations
- 6+ test scenarios
- Edge case validation

**`test_prevention_conditions.html`**
- Unit tests for PrevDam/PrevRisk
- 6+ test scenarios
- Feedback loop testing

**`test_complex_integration.html`**
- Integration tests with complex contracts
- Performance testing
- Mixed effect types

**`test_regression.html`**
- Backward compatibility validation
- Performance comparison
- All existing contracts

---

## GLOSSARY

**Terms Used in This Specification**:

- **Standard Effects**: Effects using +, -, *, / operators
- **Percentage Effects**: Effects using the % operator
- **Prevention-Based Conditions**: PrevDam and PrevRisk condition types
- **Preliminary Prevention**: Prevention calculation done before percentage effects (for condition evaluation)
- **Final Prevention**: Prevention mechanics applied at the end of calculation (reduces damage/risk in final pools)
- **Condition Multiplier**: The number returned by `evaluateCondition()` that scales effect amount
- **Multi-Pass System**: Calculation architecture with separate passes for different effect types
- **Feedback Loop**: When prevention-based effects modify Grit/Veil, creating circular dependency
- **Regression Testing**: Validating that existing functionality still works after changes
- **Edge Case**: Unusual scenario that tests boundaries of system (zero values, extremes, etc.)

---

## FINAL RECOMMENDATIONS

### For Programmers

1. **Start with TASK #1** - The architecture refactor is foundational and highest risk
2. **Test incrementally** - Don't wait until Phase 4 to start testing
3. **Capture baselines early** - Run existing contracts and save results BEFORE making ANY changes
4. **Use version control** - Commit after each task completes successfully
5. **Profile performance** - Use performance.now() logging to catch slowdowns early
6. **Document edge cases** - As you discover them during implementation, add to tests

### For Testers

1. **Create baseline data first** - Before implementation begins, capture expected results
2. **Test each task independently** - Don't wait for full implementation
3. **Focus on edge cases** - Zero values, extremes, feedback loops
4. **Performance testing** - Track calculation times for contracts of different sizes
5. **Regression is critical** - Existing contracts MUST produce identical results

### For Project Manager

1. **Day 1 is critical** - Architecture refactor sets foundation for everything else
2. **Don't skip regression testing** - This is the highest-risk area for breaking changes
3. **Get decision on stacking behavior early** - Affects implementation (DECISION #1)
4. **Performance tracking** - Monitor calculation times throughout implementation
5. **Have rollback plan ready** - Keep previous version accessible if needed

---

## APPENDIX: EXAMPLE CONTRACTS

### Example Contract 1: Percentage Showcase
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
1,Base Damage,+20 Damage,None;+;20;Damage,None;+;6;Grit,Normal,Red,100,100,2
2,Damage Boost,+50% Damage,None;%;50;Damage,,Normal,Yellow,300,100,3
3,Money Gain,+100 Money,None;+;100;Money,,Normal,Blue,500,100,4
4,Hacker Bonus,+10% Money per 3 Hacker,RunnerStat:hacker>=3;%;10;Money,,Normal,Green,700,100,
```

**Expected Flow** (with 9 Hacker stat):
1. Standard: Damage=20, Grit=6, Money=100
2. Percentage: Damage=30 (20 + 50%), Money=130 (100 + 30% from 3x multiplier)
3. Final prevention: 3 damage prevented, final Damage=27

### Example Contract 2: Prevention Showcase
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
1,High Damage Setup,+20 Damage +10 Grit,None;+;20;Damage,None;+;10;Grit,Normal,Red,100,100,2
2,Prevention Reward,+5$ per prevented damage,PrevDam;+;5;Money,,Normal,Yellow,300,100,3
3,Risk Setup,+10 Risk +8 Veil,None;+;10;Risk,None;+;8;Veil,Normal,Purple,500,100,4
4,Prevention Percentage,+10% Money per prevented risk,PrevRisk;%;10;Money,,Normal,Blue,700,100,
```

**Expected Flow**:
1. Standard: Damage=20, Grit=10, Risk=10, Veil=8
2. Preliminary prevention: 5 damage prevented, 4 risk prevented
3. PrevDam: +25 Money (5*5)
4. PrevRisk: Money = 25 + (25 * 0.4) = 35 (4*10%)

### Example Contract 3: Complex Integration
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections
1,Start,+10 Damage,None;+;10;Damage,None;+;4;Grit,Start,Red,100,100,2;3
2,Path A,+5 Damage,None;+;5;Damage,None;+;2;Veil,Normal,Green,300,50,4
3,Path B,-30% Damage,None;%;-30;Damage,None;+;6;Grit,Normal,Blue,300,150,4
4,Reward,+5$ per prevented,PrevDam;+;5;Money,PrevRisk;+;3;Money,Normal,Yellow,500,100,
```

**Two Different Paths**:
- **Path A (nodes 1,2,4)**: Damage=15, Grit=4, Veil=2 → 2 prevented → +10 Money
- **Path B (nodes 1,3,4)**: Damage=7 (10 - 30%), Grit=10 → 3 prevented → +15 Money

---

**END OF SPECIFICATION**

This document provides complete technical guidance for implementing the percentage operator and prevention-based conditions features. All tasks are independently implementable, testable, and have clear acceptance criteria.

For questions or clarifications, refer to the DECISION POINTS section or consult with the product owner.

**Document Status**: Ready for Implementation
**Last Updated**: 2025-10-06
**Version**: 1.0
