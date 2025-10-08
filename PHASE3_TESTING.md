# Phase 3 Testing Documentation

## Overview

Phase 3 consolidated ~400 lines of duplicate validation code from three files (`csvLoader.js`, `fileManager.js`, `gameState.js`) into a single shared utility: `js/utils/validationUtils.js`.

**Goal**: Ensure all validation logic works correctly after consolidation with no regressions.

---

## Changes Summary

### Files Created
- **js/utils/validationUtils.js** (~550 lines)
  - Consolidated validation logic for effects, gates, connections, and nodes
  - Single source of truth for all validation rules
  - Static methods for reusability across game and editor

### Files Modified

**csvLoader.js**:
- Line 604-606: `validateEffectString()` now delegates to `ValidationUtils.validateEffectString()`
- Line 615-617: `validateConnectionsString()` now delegates to `ValidationUtils.validateConnectionsString()`
- Line 683-686: `validateGateConditionFormat()` now delegates to `ValidationUtils.validateGateCondition()`
- **Removed**: ~140 lines of validation code

**fileManager.js**:
- Line 335-337: `validateNodeData()` now delegates to `ValidationUtils.validateNodeData()`
- Line 345-347: `validateConnectionReferences()` now delegates to `ValidationUtils.validateConnectionReferences()`
- Line 434-436: `validateGateCondition()` now delegates to `ValidationUtils.validateGateCondition()`
- **Removed**: ~170 lines of validation code

**index.html**:
- Line 263: Added `<script src="js/utils/validationUtils.js"></script>` after textUtils.js

**editor.html**:
- Line 179: Added `<script src="js/utils/validationUtils.js"></script>` after textUtils.js

### Net Code Change
- **Added**: ~550 lines (new validationUtils.js)
- **Removed**: ~310 lines (duplicate validation across files)
- **Net**: +240 lines (but with single source of truth and comprehensive utilities)

---

## Test Plan

### 1. Effect String Validation Tests

#### Test 1.1: Valid Effect Strings
**Purpose**: Ensure valid effect strings pass validation

**Test Data**:
```csv
None;+;10;Damage
RunnerType:Hacker;-;2;Risk
RunnerStat:muscle>=3;+;5;Damage
NodeColor:Red;+;100;Money
NodeColorCombo:Red,Blue;+;50;Money
PrevDam;+;5;Money
PrevRisk;%;10;Money
RiskDamPair;+;10;Money
ColorForEach;%;20;Damage
None;%;25;Damage
None;*;2;Grit
None;/;2;Veil
```

**Expected Result**: All effects pass validation with no errors

**How to Test**:
1. Create a test CSV with these effects
2. Import in game (index.html) - should load successfully
3. Import in editor (editor.html) - should load successfully
4. Check console for validation errors (should be none)

---

#### Test 1.2: Invalid Effect Strings
**Purpose**: Ensure invalid effect strings are caught

**Test Data**:
```csv
Effect String                      | Expected Error
-----------------------------------|------------------------------------------
Invalid;+;10;Damage                | Invalid condition 'Invalid'
None;^;10;Damage                   | Invalid operator '^'
None;+;abc;Damage                  | Amount must be a number
None;+;10;InvalidStat              | Invalid stat 'InvalidStat'
None;+;10                          | Effect must have exactly 4 parts
None;/;0;Damage                    | Division by zero is not allowed
;+;10;Damage                       | Condition part cannot be empty
None;;10;Damage                    | Invalid operator
None;+;;Damage                     | Amount part cannot be empty
None;+;10;                         | Stat part cannot be empty
RunnerType:;+;10;Damage            | RunnerType condition must specify a runner type
```

**Expected Result**: Each invalid effect produces a clear error message

**How to Test**:
1. Create CSV with one invalid effect at a time
2. Try to import in game - should show error message
3. Try to import in editor - should show error message
4. Verify error message is helpful and identifies the problem

---

### 2. Gate Condition Validation Tests

#### Test 2.1: Valid Gate Conditions
**Purpose**: Ensure valid gate conditions pass validation

**Test Data**:
```csv
Gate Condition                     | Description
-----------------------------------|------------------------------------------
Node:NODE001,NODE002;2             | At least 2 of specified nodes
Node:START001;0                    | ALL specified nodes (AND logic)
RunnerType:hacker,muscle;1         | At least 1 hacker or muscle
RunnerType:Ninja;2                 | At least 2 ninjas
RunnerStat:face,muscle;10          | Total face+muscle >= 10
RunnerStat:hacker;5                | Total hacker >= 5
```

**Expected Result**: All gate conditions pass validation

**How to Test**:
1. Create contract CSV with Gate nodes using these conditions
2. Import in game - should load successfully
3. Import in editor - should load successfully
4. Select a Gate node in editor - properties should display correctly

---

#### Test 2.2: Invalid Gate Conditions
**Purpose**: Ensure invalid gate conditions are caught

**Test Data**:
```csv
Gate Condition                     | Expected Error
-----------------------------------|------------------------------------------
Node:;2                            | Node gate condition requires at least one node ID
Node:INVALID ID;2                  | Invalid node ID (contains space)
Node:NODE001                       | Gate condition must have 2 parts
RunnerType:InvalidType;1           | Invalid runner type 'InvalidType'
RunnerType:;1                      | RunnerType gate condition requires at least one runner type
RunnerStat:;10                     | RunnerStat gate condition requires at least one stat
RunnerStat:invalidstat;5           | Invalid stat 'invalidstat'
Node:NODE001;-1                    | Threshold must be a non-negative integer
Node:NODE001;abc                   | Threshold must be a non-negative integer
InvalidType:something;1            | Gate condition must start with Node:, RunnerType:, or RunnerStat:
```

**Expected Result**: Each invalid gate condition produces a clear error message

**How to Test**:
1. Create CSV with Gate node using invalid condition
2. Try to import in game - should show error
3. Try to import in editor - should show error
4. Verify error messages are helpful

---

### 3. Connection Validation Tests

#### Test 3.1: Valid Connections
**Purpose**: Ensure valid connection strings pass validation

**Test Data**:
```csv
Node ID    | Connections
-----------|------------------------------------------
NODE001    | NODE002,NODE003,NODE004
NODE002    | NODE005
NODE003    | NODE005
NODE004    | NODE005
NODE005    |
START001   | NODE001
```

**Expected Result**: All connections validate successfully

**How to Test**:
1. Import contract with these connections
2. Game should load without errors
3. Editor should display connections correctly
4. All connection references should be valid

---

#### Test 3.2: Invalid Connections
**Purpose**: Ensure invalid connection strings are caught

**Test Data**:
```csv
Node ID    | Connections           | Expected Error
-----------|-----------------------|------------------------------------------
NODE001    | NODE999               | Connection reference 'NODE999' not found
NODE002    | NODE001,              | Empty connection found (trailing comma)
NODE003    | INVALID NODE          | Invalid connection ID (contains space)
NODE004    | NODE-001!             | Invalid connection ID (contains !)
```

**Expected Result**: Each invalid connection produces error

**How to Test**:
1. Try to import CSV with invalid connections
2. Should show error indicating which connection is invalid
3. Error should specify the row number

---

### 4. Node Data Validation Tests

#### Test 4.1: Valid Node Data
**Purpose**: Ensure valid node data passes validation

**Test Data**:
```csv
Node ID       | X      | Y      | Type     | Color  | Description
--------------|--------|--------|----------|--------|-------------------------
NODE001       | 100    | 200    | Normal   | Red    | Test node
NODE002       | 200    | 300    | Synergy  | Blue   | Synergy test
START001      | 0      | 100    | Start    | Grey   | Start node
END001        | 400    | 500    | End      | Green  | End node
GATE001       | 250    | 350    | Gate     | Yellow | [GateCondition: Node:NODE001;1]
```

**Expected Result**: All node data validates successfully

**How to Test**:
1. Import contract with this data
2. All nodes should load correctly
3. No validation errors

---

#### Test 4.2: Invalid Node Data
**Purpose**: Ensure invalid node data is caught

**Test Data**:
```csv
Issue                          | Expected Error
-------------------------------|------------------------------------------
Missing Node ID                | Node ID is required
Node ID > 50 characters        | Node ID too long (max 50 characters)
X coordinate = "abc"           | X coordinate must be a valid number
X coordinate = 20000           | X coordinate out of valid range
Y coordinate = "xyz"           | Y coordinate must be a valid number
Y coordinate = -15000          | Y coordinate out of valid range
Type = "InvalidType"           | Invalid node type 'InvalidType'
Color = "Orange"               | Invalid node color 'Orange'
Description > 200 chars        | Description too long (max 200 characters)
Gate without GateCondition     | Gate nodes require a GateCondition
Non-Gate with GateCondition    | [Warning only, no error]
```

**Expected Result**: Each invalid field produces appropriate error

**How to Test**:
1. Create CSV with one invalid field at a time
2. Try to import - should show specific error
3. Fix issue and retry - should succeed

---

### 5. Integration Tests

#### Test 5.1: Complete Contract Import (Game)
**Purpose**: Test complete workflow in game

**Steps**:
1. Open index.html
2. Click "Choose File" button
3. Select a valid contract CSV (e.g., TestContract01.csv)
4. Verify contract loads successfully
5. Verify no console errors
6. Check that all nodes display correctly
7. Verify gate conditions work (if applicable)

**Expected Result**: Contract loads and plays correctly

---

#### Test 5.2: Complete Contract Import (Editor)
**Purpose**: Test complete workflow in editor

**Steps**:
1. Open editor.html
2. Click "Import CSV" button
3. Select a valid contract CSV
4. Verify all nodes appear on canvas
5. Verify connections are drawn correctly
6. Select various nodes - properties should display
7. Click "Export CSV" to re-export
8. Import exported CSV in game - should work

**Expected Result**: Full round-trip works (editor → game → editor)

---

#### Test 5.3: Mixed Valid/Invalid Data
**Purpose**: Test partial validation failures

**Test Data**: Create CSV with:
- 5 valid nodes
- 1 node with invalid type
- 1 node with missing Node ID
- 1 valid connection
- 1 invalid connection reference

**Expected Result**:
- Import should fail with clear errors
- All errors should be listed
- Error messages should identify specific rows

**How to Test**:
1. Create mixed CSV
2. Try to import in game - should see multiple errors
3. Try to import in editor - should see multiple errors
4. Fix all errors
5. Re-import - should succeed

---

### 6. Edge Case Tests

#### Test 6.1: Empty and Whitespace
**Purpose**: Test handling of empty/whitespace values

**Test Data**:
```csv
Node ID    | Description | Effect 1        | Connections
-----------|-------------|-----------------|-------------
NODE001    |             | None;+;10;Money | NODE002
NODE002    | Valid       |                 |
NODE003    | Valid       | None;+;5;Damage |
```

**Expected Result**:
- Empty descriptions allowed
- Empty effects allowed
- Empty connections allowed
- Whitespace-only should be treated as empty

---

#### Test 6.2: Case Sensitivity
**Purpose**: Test case handling in validation

**Test Data**:
```csv
Effect String              | Should Pass?
---------------------------|-------------
None;+;10;DAMAGE           | YES (case-insensitive stat)
None;+;10;damage           | YES
None;+;10;DaMaGe           | YES
RunnerType:HACKER;+;5;Risk | YES (case-insensitive type)
RunnerType:hacker;+;5;Risk | YES
NodeColor:RED;+;10;Money   | NO (colors are case-sensitive)
NodeColor:red;+;10;Money   | NO
```

**Expected Result**: Case insensitivity works where documented

---

#### Test 6.3: Special Characters
**Purpose**: Test handling of special characters

**Test Data**:
```csv
Node ID        | Valid?  | Reason
---------------|---------|---------------------------
NODE_001       | YES     | Underscores allowed
NODE-001       | YES     | Hyphens allowed
NODE.001       | NO      | Periods not allowed
NODE 001       | NO      | Spaces not allowed
NODE@001       | NO      | @ not allowed
NODE#001       | NO      | # not allowed
```

**Expected Result**: Only alphanumeric, underscore, hyphen allowed

---

#### Test 6.4: Large Numbers
**Purpose**: Test numeric boundary conditions

**Test Data**:
```csv
Value           | Context           | Should Pass?
----------------|-------------------|-------------
-10000          | X coordinate      | YES (boundary)
10000           | Y coordinate      | YES (boundary)
-10001          | X coordinate      | NO (out of range)
10001           | Y coordinate      | NO (out of range)
999999          | Effect amount     | YES (no upper limit)
-999999         | Effect amount     | YES (negatives allowed)
0               | Gate threshold    | YES
-1              | Gate threshold    | NO (must be non-negative)
```

---

### 7. Performance Tests

#### Test 7.1: Large Contract Validation
**Purpose**: Ensure validation performs well on large contracts

**Test Data**: Create CSV with 100 nodes, each with:
- Valid Node ID
- Valid coordinates
- 2 effects each
- Multiple connections

**Expected Result**:
- Validation completes in < 2 seconds
- No browser lag
- All nodes validate correctly

---

#### Test 7.2: Many Validation Errors
**Purpose**: Test performance with many errors

**Test Data**: Create CSV with 50 nodes, half with validation errors

**Expected Result**:
- All errors detected
- Error list is comprehensive
- Performance remains acceptable

---

## Regression Test Checklist

After Phase 3 changes, verify these scenarios still work:

### Game (index.html)
- [ ] Load existing contract CSVs (TestContract01.csv, etc.)
- [ ] Contract dropdown populates correctly
- [ ] Node selection works
- [ ] Effect calculations are correct
- [ ] Gate conditions evaluate properly
- [ ] Preview panel updates correctly
- [ ] Contract execution works
- [ ] Session reset works
- [ ] No console errors on normal use

### Editor (editor.html)
- [ ] Create new nodes
- [ ] Edit node properties
- [ ] Create connections between nodes
- [ ] Delete nodes and connections
- [ ] Import existing CSV
- [ ] Export to CSV
- [ ] Validate contract before export
- [ ] Import exported CSV in game (round-trip)
- [ ] Node drag/drop works
- [ ] Canvas zoom/pan works
- [ ] No console errors on normal use

### Validation-Specific
- [ ] Invalid effect strings rejected with helpful errors
- [ ] Invalid gate conditions rejected with helpful errors
- [ ] Invalid connections rejected
- [ ] Duplicate node IDs caught
- [ ] Missing required fields caught
- [ ] Out-of-range values caught
- [ ] Error messages are clear and actionable

---

## Known Issues and Limitations

### Non-Breaking Changes
1. **Error message wording**: Some error messages may have slightly different wording but convey the same meaning
2. **Error order**: Multiple errors may appear in different order than before (but all are still caught)

### Expected Behavior
1. **Gate warnings**: Non-gate nodes with GateCondition produce warnings (not errors)
2. **Effect warnings**: Gate nodes with effects produce warnings (not errors)
3. **Empty values**: Empty strings and null values treated identically

---

## Test Execution Log

### Test Run 1: [Date/Time]
**Tester**: [Name]
**Browser**: [Browser name and version]

| Test ID | Test Name                    | Status | Notes |
|---------|------------------------------|--------|-------|
| 1.1     | Valid Effect Strings         | [ ]    |       |
| 1.2     | Invalid Effect Strings       | [ ]    |       |
| 2.1     | Valid Gate Conditions        | [ ]    |       |
| 2.2     | Invalid Gate Conditions      | [ ]    |       |
| 3.1     | Valid Connections            | [ ]    |       |
| 3.2     | Invalid Connections          | [ ]    |       |
| 4.1     | Valid Node Data              | [ ]    |       |
| 4.2     | Invalid Node Data            | [ ]    |       |
| 5.1     | Complete Contract Import (Game) | [ ] |       |
| 5.2     | Complete Contract Import (Editor) | [ ] |     |
| 5.3     | Mixed Valid/Invalid Data     | [ ]    |       |
| 6.1     | Empty and Whitespace         | [ ]    |       |
| 6.2     | Case Sensitivity             | [ ]    |       |
| 6.3     | Special Characters           | [ ]    |       |
| 6.4     | Large Numbers                | [ ]    |       |
| 7.1     | Large Contract Validation    | [ ]    |       |
| 7.2     | Many Validation Errors       | [ ]    |       |

**Overall Result**: [ ] PASS / [ ] FAIL

**Issues Found**:
-

**Regression Issues**:
-

---

## Success Criteria

Phase 3 is successful if:
1. ✓ All validation tests pass
2. ✓ No regressions in game or editor functionality
3. ✓ Error messages are clear and helpful
4. ✓ Performance is acceptable (< 2 seconds for 100 nodes)
5. ✓ Code is cleaner (net reduction in duplicate code)
6. ✓ ValidationUtils is reusable for future features

---

## Next Steps

After Phase 3 testing is complete:
1. Document any issues found and fixes applied
2. Update this document with actual test results
3. Proceed to Phase 4 (if planned) or mark refactoring complete
4. Update main README with validation architecture notes
