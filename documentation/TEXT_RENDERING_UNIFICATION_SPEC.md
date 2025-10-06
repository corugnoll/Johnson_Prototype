# Text Rendering Unification Specification

**Document Version:** 1.0
**Date:** 2025-09-30
**Objective:** Unify text rendering between the Editor and Main Game to achieve consistent, clean visualization without text clipping or overflow issues.

---

## Executive Summary

The Johnson Prototype currently has **two separate text rendering implementations**:
1. **Editor System** (`js/editor/nodeManager.js`) - Clean, bug-free text rendering
2. **Main Game System** (`js/visualPrototype.js`) - Exhibits text clipping and overflow issues

Multiple attempts to fix the main game's text rendering have made the problem worse. This specification details the root causes and provides a clear implementation path to port the editor's proven approach to the main game.

---

## Current State Analysis

### Editor System (js/editor/nodeManager.js)

**Text Measurement & Wrapping:**
- **Location:** Lines 263-285, 391-412
- **Font Setting:** Sets font on context BEFORE measuring text
- **Text Processing:** Uses `processTextWithLinebreaks()` method
- **Line Height:** Fixed 16px line height
- **Padding:** 6px padding around text

**Key Implementation Details:**

```javascript
// Editor: calculateNodeDimensions() - Lines 226-258
calculateNodeDimensions(node) {
    const ctx = tempCanvas.getContext('2d');
    const padding = 6;
    const maxWidth = 200;
    const lineHeight = 16;
    const separatorHeight = 4;

    // CRITICAL: Sets font BEFORE processing text
    ctx.font = 'bold 14px Arial';
    const descLines = this.processTextWithLinebreaks(node.description || '', maxWidth - padding * 2, ctx, 14);
    const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

    ctx.font = '12px Arial';
    const effectLines = this.processTextWithLinebreaks(node.effectDesc || '', maxWidth - padding * 2, ctx, 12);
    const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

    // Calculate height precisely
    const totalTextHeight = (descLines.length * lineHeight) +
                           (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

    node.width = Math.max(this.minWidth, maxTextWidth + padding * 2);
    node.height = Math.max(this.minHeight, totalTextHeight + padding * 2);
}

// Editor: processTextWithLinebreaks() - Lines 391-412
processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
    if (!text) return [''];

    // Font set by caller ensures accurate measurement
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

// Editor: wrapText() - Lines 263-285
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

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}

// Editor: renderNodeText() - Lines 329-386
renderNodeText(node, pos, ctx) {
    const padding = 6;
    const primaryFontSize = 14;
    const secondaryFontSize = 12;
    const lineHeight = 16;  // MATCHES calculation exactly
    const separatorHeight = 4;

    // Render description
    ctx.font = `bold ${primaryFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let currentY = startY;
    descriptionText.forEach((line, index) => {
        ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
    });
    currentY += descLines * lineHeight;
}
```

**Why Editor Works:**
1. ✅ Font set on context BEFORE text processing
2. ✅ Same context used for measurement and rendering
3. ✅ Line height (16px) matches between sizing and rendering
4. ✅ Padding (6px) applied consistently
5. ✅ Text baseline set to 'top' for predictable positioning
6. ✅ Simple, clean calculation: `totalHeight = lineCount * lineHeight`

---

### Main Game System (js/visualPrototype.js)

**Text Measurement & Wrapping:**
- **Location:** Lines 189-242, 517-565
- **Font Setting:** Inconsistent timing, context transformations interfere
- **Text Processing:** Similar `processTextWithLinebreaks()` method
- **Line Height:** 20px line height (DIFFERENT from editor)
- **Padding:** 20px padding (DIFFERENT from editor)

**Key Implementation Details:**

```javascript
// Main Game: calculateOptimalNodeSize() - Lines 189-242
calculateOptimalNodeSize(node) {
    const padding = 20;  // LARGER than editor (6px)
    const maxWidth = 300;
    const lineHeight = 20;  // LARGER than editor (16px)
    const separatorHeight = 8;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);  // Reset transformations

    // Sets font BEFORE processing
    this.ctx.font = 'bold 14px Arial';
    const descLines = this.processTextWithLinebreaks(node.description || '', availableWidth, 14);
    const descWidth = Math.max(0, ...descLines.map(line => this.ctx.measureText(line).width));

    this.ctx.font = '12px Arial';
    const effectLines = this.processTextWithLinebreaks(node.effectDescription || '', availableWidth, 12);
    const effectWidth = Math.max(0, ...effectLines.map(line => this.ctx.measureText(line).width));

    this.ctx.restore();

    // Height calculation
    let totalTextHeight = descLines.length * lineHeight;
    if (hasEffect) {
        totalTextHeight += separatorHeight;
        totalTextHeight += effectLines.length * lineHeight;
    }

    const extraVerticalSpace = 10;  // ADDITIONAL space not in editor
    const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2 + extraVerticalSpace);

    return { width: finalWidth, height: finalHeight };
}

// Main Game: processTextWithLinebreaks() - Lines 517-538
processTextWithLinebreaks(text, maxWidth, fontSize) {
    if (!text) return [''];

    // PROBLEM: Expects font to be set by CALLER, not internally
    // This creates inconsistency

    const paragraphs = text.split(/\r?\n/);
    const result = [];

    paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') {
            result.push('');
        } else {
            const wrappedLines = this.wrapText(paragraph, maxWidth);
            result.push(...wrappedLines);
        }
    });

    return result.length > 0 ? result : [''];
}

// Main Game: renderEnhancedNodeText() - Lines 447-512
renderEnhancedNodeText(node, pos) {
    const padding = 20;
    const lineHeight = 20;
    const separatorHeight = 8;
    const extraVerticalSpace = 10;

    // Sets font BEFORE processing
    this.ctx.font = 'bold 14px Arial';
    const descriptionText = this.processTextWithLinebreaks(node.description || '', availableWidth, 14);
    this.ctx.font = '12px Arial';
    const effectText = this.processTextWithLinebreaks(node.effectDescription || '', availableWidth, 12);

    // Complex vertical centering calculation
    const textBlockStartY = pos.y + (pos.height - totalTextHeight - extraVerticalSpace) / 2;
    const startY = textBlockStartY + extraVerticalSpace / 2;

    // Render with same line height (20px)
    descriptionText.forEach((line, index) => {
        this.ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
    });
}
```

**Why Main Game Has Issues:**
1. ❌ Different line height (20px vs 16px) - harder to fit text
2. ❌ Different padding (20px vs 6px) - reduces available space
3. ❌ Extra vertical space (10px) - complicates height calculation
4. ❌ Complex vertical centering with multiple offsets
5. ❌ Context transformations (zoom/pan) may interfere with measurements
6. ❌ Font setting timing issues in `processTextWithLinebreaks()`
7. ❌ Multiple calculation stages increase error accumulation

---

## Root Cause Analysis

### Primary Issues

**1. Inconsistent Line Height Values**
- **Editor:** 16px line height
- **Main Game:** 20px line height
- **Impact:** Same text requires 25% more vertical space in main game, causing nodes to be sized differently

**2. Excessive Padding**
- **Editor:** 6px padding
- **Main Game:** 20px padding (233% larger)
- **Impact:** Reduces available text width significantly, forcing more line wrapping

**3. Extra Vertical Space Complexity**
- **Editor:** No extra vertical space
- **Main Game:** 10px extra vertical space + complex centering
- **Impact:** Vertical positioning becomes unpredictable, text may clip at top/bottom

**4. Font Setting Inconsistency**
- **Editor:** Font explicitly set in `processTextWithLinebreaks()`
- **Main Game:** Font expected to be set by caller (inconsistent)
- **Impact:** Text measurements may be inaccurate if font context is wrong

**5. Context Transformation Issues**
- **Editor:** Uses temporary canvas for measurements, no transformations
- **Main Game:** Uses main canvas with zoom/pan transformations
- **Impact:** Measurements may be affected by current transform state

**6. Different Calculation Approaches**
- **Editor:** Simple: `height = lineCount * lineHeight + padding * 2`
- **Main Game:** Complex: `height = lineCount * lineHeight + separator + extraSpace + padding * 2`
- **Impact:** More places for errors to accumulate

### Secondary Issues

**7. Property Name Differences**
- **Editor:** Uses `effectDesc` property
- **Main Game:** Uses `effectDescription` property
- **Impact:** May cause confusion when porting code

**8. Maximum Width Differences**
- **Editor:** 200px max width
- **Main Game:** 300px max width
- **Impact:** Different text wrapping behavior

**9. Separator Height Differences**
- **Editor:** 4px separator height
- **Main Game:** 8px separator height
- **Impact:** More vertical space required in main game

---

## Technical Solution Approach

### Strategy: Port Editor's Proven Implementation to Main Game

The editor's text rendering is clean, simple, and bug-free. Rather than attempting to fix the complex main game implementation, we will **replace it entirely** with the editor's approach, with minimal adaptations for the main game's coordinate system.

### Key Principles

1. **Consistency:** Use identical values for line height, padding, fonts, and spacing
2. **Simplicity:** Remove unnecessary complexity (extra vertical space, complex centering)
3. **Isolation:** Use temporary canvas for measurements to avoid transformation issues
4. **Predictability:** Use 'top' baseline for all text rendering
5. **Validation:** Match calculation and rendering logic exactly

---

## Detailed Implementation Plan

### Phase 1: Text Measurement Functions (js/visualPrototype.js)

**File:** `js/visualPrototype.js`
**Lines to Modify:** 189-242, 517-565

#### 1.1 Update calculateOptimalNodeSize()

**Current Location:** Lines 189-242
**Action:** Replace with editor's approach

```javascript
/**
 * Calculate optimal node size based on text content (editor-compatible approach)
 * @param {VisualNode} node - Node to calculate size for
 * @returns {Object} Optimal width and height
 */
calculateOptimalNodeSize(node) {
    // MATCH EDITOR EXACTLY: Use same constants
    const padding = 6;              // Editor value (was 20)
    const maxWidth = 200;           // Editor value (was 300)
    const lineHeight = 16;          // Editor value (was 20)
    const separatorHeight = 4;      // Editor value (was 8)
    const minWidth = 80;            // Keep same
    const minHeight = 60;           // Keep same

    // Create temporary canvas for clean measurements (like editor)
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    // Calculate available width for text (accounting for padding)
    const availableWidth = maxWidth - padding * 2;

    // Process description text with linebreaks (set font FIRST)
    ctx.font = 'bold 14px Arial';
    const descLines = this.processTextWithLinebreaks(node.description || '', availableWidth, ctx, 14);
    const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

    // Process effect description text with linebreaks (set font FIRST)
    ctx.font = '12px Arial';
    const effectLines = this.processTextWithLinebreaks(node.effectDescription || '', availableWidth, ctx, 12);
    const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

    // Calculate dimensions with precise height calculation (MATCH EDITOR)
    const maxTextWidth = Math.max(descWidth, effectWidth);
    const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';

    // CRITICAL: Calculate text height exactly as in editor
    const totalTextHeight = (descLines.length * lineHeight) +
                           (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

    // Calculate final dimensions (MATCH EDITOR - no extraVerticalSpace)
    const finalWidth = Math.max(minWidth, maxTextWidth + padding * 2);
    const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2);

    return { width: finalWidth, height: finalHeight };
}
```

**Changes:**
- ✅ Reduced padding from 20px to 6px (matches editor)
- ✅ Reduced line height from 20px to 16px (matches editor)
- ✅ Reduced max width from 300px to 200px (matches editor)
- ✅ Reduced separator height from 8px to 4px (matches editor)
- ✅ Removed `extraVerticalSpace` (was 10px, not in editor)
- ✅ Use temporary canvas for measurements (like editor)
- ✅ Removed complex context save/restore/transform logic
- ✅ Simplified height calculation to match editor exactly

#### 1.2 Update processTextWithLinebreaks()

**Current Location:** Lines 517-538
**Action:** Match editor's implementation exactly

```javascript
/**
 * Process text with linebreak support and word wrapping (editor-compatible)
 * @param {string} text - Text to process
 * @param {number} maxWidth - Maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
 * @param {number} fontSize - Font size for measurement
 * @returns {Array<string>} Array of text lines
 */
processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
    if (!text) return [''];

    // MATCH EDITOR: Set font on context for accurate measurement
    ctx.font = `${fontSize}px Arial`;

    // Split by explicit linebreaks first
    const paragraphs = text.split(/\r?\n/);
    const result = [];

    paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') {
            result.push(''); // Preserve empty lines
        } else {
            // Word wrap each paragraph
            const wrappedLines = this.wrapText(ctx, paragraph, maxWidth);
            result.push(...wrappedLines);
        }
    });

    return result.length > 0 ? result : [''];
}
```

**Changes:**
- ✅ Added `ctx` parameter (required for font setting)
- ✅ Added `fontSize` parameter (for font setting)
- ✅ Set font on context using `ctx.font = \`${fontSize}px Arial\``
- ✅ Pass `ctx` to `wrapText()` method

#### 1.3 Update wrapText()

**Current Location:** Lines 540-565
**Action:** Match editor's implementation exactly

```javascript
/**
 * Wrap text to fit within specified width (editor-compatible)
 * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {Array<string>} Array of wrapped text lines
 */
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

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}
```

**Changes:**
- ✅ Added `ctx` parameter as first argument (matches editor)
- ✅ No other changes needed - logic already matches

---

### Phase 2: Text Rendering Functions (js/visualPrototype.js)

**File:** `js/visualPrototype.js`
**Lines to Modify:** 447-512

#### 2.1 Update renderEnhancedNodeText()

**Current Location:** Lines 447-512
**Action:** Replace with editor's simpler approach

```javascript
/**
 * Render node text with description and effect description (editor-compatible)
 * @param {VisualNode} node - Node to render text for
 * @param {Object} pos - Node position and dimensions
 */
renderEnhancedNodeText(node, pos) {
    // MATCH EDITOR EXACTLY: Use same constants
    const padding = 6;              // Editor value (was 20)
    const primaryFontSize = 14;     // Same as editor
    const secondaryFontSize = 12;   // Same as editor
    const lineHeight = 16;          // Editor value (was 20)
    const separatorHeight = 4;      // Editor value (was 8)

    const availableWidth = pos.width - (padding * 2);

    // Create temporary canvas for text processing (like editor)
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Process text with linebreak support (set font FIRST on temp context)
    tempCtx.font = 'bold 14px Arial';
    const descriptionText = this.processTextWithLinebreaks(
        node.description || '',
        availableWidth,
        tempCtx,
        14
    );

    tempCtx.font = '12px Arial';
    const effectText = this.processTextWithLinebreaks(
        node.effectDescription || '',
        availableWidth,
        tempCtx,
        12
    );

    // Calculate total text height needed (MATCH EDITOR)
    const descLines = descriptionText.length;
    const effectLines = effectText.length;
    const hasEffect = effectText.length > 0 && effectText[0].trim() !== '';

    const totalTextHeight = (descLines * lineHeight) +
                           (hasEffect ? separatorHeight + (effectLines * lineHeight) : 0);

    // Simple vertical centering (MATCH EDITOR - no extraVerticalSpace)
    const startY = pos.y + (pos.height - totalTextHeight) / 2;

    // Render description text (primary)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${primaryFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';  // CRITICAL: 'top' baseline like editor

    let currentY = startY;
    descriptionText.forEach((line, index) => {
        this.ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
    });
    currentY += descLines * lineHeight;

    // Render separator and effect text if available
    if (hasEffect) {
        // Render visual separator (horizontal line)
        const separatorY = currentY + separatorHeight/2;
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x + padding + 8, separatorY);
        this.ctx.lineTo(pos.x + pos.width - padding - 8, separatorY);
        this.ctx.stroke();

        // Render effect description text (secondary)
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.font = `${secondaryFontSize}px Arial`;
        currentY += separatorHeight;

        effectText.forEach((line, index) => {
            this.ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
        });
    }
}
```

**Changes:**
- ✅ Reduced padding from 20px to 6px (matches editor)
- ✅ Reduced line height from 20px to 16px (matches editor)
- ✅ Reduced separator height from 8px to 4px (matches editor)
- ✅ Removed `extraVerticalSpace` logic (was 10px)
- ✅ Simplified vertical centering calculation (like editor)
- ✅ Use temporary canvas for text processing (like editor)
- ✅ Set `textBaseline = 'top'` explicitly (like editor)
- ✅ Pass context to `processTextWithLinebreaks()`

---

### Phase 3: Update All Callers

#### 3.1 Update calculateLayout()

**Current Location:** Lines 132-181
**Action:** Ensure it properly uses new calculateOptimalNodeSize()

```javascript
calculateLayout() {
    if (!this.contractData) return;

    // Use direct X,Y positioning from contract data
    this.contractData.nodes.forEach(node => {
        const x = typeof node.x === 'number' ? node.x : 0;
        const y = typeof node.y === 'number' ? node.y : 0;

        // Calculate optimal node dimensions
        let width, height;
        if (typeof node.width === 'number' && typeof node.height === 'number') {
            // Use dimensions from CSV (editor-exported contracts)
            width = node.width;
            height = node.height;
        } else {
            // Calculate dimensions based on text content (legacy contracts)
            const dimensions = this.calculateOptimalNodeSize(node);
            width = dimensions.width;
            height = dimensions.height;
        }

        this.nodePositions.set(node.id, {
            x: x - width / 2,
            y: y - height / 2,
            width: width,
            height: height
        });

        // Update node position for connection calculations
        node.position = { x, y };
    });

    // Calculate tree bounds for pan constraints
    this.calculateTreeBounds();

    // Enable performance mode for large contracts
    if (this.contractData.nodes.size > 50) {
        this.enablePerformanceMode();
    }
}
```

**Changes:**
- ✅ No changes needed - already correctly calls `calculateOptimalNodeSize()`

#### 3.2 Update renderRegularNode()

**Current Location:** Lines 405-424
**Action:** Ensure it correctly calls renderEnhancedNodeText()

```javascript
renderRegularNode(node, pos) {
    const color = this.nodeColors[node.color] || '#CCCCCC';

    // Draw node background
    this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
    this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

    // Draw node border with proper selection styling
    if (node.state === 'selected') {
        this.ctx.strokeStyle = '#FFFFFF';  // White border for selected
        this.ctx.lineWidth = 3;
    } else {
        this.ctx.strokeStyle = '#000000';  // Black border for normal
        this.ctx.lineWidth = 1;
    }
    this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

    // Render enhanced node text with proper layout
    this.renderEnhancedNodeText(node, pos);
}
```

**Changes:**
- ✅ No changes needed - already correctly calls `renderEnhancedNodeText()`

---

### Phase 4: Remove Obsolete Code

#### 4.1 Remove Unused Helper Methods

**Lines to Remove:**
- Lines 1084-1099: `truncateText()` method (no longer needed)
- Any commented-out old implementations

#### 4.2 Update Comments

Update comments at the top of `js/visualPrototype.js` to reflect the new editor-compatible approach:

```javascript
/**
 * Visual Prototype Module
 * Canvas-based visualization system for contract node trees
 * Updated 2025-09-30: Unified with editor text rendering system for clean, consistent display
 *
 * Text Rendering Approach:
 * - Uses editor-compatible values (16px line height, 6px padding)
 * - Temporary canvas for clean text measurements
 * - Simple, predictable layout calculations
 * - 'top' text baseline for consistent positioning
 */
```

---

## Implementation Steps (Priority Order)

### Critical Path (Do in Order)

1. **STEP 1:** Update `wrapText()` method signature (add `ctx` parameter)
   - **File:** `js/visualPrototype.js`
   - **Lines:** 540-565
   - **Risk:** Low (simple parameter addition)
   - **Test:** Verify no errors when calling

2. **STEP 2:** Update `processTextWithLinebreaks()` method
   - **File:** `js/visualPrototype.js`
   - **Lines:** 517-538
   - **Risk:** Low (adds parameters, sets font)
   - **Test:** Verify text still wraps correctly

3. **STEP 3:** Update `calculateOptimalNodeSize()` method
   - **File:** `js/visualPrototype.js`
   - **Lines:** 189-242
   - **Risk:** **HIGH** (changes node sizing significantly)
   - **Test:** Load contract, verify node sizes are appropriate
   - **Rollback Plan:** Revert to backup if nodes are too small

4. **STEP 4:** Update `renderEnhancedNodeText()` method
   - **File:** `js/visualPrototype.js`
   - **Lines:** 447-512
   - **Risk:** **HIGH** (changes text rendering significantly)
   - **Test:** Load contract, verify text fits perfectly without clipping
   - **Rollback Plan:** Revert to backup if text clips

5. **STEP 5:** Remove obsolete code and update comments
   - **File:** `js/visualPrototype.js`
   - **Lines:** Various
   - **Risk:** Low (cleanup only)

### Validation Steps After Each Change

After **STEP 3** (sizing changes):
- Load a contract with long descriptions
- Verify nodes are sized appropriately (not too small)
- Verify text lines are counted correctly
- Check console for any errors

After **STEP 4** (rendering changes):
- Load the same contract
- Verify text fits perfectly without clipping at top or bottom
- Verify text is centered vertically within nodes
- Verify separator lines appear correctly
- Check text wrapping behavior

---

## Testing & Validation Criteria

### Unit Testing Requirements

**Test 1: Text Measurement Consistency**
```javascript
// Test that sizing matches rendering
const testNode = {
    description: "Test Description With Multiple Words",
    effectDescription: "Test Effect Description"
};

const dimensions = renderer.calculateOptimalNodeSize(testNode);
// Manually count expected lines and verify:
// expectedHeight = (descLines * 16) + (4) + (effectLines * 16) + (6 * 2)
```

**Test 2: Line Wrapping Behavior**
```javascript
// Test that text wraps at correct width
const testText = "A very long description that should wrap across multiple lines";
const tempCanvas = document.createElement('canvas');
const ctx = tempCanvas.getContext('2d');
ctx.font = 'bold 14px Arial';

const lines = renderer.processTextWithLinebreaks(testText, 200 - 12, ctx, 14);
// Verify lines break at appropriate points
// Verify no line exceeds maxWidth
```

**Test 3: Vertical Centering Accuracy**
```javascript
// Test that text is perfectly centered
// Load contract, select a node, take screenshot
// Measure pixel distances from top and bottom of text block to node edges
// Should be equal (or within 1px due to rounding)
```

### Integration Testing Requirements

**Test 1: Editor-Exported Contracts**
- Load a contract exported from the editor
- Verify nodes appear identical in main game as they did in editor
- Verify no text clipping occurs
- Verify separator lines appear correctly

**Test 2: Legacy Contracts**
- Load an old contract without X,Y coordinates
- Verify nodes are sized correctly by `calculateOptimalNodeSize()`
- Verify text fits properly

**Test 3: Edge Cases**
- Empty descriptions
- Single-word descriptions
- Multi-line descriptions with \n linebreaks
- Very long descriptions (stress test)
- Special characters and punctuation

### Visual Validation Checklist

✅ **Text fits completely within node boundaries**
✅ **No clipping at top edge**
✅ **No clipping at bottom edge**
✅ **Text is vertically centered**
✅ **Separator line appears between description and effect**
✅ **Line wrapping occurs at appropriate word boundaries**
✅ **Multi-line text has consistent line spacing (16px)**
✅ **Node dimensions are appropriate (not too small/large)**
✅ **Selected nodes have proper border styling**
✅ **Font sizes match editor (14px bold, 12px regular)**

### Performance Validation

- Load a contract with 50+ nodes
- Verify render time is < 50ms per frame
- Verify no console warnings about slow rendering
- Verify performance mode activates if needed

---

## Risk Assessment & Mitigation

### High-Risk Changes

**Risk 1: Node Sizing Changes Break Layout**
- **Severity:** High
- **Probability:** Medium
- **Mitigation:**
  - Make backup of current `visualPrototype.js`
  - Test with multiple contracts before committing
  - Keep old sizing constants commented out for quick revert

**Risk 2: Text Clipping Gets Worse**
- **Severity:** High
- **Probability:** Low (editor approach is proven)
- **Mitigation:**
  - Test rendering changes separately from sizing changes
  - Use test contracts with known-good text
  - Screenshot before/after comparisons

**Risk 3: Coordinate System Incompatibility**
- **Severity:** Medium
- **Probability:** Low
- **Mitigation:**
  - Editor uses absolute coordinates, main game uses same system
  - Test with editor-exported contracts to verify compatibility

### Medium-Risk Changes

**Risk 4: Context Transformation Issues**
- **Severity:** Medium
- **Probability:** Low
- **Mitigation:**
  - Use temporary canvas for all measurements (like editor)
  - Avoid relying on main canvas context state

**Risk 5: Font Loading Timing Issues**
- **Severity:** Medium
- **Probability:** Very Low
- **Mitigation:**
  - Use system font (Arial) which is always available
  - No custom font loading required

### Low-Risk Changes

**Risk 6: Parameter Signature Changes**
- **Severity:** Low
- **Probability:** Low
- **Mitigation:**
  - All callers are within same file
  - Easy to verify and update

---

## Edge Cases & Special Considerations

### Edge Case 1: Empty Descriptions
**Scenario:** Node has empty description or effect description
**Current Behavior:** May render empty string
**Expected Behavior:** Should render empty line, maintain minimum node size
**Handling:** `processTextWithLinebreaks()` returns `['']` for empty text

### Edge Case 2: Explicit Linebreaks (\n)
**Scenario:** Description contains `\n` characters for explicit line breaks
**Current Behavior:** Should be handled by split on `/\r?\n/`
**Expected Behavior:** Preserve explicit linebreaks, wrap long lines
**Handling:** Already implemented in `processTextWithLinebreaks()`

### Edge Case 3: Very Long Single Word
**Scenario:** Description contains a very long word that doesn't fit in maxWidth
**Current Behavior:** Word appears on its own line, may exceed maxWidth
**Expected Behavior:** Same as editor - word appears on own line
**Handling:** Acceptable behavior (matches editor)

### Edge Case 4: Special Characters
**Scenario:** Description contains special characters (quotes, apostrophes, etc.)
**Current Behavior:** Canvas text rendering handles these natively
**Expected Behavior:** Render correctly
**Handling:** No special handling needed

### Edge Case 5: Synergy Nodes
**Scenario:** Synergy nodes use different rendering method
**Current Behavior:** Uses `renderSynergyNodeText()` method (lines 627-649)
**Expected Behavior:** Keep separate rendering for synergy nodes
**Handling:** Do NOT change synergy node rendering (out of scope)

### Edge Case 6: Very Small Zoom Levels
**Scenario:** User zooms out far, text becomes tiny
**Current Behavior:** Text scales with zoom
**Expected Behavior:** Text remains readable or gracefully degrades
**Handling:** Already handled by zoom transformation system

### Edge Case 7: Device Pixel Ratio (High-DPI Displays)
**Scenario:** User has high-DPI display (Retina, 4K, etc.)
**Current Behavior:** Canvas scales via DPR in `resizeCanvas()` (lines 88-116)
**Expected Behavior:** Text remains sharp on high-DPI displays
**Handling:** Already implemented, no changes needed

---

## Backward Compatibility

### Editor-Exported Contracts
- ✅ **Fully Compatible:** Contracts with X,Y,Width,Height columns work perfectly
- ✅ **Reason:** Main game uses provided dimensions when available

### Legacy Contracts (Layer/Slot)
- ✅ **Fully Compatible:** Contracts without dimensions use `calculateOptimalNodeSize()`
- ✅ **Reason:** New sizing algorithm provides appropriate dimensions

### Migration Path
- ✅ **No Migration Required:** Both formats continue to work
- ✅ **Recommendation:** Export new contracts from editor for best results

---

## Performance Considerations

### Measurement Performance

**Current Approach (Main Game):**
- Uses main canvas context (may have transformations)
- Saves/restores context state
- Context transformation reset required

**New Approach (Editor-Compatible):**
- Uses temporary canvas (no transformations)
- Clean context state
- No save/restore overhead

**Performance Impact:**
- ✅ **Neutral to Positive:** Temporary canvas is lightweight, avoids transformation complexity
- ✅ **Measurement time:** < 1ms per node (same as editor)

### Rendering Performance

**Current Approach (Main Game):**
- Complex vertical centering calculations
- Multiple text processing stages
- Extra vertical space handling

**New Approach (Editor-Compatible):**
- Simple vertical centering
- Single text processing stage
- No extra complexity

**Performance Impact:**
- ✅ **Positive:** Fewer calculations per node
- ✅ **Render time:** < 50ms for 50 nodes (same as editor)

### Memory Usage

**Current Approach:**
- Caches text render results (Map)
- Caches connection paths (Map)

**New Approach:**
- Same caching strategy
- Temporary canvas created per measurement (garbage collected)

**Memory Impact:**
- ✅ **Neutral:** Temporary canvases are small and short-lived
- ✅ **GC Overhead:** Minimal (modern browsers optimize temporary canvas allocation)

---

## Success Metrics

### Primary Success Criteria

1. ✅ **Zero Text Clipping:** No text clipped at top, bottom, left, or right edges
2. ✅ **Visual Consistency:** Main game nodes match editor appearance exactly
3. ✅ **Layout Stability:** Node positions remain stable across loads
4. ✅ **Performance Target:** Render time < 50ms for 50-node contracts

### Secondary Success Criteria

5. ✅ **Code Simplicity:** Fewer lines of code, easier to understand
6. ✅ **Maintainability:** Single source of truth for text rendering logic
7. ✅ **Bug Reduction:** Eliminate text overflow/clipping bugs permanently
8. ✅ **Developer Experience:** Clear, documented code with consistent patterns

### User Experience Metrics

9. ✅ **Readability:** All text is fully readable without clipping
10. ✅ **Visual Appeal:** Clean, professional appearance matching editor
11. ✅ **Consistency:** Same contract looks identical in editor and main game
12. ✅ **Reliability:** No visual bugs across different contracts/text lengths

---

## Code Quality Standards

### Code Style Requirements

1. **Consistent Naming:** Use editor's naming conventions
2. **Clear Comments:** Document all magic numbers (6px padding, 16px line height)
3. **Function Signatures:** Match editor's parameter order and types
4. **Error Handling:** Gracefully handle empty/null text
5. **Type Checking:** Validate input parameters

### Documentation Requirements

1. **JSDoc Comments:** All public methods have JSDoc
2. **Inline Comments:** Explain non-obvious calculations
3. **Change Log:** Update file header with implementation date
4. **Cross-References:** Note when code matches editor implementation

### Testing Requirements

1. **Visual Testing:** Screenshot comparisons before/after
2. **Edge Case Testing:** Test empty, long, multi-line text
3. **Performance Testing:** Verify render times with large contracts
4. **Integration Testing:** Test with editor-exported contracts

---

## Rollback Plan

### If Implementation Fails

**Symptoms:**
- Text clipping worse than before
- Nodes sized incorrectly (too small/large)
- Performance degradation
- Visual glitches or errors

**Immediate Actions:**

1. **Revert Changes:**
   ```bash
   git checkout HEAD -- js/visualPrototype.js
   ```

2. **Verify Revert:**
   - Load test contract
   - Verify app returns to pre-change state
   - Document failure mode

3. **Diagnose Issue:**
   - Compare current code to spec
   - Check console for errors
   - Review screenshots for specific problems

4. **Create Issue:**
   - Document what went wrong
   - Include screenshots
   - Note which step failed
   - Propose alternative approach

### Partial Rollback Options

**If sizing changes work but rendering fails:**
- Keep `calculateOptimalNodeSize()` changes
- Revert `renderEnhancedNodeText()` changes
- Investigate rendering issue separately

**If measurement functions work but integration fails:**
- Keep `processTextWithLinebreaks()` and `wrapText()` changes
- Revert sizing and rendering changes
- Investigate integration issues separately

---

## Future Enhancements

### Phase 2 Improvements (Post-Unification)

1. **Refactor Common Code:**
   - Extract shared text rendering functions to utility module
   - Share code between editor and main game
   - Single source of truth for text rendering

2. **Advanced Text Features:**
   - Rich text formatting (bold, italic, colors)
   - Text overflow indicators (ellipsis)
   - Dynamic font sizing for very long text

3. **Performance Optimizations:**
   - Text measurement caching (cache by text hash)
   - Batch text rendering for multiple nodes
   - WebGL-accelerated text rendering for very large contracts

4. **Visual Enhancements:**
   - Text shadows for better readability
   - Gradient text effects
   - Animated text appearances

### Stretch Goals

5. **Accessibility:**
   - High contrast mode for text
   - Font size controls
   - Text-to-speech integration

6. **Internationalization:**
   - Multi-language support
   - RTL text support
   - Unicode handling improvements

---

## Appendix A: Key Differences Summary

| Aspect | Editor | Main Game (Current) | Main Game (Target) |
|--------|--------|---------------------|-------------------|
| **Line Height** | 16px | 20px | 16px ✅ |
| **Padding** | 6px | 20px | 6px ✅ |
| **Max Width** | 200px | 300px | 200px ✅ |
| **Separator Height** | 4px | 8px | 4px ✅ |
| **Extra Vertical Space** | 0px | 10px | 0px ✅ |
| **Text Baseline** | 'top' | 'top' | 'top' ✅ |
| **Font Setting** | In method | Caller sets | In method ✅ |
| **Measurement Canvas** | Temporary | Main (with transforms) | Temporary ✅ |
| **Height Calc** | Simple | Complex | Simple ✅ |
| **Context Transforms** | None | Save/Restore | None ✅ |

---

## Appendix B: Function Call Graph

### Before Changes (Current)

```
calculateLayout()
  └─> calculateOptimalNodeSize(node)
        ├─> ctx.save()
        ├─> ctx.setTransform()
        ├─> processTextWithLinebreaks(text, width, fontSize)  // NO ctx param
        │     └─> wrapText(text, maxWidth)  // NO ctx param
        └─> ctx.restore()

renderNodes()
  └─> renderNode(node)
        └─> renderEnhancedNodeText(node, pos)
              ├─> ctx.font = 'bold 14px Arial'
              ├─> processTextWithLinebreaks(text, width, fontSize)  // NO ctx
              │     └─> wrapText(text, maxWidth)  // NO ctx
              ├─> Complex vertical centering with extraVerticalSpace
              └─> ctx.fillText() with 20px line height
```

### After Changes (Target)

```
calculateLayout()
  └─> calculateOptimalNodeSize(node)
        ├─> tempCanvas = createElement('canvas')  // NEW: Temp canvas
        ├─> tempCtx = tempCanvas.getContext('2d')
        ├─> tempCtx.font = 'bold 14px Arial'  // NEW: Font set
        ├─> processTextWithLinebreaks(text, width, tempCtx, fontSize)  // NEW: ctx param
        │     ├─> tempCtx.font = `${fontSize}px Arial`  // NEW: Font set
        │     └─> wrapText(tempCtx, text, maxWidth)  // NEW: ctx param
        └─> Simple height calc: lines * 16 + padding * 2

renderNodes()
  └─> renderNode(node)
        └─> renderEnhancedNodeText(node, pos)
              ├─> tempCanvas = createElement('canvas')  // NEW: Temp canvas
              ├─> tempCtx = tempCanvas.getContext('2d')
              ├─> tempCtx.font = 'bold 14px Arial'  // NEW: Font set
              ├─> processTextWithLinebreaks(text, width, tempCtx, fontSize)  // NEW: ctx param
              │     ├─> tempCtx.font = `${fontSize}px Arial`  // NEW: Font set
              │     └─> wrapText(tempCtx, text, maxWidth)  // NEW: ctx param
              ├─> Simple vertical centering: (height - textHeight) / 2
              └─> ctx.fillText() with 16px line height  // CHANGED: 16px
```

---

## Appendix C: Test Contracts

### Test Contract 1: Short Text
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Width,Height,Connections
NODE001,Short,+2 Grit,None;+;2;Grit,,Effect,Red,100,100,,,NODE002
NODE002,Test,+1 Risk,None;+;1;Risk,,Effect,Blue,250,100,,,
```
**Expected Result:** Minimal node sizes, text fits comfortably

### Test Contract 2: Long Text
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Width,Height,Connections
NODE001,This is a very long description that should wrap across multiple lines in the node,This effect description is also quite long and should wrap appropriately,None;+;5;Grit,,Effect,Red,100,100,,,
```
**Expected Result:** Text wraps at ~200px width, all text visible, no clipping

### Test Contract 3: Multi-line with \n
```csv
Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Width,Height,Connections
NODE001,"Line One\nLine Two\nLine Three","Effect Line 1\nEffect Line 2",None;+;3;Veil,,Effect,Green,100,100,,,
```
**Expected Result:** Explicit linebreaks preserved, text wraps within each line if needed

---

## Appendix D: Visual Comparison

### Current Main Game Issues

**Issue 1: Text Clipping at Bottom**
```
┌────────────────────────┐
│  Node Description      │  ← Top of node (padding: 20px)
│  That Wraps Across     │
│  Multiple Lines And    │
│  Gets Cut O            │  ← CLIPPED! (should be "Off")
└────────────────────────┘  ← Bottom of node
```

**Issue 2: Excessive Whitespace**
```
┌────────────────────────┐
│                        │  ← Too much space at top
│                        │
│  Short Text            │  ← Text lost in large node
│                        │
│                        │  ← Too much space at bottom
└────────────────────────┘
```

### Target Editor Appearance

**Correct Rendering:**
```
┌────────────────────────┐
│  Node Description      │  ← Top (padding: 6px)
│  That Wraps Across     │  ← Line 2 (16px below)
│  Multiple Lines        │  ← Line 3 (16px below)
│  ────────────────      │  ← Separator (4px)
│  Effect Description    │  ← Effect (16px below separator)
└────────────────────────┘  ← Bottom (padding: 6px)
```

**Correct Sizing:**
```
┌──────────────┐
│  Short Text  │  ← Minimal size, properly centered
│  ──────────  │
│  +2 Grit     │
└──────────────┘
```

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-09-30 | Technical PM Agent | Initial specification created |

---

## Conclusion

This specification provides a complete, actionable plan to unify text rendering between the editor and main game. By adopting the editor's proven approach, we will:

1. ✅ **Eliminate text clipping bugs** permanently
2. ✅ **Achieve visual consistency** between editor and main game
3. ✅ **Simplify the codebase** by removing unnecessary complexity
4. ✅ **Improve maintainability** with clearer, more predictable code
5. ✅ **Match proven quality** of the editor's implementation

The implementation is low-risk because:
- Editor's approach is proven and bug-free
- Changes are isolated to rendering functions
- Backward compatibility is maintained
- Clear rollback plan exists

**Next Steps:**
1. Review this specification with development team
2. Create backup of `js/visualPrototype.js`
3. Implement changes in order specified (Steps 1-5)
4. Test thoroughly with provided test contracts
5. Validate against success criteria
6. Document any deviations or issues discovered

**Success will be measured by:**
- Zero text clipping in visual validation
- Identical appearance between editor and main game
- Positive developer feedback on code clarity
- No performance regressions

---

**End of Specification**