# Johnson Prototype Refactoring Plan

## Executive Summary (Non-Technical)

Think of your codebase like a house that was built room-by-room over time. Some rooms have duplicate furniture, some have features that are no longer used, and some have wiring that does the same job in different ways. This refactoring is like hiring an organization expert to:

- **Remove duplicate items** - The game and editor both have their own text-wrapping code doing the exact same thing
- **Clean out storage closets** - Remove dead code and unused functions that were replaced but never deleted
- **Standardize the plumbing** - Make validation work the same way everywhere
- **Organize similar items together** - Create shared utilities instead of copying code
- **Fix inefficiencies** - Remove unnecessary calculations and redundant data storage

**Benefits you'll see:**
- **Faster loading and smoother gameplay** - Less code means quicker execution
- **Easier to add new features** - Shared utilities mean writing new code once, not twice
- **Fewer bugs** - Less duplicate code means fewer places where bugs can hide
- **Better maintainability** - Future changes only need to happen in one place

The refactoring is designed to be done safely in phases, testing after each step to ensure nothing breaks.

---

## Current State Analysis

### Project Statistics
- **Total JavaScript files**: 11 main files (excluding node_modules and test files)
- **Lines of code**: ~7,000+ lines across main application and editor
- **Duplicate code patterns**: 5 major areas of duplication identified
- **Dead/Unused code**: 3 significant deprecated methods identified
- **Validation logic**: Duplicated across 3 different files

### Code Health Assessment
- **Strengths**:
  - Well-organized file structure with clear separation of concerns
  - Comprehensive validation in multiple places
  - Good documentation and comments
  - Editor and game work correctly

- **Issues**:
  - Significant code duplication between game and editor (text rendering, validation)
  - Dead/deprecated code not removed after refactoring
  - Inconsistent validation approaches
  - Some over-engineering where simple solutions would suffice
  - Performance optimizations that may not be needed

---

## Issues Identified

### Critical Issues

#### 1. **Duplicate Text Rendering Logic** (HIGH IMPACT)
**Files**: `visualPrototype.js` (lines 203-273, 499-520, 674-703) and `nodeManager.js` (lines 225-273, 275-300, 498-520)
- **Problem**: The exact same text processing, line breaking, and wrapping logic exists in both files
- **Impact**:
  - Changes to text rendering must be made in two places
  - Inconsistencies can cause visual differences between game and editor
  - ~150 lines of duplicate code
- **Risk**: High - Any text rendering bug fix or enhancement requires dual updates

#### 2. **Duplicate Validation Logic** (HIGH IMPACT)
**Files**: `csvLoader.js` (lines 659-715, 809-856), `fileManager.js` (lines 248-298, 331-396, 510-583), `gameState.js` (lines 759-870)
- **Problem**: Three different files validate CSV data, effect strings, and gate conditions
- **Impact**:
  - Validation rules can drift out of sync
  - Three places to update when adding new validation
  - ~400 lines of similar/duplicate validation code
- **Risk**: High - Inconsistent validation can allow invalid data through one path but not another

#### 3. **Legacy Code Not Removed** (MEDIUM IMPACT)
**Files**:
- `editorMain.js` line 465-470: Deprecated `loadContractFromCSV()` method
- `ui.js` lines 89-169: Deprecated placeholder canvas drawing methods
- `csvLoader.js` lines 522-573: Sample data method that's never used

- **Problem**: Old code remains after functionality was refactored
- **Impact**:
  - Confuses new developers
  - Increases codebase size unnecessarily
  - May be accidentally called causing bugs
- **Risk**: Medium - Could cause confusion or accidental usage

### Medium Priority Issues

#### 4. **Coordinate Format Conversion** (MEDIUM COMPLEXITY)
**Files**: `gameState.js` (lines 71-85), `csvLoader.js` (lines 58-64, 580-617)
- **Problem**: Code handling both X,Y and legacy Layer/Slot formats adds complexity
- **Impact**:
  - Extra conditional logic in multiple places
  - Legacy format detection adds processing overhead
  - Makes code harder to understand
- **Risk**: Low - Legacy format rarely used, but adds technical debt

#### 5. **Canvas Dimension Handling** (LOW IMPACT)
**Files**: `visualPrototype.js` (lines 299-307, 1349-1354), `ui.js` (lines 59-84)
- **Problem**: Different approaches to getting canvas dimensions (CSS vs buffer dimensions)
- **Impact**:
  - Can cause confusion about which dimensions to use
  - Inconsistent across different parts of codebase
- **Risk**: Low - Currently working, but could cause layout bugs

#### 6. **Connection Path Calculation** (MODERATE DUPLICATION)
**Files**: `visualPrototype.js` (lines 822-921), `connectionManager.js` (lines 79-178)
- **Problem**: Similar but slightly different connection routing algorithms
- **Impact**:
  - ~100 lines of similar code
  - Harder to improve routing algorithm (must change in two places)
- **Risk**: Medium - Visual inconsistency between game and editor

### Low Priority Issues

#### 7. **Prevention Data Calculation** (MINOR DUPLICATION)
**Files**: `gameState.js` (lines 248-270, 574-613)
- **Problem**: Prevention calculation happens twice with slight differences
- **Impact**:
  - Could be consolidated into single method
  - ~60 lines could be reduced to ~30
- **Risk**: Low - Works correctly, just inefficient

#### 8. **Node State Management** (COMPLEXITY)
**Files**: `gameState.js` (lines 690-737)
- **Problem**: Complex node availability logic with multiple conditions
- **Impact**:
  - Hard to understand and debug
  - Could benefit from refactoring into smaller functions
- **Risk**: Low - Works but could be clearer

#### 9. **Performance Optimizations That May Be Premature** (OVER-ENGINEERING)
**Files**: `visualPrototype.js` (lines 48-56, 269-292)
- **Problem**: Caching and performance mode may not be needed for typical contract sizes
- **Impact**:
  - Adds complexity
  - May not provide actual performance benefit
- **Risk**: Very Low - Could simplify if not needed

---

## Refactoring Goals

1. **Eliminate critical code duplication** - Create shared utilities for text rendering and validation
2. **Remove dead code** - Delete deprecated methods and unused functions
3. **Consolidate validation** - Single source of truth for all validation rules
4. **Simplify coordinate handling** - Remove legacy format support or isolate it better
5. **Improve maintainability** - Make codebase easier to understand and modify
6. **Maintain stability** - Ensure all existing functionality continues to work perfectly

---

## Detailed Refactoring Plan

### Phase 1: Safe Cleanup - Remove Dead Code
**Risk Level**: Very Low
**Estimated Impact**: Reduce codebase by ~200 lines
**Files Affected**: `editorMain.js`, `ui.js`, `csvLoader.js`

#### Changes:

1. **Remove deprecated `loadContractFromCSV()` method** (`editorMain.js` lines 465-470)
   ```javascript
   // REMOVE THIS:
   loadContractFromCSV(csvContent) {
       console.warn('loadContractFromCSV is deprecated...');
   }
   ```
   - Marked as deprecated since FileManager handles this
   - Not called anywhere in codebase
   - Safe to remove

2. **Remove placeholder canvas methods** (`ui.js` lines 89-169)
   ```javascript
   // REMOVE THESE:
   drawPlaceholder()
   drawPlaceholderNodes()
   ```
   - VisualPrototypeRenderer replaced this functionality
   - Only called during initialization, no longer needed
   - Safe to remove

3. **Remove unused `getSampleData()` method** (`csvLoader.js` lines 522-573)
   - Never called in production code
   - Was for early testing only
   - Safe to remove

4. **Remove performance caching if not beneficial** (`visualPrototype.js` lines 52-56)
   - Consider removing if performance testing shows no benefit
   - Check if `textRenderCache` and `connectionCache` are actually improving performance
   - If not, simplify by removing caching logic

#### Rationale:
Dead code removal is safest refactoring with no behavior changes. This creates a cleaner starting point for more complex refactoring.

#### Testing Strategy:
1. Grep for any calls to removed methods
2. Run full game flow (load contract, select nodes, execute)
3. Run editor flow (create nodes, save, load)
4. Verify no console errors

---

### Phase 2: Extract Shared Text Utilities
**Risk Level**: Low
**Estimated Impact**: Eliminate ~150 lines of duplicate code
**Files Affected**: New `js/utils/textUtils.js`, `visualPrototype.js`, `nodeManager.js`

#### Changes:

1. **Create new shared utility file** (`js/utils/textUtils.js`)
   ```javascript
   /**
    * Shared text processing utilities
    * Used by both game renderer and editor
    */
   class TextUtils {
       /**
        * Process text with linebreak support and word wrapping
        */
       static processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
           if (!text) return [''];
           ctx.font = `${fontSize}px Arial`;
           const paragraphs = text.split(/\r?\n/);
           const result = [];
           paragraphs.forEach(paragraph => {
               if (paragraph.trim() === '') {
                   result.push('');
               } else {
                   const wrappedLines = TextUtils.wrapText(ctx, paragraph, maxWidth);
                   result.push(...wrappedLines);
               }
           });
           return result.length > 0 ? result : [''];
       }

       /**
        * Wrap text to fit within specified width
        */
       static wrapText(ctx, text, maxWidth) {
           const words = text.split(' ');
           const lines = [];
           let currentLine = '';
           for (let word of words) {
               const testLine = currentLine + (currentLine ? ' ' : '') + word;
               const metrics = ctx.measureText(testLine);
               if (metrics.width > maxWidth && currentLine) {
                   lines.push(currentLine);
                   currentLine = word;
               } else {
                   currentLine = testLine;
               }
           }
           if (currentLine) lines.push(currentLine);
           return lines.length > 0 ? lines : [text];
       }

       /**
        * Calculate optimal node dimensions based on text content
        */
       static calculateNodeDimensions(node, minWidth = 80, minHeight = 60) {
           const tempCanvas = document.createElement('canvas');
           const ctx = tempCanvas.getContext('2d');
           const padding = 6;
           const maxWidth = 200;
           const lineHeight = 16;
           const separatorHeight = 4;

           const availableWidth = maxWidth - padding * 2;

           // Gate nodes only use effectDesc
           if (node.type === 'Gate') {
               ctx.font = '12px Arial';
               const effectLines = TextUtils.processTextWithLinebreaks(
                   node.effectDesc || '', availableWidth, ctx, 12
               );
               const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));
               const totalTextHeight = effectLines.length * lineHeight;
               return {
                   width: Math.max(minWidth, effectWidth + padding * 2),
                   height: Math.max(minHeight, totalTextHeight + padding * 2)
               };
           }

           // Regular nodes: description + effectDesc
           ctx.font = 'bold 14px Arial';
           const descLines = TextUtils.processTextWithLinebreaks(
               node.description || '', availableWidth, ctx, 14
           );
           const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

           ctx.font = '12px Arial';
           const effectLines = TextUtils.processTextWithLinebreaks(
               node.effectDesc || '', availableWidth, ctx, 12
           );
           const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

           const maxTextWidth = Math.max(descWidth, effectWidth);
           const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';
           const totalTextHeight = (descLines.length * lineHeight) +
                                  (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

           return {
               width: Math.max(minWidth, maxTextWidth + padding * 2),
               height: Math.max(minHeight, totalTextHeight + padding * 2)
           };
       }
   }
   ```

2. **Update `visualPrototype.js`** to use shared utilities
   - Remove `processTextWithLinebreaks()` method (lines 651-672)
   - Remove `wrapText()` method (lines 675-703)
   - Remove `calculateOptimalNodeSize()` method (lines 203-257)
   - Replace all calls with `TextUtils.methodName()`

3. **Update `nodeManager.js`** to use shared utilities
   - Remove `processTextWithLinebreaks()` method (lines 498-520)
   - Remove `wrapText()` method (lines 275-300)
   - Remove `calculateNodeDimensions()` method (lines 225-273)
   - Replace all calls with `TextUtils.methodName()`

#### Rationale:
Text processing is identical in both files. Extracting to shared utility ensures consistency and reduces maintenance burden. Any text rendering improvements only need to be made once.

#### Testing Strategy:
1. Load contract in game - verify node text wraps correctly
2. Load contract in editor - verify node text wraps correctly
3. Create new node with long text - verify wrapping
4. Test with multi-line text (linebreaks) - verify preserves linebreaks
5. Compare screenshots before/after to ensure identical rendering
6. Test Gate nodes vs regular nodes

---

### Phase 3: Consolidate Validation Logic
**Risk Level**: Medium
**Estimated Impact**: Create single validation source of truth
**Files Affected**: New `js/utils/validationUtils.js`, `csvLoader.js`, `fileManager.js`, `gameState.js`

#### Changes:

1. **Create comprehensive validation utility** (`js/utils/validationUtils.js`)
   ```javascript
   /**
    * Shared validation utilities
    * Single source of truth for all validation rules
    */
   class ValidationUtils {
       // Valid values constants
       static VALID_COLORS = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey'];
       static VALID_NODE_TYPES = ['Normal', 'Synergy', 'Start', 'End', 'Gate'];
       static VALID_OPERATORS = ['+', '-', '*', '/', '%'];
       static VALID_STATS = ['damage', 'risk', 'money', 'grit', 'veil'];

       /**
        * Validate effect string format
        */
       static validateEffectString(effectString, rowNumber = null, columnName = '') {
           const errors = [];
           // ... consolidate logic from csvLoader.js lines 659-715
           return { errors };
       }

       /**
        * Validate gate condition format
        */
       static validateGateCondition(conditionString, nodeId = null) {
           // ... consolidate logic from csvLoader.js lines 809-856
           //     and fileManager.js lines 510-583
           return { valid: true/false, message: '' };
       }

       /**
        * Validate node data structure
        */
       static validateNodeData(nodeData, rowNumber = null) {
           // ... consolidate logic from csvLoader.js and fileManager.js
           return { isValid: true/false, errors: [] };
       }

       /**
        * Validate connection references
        */
       static validateConnectionReferences(data) {
           // ... consolidate logic from fileManager.js lines 403-424
           return { isValid: true/false, errors: [] };
       }
   }
   ```

2. **Update all validation call sites**
   - `csvLoader.js`: Replace methods with `ValidationUtils` calls
   - `fileManager.js`: Replace methods with `ValidationUtils` calls
   - `gameState.js`: Use `ValidationUtils` for gate condition validation

#### Rationale:
Multiple validation implementations create risk of inconsistency. Consolidating ensures all entry points (CSV load, editor, runtime) use same rules. Makes it trivial to add new validation rules.

#### Testing Strategy:
1. Test CSV import with valid data
2. Test CSV import with invalid effect strings
3. Test CSV import with invalid gate conditions
4. Test editor node property updates with invalid data
5. Verify error messages are helpful and accurate
6. Test boundary cases (empty strings, null values, etc.)

---

### Phase 4: Simplify Connection Path Logic
**Risk Level**: Low-Medium
**Estimated Impact**: Consolidate ~100 lines of similar code
**Files Affected**: New `js/utils/connectionUtils.js`, `visualPrototype.js`, `connectionManager.js`

#### Changes:

1. **Create shared connection utilities** (`js/utils/connectionUtils.js`)
   ```javascript
   /**
    * Shared connection path calculation
    * Used by both game renderer and editor
    */
   class ConnectionUtils {
       /**
        * Find best anchor points between two nodes
        */
       static findBestAnchorPoints(fromNode, toNode) {
           // Consolidate logic from visualPrototype.js lines 843-889
           // and connectionManager.js lines 96-142
       }

       /**
        * Calculate right-angle path between anchor points
        */
       static calculateRightAnglePath(startPoint, endPoint) {
           // Consolidate logic from visualPrototype.js lines 897-921
           // and connectionManager.js lines 154-178
       }

       /**
        * Calculate full connection path
        */
       static calculateConnectionPath(fromNode, toNode) {
           const anchorPoints = ConnectionUtils.findBestAnchorPoints(fromNode, toNode);
           return ConnectionUtils.calculateRightAnglePath(anchorPoints.start, anchorPoints.end);
       }
   }
   ```

2. **Update renderers to use shared utilities**
   - `visualPrototype.js`: Replace path calculation methods
   - `connectionManager.js`: Replace path calculation methods

#### Rationale:
Connection routing should look identical between game and editor. Having two implementations risks visual inconsistency. Shared utility ensures consistency and makes improvements easier.

#### Testing Strategy:
1. Load contract with various connection types
2. Verify connections render identically in game and editor
3. Test with nodes at different relative positions (above, below, diagonal)
4. Move nodes and verify connections update correctly
5. Compare screenshots of connections before/after refactoring

---

### Phase 5: Cleanup Legacy Format Support
**Risk Level**: Medium
**Estimated Impact**: Simplify coordinate handling
**Files Affected**: `gameState.js`, `csvLoader.js`

#### Changes:

1. **Option A: Remove legacy Layer/Slot support entirely**
   - All contracts now use X,Y format
   - Remove legacy detection and conversion code
   - Simpler, cleaner codebase

2. **Option B: Isolate legacy format handling** (RECOMMENDED)
   - Create `LegacyFormatConverter` utility
   - Keep backward compatibility but isolate complexity
   - Make it clear this is legacy support

   ```javascript
   /**
    * Legacy format converter
    * Handles old Layer/Slot positioning format
    */
   class LegacyFormatConverter {
       static isLegacyFormat(data) {
           // Check if using Layer/Slot instead of X,Y
       }

       static convertToXY(legacyData) {
           // Convert Layer/Slot to X,Y coordinates
       }
   }
   ```

#### Rationale:
Legacy format handling adds complexity throughout codebase. Either remove it (if all contracts updated) or isolate it clearly. Recommended approach is isolation for backward compatibility.

#### Testing Strategy:
1. Test with modern X,Y format contracts
2. Test with legacy Layer/Slot contracts (if keeping support)
3. Verify conversion produces correct positions
4. Test contract library loading

---

### Phase 6: Optional Performance Optimization Review
**Risk Level**: Low
**Estimated Impact**: May simplify code if optimizations not needed
**Files Affected**: `visualPrototype.js`

#### Changes:

1. **Profile performance with typical contracts**
   - Measure render times with and without caching
   - Measure render times with and without viewport culling
   - Determine if optimizations provide real benefit

2. **If optimizations not needed:**
   - Remove `performanceMode` flag and related logic
   - Remove caching mechanisms
   - Simplify render loop

3. **If optimizations needed:**
   - Keep existing code
   - Document when performance mode triggers
   - Add metrics to show benefit

#### Rationale:
Premature optimization adds complexity. If profiling shows optimizations don't help with typical contract sizes (20-50 nodes), remove the complexity. If they do help, keep but document clearly.

#### Testing Strategy:
1. Profile rendering with 10, 50, 100 node contracts
2. Compare render times with/without optimizations
3. Test with rapid panning/zooming
4. Verify smooth performance either way

---

## Code Examples

### Before: Duplicate Text Processing
**visualPrototype.js** (lines 651-703):
```javascript
// In visualPrototype.js
processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
    if (!text) return [''];
    ctx.font = `${fontSize}px Arial`;
    const paragraphs = text.split(/\r?\n/);
    const result = [];
    paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') {
            result.push('');
        } else {
            const wrappedLines = this.wrapText(ctx, paragraph, maxWidth);
            result.push(...wrappedLines);
        }
    });
    return result.length > 0 ? result : [''];
}

wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
}
```

**nodeManager.js** has identical code (lines 498-520, 275-300)

### After: Shared Utility
**js/utils/textUtils.js**:
```javascript
class TextUtils {
    static processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
        // Same implementation, but in one place
    }

    static wrapText(ctx, text, maxWidth) {
        // Same implementation, but in one place
    }
}
```

**visualPrototype.js** and **nodeManager.js**:
```javascript
// Both files now just call:
const lines = TextUtils.processTextWithLinebreaks(text, maxWidth, ctx, fontSize);
```

**Result**: 100 lines of duplicate code → 5 lines calling shared utility

---

### Before: Multiple Validation Implementations

**csvLoader.js** (lines 659-715):
```javascript
validateEffectString(effectString, rowNumber, columnName) {
    const errors = [];
    const parts = effectString.split(';');
    if (parts.length !== 4) {
        errors.push(`Effect must have exactly 4 parts...`);
    }
    // ... 50+ lines of validation
    return { errors };
}
```

**fileManager.js** has similar but slightly different validation

### After: Single Validation Source

**js/utils/validationUtils.js**:
```javascript
class ValidationUtils {
    static validateEffectString(effectString, context = {}) {
        // Single, comprehensive implementation
        // Both CSV loader and file manager call this
    }
}
```

**Result**: Consistent validation everywhere, single place to update rules

---

## Risks and Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**:
- Make changes incrementally in phases
- Test thoroughly after each phase
- Keep git commits small and focused
- Have rollback plan for each phase
- Run full regression test suite after each phase

### Risk 2: Introducing Subtle Visual Differences
**Mitigation**:
- Take screenshots before refactoring
- Compare screenshots after each change
- Use pixel-perfect diff tools if available
- Test with variety of contracts (short text, long text, multi-line, etc.)

### Risk 3: Performance Regression
**Mitigation**:
- Profile performance before refactoring
- Profile after each phase
- Keep performance metrics for comparison
- If performance degrades, investigate and fix before proceeding

### Risk 4: Breaking Editor-Game Compatibility
**Mitigation**:
- Test contract export from editor
- Test contract import to game
- Verify CSV format unchanged
- Test round-trip (export from editor, import to game, works correctly)

### Risk 5: Validation Changes Allow Bad Data
**Mitigation**:
- Create comprehensive validation test suite before consolidating
- Test all edge cases with new consolidated validation
- Verify same data passes/fails validation before and after
- Add validation for any previously unchecked cases

---

## Success Metrics

### Code Metrics
- [ ] Reduce codebase by at least 400 lines (duplicate code removed)
- [ ] Reduce code duplication from 5 major areas to 0
- [ ] All validation in single utility file
- [ ] Text processing in single utility file
- [ ] No deprecated methods remaining

### Quality Metrics
- [ ] All existing functionality still works perfectly
- [ ] No visual differences between before/after screenshots
- [ ] No performance regression (render times within 10% of original)
- [ ] Validation is consistent across all entry points
- [ ] Code is more maintainable (less duplication, clearer structure)

### Testing Metrics
- [ ] Full contract loading and execution works
- [ ] Editor create, edit, save, load works
- [ ] CSV import/export preserves all data
- [ ] All node types render correctly (regular, gate, synergy)
- [ ] All effect types calculate correctly
- [ ] All gate conditions evaluate correctly
- [ ] Connection routing works in both game and editor
- [ ] Touch controls still work on tablet
- [ ] Session state persistence works

---

## Implementation Recommendations

### Development Approach
1. **Work in feature branch**: Create `refactoring/phase1` branch for first phase
2. **One phase at a time**: Complete and test each phase before starting next
3. **Commit frequently**: Small, focused commits make rollback easier
4. **Write tests first**: Create test cases before making changes
5. **Document changes**: Update code comments and this plan as you go

### Testing Strategy
1. **Manual testing checklist**: Create detailed checklist for each phase
2. **Automated tests**: Consider adding unit tests for utility functions
3. **Visual regression testing**: Take screenshots for comparison
4. **Performance testing**: Profile render times before/after
5. **Integration testing**: Test full workflows (load, play, save)

### Order of Implementation
**Recommended order**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

This order starts with safest changes (removing dead code) and progresses to more complex refactoring. Each phase can be deployed independently if needed.

### Timeline Estimate
- **Phase 1**: 2-3 hours (safe cleanup)
- **Phase 2**: 4-6 hours (extract text utilities + testing)
- **Phase 3**: 6-8 hours (consolidate validation + extensive testing)
- **Phase 4**: 4-5 hours (connection utilities + testing)
- **Phase 5**: 3-4 hours (legacy format handling)
- **Phase 6**: 2-4 hours (performance review + optional changes)

**Total**: 21-30 hours of focused development and testing

---

## Files to Review Manually

### Before Starting Refactoring
1. **Review all test files** (`Tests/` directory) - Understand current test coverage
2. **Review CONTRACT_LIBRARY** - Ensure understand current contract format
3. **Review CLAUDE.md** - Ensure refactoring aligns with project architecture
4. **Review recent commits** - Understand latest changes and their intent

### During Refactoring
1. **Check all import statements** - Ensure new utility files are properly imported
2. **Verify HTML files** - Ensure script tags updated for new utility files
3. **Check console logs** - Look for warnings about deprecated methods
4. **Review CSS files** - Ensure no styling changes needed

### After Refactoring
1. **Update CLAUDE.md** - Document new utility structure
2. **Update README** (if exists) - Reflect new architecture
3. **Review all TODOs** - Remove completed items, update remaining
4. **Check for console warnings** - Clean up any deprecation warnings

---

## Appendix: Detailed File Analysis

### visualPrototype.js (1853 lines)
**Strengths**:
- Well-organized rendering system
- Good touch control implementation
- Comprehensive pan/zoom support

**Issues**:
- Duplicate text processing (lines 651-703)
- Duplicate dimension calculation (lines 203-257)
- Performance caching may be premature optimization (lines 48-56)
- Canvas dimension handling complexity (lines 299-307)

**Refactoring Priority**: HIGH (Phase 2)

### nodeManager.js (757 lines)
**Strengths**:
- Clean node management
- Good separation of concerns

**Issues**:
- Duplicate text processing (lines 498-520, 275-300)
- Duplicate dimension calculation (lines 225-273)
- Same issues as visualPrototype.js

**Refactoring Priority**: HIGH (Phase 2)

### csvLoader.js (857 lines)
**Strengths**:
- Comprehensive validation
- Good error messages

**Issues**:
- Validation duplicated with fileManager.js
- Unused getSampleData method (lines 522-573)
- Legacy format detection adds complexity (lines 58-64)

**Refactoring Priority**: HIGH (Phase 3, Phase 5)

### fileManager.js (797 lines)
**Strengths**:
- Comprehensive import/export
- Good error handling

**Issues**:
- Duplicate validation with csvLoader.js (lines 248-298, 331-396, 510-583)
- Very similar to csvLoader validation

**Refactoring Priority**: HIGH (Phase 3)

### gameState.js (1170 lines)
**Strengths**:
- Solid effect calculation system
- Good state management

**Issues**:
- Gate condition validation duplicated (lines 759-870)
- Prevention calculation could be simplified (lines 248-270, 574-613)
- Node availability logic is complex (lines 690-737)

**Refactoring Priority**: MEDIUM (Phase 3, Phase 5)

### connectionManager.js (409 lines)
**Strengths**:
- Clean connection management
- Good hover detection

**Issues**:
- Connection path calculation duplicated with visualPrototype.js
- Similar routing algorithms (lines 79-178)

**Refactoring Priority**: MEDIUM (Phase 4)

### ui.js (690 lines)
**Strengths**:
- Good UI coordination

**Issues**:
- Deprecated placeholder drawing (lines 89-169)
- Can be cleaned up

**Refactoring Priority**: LOW (Phase 1)

### editorMain.js (602 lines)
**Strengths**:
- Clean application coordination

**Issues**:
- Deprecated loadContractFromCSV method (lines 465-470)

**Refactoring Priority**: LOW (Phase 1)

---

## Conclusion

This refactoring plan provides a structured approach to improving the Johnson Prototype codebase while maintaining stability and functionality. By following the phased approach and testing thoroughly at each step, you can safely eliminate duplication, remove dead code, and create a more maintainable codebase.

The key benefits are:
- **Less maintenance burden** - Changes only need to happen once, not 2-3 times
- **Fewer bugs** - Less duplicate code means fewer places for bugs to hide
- **Easier to understand** - Clearer structure with shared utilities
- **Better consistency** - Shared code ensures game and editor work identically
- **Faster development** - New features only need to be implemented once

Start with Phase 1 (safe cleanup) to build confidence, then progress through phases in order. Each phase can be completed independently and deployed if needed.
