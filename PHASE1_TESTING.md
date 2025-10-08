# Phase 1 Refactoring - Testing Checklist

## Changes Made

Phase 1 removed **~200 lines of dead code** from 3 files:

### 1. editorMain.js (lines 463-470)
- **Removed**: `loadContractFromCSV()` method (deprecated)
- **Reason**: Replaced by FileManager.importContract()
- **Impact**: No functionality change - method was not called anywhere

### 2. ui.js (lines 89-169 and 4 call sites)
- **Removed**: `drawPlaceholder()` method (81 lines)
- **Removed**: `drawPlaceholderNodes()` method (50 lines)
- **Removed**: 4 calls to `drawPlaceholder()` from:
  - `initCanvas()` - line 53
  - `handleCanvasResize()` - line 177
  - `resetUI()` - line 446
  - `clearContractSelection()` - line 591
- **Reason**: Replaced by VisualPrototypeRenderer
- **Impact**: Canvas rendering now handled entirely by VisualPrototypeRenderer

### 3. csvLoader.js (lines 518-573)
- **Removed**: `getSampleData()` method (56 lines)
- **Reason**: Never called in production code, was for early testing only
- **Impact**: No functionality change - method was never used

## Testing Instructions

### IMPORTANT: Open Browser Console
Before testing, open the browser console (F12) to check for any JavaScript errors.

### Test 1: Contract Loading in Game (CRITICAL)
**File**: `index.html`

1. Open `index.html` in browser
2. Verify no console errors on page load
3. **Test dropdown loading**:
   - Select "Example Contract" from dropdown
   - Verify contract loads and displays on canvas
   - Verify nodes are visible and properly rendered
   - Verify no console errors
4. **Test file upload**:
   - Click "Load Contract File" button
   - Select `Contracts/Contract_Example1.csv`
   - Verify contract loads and displays
   - Verify no console errors
5. **Test node selection**:
   - Click on various nodes
   - Verify nodes can be selected/deselected
   - Verify preview pools update correctly
   - Verify no console errors

**Expected Behavior**:
- Canvas should show contract tree (NOT a placeholder with text)
- All nodes should be visible and clickable
- No JavaScript errors in console

### Test 2: Contract Loading in Editor (CRITICAL)
**File**: `editor.html`

1. Open `editor.html` in browser
2. Verify no console errors on page load
3. **Test import contract**:
   - Click "Import Contract" button
   - Select `Contracts/Contract_Example1.csv`
   - Verify contract loads in editor
   - Verify all nodes are visible
   - Verify connections are drawn
   - Verify no console errors
4. **Test new contract**:
   - Click "New Contract" if available
   - Verify canvas clears properly
   - Verify no console errors

**Expected Behavior**:
- Editor canvas should show contract nodes
- All nodes should be draggable
- Connections should be visible
- No JavaScript errors in console

### Test 3: Node Creation in Editor
**File**: `editor.html`

1. Open `editor.html` with a contract loaded
2. **Create new node**:
   - Click "Add Node" or double-click canvas
   - Fill in node properties (Description, Effect Desc, etc.)
   - Save node
   - Verify node appears on canvas
   - Verify no console errors
3. **Edit existing node**:
   - Click on an existing node
   - Modify its properties
   - Save changes
   - Verify changes are reflected
   - Verify no console errors

**Expected Behavior**:
- Nodes can be created and edited
- Text wrapping still works correctly
- Nodes render with proper dimensions
- No JavaScript errors in console

### Test 4: Contract Export from Editor
**File**: `editor.html`

1. Open `editor.html` with a contract loaded
2. Make a small change (edit a node or add a node)
3. **Export contract**:
   - Click "Export Contract" or "Save Contract"
   - Verify CSV file is generated
   - Verify no console errors
4. **Re-import exported contract**:
   - Import the exported CSV back into editor
   - Verify all nodes load correctly
   - Verify all data is preserved
   - Verify no console errors
5. **Test exported contract in game**:
   - Open `index.html`
   - Load the exported CSV
   - Verify contract works in game
   - Verify no console errors

**Expected Behavior**:
- Export generates valid CSV file
- Exported CSV can be re-imported
- Exported CSV works in game
- No JavaScript errors in console

### Test 5: Canvas Behavior When No Contract Loaded

1. Open `index.html`
2. **Initial state**:
   - Canvas should be visible (dark background)
   - No placeholder text should be shown
   - Canvas should be blank/empty until contract is loaded
3. **After loading and clearing**:
   - Load a contract
   - Reset/clear the application if possible
   - Canvas should become blank again (NOT show placeholder)

**Expected Behavior**:
- Canvas is blank when no contract is loaded
- No "Contract Tree Visualization (Coming in next milestone)" text
- No placeholder nodes visible
- Canvas handled by VisualPrototypeRenderer

### Test 6: Window Resize Behavior

1. Open `index.html` with a contract loaded
2. Resize browser window
3. Verify:
   - Canvas resizes appropriately
   - Contract remains visible after resize
   - No console errors
4. Repeat for `editor.html`

**Expected Behavior**:
- Canvas resizes smoothly
- No errors related to `drawPlaceholder()` being undefined
- Contract remains rendered correctly

## Success Criteria

All of the following must be TRUE:

- [ ] Game loads without console errors
- [ ] Contracts load from dropdown successfully
- [ ] Contracts load from file upload successfully
- [ ] Nodes can be selected and deselected in game
- [ ] Editor loads without console errors
- [ ] Contracts can be imported into editor
- [ ] Nodes can be created/edited in editor
- [ ] Contracts can be exported from editor
- [ ] Exported contracts work when imported back
- [ ] Exported contracts work in the game
- [ ] No calls to undefined `drawPlaceholder()` method
- [ ] No calls to undefined `loadContractFromCSV()` method
- [ ] No calls to undefined `getSampleData()` method
- [ ] Canvas is blank when no contract loaded (no placeholder text)
- [ ] Window resize works without errors

## If Tests Fail

### If you see "drawPlaceholder is not defined" error:
- This means we missed a call to `drawPlaceholder()`
- Search for `drawPlaceholder` in all JS files
- Remove the call or replace with appropriate VisualPrototypeRenderer method
- Report the file and line number

### If canvas shows placeholder text after Phase 1:
- This should NOT happen - verify ui.js changes were applied correctly
- Check that all `drawPlaceholder()` calls were removed

### If editor fails to import/export:
- Verify `loadContractFromCSV()` removal didn't break import flow
- Check that FileManager.importContract() is being used instead

### If any unexpected behavior occurs:
- STOP testing immediately
- Document the issue with:
  - File/page where it occurred
  - Steps to reproduce
  - Console error messages (if any)
  - Expected vs actual behavior
- Report issue before proceeding to Phase 2

## Lines of Code Removed

- **editorMain.js**: 8 lines (deprecated method)
- **ui.js**: 139 lines (2 methods + 4 call sites)
- **csvLoader.js**: 56 lines (unused method)
- **Total**: ~203 lines removed

## Next Steps

If all tests pass:
- Document test results
- Report Phase 1 complete
- Wait for confirmation before proceeding to Phase 2

If any tests fail:
- Document failures in detail
- Fix issues before moving to Phase 2
- Re-test after fixes
