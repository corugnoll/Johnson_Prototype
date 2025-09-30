# Gate Node Technical Implementation Specification

**Document Version:** 1.0
**Date:** 2025-09-30
**Based on:** Johnson Gate Node Specs.md (Design Specification)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Data Structure Specifications](#data-structure-specifications)
4. [Editor Implementation](#editor-implementation)
5. [Main Game Implementation](#main-game-implementation)
6. [CSV Schema Extensions](#csv-schema-extensions)
7. [Validation & Error Handling](#validation--error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Sequence](#implementation-sequence)

---

## Executive Summary

Gate Nodes are conditional gating mechanisms that control progression through the Contract Perk Tree based on runner configuration. Unlike Normal or Synergy nodes, Gates do not provide effects themselves but instead act as unlockable barriers that must meet specific conditions before becoming selectable.

**Key Differences from Existing Nodes:**
- Do not use Description field for display (only effectDesc is shown)
- Do not process Effect 1 or Effect 2 columns
- Use a new GateCondition column instead of effect columns
- Have different visual rendering (rounded rectangle shape)
- Are NOT counted in color-based effect calculations
- Can be positioned and connected like Normal nodes

---

## System Architecture Overview

### Affected Components

The Gate Node implementation requires modifications to:

1. **Editor Components:**
   - `js/editor/nodeManager.js` - Node creation, validation, rendering
   - `js/editor/editorCanvas.js` - Visual rendering (rounded rectangles)
   - `js/editor/fileManager.js` - CSV import/export validation
   - `editor.html` - UI form fields for gate properties

2. **Main Game Components:**
   - `js/csvLoader.js` - CSV parsing and validation
   - `js/visualPrototype.js` - Visual rendering
   - `js/gameState.js` - Gate condition evaluation logic
   - `js/ui.js` - Node availability UI updates

3. **Data Schema:**
   - CSV format extension (add GateCondition column)
   - Node data structure extension

---

## Data Structure Specifications

### CSV Schema Extension

The CSV format must be extended to support Gate nodes. The new column is:

**New Column: `GateCondition`**
- Required for Type="Gate" nodes
- Optional/ignored for other node types
- Contains the condition that must be met for the gate to become active

**Updated CSV Column Order:**
```
Node ID, Description, Effect Desc, Effect 1, Effect 2, Type, Color, X, Y, Width, Height, GateCondition, Connections
```

### GateCondition Syntax

Gate conditions follow a similar pattern to effect conditions but control node availability rather than applying multipliers.

**Format:**
```
ConditionType:Parameters;Threshold
```

**Supported Condition Types:**

#### 1. RunnerType Condition
```
RunnerType:{Type1},{Type2},...;{Amount}
```
- **Example:** `RunnerType:hacker,muscle;3`
- **Meaning:** Requires 3 or more runners of type hacker OR muscle
- **Evaluation:** Count all runners matching any of the specified types. If count >= threshold, gate is active.

#### 2. RunnerStat Condition
```
RunnerStat:{Stat1},{Stat2},...;{Amount}
```
- **Example:** `RunnerStat:muscle,stealth;4`
- **Meaning:** Requires the sum of muscle and stealth stats across all runners to be 4 or higher
- **Evaluation:** Sum the specified stats across all runners. If sum >= threshold, gate is active.

**Parsing Strategy:**
```javascript
// Example parsing function
function parseGateCondition(conditionString) {
    const [conditionPart, thresholdStr] = conditionString.split(';');
    const threshold = parseInt(thresholdStr);

    if (conditionPart.startsWith('RunnerType:')) {
        const types = conditionPart.substring('RunnerType:'.length).split(',').map(t => t.trim());
        return {
            type: 'RunnerType',
            parameters: types,
            threshold: threshold
        };
    }
    else if (conditionPart.startsWith('RunnerStat:')) {
        const stats = conditionPart.substring('RunnerStat:'.length).split(',').map(s => s.trim());
        return {
            type: 'RunnerStat',
            parameters: stats,
            threshold: threshold
        };
    }

    return null; // Invalid condition
}
```

### Node Data Structure Extension

**JavaScript Node Object:**
```javascript
{
    id: "GATE001",
    description: "",              // Empty or ignored for gates
    effectDesc: "Requires 3 Muscle", // Displayed as the only text
    effect1: "",                  // Ignored for gates
    effect2: "",                  // Ignored for gates
    type: "Gate",                 // New node type
    color: "Red",                 // Has color but not counted in effects
    x: 150,
    y: 300,
    width: 120,
    height: 80,
    gateCondition: "RunnerType:muscle;3", // New property
    connections: ["NODE001", "NODE002"],
    selected: false,
    available: false,             // Controlled by gate condition evaluation
    isGate: true                  // Helper flag for quick identification
}
```

---

## Editor Implementation

### 1. UI Changes (editor.html)

**Node Properties Panel Modifications:**

Add conditional visibility logic to show/hide fields based on node type:

```html
<!-- Existing fields -->
<div class="form-group">
    <label for="nodeType">Type:</label>
    <select id="nodeType">
        <option value="Normal">Normal</option>
        <option value="Synergy">Synergy</option>
        <option value="Start">Start</option>
        <option value="End">End</option>
        <option value="Gate">Gate</option> <!-- NEW -->
    </select>
</div>

<!-- Show only for non-Gate nodes -->
<div class="form-group" id="descriptionGroup">
    <label for="nodeDescription">Description:</label>
    <textarea id="nodeDescription" rows="2"></textarea>
</div>

<!-- Always show Effect Desc -->
<div class="form-group">
    <label for="nodeEffectDesc">Effect Description:</label>
    <textarea id="nodeEffectDesc" rows="2"></textarea>
</div>

<!-- Hide for Gate nodes -->
<div class="form-group" id="effect1Group">
    <label for="nodeEffect1">Effect 1:</label>
    <input type="text" id="nodeEffect1" placeholder="Condition;Operator;Amount;Stat">
</div>

<div class="form-group" id="effect2Group">
    <label for="nodeEffect2">Effect 2:</label>
    <input type="text" id="nodeEffect2" placeholder="Condition;Operator;Amount;Stat">
</div>

<!-- Show only for Gate nodes -->
<div class="form-group" id="gateConditionGroup" style="display: none;">
    <label for="nodeGateCondition">Gate Condition:</label>
    <input type="text" id="nodeGateCondition" placeholder="RunnerType:hacker,muscle;3">
    <small class="help-text">
        Format: RunnerType:{types};{amount} or RunnerStat:{stats};{amount}
    </small>
</div>
```

**JavaScript for Dynamic Field Visibility:**
```javascript
// In editorMain.js setupPropertiesPanelEvents()
const typeSelect = document.getElementById('nodeType');
if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
        const isGate = e.target.value === 'Gate';

        // Toggle field groups
        document.getElementById('descriptionGroup').style.display = isGate ? 'none' : 'block';
        document.getElementById('effect1Group').style.display = isGate ? 'none' : 'block';
        document.getElementById('effect2Group').style.display = isGate ? 'none' : 'block';
        document.getElementById('gateConditionGroup').style.display = isGate ? 'block' : 'none';

        // Clear fields when switching to/from Gate
        if (isGate) {
            document.getElementById('nodeDescription').value = '';
            document.getElementById('nodeEffect1').value = '';
            document.getElementById('nodeEffect2').value = '';
        } else {
            document.getElementById('nodeGateCondition').value = '';
        }
    });
}
```

### 2. NodeManager Changes (js/editor/nodeManager.js)

**Update Node Creation:**

Modify the `createNode()` method to initialize gate-specific properties:

```javascript
// In createNode(x, y)
createNode(x, y) {
    const coords = this.canvas.snapToGridCoords(x, y);

    const node = {
        id: `NODE${String(this.nextNodeId).padStart(3, '0')}`,
        description: "New Node",
        effectDesc: "Node effect description",
        effect1: "",
        effect2: "",
        type: "Normal",
        color: this.selectedColor,
        x: coords.x,
        y: coords.y,
        connections: [],
        selected: false,
        width: this.minWidth,
        height: this.minHeight,
        gateCondition: "" // NEW: Initialize gate condition field
    };

    this.calculateNodeDimensions(node);
    this.nodes.push(node);
    this.nextNodeId++;

    // ... rest of method
}
```

**Update Node Rendering:**

Modify the `drawNode()` method to render gates with rounded rectangles:

```javascript
// In drawNode(node, ctx)
drawNode(node, ctx) {
    ctx.save();

    const color = this.nodeColors[node.color] || this.nodeColors.Grey;

    // Choose drawing method based on node type
    if (node.type === 'Gate') {
        this.drawGateNode(node, ctx, color);
    } else {
        this.drawRegularNode(node, ctx, color);
    }

    ctx.restore();
}

// NEW METHOD: Draw gate node with rounded rectangle
drawGateNode(node, ctx, color) {
    const radius = 8; // Border radius for rounded corners

    // Draw rounded rectangle
    ctx.fillStyle = color;
    this.roundRect(ctx, node.x, node.y, node.width, node.height, radius, true, false);

    // Draw border
    ctx.strokeStyle = node.selected ? '#FFFFFF' : '#000000';
    ctx.lineWidth = node.selected ? 3 : 1;
    this.roundRect(ctx, node.x, node.y, node.width, node.height, radius, false, true);

    // Draw node ID in top-right corner
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = this.getContrastColor(color, 0.7);
    ctx.fillText(
        node.id,
        node.x + node.width - this.padding,
        node.y + this.padding
    );

    // Render gate text (ONLY effectDesc, no description)
    this.renderGateNodeText(node, {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
    }, ctx);
}

// NEW METHOD: Draw regular node (existing logic)
drawRegularNode(node, ctx, color) {
    // Draw node background
    ctx.fillStyle = color;
    ctx.fillRect(node.x, node.y, node.width, node.height);

    // Draw node border
    ctx.strokeStyle = node.selected ? '#FFFFFF' : '#000000';
    ctx.lineWidth = node.selected ? 3 : 1;
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // Draw node ID
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = this.getContrastColor(color, 0.7);
    ctx.fillText(
        node.id,
        node.x + node.width - this.padding,
        node.y + this.padding
    );

    // Render node text with description and effect description sections
    this.renderNodeText(node, {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
    }, ctx);
}

// NEW HELPER METHOD: Draw rounded rectangle
roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// NEW METHOD: Render gate node text (only effectDesc, centered)
renderGateNodeText(node, pos, ctx) {
    const padding = 6;
    const availableWidth = pos.width - (padding * 2);
    const fontSize = 12;
    const lineHeight = 16;

    // Process effect description text with linebreak support
    const effectText = this.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, fontSize);

    // Calculate vertical centering
    const totalTextHeight = effectText.length * lineHeight;
    const startY = pos.y + (pos.height - totalTextHeight) / 2;

    // Render effect description text (only text for gates)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    effectText.forEach((line, index) => {
        ctx.fillText(line, pos.x + pos.width/2, startY + (index * lineHeight));
    });
}
```

**Update Dimension Calculation:**

Modify `calculateNodeDimensions()` to handle gates (only effectDesc text):

```javascript
calculateNodeDimensions(node) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    const padding = 6;
    const maxWidth = 200;
    const lineHeight = 16;
    const separatorHeight = 4;
    const minWidth = 80;
    const minHeight = 60;

    // Calculate available width for text
    const availableWidth = maxWidth - padding * 2;

    // For Gate nodes, only process effectDesc
    if (node.type === 'Gate') {
        ctx.font = '12px Arial';
        const effectLines = this.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, 12);
        const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

        const totalTextHeight = effectLines.length * lineHeight;

        node.width = Math.max(minWidth, effectWidth + padding * 2);
        node.height = Math.max(minHeight, totalTextHeight + padding * 2);
    } else {
        // Existing logic for regular nodes (description + effectDesc)
        ctx.font = 'bold 14px Arial';
        const descLines = this.processTextWithLinebreaks(node.description || '', availableWidth, ctx, 14);
        const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

        ctx.font = '12px Arial';
        const effectLines = this.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, 12);
        const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

        const maxTextWidth = Math.max(descWidth, effectWidth);
        const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';

        const totalTextHeight = (descLines.length * lineHeight) +
                               (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

        node.width = Math.max(minWidth, maxTextWidth + padding * 2);
        node.height = Math.max(minHeight, totalTextHeight + padding * 2);
    }

    return { width: node.width, height: node.height };
}
```

**Update Properties Panel:**

Modify `updatePropertiesPanel()` to handle gate-specific fields:

```javascript
updatePropertiesPanel(node) {
    const elements = {
        nodeId: document.getElementById('nodeId'),
        nodeDescription: document.getElementById('nodeDescription'),
        nodeEffectDesc: document.getElementById('nodeEffectDesc'),
        nodeEffect1: document.getElementById('nodeEffect1'),
        nodeEffect2: document.getElementById('nodeEffect2'),
        nodeType: document.getElementById('nodeType'),
        nodeColor: document.getElementById('nodeColor'),
        nodeGateCondition: document.getElementById('nodeGateCondition'),
        nodeConnections: document.getElementById('nodeConnections'),
        nodeX: document.getElementById('nodeX'),
        nodeY: document.getElementById('nodeY')
    };

    // Populate form fields
    if (elements.nodeId) elements.nodeId.value = node.id;
    if (elements.nodeDescription) elements.nodeDescription.value = node.description || '';
    if (elements.nodeEffectDesc) elements.nodeEffectDesc.value = node.effectDesc || '';
    if (elements.nodeEffect1) elements.nodeEffect1.value = node.effect1 || '';
    if (elements.nodeEffect2) elements.nodeEffect2.value = node.effect2 || '';
    if (elements.nodeType) elements.nodeType.value = node.type;
    if (elements.nodeColor) elements.nodeColor.value = node.color;
    if (elements.nodeGateCondition) elements.nodeGateCondition.value = node.gateCondition || '';
    if (elements.nodeConnections) elements.nodeConnections.value = node.connections.join(',');
    if (elements.nodeX) elements.nodeX.value = node.x;
    if (elements.nodeY) elements.nodeY.value = node.y;

    // Toggle field visibility based on node type
    const isGate = node.type === 'Gate';
    const descGroup = document.getElementById('descriptionGroup');
    const effect1Group = document.getElementById('effect1Group');
    const effect2Group = document.getElementById('effect2Group');
    const gateConditionGroup = document.getElementById('gateConditionGroup');

    if (descGroup) descGroup.style.display = isGate ? 'none' : 'block';
    if (effect1Group) effect1Group.style.display = isGate ? 'none' : 'block';
    if (effect2Group) effect2Group.style.display = isGate ? 'none' : 'block';
    if (gateConditionGroup) gateConditionGroup.style.display = isGate ? 'block' : 'none';

    // Show the editor panel
    const nodeEditor = document.getElementById('nodeEditor');
    const noSelection = document.getElementById('noSelection');
    if (nodeEditor) nodeEditor.style.display = 'block';
    if (noSelection) noSelection.style.display = 'none';
}
```

**Update Node Update Handler:**

Modify `updateSelectedNode()` in editorMain.js to handle gateCondition:

```javascript
updateSelectedNode() {
    const selectedNode = this.nodeManager.getSelectedNode();
    if (!selectedNode) return;

    const updates = {
        id: document.getElementById('nodeId')?.value,
        description: document.getElementById('nodeDescription')?.value,
        effectDesc: document.getElementById('nodeEffectDesc')?.value,
        effect1: document.getElementById('nodeEffect1')?.value,
        effect2: document.getElementById('nodeEffect2')?.value,
        type: document.getElementById('nodeType')?.value,
        color: document.getElementById('nodeColor')?.value,
        gateCondition: document.getElementById('nodeGateCondition')?.value, // NEW
        connections: document.getElementById('nodeConnections')?.value
    };

    // Apply updates
    Object.entries(updates).forEach(([property, value]) => {
        if (value !== undefined && value !== selectedNode[property]) {
            this.nodeManager.updateNodeProperty(selectedNode.id, property, value);
        }
    });
}
```

### 3. FileManager Changes (js/editor/fileManager.js)

**Update Valid Node Types:**

```javascript
// In constructor
this.validNodeTypes = ['Normal', 'Synergy', 'Start', 'End', 'Gate']; // Add 'Gate'
```

**Update CSV Generation:**

Modify `generateCSVContent()` to include GateCondition column:

```javascript
generateCSVContent(nodes) {
    const csvData = nodes.map(node => {
        const connectionsStr = Array.isArray(node.connections)
            ? node.connections.join(',')
            : (node.connections || '');

        return {
            'Node ID': node.id || '',
            'Description': node.description || '',
            'Effect Desc': node.effectDesc || '',
            'Effect 1': node.effect1 || '',
            'Effect 2': node.effect2 || '',
            'Type': node.type || 'Normal',
            'Color': node.color || 'Grey',
            'X': this.formatCoordinate(node.x),
            'Y': this.formatCoordinate(node.y),
            'Width': this.formatCoordinate(node.width),
            'Height': this.formatCoordinate(node.height),
            'GateCondition': node.gateCondition || '', // NEW
            'Connections': connectionsStr
        };
    });

    return Papa.unparse(csvData, {
        quotes: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n'
    });
}
```

**Update Import Conversion:**

Modify `convertToNodeObjects()` to handle GateCondition:

```javascript
convertToNodeObjects(parsedData) {
    return parsedData.map(row => {
        const node = {
            id: row['Node ID'] || '',
            description: row['Description'] || '',
            effectDesc: row['Effect Desc'] || '',
            effect1: row['Effect 1'] || '',
            effect2: row['Effect 2'] || '',
            type: row['Type'] || 'Normal',
            color: row['Color'] || 'Grey',
            x: parseFloat(row['X']) || 0,
            y: parseFloat(row['Y']) || 0,
            width: parseFloat(row['Width']) || 80,
            height: parseFloat(row['Height']) || 60,
            gateCondition: row['GateCondition'] || '', // NEW
            connections: this.parseConnectionsString(row['Connections'] || ''),
            selected: false
        };

        return node;
    });
}
```

**Add Gate Condition Validation:**

Add a new validation method for gate conditions:

```javascript
/**
 * Validate gate condition string format
 * @param {string} conditionString - Gate condition to validate
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} Validation result with errors array
 */
validateGateCondition(conditionString, rowNumber) {
    const errors = [];

    if (!conditionString || conditionString.trim() === '') {
        return { errors }; // Empty is valid (not a gate node)
    }

    try {
        const parts = conditionString.split(';');
        if (parts.length !== 2) {
            errors.push(`Row ${rowNumber}: Gate condition must have exactly 2 parts separated by semicolon (Type:Params;Threshold). Got: '${conditionString}'`);
            return { errors };
        }

        const [conditionPart, thresholdStr] = parts;

        // Validate threshold
        const threshold = parseInt(thresholdStr);
        if (isNaN(threshold) || threshold < 0) {
            errors.push(`Row ${rowNumber}: Gate condition threshold must be a non-negative integer. Got: '${thresholdStr}'`);
        }

        // Validate condition type
        if (conditionPart.startsWith('RunnerType:')) {
            const types = conditionPart.substring('RunnerType:'.length).split(',').map(t => t.trim());
            const validRunnerTypes = ['Face', 'Muscle', 'Hacker', 'Ninja', 'face', 'muscle', 'hacker', 'ninja'];

            types.forEach(type => {
                if (!validRunnerTypes.includes(type)) {
                    errors.push(`Row ${rowNumber}: Invalid runner type '${type}' in gate condition. Valid types: Face, Muscle, Hacker, Ninja (case-insensitive)`);
                }
            });

            if (types.length === 0) {
                errors.push(`Row ${rowNumber}: RunnerType gate condition requires at least one runner type`);
            }
        }
        else if (conditionPart.startsWith('RunnerStat:')) {
            const stats = conditionPart.substring('RunnerStat:'.length).split(',').map(s => s.trim());
            const validStats = ['face', 'muscle', 'hacker', 'ninja'];

            stats.forEach(stat => {
                if (!validStats.includes(stat.toLowerCase())) {
                    errors.push(`Row ${rowNumber}: Invalid stat '${stat}' in gate condition. Valid stats: face, muscle, hacker, ninja (case-insensitive)`);
                }
            });

            if (stats.length === 0) {
                errors.push(`Row ${rowNumber}: RunnerStat gate condition requires at least one stat`);
            }
        }
        else {
            errors.push(`Row ${rowNumber}: Gate condition must start with 'RunnerType:' or 'RunnerStat:'. Got: '${conditionPart}'`);
        }

    } catch (error) {
        errors.push(`Row ${rowNumber}: Error parsing gate condition '${conditionString}': ${error.message}`);
    }

    return { errors };
}
```

**Update Data Validation:**

Modify `validateImportData()` to validate gate conditions:

```javascript
validateImportData(data) {
    const validationErrors = [];

    data.forEach((row, index) => {
        const rowNumber = index + 2; // +2 for header row and 0-index

        // Existing validations...

        // NEW: Validate Gate-specific rules
        if (row['Type'] === 'Gate') {
            // Gate nodes should have GateCondition
            if (!row['GateCondition'] || row['GateCondition'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Gate nodes require a GateCondition`);
            } else {
                // Validate gate condition format
                const gateValidation = this.validateGateCondition(row['GateCondition'], rowNumber);
                if (gateValidation.errors.length > 0) {
                    validationErrors.push(...gateValidation.errors);
                }
            }

            // Gate nodes should not have Effect 1 or Effect 2 (warn if present)
            if (row['Effect 1'] && row['Effect 1'].trim() !== '') {
                console.warn(`Row ${rowNumber}: Gate node has Effect 1 defined but it will be ignored`);
            }
            if (row['Effect 2'] && row['Effect 2'].trim() !== '') {
                console.warn(`Row ${rowNumber}: Gate node has Effect 2 defined but it will be ignored`);
            }
        } else {
            // Non-gate nodes should not have GateCondition (warn if present)
            if (row['GateCondition'] && row['GateCondition'].trim() !== '') {
                console.warn(`Row ${rowNumber}: Non-gate node has GateCondition defined but it will be ignored`);
            }
        }
    });

    return {
        isValid: validationErrors.length === 0,
        errors: validationErrors
    };
}
```

---

## Main Game Implementation

### 1. CSV Loader Changes (js/csvLoader.js)

**Update Valid Types:**

```javascript
// In validateData() method
const validTypes = ['Normal', 'Effect', 'Choice', 'Start', 'End', 'Gate', 'Synergy', 'Special'];
```

**Update VisualNode Constructor:**

Modify the `VisualNode` class to include gateCondition:

```javascript
class VisualNode {
    constructor(csvRow) {
        // Core properties from CSV
        this.id = csvRow['Node ID'];
        this.description = csvRow['Description'];
        this.effectDescription = csvRow['Effect Desc'];
        this.effect1 = csvRow['Effect 1'];
        this.effect2 = csvRow['Effect 2'];
        this.type = csvRow['Type'];
        this.color = csvRow['Color'];
        this.gateCondition = csvRow['GateCondition'] || ''; // NEW

        // Position properties (X,Y coordinates)
        this.x = parseFloat(csvRow['X']) || 0;
        this.y = parseFloat(csvRow['Y']) || 0;

        // Dimension properties (width/height from editor)
        this.width = parseFloat(csvRow['Width']) || null;
        this.height = parseFloat(csvRow['Height']) || null;

        // Legacy layer/slot support for backward compatibility
        this.layer = parseInt(csvRow['Layer']) || 0;
        this.slot = csvRow['Slot'] || '';

        // Visual properties
        this.state = 'available';
        this.position = null;
        this.connections = new Set();
    }
}
```

**Add Gate Condition Validation:**

Add validation for gate conditions in CSV loader:

```javascript
// In validateData() method, add gate-specific validation
data.forEach((row, index) => {
    const rowNumber = index + 1;

    // ... existing validations ...

    // NEW: Validate Gate nodes
    if (row['Type'] === 'Gate') {
        if (!row['GateCondition'] || row['GateCondition'].trim() === '') {
            validationErrors.push(`Row ${rowNumber}: Gate nodes require a GateCondition`);
        } else {
            // Validate gate condition format
            const gateValidation = this.validateGateConditionFormat(row['GateCondition'], rowNumber);
            if (gateValidation.errors.length > 0) {
                validationErrors.push(...gateValidation.errors);
            }
        }
    }
});
```

Add the validation method:

```javascript
/**
 * Validate gate condition string format
 * @param {string} conditionString - Gate condition to validate
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} Validation result with errors array
 */
validateGateConditionFormat(conditionString, rowNumber) {
    const errors = [];

    try {
        const parts = conditionString.split(';');
        if (parts.length !== 2) {
            errors.push(`Row ${rowNumber}: Gate condition must have 2 parts (Type:Params;Threshold)`);
            return { errors };
        }

        const [conditionPart, thresholdStr] = parts;
        const threshold = parseInt(thresholdStr);

        if (isNaN(threshold) || threshold < 0) {
            errors.push(`Row ${rowNumber}: Gate condition threshold must be non-negative integer`);
        }

        if (!conditionPart.startsWith('RunnerType:') && !conditionPart.startsWith('RunnerStat:')) {
            errors.push(`Row ${rowNumber}: Gate condition must start with 'RunnerType:' or 'RunnerStat:'`);
        }

    } catch (error) {
        errors.push(`Row ${rowNumber}: Error parsing gate condition: ${error.message}`);
    }

    return { errors };
}
```

### 2. Game State Changes (js/gameState.js)

**Update Contract Data Loading:**

Modify `setContractData()` to include gateCondition:

```javascript
setContractData(contractData) {
    try {
        this.contractData = contractData.map(node => {
            const baseNode = {
                id: node['Node ID'] || node.id,
                description: node['Description'] || node.description,
                effectDescription: node['Effect Desc'] || node.effectDescription,
                effect1: node['Effect 1'] || node.effect1,
                effect2: node['Effect 2'] || node.effect2,
                type: node['Type'] || node.type,
                color: node['Color'] || node.color,
                gateCondition: node['GateCondition'] || node.gateCondition || '', // NEW
                connections: this.parseConnections(node['Connections'] || node.connections),
                selected: false,
                available: this.shouldBeInitiallyAvailable(node)
            };

            // Handle both X,Y format and legacy Layer/Slot format
            if (typeof node.x === 'number' && typeof node.y === 'number') {
                baseNode.x = node.x;
                baseNode.y = node.y;
                baseNode.layer = node.layer || 0;
                baseNode.slot = node.slot || '';
            } else {
                baseNode.layer = parseInt(node['Layer'] || node.layer) || 0;
                baseNode.slot = node['Slot'] || node.slot || '';
                baseNode.x = 0;
                baseNode.y = 0;
            }

            return baseNode;
        });

        this.selectedNodes = [];
        this.updateAvailableNodes();
        this.calculateCurrentPools();

        console.log(`Contract data set with ${this.contractData.length} nodes`);

    } catch (error) {
        console.error('Error setting contract data:', error);
        throw new Error(`Failed to process contract data: ${error.message}`);
    }
}
```

**Add Gate Condition Evaluation:**

Add a new method to evaluate gate conditions:

```javascript
/**
 * Evaluate gate condition for a gate node
 * @param {Object} node - Gate node to evaluate
 * @returns {boolean} True if condition is met
 */
evaluateGateCondition(node) {
    if (node.type !== 'Gate') {
        return true; // Non-gate nodes are always available based on connections
    }

    if (!node.gateCondition || node.gateCondition.trim() === '') {
        console.warn(`Gate node ${node.id} has no gate condition`);
        return false;
    }

    try {
        const [conditionPart, thresholdStr] = node.gateCondition.split(';');
        const threshold = parseInt(thresholdStr);

        if (isNaN(threshold)) {
            console.error(`Invalid threshold in gate condition: ${node.gateCondition}`);
            return false;
        }

        // RunnerType condition
        if (conditionPart.startsWith('RunnerType:')) {
            return this.evaluateRunnerTypeGateCondition(conditionPart, threshold);
        }

        // RunnerStat condition
        if (conditionPart.startsWith('RunnerStat:')) {
            return this.evaluateRunnerStatGateCondition(conditionPart, threshold);
        }

        console.warn(`Unknown gate condition type: ${conditionPart}`);
        return false;

    } catch (error) {
        console.error(`Error evaluating gate condition for ${node.id}:`, error);
        return false;
    }
}

/**
 * Evaluate RunnerType gate condition
 * @param {string} conditionPart - Condition part (e.g., "RunnerType:hacker,muscle")
 * @param {number} threshold - Required count
 * @returns {boolean} True if condition is met
 */
evaluateRunnerTypeGateCondition(conditionPart, threshold) {
    const typesStr = conditionPart.substring('RunnerType:'.length);
    const requiredTypes = typesStr.split(',').map(t => t.trim().toLowerCase());

    // Count runners matching any of the required types
    const matchingCount = this.runners.filter(runner => {
        return requiredTypes.includes(runner.type.toLowerCase());
    }).length;

    return matchingCount >= threshold;
}

/**
 * Evaluate RunnerStat gate condition
 * @param {string} conditionPart - Condition part (e.g., "RunnerStat:muscle,stealth")
 * @param {number} threshold - Required stat sum
 * @returns {boolean} True if condition is met
 */
evaluateRunnerStatGateCondition(conditionPart, threshold) {
    const statsStr = conditionPart.substring('RunnerStat:'.length);
    const requiredStats = statsStr.split(',').map(s => s.trim().toLowerCase());

    // Sum the required stats across all runners
    let totalStats = 0;
    this.runners.forEach(runner => {
        requiredStats.forEach(statName => {
            totalStats += runner.stats[statName] || 0;
        });
    });

    return totalStats >= threshold;
}
```

**Update Node Availability Logic:**

Modify `updateAvailableNodes()` to handle gate nodes:

```javascript
/**
 * Update which nodes are currently available for selection
 * Nodes become available when:
 * 1. They are start nodes (layer 0 or Type 'Start')
 * 2. They are Synergy nodes (always available)
 * 3. They are Gate nodes AND gate condition is met AND at least one connected predecessor is selected
 * 4. They are normal nodes AND at least one connected predecessor node is selected
 */
updateAvailableNodes() {
    if (!this.contractData) return;

    this.contractData.forEach(node => {
        // Skip already selected nodes
        if (node.selected) {
            node.available = false;
            return;
        }

        // Start nodes are always available
        if (this.isStartNode(node)) {
            node.available = true;
            return;
        }

        // Synergy nodes are always available
        if (node.type === 'Synergy') {
            node.available = true;
            return;
        }

        // NEW: Gate node availability logic
        if (node.type === 'Gate') {
            // Gate must have connection availability AND gate condition met
            const hasConnectionAvailability = this.hasAvailableConnection(node);
            const gateConditionMet = this.evaluateGateCondition(node);

            node.available = hasConnectionAvailability && gateConditionMet;
            return;
        }

        // Regular nodes: available if at least one predecessor is selected
        node.available = this.hasAvailableConnection(node);
    });
}

/**
 * Check if node has at least one selected predecessor
 * @param {Object} node - Node to check
 * @returns {boolean} True if has available connection
 */
hasAvailableConnection(node) {
    // Find nodes that connect TO this node
    const predecessors = this.contractData.filter(otherNode => {
        return otherNode.connections && otherNode.connections.includes(node.id);
    });

    // Node is available if any predecessor is selected
    return predecessors.some(pred => pred.selected);
}
```

**Update Pool Calculation:**

Modify `applyNodeEffects()` to skip effects for Gate nodes:

```javascript
/**
 * Apply effects from a specific node
 * @param {Object} node - Node to apply effects from
 */
applyNodeEffects(node) {
    // NEW: Skip gate nodes - they don't have effects
    if (node.type === 'Gate') {
        return;
    }

    if (node.effect1) {
        this.applyEffect(node.effect1);
    }
    if (node.effect2) {
        this.applyEffect(node.effect2);
    }
}
```

**Update Color Counting:**

Add logic to exclude Gate nodes from color counts in effect conditions:

```javascript
/**
 * Count selected nodes of specific color (excludes Gate nodes)
 * @param {string} color - Color to count
 * @returns {number} Count of selected nodes of that color (excluding gates)
 */
countSelectedNodesOfColor(color) {
    return this.selectedNodes.filter(nodeId => {
        const node = this.getNodeById(nodeId);
        return node && node.color === color && node.type !== 'Gate'; // NEW: Exclude gates
    }).length;
}
```

Update any effect condition evaluation that counts node colors to exclude Gate nodes:

```javascript
// In evaluateCondition() method, update NodeColor condition
if (condition.startsWith('NodeColor:')) {
    const requiredColor = condition.split(':')[1];
    const hasColor = this.selectedNodes.some(nodeId => {
        const node = this.getNodeById(nodeId);
        // NEW: Exclude gate nodes from color counting
        return node && node.color === requiredColor && node.type !== 'Gate';
    });
    return hasColor ? 1 : 0;
}

// Update NodeColorCombo condition similarly
if (condition.startsWith('NodeColorCombo:')) {
    const requiredColors = condition.split(':')[1].split(',').map(c => c.trim());
    const hasAllColors = requiredColors.every(color => {
        return this.selectedNodes.some(nodeId => {
            const node = this.getNodeById(nodeId);
            // NEW: Exclude gate nodes from color counting
            return node && node.color === color && node.type !== 'Gate';
        });
    });
    return hasAllColors ? 1 : 0;
}
```

### 3. Visual Prototype Changes (js/visualPrototype.js)

**Update Node Rendering:**

Add gate-specific rendering to `renderRegularNode()`:

```javascript
renderRegularNode(node, pos) {
    const color = this.nodeColors[node.color] || '#CCCCCC';

    // NEW: Check if this is a gate node
    if (node.type === 'Gate') {
        this.renderGateNode(node, pos, color);
    } else {
        // Existing regular node rendering
        this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
        this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

        // Draw node border with proper selection styling
        if (node.state === 'selected') {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
        } else {
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
        }
        this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Render enhanced node text with proper layout
        this.renderEnhancedNodeText(node, pos);
    }
}

/**
 * Render a gate node with rounded rectangle shape
 * @param {Object} node - Gate node to render
 * @param {Object} pos - Node position and dimensions
 * @param {string} color - Node color
 */
renderGateNode(node, pos, color) {
    const radius = 8; // Border radius for rounded corners

    // Draw rounded rectangle background
    this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
    this.roundRect(this.ctx, pos.x, pos.y, pos.width, pos.height, radius, true, false);

    // Draw rounded rectangle border
    if (node.state === 'selected') {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
    } else {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
    }
    this.roundRect(this.ctx, pos.x, pos.y, pos.width, pos.height, radius, false, true);

    // Render gate text (only effectDescription, centered)
    this.renderGateNodeText(node, pos);
}

/**
 * Draw rounded rectangle helper
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Corner radius
 * @param {boolean} fill - Whether to fill
 * @param {boolean} stroke - Whether to stroke
 */
roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

/**
 * Render gate node text (only effectDescription, centered)
 * @param {Object} node - Gate node
 * @param {Object} pos - Position and dimensions
 */
renderGateNodeText(node, pos) {
    const padding = 6;
    const fontSize = 12;
    const lineHeight = 16;
    const availableWidth = pos.width - (padding * 2);

    // Create temporary canvas for text processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Process effect description text
    tempCtx.font = `${fontSize}px Arial`;
    const effectText = this.processTextWithLinebreaks(
        node.effectDescription || '',
        availableWidth,
        tempCtx,
        fontSize
    );

    // Calculate vertical centering
    const totalTextHeight = effectText.length * lineHeight;
    const startY = pos.y + (pos.height - totalTextHeight) / 2;

    // Render text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    effectText.forEach((line, index) => {
        this.ctx.fillText(line, pos.x + pos.width/2, startY + (index * lineHeight));
    });
}
```

**Update Node Size Calculation:**

Modify `calculateOptimalNodeSize()` to handle gate nodes:

```javascript
calculateOptimalNodeSize(node) {
    const padding = 6;
    const maxWidth = 200;
    const lineHeight = 16;
    const separatorHeight = 4;
    const minWidth = 80;
    const minHeight = 60;

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    const availableWidth = maxWidth - padding * 2;

    // NEW: For gate nodes, only calculate based on effectDescription
    if (node.type === 'Gate') {
        ctx.font = '12px Arial';
        const effectLines = this.processTextWithLinebreaks(node.effectDescription || '', availableWidth, ctx, 12);
        const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

        const totalTextHeight = effectLines.length * lineHeight;

        const finalWidth = Math.max(minWidth, effectWidth + padding * 2);
        const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2);

        return { width: finalWidth, height: finalHeight };
    }

    // Existing logic for regular nodes
    ctx.font = 'bold 14px Arial';
    const descLines = this.processTextWithLinebreaks(node.description || '', availableWidth, ctx, 14);
    const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

    ctx.font = '12px Arial';
    const effectLines = this.processTextWithLinebreaks(node.effectDescription || '', availableWidth, ctx, 12);
    const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

    const maxTextWidth = Math.max(descWidth, effectWidth);
    const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';

    const totalTextHeight = (descLines.length * lineHeight) +
                           (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

    const finalWidth = Math.max(minWidth, maxTextWidth + padding * 2);
    const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2);

    return { width: finalWidth, height: finalHeight };
}
```

---

## CSV Schema Extensions

### Complete CSV Column Structure

The updated CSV format for contracts with Gate support:

```csv
Node ID, Description, Effect Desc, Effect 1, Effect 2, Type, Color, X, Y, Width, Height, GateCondition, Connections
```

### Column Descriptions

| Column | Required | Description | Valid Values / Format | Notes |
|--------|----------|-------------|----------------------|-------|
| Node ID | Yes | Unique identifier | Alphanumeric + underscore/hyphen | Primary key |
| Description | Conditional | Main node text | Any text | Empty for Gate nodes |
| Effect Desc | Yes | Effect description | Any text | Only text shown for Gates |
| Effect 1 | Conditional | Primary effect | Condition;Operator;Amount;Stat | Ignored for Gates |
| Effect 2 | No | Secondary effect | Condition;Operator;Amount;Stat | Ignored for Gates |
| Type | Yes | Node type | Normal, Synergy, Start, End, **Gate** | Determines behavior |
| Color | Yes | Node color | Red, Yellow, Green, Blue, Purple, Grey | Gates have color but not counted |
| X | Yes | X coordinate | Number (float) | World position |
| Y | Yes | Y coordinate | Number (float) | World position |
| Width | No | Node width | Number (float) | Auto-calculated if missing |
| Height | No | Node height | Number (float) | Auto-calculated if missing |
| **GateCondition** | **Conditional** | **Gate unlock condition** | **Type:Params;Threshold** | **Required for Type=Gate** |
| Connections | No | Connected nodes | Comma-separated IDs | Node IDs this node connects to |

### Gate Condition Format Examples

```csv
# Example 1: Muscle runner requirement
GATE001,,Requires 2 Muscle Runners,,,Gate,Red,200,150,120,80,RunnerType:muscle;2,NODE005

# Example 2: Multi-type requirement
GATE002,,Requires 1 Hacker or Ninja,,,Gate,Blue,200,300,140,80,RunnerType:hacker,ninja;1,NODE010

# Example 3: Stat sum requirement
GATE003,,Requires 6 total Muscle,,,Gate,Green,400,200,130,80,RunnerStat:muscle;6,NODE015

# Example 4: Multi-stat requirement
GATE004,,Requires 8 Hacker+Ninja stats,,,Gate,Purple,400,400,150,80,"RunnerStat:hacker,ninja;8",NODE020
```

### Backward Compatibility

The system maintains backward compatibility with contracts that don't have Gate nodes:
- GateCondition column is optional for non-Gate nodes
- Legacy contracts without GateCondition column will work (empty value assumed)
- CSV parser should handle missing GateCondition column gracefully

---

## Validation & Error Handling

### Editor Validation

**Gate Node Creation Validation:**

1. **Type Selection:**
   - When Type is set to "Gate", automatically:
     - Clear Description field
     - Clear Effect 1 and Effect 2 fields
     - Show GateCondition field
     - Keep Effect Desc field visible

2. **GateCondition Validation:**
   - Cannot be empty for Gate nodes
   - Must match format: `Type:Params;Threshold`
   - Threshold must be non-negative integer
   - Runner types must be valid (Face, Muscle, Hacker, Ninja)
   - Stat names must be valid (face, muscle, hacker, ninja)

3. **Real-time Validation:**
```javascript
// In nodeManager.js or editorMain.js
function validateGateConditionInput(conditionString) {
    if (!conditionString || conditionString.trim() === '') {
        return { valid: false, message: 'Gate condition cannot be empty' };
    }

    const parts = conditionString.split(';');
    if (parts.length !== 2) {
        return { valid: false, message: 'Format: Type:Params;Threshold' };
    }

    const [conditionPart, thresholdStr] = parts;
    const threshold = parseInt(thresholdStr);

    if (isNaN(threshold) || threshold < 0) {
        return { valid: false, message: 'Threshold must be non-negative integer' };
    }

    if (!conditionPart.startsWith('RunnerType:') && !conditionPart.startsWith('RunnerStat:')) {
        return { valid: false, message: 'Must start with RunnerType: or RunnerStat:' };
    }

    return { valid: true, message: 'Valid gate condition' };
}
```

**Export Validation:**

Before exporting, validate that all Gate nodes have proper gate conditions:

```javascript
// In fileManager.js
validateExportData(nodes) {
    const errors = [];

    nodes.forEach((node, index) => {
        if (node.type === 'Gate') {
            if (!node.gateCondition || node.gateCondition.trim() === '') {
                errors.push(`Node ${node.id}: Gate node missing gate condition`);
            } else {
                const validation = this.validateGateConditionSyntax(node.gateCondition);
                if (!validation.valid) {
                    errors.push(`Node ${node.id}: ${validation.message}`);
                }
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

### Game Validation

**CSV Load Validation:**

```javascript
// In csvLoader.js validateData() method
data.forEach((row, index) => {
    const rowNumber = index + 1;

    // ... existing validations ...

    // Gate-specific validation
    if (row['Type'] === 'Gate') {
        // Must have gate condition
        if (!row['GateCondition'] || row['GateCondition'].trim() === '') {
            validationErrors.push(`Row ${rowNumber}: Gate node requires GateCondition`);
        } else {
            // Validate format
            const gateValidation = this.validateGateConditionFormat(row['GateCondition'], rowNumber);
            if (gateValidation.errors.length > 0) {
                validationErrors.push(...gateValidation.errors);
            }
        }

        // Warn if has effects (they will be ignored)
        if (row['Effect 1'] && row['Effect 1'].trim() !== '') {
            console.warn(`Row ${rowNumber}: Gate node has Effect 1 but it will be ignored`);
        }
        if (row['Effect 2'] && row['Effect 2'].trim() !== '') {
            console.warn(`Row ${rowNumber}: Gate node has Effect 2 but it will be ignored`);
        }
    }
});
```

**Runtime Validation:**

```javascript
// In gameState.js
evaluateGateCondition(node) {
    if (node.type !== 'Gate') {
        return true;
    }

    // Validate gate has condition
    if (!node.gateCondition || node.gateCondition.trim() === '') {
        console.error(`Gate node ${node.id} has no gate condition - defaulting to unavailable`);
        return false;
    }

    try {
        const [conditionPart, thresholdStr] = node.gateCondition.split(';');
        const threshold = parseInt(thresholdStr);

        if (isNaN(threshold)) {
            console.error(`Invalid threshold in gate ${node.id}: ${thresholdStr}`);
            return false;
        }

        // Evaluate condition
        if (conditionPart.startsWith('RunnerType:')) {
            return this.evaluateRunnerTypeGateCondition(conditionPart, threshold);
        } else if (conditionPart.startsWith('RunnerStat:')) {
            return this.evaluateRunnerStatGateCondition(conditionPart, threshold);
        } else {
            console.error(`Unknown gate condition type in ${node.id}: ${conditionPart}`);
            return false;
        }

    } catch (error) {
        console.error(`Error evaluating gate condition for ${node.id}:`, error);
        return false;
    }
}
```

### User Feedback

**Editor Feedback:**

1. Visual indicators for gate condition validity
2. Real-time validation messages below GateCondition input
3. Export warnings if any gates have invalid conditions
4. Hover tooltips with gate condition syntax help

**Game Feedback:**

1. Console warnings for malformed gate conditions
2. Visual indication when gate is inactive due to unmet condition
3. Tooltip/hover showing what condition is required (future enhancement)

---

## Testing Strategy

### Unit Tests

**Gate Condition Parsing:**
```javascript
// Test cases for gate condition parsing
describe('Gate Condition Parsing', () => {
    test('parses RunnerType condition correctly', () => {
        const condition = 'RunnerType:muscle,hacker;2';
        const parsed = parseGateCondition(condition);
        expect(parsed.type).toBe('RunnerType');
        expect(parsed.parameters).toEqual(['muscle', 'hacker']);
        expect(parsed.threshold).toBe(2);
    });

    test('parses RunnerStat condition correctly', () => {
        const condition = 'RunnerStat:face,ninja;5';
        const parsed = parseGateCondition(condition);
        expect(parsed.type).toBe('RunnerStat');
        expect(parsed.parameters).toEqual(['face', 'ninja']);
        expect(parsed.threshold).toBe(5);
    });

    test('handles invalid format', () => {
        const condition = 'InvalidFormat';
        const parsed = parseGateCondition(condition);
        expect(parsed).toBeNull();
    });
});
```

**Gate Condition Evaluation:**
```javascript
describe('Gate Condition Evaluation', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState();
        gameState.runners = [
            { type: 'Muscle', stats: { face: 0, muscle: 5, hacker: 0, ninja: 0 } },
            { type: 'Hacker', stats: { face: 0, muscle: 0, hacker: 7, ninja: 0 } },
            { type: 'Empty', stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 } }
        ];
    });

    test('evaluates RunnerType condition - met', () => {
        const node = {
            type: 'Gate',
            gateCondition: 'RunnerType:muscle,hacker;2'
        };
        expect(gameState.evaluateGateCondition(node)).toBe(true);
    });

    test('evaluates RunnerType condition - not met', () => {
        const node = {
            type: 'Gate',
            gateCondition: 'RunnerType:ninja;1'
        };
        expect(gameState.evaluateGateCondition(node)).toBe(false);
    });

    test('evaluates RunnerStat condition - met', () => {
        const node = {
            type: 'Gate',
            gateCondition: 'RunnerStat:muscle,hacker;10'
        };
        expect(gameState.evaluateGateCondition(node)).toBe(true); // 5 + 7 = 12
    });

    test('evaluates RunnerStat condition - not met', () => {
        const node = {
            type: 'Gate',
            gateCondition: 'RunnerStat:muscle,hacker;15'
        };
        expect(gameState.evaluateGateCondition(node)).toBe(false); // 5 + 7 = 12 < 15
    });
});
```

### Integration Tests

**Editor Workflow:**
1. Create a new contract in editor
2. Add a Gate node
3. Verify UI shows correct fields (no Description, has GateCondition)
4. Set gate condition to valid value
5. Export contract
6. Verify CSV contains GateCondition column with correct value
7. Import contract back
8. Verify gate node properties are preserved

**Game Workflow:**
1. Load contract with Gate nodes
2. Configure runners to NOT meet gate condition
3. Verify gate is unavailable (greyed out)
4. Select prerequisite nodes to make gate reachable
5. Verify gate is still unavailable (condition not met)
6. Adjust runner configuration to meet gate condition
7. Verify gate becomes available (can be selected)
8. Select gate node
9. Verify it doesn't add effects to pools
10. Verify connected nodes become available

### Manual Testing Scenarios

**Test Case 1: RunnerType Gate**
- Setup: Contract with gate requiring 2 Muscle runners
- Steps:
  1. Load contract
  2. Set all runners to Empty
  3. Verify gate is unavailable
  4. Set 1 runner to Muscle
  5. Verify gate is still unavailable
  6. Set 2nd runner to Muscle
  7. Verify gate becomes available (if prerequisite nodes selected)
  8. Select gate
  9. Verify no effects applied
  10. Verify next nodes unlocked

**Test Case 2: RunnerStat Gate**
- Setup: Contract with gate requiring 8 total Hacker stat
- Steps:
  1. Load contract
  2. Set runner stats to Hacker: 2, 3, 0
  3. Verify gate is unavailable (5 < 8)
  4. Increase stats to Hacker: 3, 3, 3
  5. Verify gate becomes available (9 >= 8)
  6. Select gate
  7. Verify connected nodes available

**Test Case 3: Gate Color Exclusion**
- Setup: Contract with Red gate and effect that counts Red nodes
- Steps:
  1. Select normal Red node
  2. Verify effect sees 1 Red node
  3. Select Red gate node
  4. Verify effect still sees only 1 Red node (gate not counted)

**Test Case 4: Editor Round-trip**
- Setup: Editor with gate nodes
- Steps:
  1. Create gate in editor
  2. Set GateCondition
  3. Export CSV
  4. Close editor
  5. Import same CSV
  6. Verify gate properties preserved
  7. Verify rendering correct (rounded rectangle)

---

## Implementation Sequence

### Phase 1: Data Structure & Schema (Week 1)

**Priority 1: Core Data Structures**
- [ ] Add `gateCondition` property to node data structures
- [ ] Update VisualNode class in csvLoader.js
- [ ] Update node object structure in gameState.js
- [ ] Add GateCondition column to CSV schema

**Priority 2: Validation Infrastructure**
- [ ] Implement gate condition syntax validation function
- [ ] Add gate condition validation to csvLoader.js
- [ ] Add gate condition validation to fileManager.js (editor)

**Testing Checkpoint:**
- Unit tests for data structure extensions
- CSV parsing tests with GateCondition column

### Phase 2: Editor Implementation (Week 2)

**Priority 1: UI Changes**
- [ ] Add "Gate" option to Type dropdown
- [ ] Add GateCondition input field to properties panel
- [ ] Implement field visibility logic (show/hide based on Type)
- [ ] Add validation feedback UI

**Priority 2: Node Management**
- [ ] Update node creation to initialize gateCondition
- [ ] Implement gate node rendering (rounded rectangles)
- [ ] Update dimension calculation for gate nodes (effectDesc only)
- [ ] Implement gate-specific text rendering (no description)

**Priority 3: File Operations**
- [ ] Update CSV export to include GateCondition
- [ ] Update CSV import to parse GateCondition
- [ ] Add export validation for gate nodes
- [ ] Test round-trip (export then import)

**Testing Checkpoint:**
- Manual testing of gate creation in editor
- Visual validation of rounded rectangle rendering
- CSV export/import round-trip tests

### Phase 3: Game Logic Implementation (Week 3)

**Priority 1: Gate Condition Evaluation**
- [ ] Implement parseGateCondition() function
- [ ] Implement evaluateRunnerTypeGateCondition()
- [ ] Implement evaluateRunnerStatGateCondition()
- [ ] Integrate evaluation into evaluateGateCondition()

**Priority 2: Node Availability Logic**
- [ ] Update updateAvailableNodes() to handle gates
- [ ] Ensure gates check both connection AND condition
- [ ] Test gate availability with different runner configs

**Priority 3: Effect Exclusions**
- [ ] Update applyNodeEffects() to skip Gate nodes
- [ ] Update color counting to exclude Gate nodes
- [ ] Test that gate selections don't affect pools
- [ ] Test that gate colors aren't counted in effects

**Testing Checkpoint:**
- Unit tests for gate evaluation logic
- Integration tests for runner config changes
- Manual testing of gate unlock scenarios

### Phase 4: Visual Rendering (Week 4)

**Priority 1: Canvas Rendering**
- [ ] Implement renderGateNode() in visualPrototype.js
- [ ] Implement roundRect() helper function
- [ ] Update renderRegularNode() to detect and route gates
- [ ] Implement renderGateNodeText() (effectDesc only)

**Priority 2: Node Sizing**
- [ ] Update calculateOptimalNodeSize() for gates
- [ ] Test sizing with various text lengths
- [ ] Ensure consistency between editor and game

**Priority 3: Visual States**
- [ ] Test unavailable state rendering (desaturated)
- [ ] Test available state rendering (normal)
- [ ] Test selected state rendering (white border)

**Testing Checkpoint:**
- Visual comparison between editor and game rendering
- Screenshot tests for rounded rectangle appearance
- State transition visual tests

### Phase 5: Integration & Polish (Week 5)

**Priority 1: End-to-End Testing**
- [ ] Complete workflow test (editor → export → game)
- [ ] Test all gate condition types
- [ ] Test gate + normal node combinations
- [ ] Test complex contracts with multiple gates

**Priority 2: Error Handling**
- [ ] Test malformed gate conditions
- [ ] Test missing gate conditions
- [ ] Test invalid runner types/stats
- [ ] Ensure graceful degradation

**Priority 3: Documentation**
- [ ] Update CSV format documentation
- [ ] Create gate node usage guide
- [ ] Document gate condition syntax
- [ ] Add examples to documentation

**Testing Checkpoint:**
- Full regression testing
- Performance testing with many gates
- User acceptance testing

### Phase 6: Optional Enhancements (Future)

**Future Features (Not in Initial Implementation):**
- [ ] Visual tooltip showing gate requirements on hover
- [ ] Editor preview showing which gates would be active
- [ ] More gate condition types (e.g., money threshold, risk threshold)
- [ ] Complex gate conditions (AND/OR logic)
- [ ] Gate unlock animations
- [ ] Sound effects for gate unlocks

---

## Key Implementation Notes

### Critical Considerations

1. **Data Consistency:**
   - Gate nodes must always be Type="Gate"
   - GateCondition must be populated for all gates
   - Description should be empty for gates (only effectDesc used)
   - Effect 1 and Effect 2 should be empty for gates (ignored if present)

2. **Backward Compatibility:**
   - Existing contracts without GateCondition column must still load
   - Missing GateCondition column should not cause errors
   - Non-gate nodes should ignore GateCondition if present

3. **Performance:**
   - Gate evaluation happens on runner config changes
   - Gate evaluation happens after node selection
   - Should be efficient even with many gates (O(gates × runners))
   - Consider caching gate evaluation results

4. **Visual Consistency:**
   - Gate rendering must match between editor and game
   - Rounded rectangles should use same radius in both
   - Text sizing should be consistent between editor and game
   - Gate node colors should match color palette

5. **Color Exclusion:**
   - Gates have colors for visual organization
   - But gates must NOT be counted in NodeColor effects
   - This is critical for game balance
   - Must be explicitly checked in all color-counting code

### Development Best Practices

1. **Start with Schema:**
   - Implement and test CSV schema first
   - Validate gate condition parsing early
   - Ensure data structures are solid before UI

2. **Editor First Approach:**
   - Build editor support before game logic
   - Test export/import thoroughly
   - Validate round-trip data integrity

3. **Incremental Testing:**
   - Test each phase before moving to next
   - Use unit tests for logic components
   - Use manual tests for visual components
   - Don't skip validation testing

4. **Code Reuse:**
   - Use existing text rendering methods where possible
   - Leverage existing effect condition parsing patterns
   - Follow established code style and conventions

5. **Error Handling:**
   - Validate early and fail gracefully
   - Provide clear error messages
   - Log warnings for malformed data
   - Don't crash on bad input

---

## Conclusion

This technical specification provides a comprehensive blueprint for implementing Gate Nodes in the Johnson Prototype. The implementation follows these key principles:

1. **Minimal Disruption:** Gate nodes integrate into existing systems without requiring major refactoring
2. **Clear Separation:** Gate logic is separate from effect logic, avoiding confusion
3. **Visual Distinction:** Rounded rectangles clearly distinguish gates from regular nodes
4. **Data-Driven:** Gate conditions are defined in CSV, not hardcoded
5. **Extensible:** System supports future gate condition types
6. **Well-Tested:** Comprehensive testing strategy ensures quality

The phased implementation approach ensures that the feature can be built incrementally, with testing at each stage to catch issues early.

**Estimated Implementation Time:** 4-5 weeks for full implementation and testing
**Estimated Lines of Code:** ~800-1000 new/modified lines across all files

---

**Document End**
