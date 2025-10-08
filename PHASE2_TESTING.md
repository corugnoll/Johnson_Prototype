# Phase 2 Testing Instructions

## Overview
Phase 2 extracted duplicate text rendering code into a shared utility (`js/utils/textUtils.js`). Both the game and editor now use the same text processing code.

**Critical**: Text rendering must look IDENTICAL before and after this refactoring.

---

## Pre-Testing Checklist

- [ ] Phase 2 changes committed to git (commit f2a994b)
- [ ] Browser cache cleared (to ensure new scripts load)
- [ ] Console open (F12) to watch for errors

---

## Test 1: Game - Basic Contract Loading

### Steps:
1. Open `index.html` in browser
2. Open browser console (F12)
3. Select "AI Extraction (Synergy)" from contract dropdown
4. Click "Load Contract" button

### Expected Results:
- [ ] Contract loads without errors
- [ ] All nodes render with proper text
- [ ] Text wraps correctly inside nodes
- [ ] No console errors
- [ ] Node text looks the same as before Phase 2

### Visual Checks:
- [ ] Description text is bold and readable
- [ ] Effect description text appears below separator line
- [ ] Multi-line text preserves linebreaks
- [ ] Long text wraps to multiple lines
- [ ] Gate nodes show only effect description (centered)

---

## Test 2: Game - Various Text Types

### Test Short Text:
1. Select node "NODE019" (End)
   - [ ] "No Effect" displays correctly
   - [ ] Node is minimum size

### Test Long Text:
1. Select node "NODE002" (Blast Through Entrance Area)
   - [ ] Text wraps to multiple lines
   - [ ] "+2 Grit" displays below separator
   - [ ] All text is readable

### Test Multi-Line Text:
1. Select node "NODE016" (Fight your way out)
   - [ ] Description has linebreak preserved
   - [ ] "+1 Grit for each 3 Muscle stat" wraps correctly

### Test Gate Node:
1. Find node "NODE020" (≥10 Hacking gate)
   - [ ] Only "≥10 Hacking" text shown
   - [ ] Text is centered
   - [ ] Rounded rectangle shape
   - [ ] No description text

---

## Test 3: Editor - Node Creation and Text

### Steps:
1. Open `editor.html` in browser
2. Open browser console (F12)
3. Click "New Contract" button
4. Add a new node by clicking on canvas

### Expected Results:
- [ ] Editor loads without errors
- [ ] Property panel shows node details
- [ ] No console errors

### Test Text Input:
1. Enter description: "Test Node with Long Description Text That Should Wrap"
   - [ ] Text wraps in node on canvas
   - [ ] Text matches game rendering style

2. Enter effect description: "This is effect text\nWith a linebreak"
   - [ ] Linebreak is preserved
   - [ ] Separator line appears between description and effect
   - [ ] Text wraps if too long

3. Change node type to "Gate"
   - [ ] Only effect description is shown
   - [ ] Node becomes rounded rectangle
   - [ ] Text is centered

---

## Test 4: Editor - Import Existing Contract

### Steps:
1. In editor, click "Open Contract"
2. Select `Contracts/contract_extract_ai_synergy.csv`
3. Wait for contract to load

### Expected Results:
- [ ] Contract loads successfully
- [ ] All 27 nodes appear
- [ ] Text rendering matches game exactly
- [ ] Gate nodes render correctly (rounded rectangles, centered text)
- [ ] Regular nodes show description + effect description
- [ ] No console errors

### Visual Comparison:
1. Take note of how "NODE002" looks in editor
2. Load same contract in game (`index.html`)
3. Compare "NODE002" appearance
   - [ ] Text wrapping is identical
   - [ ] Font sizes match
   - [ ] Spacing is the same
   - [ ] Node dimensions are similar

---

## Test 5: Editor - Export and Re-Import

### Steps:
1. In editor with loaded contract, click "Save Contract"
2. Save as `test_export.csv`
3. Click "Open Contract" and load `test_export.csv`

### Expected Results:
- [ ] Export succeeds without errors
- [ ] Re-import succeeds without errors
- [ ] All nodes still render correctly
- [ ] Text dimensions preserved

### Cross-Tool Test:
1. Load exported `test_export.csv` in game (`index.html`)
   - [ ] Game loads contract successfully
   - [ ] All nodes render correctly
   - [ ] Text wrapping matches editor

---

## Test 6: Edge Cases

### Empty Text:
1. In editor, create node with empty description
   - [ ] Node renders with minimum size
   - [ ] No errors

### Special Characters:
1. In editor, create node with description: "Test & < > \" ' chars"
   - [ ] Special characters display correctly
   - [ ] No HTML injection or errors

### Very Long Single Word:
1. In editor, enter description: "Supercalifragilisticexpialidocious"
   - [ ] Word wraps or truncates gracefully
   - [ ] Node width adjusts appropriately

### Multiple Linebreaks:
1. Enter description with multiple linebreaks:
   ```
   Line 1

   Line 3 (with blank line above)
   ```
   - [ ] Blank lines are preserved
   - [ ] Spacing looks correct

---

## Test 7: Performance

### Large Contract:
1. Load contract with many nodes (if available)
   - [ ] Rendering is smooth
   - [ ] No lag when panning/zooming
   - [ ] Text renders correctly at all zoom levels

### Rapid Actions:
1. In editor, quickly add 10 nodes
   - [ ] All nodes render correctly
   - [ ] No errors or visual glitches

---

## Test 8: Touch Controls (If Available)

### On Tablet/Touch Device:
1. Open game on tablet
2. Load contract
3. Use touch to pan and zoom
   - [ ] Text remains readable at different zoom levels
   - [ ] Touch interactions work correctly

---

## Regression Checks

### Core Functionality (Must Not Break):
- [ ] Node selection works (game)
- [ ] Preview pools update (game)
- [ ] Contract execution works (game)
- [ ] Node creation works (editor)
- [ ] Node editing works (editor)
- [ ] Connection drawing works (editor)
- [ ] Pan/zoom works (both)
- [ ] Touch controls work (both, if applicable)

---

## Console Error Monitoring

### Throughout All Tests:
- [ ] No `Uncaught ReferenceError: TextUtils is not defined` errors
- [ ] No `Cannot read property 'processTextWithLinebreaks' of undefined` errors
- [ ] No text rendering errors
- [ ] No warnings about missing methods

---

## Visual Regression Testing (Recommended)

### If You Want to Be Thorough:

**Before Phase 2:**
1. Should have taken screenshots of key nodes in game and editor

**After Phase 2:**
1. Take same screenshots
2. Compare pixel-by-pixel (or visually)
3. Verify no visual differences

**Key Nodes to Compare:**
- NODE002 (long description)
- NODE016 (multi-line text)
- NODE020 (gate node)
- NODE023 (synergy node)

---

## Success Criteria

Phase 2 is successful if:

1. **✓ All tests pass** with no errors
2. **✓ Visual rendering is identical** to before refactoring
3. **✓ No performance degradation** (smooth rendering)
4. **✓ No console errors** in any test scenario
5. **✓ Text wrapping is consistent** between game and editor
6. **✓ All node types render correctly** (regular, gate, synergy)

---

## If Issues Found

### Document:
1. Which test failed
2. Error message (if any)
3. Screenshot of issue
4. Steps to reproduce

### Report to developer with:
- Test number that failed
- Expected vs actual behavior
- Console error messages
- Any relevant screenshots

---

## Post-Testing

After all tests pass:
- [ ] Clear browser cache one more time
- [ ] Test in different browser (Chrome, Firefox, Edge)
- [ ] Mark Phase 2 as complete
- [ ] Proceed to Phase 3 (if desired)

---

## Technical Notes

**What Changed:**
- Created `js/utils/textUtils.js` with shared methods
- Removed ~150 lines of duplicate code from visualPrototype.js
- Removed ~150 lines of duplicate code from nodeManager.js
- Added script tags to both HTML files

**What Didn't Change:**
- Text rendering algorithm (same logic, just in one place)
- Node dimensions calculation (same constants)
- Visual appearance (should be pixel-perfect match)

**Risk Level:** Low (logic moved, not changed)
