# Johnson Contract Editor - Technical Implementation Specification

## Overview
This document provides detailed technical specifications for implementing the Johnson Contract Editor - a standalone browser-based tool for creating and editing contract perk trees that integrates with the main Johnson Prototype game.

## Project Structure

### New Files to Create
```
├── editor.html                           # Main editor application
├── css/
│   └── editor-styles.css                 # Editor-specific styles
├── js/editor/
│   ├── editorCanvas.js                   # Canvas management and rendering
│   ├── nodeManager.js                    # Node creation, editing, positioning
│   ├── connectionManager.js              # Connection line drawing and routing
│   ├── fileManager.js                    # CSV import/export functionality
│   └── editorMain.js                     # Main editor application logic
└── documentation/
    └── Johnson_Editor_Technical_Spec.md  # This document
```

### Files to Modify
```
├── js/
│   ├── nodeRenderer.js                   # Update for free positioning support
│   ├── csvLoader.js                      # Update for new CSV format with X,Y coords
│   └── gameState.js                      # Minor updates for position data handling
```

## Data Format Specifications

### CSV Format (Position Based)
```
Node ID, Description, Effect Desc, Effect 1, Effect 2, Type, Color, X, Y, Connections
```

### Format Notes
- Editor exports exclusively in X,Y coordinate format
- Main game will be updated to use only the new positioning system
- All existing contracts will need to be recreated or manually converted using the editor

## Editor Application Architecture

### 1. Canvas System (`editorCanvas.js`)

#### Canvas Configuration
- **Default Size**: 1200x800px (larger than main game canvas)
- **Resizable**: User can adjust dimensions via toolbar controls
- **Maximum Size**: 3000x2000px to handle ~100 nodes
- **Zoom and Pan**: Essential navigation for large contracts
  - Zoom range: 25% to 200%
  - Mouse wheel zoom, pan with middle-click drag
  - Zoom controls in toolbar
- **Grid System**: Fine grid (10-15px squares) for precise positioning
- **Grid Features**:
  - Visual grid overlay (toggleable)
  - Snap-to-grid functionality (toggleable)
  - Grid size adjustable (5-50px range)

#### Canvas Methods Required
```javascript
class EditorCanvas {
    constructor(canvasId, initialWidth, initialHeight)

    // Grid management
    setGridSize(size)
    toggleGridVisibility()
    toggleSnapToGrid()
    drawGrid()
    snapToGrid(x, y)

    // Canvas management
    resizeCanvas(width, height)
    clearCanvas()
    getCanvasCoordinates(event)

    // Zoom and pan
    setZoom(zoomLevel)
    panCanvas(deltaX, deltaY)
    zoomToFit()
    resetView()

    // Rendering
    render()
    redrawConnections()
}
```

### 2. Node Management (`nodeManager.js`)

#### Node Data Structure
```javascript
const node = {
    id: "string",           // Unique identifier
    description: "string",  // Node description text
    effectDesc: "string",   // Effect description
    effect1: "string",      // Effect 1 (Condition;Operator;Amount;Stat)
    effect2: "string",      // Effect 2 (Condition;Operator;Amount;Stat)
    type: "string",         // Normal, Synergy, Special
    color: "string",        // Red, Yellow, Green, Blue, Purple, Grey
    x: number,              // X coordinate
    y: number,              // Y coordinate
    connections: array,     // Array of connected node IDs
    selected: boolean,      // Selection state
    width: number,          // Calculated based on text content
    height: number          // Calculated based on text content
}
```

#### Node Color Mapping
```javascript
const nodeColors = {
    Red: "#FF6467",
    Yellow: "#FFDF20",
    Green: "#4CAF50",
    Blue: "#51A2FF",
    Purple: "#9C27B0",
    Grey: "#757575"
}
```

#### Node Manager Methods
```javascript
class NodeManager {
    constructor(canvas, gridSize)

    // Node operations
    createNode(x, y)
    deleteNode(nodeId)
    selectNode(nodeId)
    clearSelection()
    moveNode(nodeId, newX, newY)

    // Node editing
    updateNodeProperty(nodeId, property, value)
    calculateNodeDimensions(node)

    // Node rendering
    drawNode(node, ctx)
    drawSelectedNode(node, ctx)

    // Hit detection
    getNodeAt(x, y)
    isPointInNode(x, y, node)

    // Data management
    getAllNodes()
    setAllNodes(nodeArray)
    validateNode(node)
}
```

#### Node Rendering Specifications
- **Variable Size**: Nodes adjust size based on text content
- **Minimum Size**: 80x60px
- **Text Wrapping**: Description text wraps within node bounds
- **Visual States**:
  - Normal: Standard node color with border
  - Selected: Highlighted border (2px white outline)
  - Hover: Subtle highlight effect

### 3. Connection Management (`connectionManager.js`)

#### Connection Routing Algorithm
- **Line Style**: Straight lines with 90° angles only
- **Automatic Routing**: Calculate optimal path between nodes
- **Anchor Points**: Connections attach to node edges (top, bottom, left, right)
- **Path Finding**: Use A* or similar algorithm for optimal routing
- **Collision Avoidance**: Route around other nodes when possible

#### Connection Manager Methods
```javascript
class ConnectionManager {
    constructor(nodeManager, canvas)

    // Connection operations
    buildAllConnections()
    drawConnection(fromNode, toNode, ctx)
    calculateConnectionPath(fromNode, toNode)

    // Path calculation
    findBestAnchorPoints(node1, node2)
    calculateStraightPath(start, end)
    calculateRightAnglePath(start, end)

    // Rendering
    drawConnectionLine(path, ctx, style)
    drawConnectionArrow(endPoint, ctx)

    // Validation
    validateConnections(nodes)
    removeInvalidConnections()
}
```

#### Connection Visual Specifications
- **Line Color**: #FFFFFF (white)
- **Line Width**: 2px
- **Line Style**: Solid
- **Arrow Heads**: Small triangular arrows at target nodes
- **Hover Effect**: Highlight connection line when hovered

### 4. File Management (`fileManager.js`)

#### CSV Export Format
```javascript
const csvHeader = "Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,X,Y,Connections"

function exportToCSV(nodes) {
    // Convert nodes array to CSV format
    // Handle text escaping (quotes, commas, newlines)
    // Return downloadable blob
}
```

#### CSV Import Processing
```javascript
function importFromCSV(csvContent) {
    // Parse CSV using Papa Parse
    // Validate data format
    // Convert to node objects
    // Handle position data (X,Y coordinates)
    // Return nodes array or error
}
```

#### File Manager Methods
```javascript
class FileManager {
    constructor(nodeManager, connectionManager)

    // Export operations
    exportContract(filename)
    generateCSVContent(nodes)
    downloadFile(content, filename, mimeType)

    // Import operations
    importContract(file)
    parseCSVContent(csvContent)
    validateImportData(data)

    // Data validation
    validateCSVFormat(headers)
    validateNodeData(nodeData)

    // Error handling
    showImportError(message)
    showExportSuccess(filename)
}
```

### 5. Main Editor Logic (`editorMain.js`)

#### Application Initialization
```javascript
class EditorMain {
    constructor()

    // Initialization
    initializeComponents()
    setupEventListeners()
    setupKeyboardShortcuts()

    // Event handling
    handleCanvasClick(event)
    handleCanvasMouseMove(event)
    handleCanvasDrag(event)
    handleMouseWheel(event)
    handleKeyPress(event)

    // UI state management
    updatePropertiesPanel(selectedNode)
    updateToolbarState()
    showMessage(message, type)

    // Application state
    saveEditorState()
    loadEditorState()
}
```

#### Event Handling Specifications

**Mouse Events**:
- Single Click: Select node (properties panel updates automatically)
- Drag: Move selected node
- Right Click: Context menu (future enhancement)

**Keyboard Shortcuts**:
- Delete: Remove selected node
- Ctrl+Z: Undo (future enhancement)
- Ctrl+S: Save/Export
- Ctrl+O: Open/Import
- Ctrl+N: New contract

## User Interface Specifications

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Toolbar (File Controls | Canvas Controls)                   │
├─────────────────────────────────────────────┬───────────────┤
│                                            │               │
│              Canvas Area                   │  Properties   │
│            (Primary Focus)                 │     Panel     │
│                                            │  (Narrow)     │
│  ┌─────────────────┐                       │               │
│  │ Creation Panel  │                       │ - Node Editor │
│  └─────────────────┘                       │ - Position    │
│                                            │ - Actions     │
└─────────────────────────────────────────────┴───────────────┘
```

**Layout Proportions**:
- Canvas Area: ~75% of available width
- Properties Panel: ~25% of available width
- Toolbar: Fixed height across full width

### CSS Framework (`editor-styles.css`)

#### Design System
- **Color Scheme**: Inherit from main game (cyberpunk theme)
- **Typography**: Same font family as main game
- **Spacing**: Consistent with main game grid system
- **Components**: Buttons, inputs, panels styled consistently

#### Key CSS Classes
```css
.editor-container {
    /* Main grid layout with 75/25 split */
    display: grid;
    grid-template-columns: 3fr 1fr;
}
.toolbar { /* Top toolbar styling */ }
.canvas-container { /* Canvas area with scrolling */ }
.properties-panel { /* Right sidebar panel */ }
.creation-panel { /* Node creation tools */ }
.btn-primary, .btn-secondary, .btn-danger { /* Button styles */ }
.property-group { /* Form group styling */ }
.node-editor { /* Properties form styling */ }
```

## Integration with Main Game

### Required Changes to Main Game

#### 1. Update `nodeRenderer.js`
```javascript
// Replace layer/slot system with direct X,Y positioning
function drawNodeAtPosition(node, ctx) {
    // Use node.x and node.y directly for positioning
    const x = node.x;
    const y = node.y;
    // Draw node at exact coordinates
}

// Remove all layer/slot calculation logic
function calculateNodePosition(node) {
    return { x: node.x, y: node.y };
}
```

#### 2. Update `csvLoader.js`
```javascript
// Parse new CSV format with X,Y coordinates
function parseContractData(csvData) {
    // Expect X,Y columns in CSV
    // Validate required columns are present
    // Parse position data as numbers
}

function validateCSVFormat(headers) {
    const requiredColumns = ['Node ID', 'X', 'Y', 'Connections'];
    return requiredColumns.every(col => headers.includes(col));
}
```

#### 3. Update `gameState.js`
```javascript
// Update to handle position data
function updateNodePositions(nodes) {
    // Ensure X,Y position data is preserved during game state updates
    // Remove any layer/slot related code
}
```

### Data Migration Notes
- **Clean Break**: No backward compatibility with Layer/Slot format
- **Contract Recreation**: Existing contracts must be recreated using the editor
- **Simplified Codebase**: Removes all Layer/Slot calculation complexity

## Development Phases

### Phase 1: Core Editor Foundation (Week 1-2)
1. Create `editor.html` with complete UI structure (75/25 layout split)
2. Implement `editorCanvas.js` with grid system, resizing, zoom and pan
3. Build `nodeManager.js` with basic node operations
4. Style with `editor-styles.css`

### Phase 2: Interactive Features (Week 3-4)
1. Complete `nodeManager.js` with drag-drop and editing
2. Implement `connectionManager.js` with automatic routing
3. Add `editorMain.js` with event handling
4. Integrate all components

### Phase 3: File Operations (Week 5)
1. Implement `fileManager.js` with CSV export/import
2. Add data validation and error handling
3. Test with existing contract files

### Phase 4: Main Game Integration (Week 6)
1. Update main game files for position support
2. Test integration between editor and game
3. Performance optimization
4. Final polish and bug fixes

## Testing Requirements

### Editor Testing
- [ ] Node creation and editing functionality
- [ ] Drag and drop positioning with grid snapping
- [ ] Connection line automatic routing
- [ ] CSV export produces valid format
- [ ] CSV import handles various formats correctly
- [ ] Canvas resizing works properly
- [ ] UI responsiveness and accessibility

### Integration Testing
- [ ] Main game loads editor-exported contracts
- [ ] Position data displays correctly in main game
- [ ] Only new X,Y format contracts are supported
- [ ] Data integrity maintained through export/import cycle
- [ ] Performance acceptable with ~100 nodes

### Browser Compatibility
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+

## Performance Considerations

### Canvas Optimization
- **Efficient Rendering**: Only redraw when necessary
- **Viewport Culling**: Only render visible nodes
- **Connection Caching**: Cache connection paths when nodes don't move
- **Event Throttling**: Throttle mouse move events during drag

### Memory Management
- **Node Cleanup**: Properly dispose of deleted nodes
- **Event Cleanup**: Remove event listeners when not needed
- **Large File Handling**: Stream processing for large CSV files

## Error Handling

### User-Facing Errors
- Invalid CSV format during import
- Duplicate node IDs
- Invalid effect syntax
- Canvas size limitations exceeded
- File save/load failures

### Developer Error Handling
- Graceful degradation for missing features
- Console logging for debugging
- Error boundaries for JavaScript exceptions
- Validation at data entry points

## Future Enhancements

### Phase 2 Features (Post-MVP)
- Undo/Redo functionality
- Copy/Paste nodes
- Multi-select operations
- Version control integration
- Advanced keyboard shortcuts
- Performance optimizations for very large contracts

---

**Implementation Priority**: Start with Phase 1 core foundation, ensuring solid canvas and node management before adding advanced features. Focus on data integrity and compatibility with existing contracts throughout development.