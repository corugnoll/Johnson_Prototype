# Sub-Milestone 1D: Game Logic Engine
## Johnson Prototype Game Development

---

## Executive Summary

Sub-Milestone 1D implements the core game mechanics that bring the Johnson Prototype to life - the runner management system and sophisticated effect calculation engine. This sub-milestone transforms the visual representation into an interactive game by implementing the complex business logic for runner configurations, effect processing, and prevention mechanics that form the heart of the cyberpunk simulation experience.

**Key Deliverable:** A complete game logic system that processes runner configurations and calculates effects in real-time, demonstrating the full gameplay concept from setup through final calculation results.

---

## Scope and Objectives

### Primary Objectives
1. **Runner Management System** - Complete interface for configuring and managing 3 runner slots
2. **Effect Calculation Engine** - Complex condition-based effect processing with all specified operators
3. **Prevention Mechanics** - Grit and Veil damage/risk reduction calculations
4. **State Integration** - Real-time updates connecting UI, data, and calculations
5. **Game Flow Validation** - End-to-end verification of the complete gameplay concept

### Success Criteria
- Runner interface supports all 5 types with 4-stat configuration system
- Effect engine handles all 5 condition types with mathematical accuracy
- Prevention mechanics correctly reduce damage/risk using Grit/Veil resources
- Real-time calculations update immediately when runners or selections change
- System accurately processes all example effects from specification
- Complete game flow from contract load to final results works seamlessly
- Performance remains responsive with complex effect calculations

---

## Included Tasks

### TASK #6: Runner Setup and Management Interface
**PRIORITY:** High
**OBJECTIVE:** Implement complete runner configuration system with validation and real-time totaling

**TECHNICAL REQUIREMENTS:**
- 3 runner configuration slots with independent management
- Dropdown selection for 5 runner types: Empty, Face, Muscle, Hacker, Ninja
- 4 stat input fields per runner: FaceStat, MuscleStat, HackerStat, NinjaStat
- Real-time calculation and validation of stat totals
- Input validation ensuring only valid integer values
- Integration with game state for effect calculations

**ACCEPTANCE CRITERIA:**
- [ ] 3 runner slots display with consistent styling and functionality
- [ ] Dropdown menus populated with all 5 runner types
- [ ] Each runner has 4 stat input fields with proper labels
- [ ] Real-time totaling calculates sum of all stats across all runners
- [ ] Input validation prevents invalid values (non-integers, negatives)
- [ ] Empty slots properly handled in calculations
- [ ] Runner configuration changes trigger immediate effect recalculation
- [ ] Interface state persists during contract changes
- [ ] Clear visual indication of required vs. optional fields
- [ ] Keyboard navigation works properly for accessibility

**DEPENDENCIES:** MS1A completion (UI foundation)
**ESTIMATED EFFORT:** Small-Medium (1-2 days)

### TASK #7: Effect Calculation Engine
**PRIORITY:** Critical
**OBJECTIVE:** Implement comprehensive effect processing system with all condition types and operators

**TECHNICAL REQUIREMENTS:**
- Parse complex effect strings from CSV data with format validation
- Support all 5 condition types: None, RunnerType, RunnerStat, NodeColor, NodeColorCombo
- Implement all 4 operators: Addition (+), Subtraction (-), Multiplication (*), Division (/)
- Handle all 5 stat types: Damage, Risk, Money, Grit, Veil
- Prevention mechanics: 2 Grit prevents 1 Damage, 2 Veil prevents 1 Risk
- Real-time calculation updates with proper error handling

**ACCEPTANCE CRITERIA:**
- [ ] Effect string parsing handles all specified formats correctly
- [ ] **None conditions:** Always apply regardless of runner configuration
- [ ] **RunnerType conditions:** Check for specific runner types in configuration
- [ ] **RunnerStat conditions:** Evaluate stat comparisons (>, <, =, >=, <=)
- [ ] **NodeColor conditions:** Check for other selected nodes of specific colors
- [ ] **NodeColorCombo conditions:** Validate combinations of selected node colors
- [ ] All mathematical operators produce accurate results
- [ ] Prevention mechanics correctly reduce final damage and risk values
- [ ] Calculation errors handled gracefully with clear user feedback
- [ ] Performance remains responsive with complex effect combinations
- [ ] Results update in real-time as inputs change

**DEPENDENCIES:** MS1B (data structures), MS1C (node selection capability)
**ESTIMATED EFFORT:** Large (4-6 days)

### TASK #7B: Advanced Effect Processing
**PRIORITY:** Medium-High
**OBJECTIVE:** Implement sophisticated effect validation and debugging capabilities

**TECHNICAL REQUIREMENTS:**
- Effect string syntax validation with detailed error reporting
- Circular dependency detection for complex effect chains
- Mathematical accuracy validation for all calculation types
- Debug mode showing step-by-step calculation breakdown
- Performance optimization for complex effect combinations
- Edge case handling for unusual effect configurations

**ACCEPTANCE CRITERIA:**
- [ ] Effect syntax validation catches malformed effect strings
- [ ] Circular dependency detection prevents infinite calculation loops
- [ ] Mathematical operations handle edge cases (division by zero, overflow)
- [ ] Debug mode provides step-by-step calculation visibility
- [ ] Performance optimization maintains responsiveness with 20+ effects
- [ ] Error handling provides specific guidance for effect string corrections
- [ ] Calculation accuracy verified for all example scenarios
- [ ] Edge cases handled gracefully (empty runners, zero stats)

**DEPENDENCIES:** Basic effect calculation implementation
**ESTIMATED EFFORT:** Medium (2-3 days)

### TASK #6B: Advanced Runner Management
**PRIORITY:** Medium
**OBJECTIVE:** Enhance runner system with advanced features and validation

**TECHNICAL REQUIREMENTS:**
- Runner configuration templates for common setups
- Stat distribution validation and recommendations
- Runner optimization suggestions based on selected nodes
- Configuration import/export for testing scenarios
- Advanced validation preventing impossible configurations
- Integration with effect preview system

**ACCEPTANCE CRITERIA:**
- [ ] Template system provides pre-configured runner setups
- [ ] Stat validation ensures balanced distributions
- [ ] Optimization suggestions help players configure effective teams
- [ ] Configuration data can be saved and loaded for testing
- [ ] Advanced validation catches impossible stat combinations
- [ ] Runner changes immediately preview effect impacts
- [ ] System provides helpful hints for new players
- [ ] Configuration history supports undo/redo operations

**DEPENDENCIES:** Basic runner management implementation
**ESTIMATED EFFORT:** Medium (2-3 days)

---

## Technical Architecture

### Game Logic System Structure
```
Johnson_Prototype/js/
├── runnerManager.js          # Runner configuration and validation
├── effectCalculator.js       # Core effect processing engine
├── effectParser.js           # Effect string parsing and validation
├── gameLogic.js             # Game state and rule coordination
├── preventionMechanics.js   # Grit/Veil damage reduction system
└── calculationDebugger.js   # Debug and validation tools
```

### Data Flow Architecture
```
Runner Configuration → Effect Calculation → Prevention Application → Final Results → UI Updates
```

### State Management Strategy
- Centralized game state with immutable updates
- Event-driven updates for real-time responsiveness
- Validation at each state transition
- Rollback capability for invalid configurations

---

## Detailed Implementation Specifications

### Runner Management System
```javascript
// runnerManager.js - Complete runner configuration system
export class RunnerManager {
    constructor() {
        this.runners = [
            { type: 'Empty', faceStat: 0, muscleStat: 0, hackerStat: 0, ninjaStat: 0 },
            { type: 'Empty', faceStat: 0, muscleStat: 0, hackerStat: 0, ninjaStat: 0 },
            { type: 'Empty', faceStat: 0, muscleStat: 0, hackerStat: 0, ninjaStat: 0 }
        ];
        this.runnerTypes = ['Empty', 'Face', 'Muscle', 'Hacker', 'Ninja'];
        this.observers = new Set();
    }

    updateRunner(slotIndex, field, value) {
        if (slotIndex < 0 || slotIndex >= this.runners.length) {
            throw new Error(`Invalid runner slot: ${slotIndex}`);
        }

        const oldValue = this.runners[slotIndex][field];

        if (field === 'type') {
            this.validateRunnerType(value);
        } else {
            this.validateStatValue(value);
        }

        this.runners[slotIndex][field] = value;
        this.notifyObservers('runnerUpdated', { slotIndex, field, value, oldValue });
    }

    validateStatValue(value) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 20) {
            throw new Error('Stat values must be integers between 0 and 20');
        }
        return numValue;
    }

    validateRunnerType(type) {
        if (!this.runnerTypes.includes(type)) {
            throw new Error(`Invalid runner type: ${type}`);
        }
    }

    getRunnerConfiguration() {
        return this.runners.map(runner => ({ ...runner }));
    }

    getTotalStats() {
        return this.runners.reduce((totals, runner) => {
            if (runner.type !== 'Empty') {
                totals.faceStat += runner.faceStat;
                totals.muscleStat += runner.muscleStat;
                totals.hackerStat += runner.hackerStat;
                totals.ninjaStat += runner.ninjaStat;
            }
            return totals;
        }, { faceStat: 0, muscleStat: 0, hackerStat: 0, ninjaStat: 0 });
    }

    getActiveRunners() {
        return this.runners.filter(runner => runner.type !== 'Empty');
    }

    subscribe(observer) {
        this.observers.add(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => observer(event, data));
    }
}
```

### Effect Calculation Engine
```javascript
// effectCalculator.js - Comprehensive effect processing
export class EffectCalculator {
    constructor(runnerManager) {
        this.runnerManager = runnerManager;
        this.parser = new EffectParser();
        this.prevention = new PreventionMechanics();
        this.currentPools = this.initializePools();
    }

    initializePools() {
        return {
            damage: 0,
            risk: 0,
            money: 0,
            grit: 0,
            veil: 0
        };
    }

    calculateEffects(selectedNodes, contractData) {
        this.resetPools();

        const runners = this.runnerManager.getRunnerConfiguration();
        const calculations = [];

        selectedNodes.forEach(nodeId => {
            const node = contractData.nodes.get(nodeId);
            if (!node || !node.effect) return;

            const result = this.processNodeEffect(node, runners, selectedNodes, contractData);
            calculations.push(result);

            if (result.success) {
                this.applyEffectToPool(result.effect);
            }
        });

        // Apply prevention mechanics
        const finalPools = this.prevention.applyPrevention(this.currentPools);

        return {
            calculations: calculations,
            finalPools: finalPools,
            prevention: this.prevention.getPreventionSummary(this.currentPools)
        };
    }

    processNodeEffect(node, runners, selectedNodes, contractData) {
        try {
            const parsedEffect = this.parser.parseEffect(node.effect);
            const conditionMet = this.evaluateCondition(parsedEffect.condition, runners, selectedNodes, contractData);

            if (!conditionMet) {
                return {
                    nodeId: node.id,
                    success: false,
                    reason: 'Condition not met',
                    effect: parsedEffect
                };
            }

            const calculatedValue = this.calculateValue(parsedEffect, runners);

            return {
                nodeId: node.id,
                success: true,
                effect: {
                    ...parsedEffect,
                    calculatedValue: calculatedValue
                }
            };

        } catch (error) {
            return {
                nodeId: node.id,
                success: false,
                reason: error.message,
                effect: null
            };
        }
    }

    evaluateCondition(condition, runners, selectedNodes, contractData) {
        switch (condition.type) {
            case 'None':
                return true;

            case 'RunnerType':
                return this.checkRunnerType(condition.value, runners);

            case 'RunnerStat':
                return this.checkRunnerStat(condition, runners);

            case 'NodeColor':
                return this.checkNodeColor(condition.value, selectedNodes, contractData);

            case 'NodeColorCombo':
                return this.checkNodeColorCombo(condition.value, selectedNodes, contractData);

            default:
                throw new Error(`Unknown condition type: ${condition.type}`);
        }
    }

    checkRunnerType(requiredType, runners) {
        return runners.some(runner => runner.type === requiredType);
    }

    checkRunnerStat(condition, runners) {
        // Parse condition like "FaceStat>5"
        const [statName, operator, threshold] = this.parser.parseStatCondition(condition.value);
        const totalStat = runners.reduce((sum, runner) => sum + runner[statName], 0);

        switch (operator) {
            case '>': return totalStat > threshold;
            case '<': return totalStat < threshold;
            case '=': return totalStat === threshold;
            case '>=': return totalStat >= threshold;
            case '<=': return totalStat <= threshold;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
    }

    checkNodeColor(requiredColor, selectedNodes, contractData) {
        return selectedNodes.some(nodeId => {
            const node = contractData.nodes.get(nodeId);
            return node && node.color === requiredColor;
        });
    }

    checkNodeColorCombo(colorCombo, selectedNodes, contractData) {
        // Parse combinations like "Red+Blue" or "Red+Blue+Green"
        const requiredColors = colorCombo.split('+');
        const selectedColors = new Set();

        selectedNodes.forEach(nodeId => {
            const node = contractData.nodes.get(nodeId);
            if (node) {
                selectedColors.add(node.color);
            }
        });

        return requiredColors.every(color => selectedColors.has(color));
    }

    calculateValue(effect, runners) {
        let baseValue = effect.amount;

        // Apply operator if not addition
        if (effect.operator !== '+') {
            // For non-addition operators, might need context-specific calculations
            // This depends on the specific game rules for each operator
        }

        return baseValue;
    }

    applyEffectToPool(effect) {
        const value = effect.calculatedValue;

        switch (effect.operator) {
            case '+':
                this.currentPools[effect.stat] += value;
                break;
            case '-':
                this.currentPools[effect.stat] -= value;
                break;
            case '*':
                this.currentPools[effect.stat] *= value;
                break;
            case '/':
                if (value !== 0) {
                    this.currentPools[effect.stat] = Math.floor(this.currentPools[effect.stat] / value);
                }
                break;
        }
    }

    resetPools() {
        this.currentPools = this.initializePools();
    }
}
```

### Effect String Parser
```javascript
// effectParser.js - Robust effect string parsing
export class EffectParser {
    parseEffect(effectString) {
        // Format: "Condition;Operator;Amount;Stat"
        const parts = effectString.split(';');

        if (parts.length !== 4) {
            throw new Error(`Invalid effect format: ${effectString}`);
        }

        const [conditionStr, operator, amountStr, stat] = parts;

        return {
            condition: this.parseCondition(conditionStr),
            operator: this.validateOperator(operator),
            amount: this.parseAmount(amountStr),
            stat: this.validateStat(stat)
        };
    }

    parseCondition(conditionStr) {
        if (conditionStr === 'None') {
            return { type: 'None' };
        }

        const colonIndex = conditionStr.indexOf(':');
        if (colonIndex === -1) {
            throw new Error(`Invalid condition format: ${conditionStr}`);
        }

        const type = conditionStr.substring(0, colonIndex);
        const value = conditionStr.substring(colonIndex + 1);

        return { type, value };
    }

    parseStatCondition(value) {
        // Parse "FaceStat>5" format
        const operators = ['>=', '<=', '>', '<', '='];

        for (const op of operators) {
            const index = value.indexOf(op);
            if (index !== -1) {
                const statName = value.substring(0, index);
                const threshold = parseInt(value.substring(index + op.length), 10);
                return [statName, op, threshold];
            }
        }

        throw new Error(`Invalid stat condition format: ${value}`);
    }

    validateOperator(operator) {
        const validOperators = ['+', '-', '*', '/'];
        if (!validOperators.includes(operator)) {
            throw new Error(`Invalid operator: ${operator}`);
        }
        return operator;
    }

    parseAmount(amountStr) {
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount)) {
            throw new Error(`Invalid amount: ${amountStr}`);
        }
        return amount;
    }

    validateStat(stat) {
        const validStats = ['Damage', 'Risk', 'Money', 'Grit', 'Veil'];
        if (!validStats.includes(stat)) {
            throw new Error(`Invalid stat: ${stat}`);
        }
        return stat.toLowerCase();
    }
}
```

### Prevention Mechanics System
```javascript
// preventionMechanics.js - Grit/Veil damage reduction
export class PreventionMechanics {
    applyPrevention(pools) {
        const result = { ...pools };

        // 2 Grit prevents 1 Damage
        const damagePreventable = Math.floor(pools.grit / 2);
        const damagePrevented = Math.min(damagePreventable, pools.damage);
        result.damage -= damagePrevented;
        result.grit -= damagePrevented * 2;

        // 2 Veil prevents 1 Risk
        const riskPreventable = Math.floor(pools.veil / 2);
        const riskPrevented = Math.min(riskPreventable, pools.risk);
        result.risk -= riskPrevented;
        result.veil -= riskPrevented * 2;

        return result;
    }

    getPreventionSummary(originalPools) {
        const afterPrevention = this.applyPrevention(originalPools);

        return {
            damagePrevented: originalPools.damage - afterPrevention.damage,
            riskPrevented: originalPools.risk - afterPrevention.risk,
            gritUsed: originalPools.grit - afterPrevention.grit,
            veilUsed: originalPools.veil - afterPrevention.veil
        };
    }

    calculatePreventionCapacity(pools) {
        return {
            maxDamagePrevention: Math.floor(pools.grit / 2),
            maxRiskPrevention: Math.floor(pools.veil / 2)
        };
    }
}
```

---

## Testing and Validation

### Runner Management Testing
- [ ] All 5 runner types selectable in each slot
- [ ] Stat input validation prevents invalid values
- [ ] Real-time totaling updates correctly
- [ ] Configuration changes trigger appropriate events
- [ ] Empty slots handled properly in calculations
- [ ] Input persistence during application use

### Effect Calculation Testing
- [ ] **None conditions:** Always apply effects
- [ ] **RunnerType conditions:** Correctly check for specific runner types
- [ ] **RunnerStat conditions:** All comparison operators work accurately
- [ ] **NodeColor conditions:** Properly evaluate selected node colors
- [ ] **NodeColorCombo conditions:** Complex color combinations validate correctly
- [ ] All mathematical operators produce accurate results
- [ ] Edge cases handled (division by zero, negative results)

### Prevention Mechanics Testing
- [ ] Grit correctly prevents damage at 2:1 ratio
- [ ] Veil correctly prevents risk at 2:1 ratio
- [ ] Prevention applied only up to available resources
- [ ] Final calculations accurate after prevention
- [ ] Prevention summary displays correct values

### Integration Testing
- [ ] Complete flow from runner setup to final results
- [ ] Real-time updates across all system components
- [ ] Error handling displays appropriate user feedback
- [ ] Performance remains responsive with complex calculations
- [ ] State persistence during contract changes

---

## Performance Requirements

### Calculation Performance Targets
- **Effect Processing:** Under 100ms for 20+ selected nodes
- **Real-time Updates:** Under 50ms for runner configuration changes
- **Prevention Calculation:** Under 10ms for all pools
- **Complete Recalculation:** Under 200ms for full system update

### Memory Management
- Efficient effect parsing with caching for repeated calculations
- Minimal object creation during real-time updates
- Proper cleanup of calculation intermediates
- Optimized data structures for frequent access patterns

---

## Definition of Done

### Functional Criteria
- [ ] Runner management system supports all configuration requirements
- [ ] Effect calculation engine processes all specified condition types accurately
- [ ] Prevention mechanics correctly reduce damage and risk using Grit/Veil
- [ ] Real-time updates maintain system responsiveness
- [ ] Complete game flow from setup to results works seamlessly
- [ ] All mathematical operations produce accurate results

### Integration Criteria
- [ ] Runner system integrates cleanly with UI components
- [ ] Effect calculations work correctly with data structures from MS1B
- [ ] Visual updates reflect calculation results appropriately
- [ ] Error handling provides clear user feedback
- [ ] Performance remains responsive under typical usage scenarios

### Code Quality Criteria
- [ ] Game logic code follows modular architecture patterns
- [ ] Mathematical calculations are well-tested and documented
- [ ] Error handling covers all edge cases and invalid inputs
- [ ] Code structure supports future enhancement and maintenance

---

## Risk Assessment

### Technical Risks
1. **Effect Calculation Complexity**
   - **Risk Level:** High
   - **Mitigation:** Comprehensive unit testing, step-by-step validation, debugging tools

2. **Real-time Performance**
   - **Risk Level:** Medium
   - **Mitigation:** Performance optimization, calculation caching, efficient algorithms

3. **Mathematical Accuracy**
   - **Risk Level:** Medium
   - **Mitigation:** Extensive test cases, validation against specification examples

### Business Logic Risks
1. **Complex Condition Evaluation**
   - **Risk Level:** Medium-High
   - **Mitigation:** Detailed specification interpretation, stakeholder validation

2. **Prevention Mechanics Edge Cases**
   - **Risk Level:** Medium
   - **Mitigation:** Comprehensive edge case testing, clear specification documentation

---

## Transition to Phase 2

Upon completion of MS1D, the project will have achieved:
- **Complete Milestone 1 Objectives:** All 7 tasks implemented and validated
- **Full Game Concept Demonstration:** End-to-end gameplay flow operational
- **Technical Foundation:** Architecture ready for Phase 2 enhancements
- **Performance Baseline:** Established metrics for future optimization

**Phase 2 Preparation:**
- Real-time preview system ready for implementation (Task #8)
- Node interaction capabilities prepared for enhancement (Task #9)
- Contract execution framework established for advanced features (Task #10)

**Final Deliverables:**
1. Complete game logic engine with all specified features
2. Comprehensive test suite validating all calculations
3. Performance benchmarks for optimization planning
4. Technical documentation for future development phases
5. Stakeholder demonstration of complete game concept