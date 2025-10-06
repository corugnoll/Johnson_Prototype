# Visual Prototype Specification
## Johnson Prototype Game Development

---

## Executive Summary

The Visual Prototype phase implements essential node visualization capabilities to enable user evaluation of the core Johnson Prototype game concept. This intermediate step extracts critical components from MS1B and MS1C to deliver a functional visual representation of contract data without the complexity of full optimization systems.

**Key Deliverable:** A working canvas-based visualization that renders contract nodes with connections, enabling user evaluation of the perk tree concept and game mechanics.

---

## Scope and Objectives

### Primary Objectives
1. **Visual Node Representation** - Render contract data as colored nodes on canvas
2. **Connection Visualization** - Display relationships between nodes with connection lines
3. **Basic Interaction** - Enable node selection and visual state changes
4. **Concept Validation** - Provide sufficient functionality for user evaluation

### Success Criteria
- Contract_Example1.csv displays as visual node tree
- All 6 node colors render correctly with proper styling
- Connection lines show relationships clearly
- Node clicking changes visual states (available → selected)
- User can evaluate whether the perk tree concept feels engaging
- Performance adequate for example contracts (under 2 seconds total render)

---

## Technical Requirements

### Data Structure Requirements (Minimal MS1B Components)
```javascript
// Enhanced but simplified data structures
class VisualContractData {
    constructor(csvData) {
        this.nodes = new Map();           // NodeID → VisualNode
        this.connections = new Map();     // NodeID → Set<NodeID>
        this.layers = new Map();          // Layer → VisualNode[]
        this.metadata = {
            nodeCount: 0,
            connectionCount: 0,
            loadTime: 0
        };
    }
}

class VisualNode {
    constructor(csvRow) {
        // Core properties from CSV
        this.id = csvRow['Node ID'];
        this.description = csvRow['Description'];
        this.color = csvRow['Color'];
        this.layer = parseInt(csvRow['Layer']);
        this.slot = parseInt(csvRow['Slot']);

        // Visual properties
        this.state = 'available';         // available, selected, unavailable
        this.position = null;             // Set by layout algorithm
        this.connections = new Set();     // Connected node IDs
    }
}
```

### Canvas Rendering Requirements (Essential MS1C Components)
```javascript
// Simplified rendering system
class VisualPrototypeRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.nodeColors = {
            'Red': '#FF6467',
            'Yellow': '#FFDF20',
            'Green': '#4ADE80',
            'Blue': '#51A2FF',
            'Purple': '#8B5CF6',
            'Orange': '#FB923C'
        };
    }
}
```

---

## Implementation Tasks

### TASK #VP1: Enhanced Data Processing
**PRIORITY:** Critical
**OBJECTIVE:** Extend existing CSV loading to create visualization-ready data structures

**TECHNICAL REQUIREMENTS:**
- Enhance csvLoader.js to create VisualContractData objects
- Parse connection data from ConnectionsIn column format
- Create node-to-node relationship mapping
- Basic validation for required fields only

**ACCEPTANCE CRITERIA:**
- [ ] CSV loading creates VisualContractData structure
- [ ] All nodes from Contract_Example1.csv load correctly
- [ ] Connection parsing handles comma-separated node IDs
- [ ] Data structure supports efficient rendering queries
- [ ] Loading completes without errors for example contract

**DEPENDENCIES:** MS1A CSV loading system
**ESTIMATED EFFORT:** 0.5 days

### TASK #VP2: Basic Node Rendering System
**PRIORITY:** Critical
**OBJECTIVE:** Implement canvas-based node visualization with all required colors

**TECHNICAL REQUIREMENTS:**
- Canvas-based rectangle rendering for nodes
- Support for all 6 specified colors with exact hex values
- Text rendering for node descriptions (single line, clipped if needed)
- Basic layout algorithm using layer/slot positioning
- Visual state support (available, selected with yellow border)

**ACCEPTANCE CRITERIA:**
- [ ] All 6 node colors render with correct hex values
- [ ] Nodes display as rectangles with proper proportions
- [ ] Node descriptions render as readable text
- [ ] Layer/slot positioning prevents overlapping
- [ ] Selected state shows distinctive yellow border
- [ ] Canvas clears and redraws properly

**DEPENDENCIES:** Task #VP1 (Enhanced Data Processing)
**ESTIMATED EFFORT:** 1 day

### TASK #VP3: Connection Line System
**PRIORITY:** High
**OBJECTIVE:** Draw connection lines between related nodes

**TECHNICAL REQUIREMENTS:**
- Simple line rendering between connected nodes
- Connection endpoints calculated on node boundaries
- Basic routing (straight lines initially, can enhance later)
- Consistent visual styling (2px width, #666666 color)
- Performance adequate for example contract complexity

**ACCEPTANCE CRITERIA:**
- [ ] Connection lines draw between correct node pairs
- [ ] Lines start and end at appropriate node boundaries
- [ ] Visual styling matches specification
- [ ] Lines render clearly without overlap conflicts
- [ ] Connection data parsing handles all relationship types
- [ ] Performance remains responsive for example contract

**DEPENDENCIES:** Task #VP2 (Basic Node Rendering)
**ESTIMATED EFFORT:** 0.5 days

### TASK #VP4: Interactive Node Selection
**PRIORITY:** Medium
**OBJECTIVE:** Enable basic interaction for concept evaluation

**TECHNICAL REQUIREMENTS:**
- Click detection on canvas nodes
- Visual state transitions (available ↔ selected)
- Mouse cursor feedback (pointer on hover)
- Basic state management for selected nodes
- Integration with existing UI state system

**ACCEPTANCE CRITERIA:**
- [ ] Clicking nodes changes visual state correctly
- [ ] Mouse cursor changes to pointer over nodes
- [ ] Multiple nodes can be selected simultaneously
- [ ] Visual feedback is immediate and clear
- [ ] State changes integrate with game state system
- [ ] Click detection is accurate for all node sizes

**DEPENDENCIES:** Task #VP3 (Connection Line System)
**ESTIMATED EFFORT:** 0.5 days

---

## Technical Architecture

### File Structure
```
Johnson_Prototype/js/
├── main.js                    # Application coordination (existing)
├── csvLoader.js              # Enhanced with VisualContractData (modify)
├── visualPrototype.js        # NEW: Core rendering and interaction
├── gameState.js              # Enhanced with visual state management (modify)
└── ui.js                     # Enhanced with canvas integration (modify)
```

### Module Dependencies
```
main.js → csvLoader.js → visualPrototype.js → gameState.js → ui.js
```

### Integration Points
- **Canvas Element:** Use existing canvas from MS1A layout
- **CSV Loading:** Enhance existing csvLoader.js functionality
- **State Management:** Extend gameState.js with visual state tracking
- **UI Updates:** Integrate canvas rendering with existing UI patterns

---

## Detailed Implementation Specifications

### Enhanced CSV Data Processing
```javascript
// csvLoader.js modifications
class CSVLoader {
    // Existing methods...

    createVisualContractData(parsedCSV) {
        const contractData = new VisualContractData();

        parsedCSV.forEach(row => {
            const node = new VisualNode(row);
            contractData.nodes.set(node.id, node);

            // Parse connections
            if (row['Connections']) {
                const connections = this.parseConnections(row['Connections']);
                contractData.connections.set(node.id, new Set(connections));
            }

            // Organize by layers
            if (!contractData.layers.has(node.layer)) {
                contractData.layers.set(node.layer, []);
            }
            contractData.layers.get(node.layer).push(node);
        });

        return contractData;
    }

    parseConnections(connectionsString) {
        if (!connectionsString || connectionsString.trim() === '') return [];
        return connectionsString.split(',').map(id => id.trim());
    }
}
```

### Visual Prototype Renderer
```javascript
// visualPrototype.js - NEW FILE
class VisualPrototypeRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.contractData = null;
        this.nodePositions = new Map();

        // Visual configuration
        this.nodeSize = { width: 120, height: 60 };
        this.nodeSpacing = { horizontal: 140, vertical: 80 };
        this.colors = {
            'Red': '#FF6467',
            'Yellow': '#FFDF20',
            'Green': '#4ADE80',
            'Blue': '#51A2FF',
            'Purple': '#8B5CF6',
            'Orange': '#FB923C'
        };

        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Basic canvas setup for prototype
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '12px Arial';
    }

    loadContract(contractData) {
        this.contractData = contractData;
        this.calculateLayout();
        this.render();
    }

    calculateLayout() {
        // Simple layer/slot based positioning
        const layers = Array.from(this.contractData.layers.keys()).sort((a, b) => a - b);

        layers.forEach((layerNum, layerIndex) => {
            const layerNodes = this.contractData.layers.get(layerNum);
            const y = 50 + (layerIndex * this.nodeSpacing.vertical);

            layerNodes.forEach((node, nodeIndex) => {
                const x = 50 + (nodeIndex * this.nodeSpacing.horizontal);

                this.nodePositions.set(node.id, {
                    x: x,
                    y: y,
                    width: this.nodeSize.width,
                    height: this.nodeSize.height
                });

                node.position = { x, y };
            });
        });
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render connections first (so they appear behind nodes)
        this.renderConnections();

        // Render nodes
        this.renderNodes();
    }

    renderNodes() {
        this.contractData.nodes.forEach(node => {
            this.renderNode(node);
        });
    }

    renderNode(node) {
        const pos = this.nodePositions.get(node.id);
        if (!pos) return;

        const color = this.colors[node.color] || '#CCCCCC';

        // Apply state styling
        if (node.state === 'selected') {
            this.ctx.strokeStyle = '#FFDF20';
            this.ctx.lineWidth = 3;
        } else {
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 1;
        }

        // Draw node rectangle
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Draw text
        this.ctx.fillStyle = '#000000';
        const text = this.truncateText(node.description, pos.width - 10);
        this.ctx.fillText(text, pos.x + pos.width/2, pos.y + pos.height/2);
    }

    renderConnections() {
        this.contractData.connections.forEach((targets, sourceId) => {
            targets.forEach(targetId => {
                this.renderConnection(sourceId, targetId);
            });
        });
    }

    renderConnection(fromId, toId) {
        const fromPos = this.nodePositions.get(fromId);
        const toPos = this.nodePositions.get(toId);

        if (!fromPos || !toPos) return;

        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;

        // Simple straight line connection
        this.ctx.beginPath();
        this.ctx.moveTo(fromPos.x + fromPos.width, fromPos.y + fromPos.height/2);
        this.ctx.lineTo(toPos.x, toPos.y + toPos.height/2);
        this.ctx.stroke();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });

        this.canvas.addEventListener('mousemove', (event) => {
            this.handleCanvasHover(event);
        });
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedNode = this.getNodeAtPosition(x, y);
        if (clickedNode) {
            this.toggleNodeSelection(clickedNode);
            this.render();
        }
    }

    getNodeAtPosition(x, y) {
        for (let [nodeId, pos] of this.nodePositions) {
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                return this.contractData.nodes.get(nodeId);
            }
        }
        return null;
    }

    toggleNodeSelection(node) {
        node.state = node.state === 'selected' ? 'available' : 'selected';
    }

    truncateText(text, maxWidth) {
        // Simple text truncation for prototype
        if (text.length <= 15) return text;
        return text.substring(0, 12) + '...';
    }
}
```

### Integration with Existing Systems
```javascript
// main.js modifications
class JohnsonApp {
    constructor() {
        // Existing initialization...
        this.visualRenderer = new VisualPrototypeRenderer(
            document.getElementById('game-canvas')
        );
    }

    handleFileLoaded(contractData) {
        // Existing file loading logic...

        // NEW: Load visual representation
        if (this.visualRenderer && contractData) {
            this.visualRenderer.loadContract(contractData);
        }
    }
}
```

---

## Testing and Validation

### Functional Testing Checklist
- [ ] Contract_Example1.csv loads and displays as node tree
- [ ] All 6 node colors display with correct hex values
- [ ] Node descriptions are readable and properly positioned
- [ ] Connection lines draw between correct node pairs
- [ ] Clicking nodes changes visual state (available ↔ selected)
- [ ] Multiple nodes can be selected simultaneously
- [ ] Canvas rendering performance is acceptable

### Visual Quality Testing
- [ ] Node colors match specification exactly
- [ ] Text is readable and well-positioned
- [ ] Connection lines are clean and clear
- [ ] Selected state is visually distinctive
- [ ] Layout prevents node overlapping
- [ ] Overall appearance is professional

### User Evaluation Criteria
- [ ] Perk tree concept is visually understandable
- [ ] Node relationships are clear through connections
- [ ] Interaction feels responsive and intuitive
- [ ] User can assess game concept appeal
- [ ] Visual representation communicates cyberpunk theme appropriately

---

## Performance Requirements

### Rendering Performance Targets
- **Initial Render:** Under 2 seconds for Contract_Example1.csv
- **Interaction Response:** Under 100ms for node selection
- **Canvas Updates:** Under 500ms for full redraw
- **Memory Usage:** Stable during extended interaction

### Optimization Strategy (Minimal for Prototype)
- Use efficient canvas clearing and redrawing
- Cache node positions after layout calculation
- Minimize text measurement operations
- Simple event handling without complex optimizations

---

## Definition of Done

### Functional Criteria
- [ ] Visual prototype renders Contract_Example1.csv as interactive node tree
- [ ] All core visual elements display correctly (nodes, connections, text)
- [ ] Basic interaction works (node selection with visual feedback)
- [ ] Performance adequate for user evaluation
- [ ] No console errors during normal operation

### User Experience Criteria
- [ ] Interface provides sufficient functionality for concept evaluation
- [ ] Visual representation clearly communicates perk tree structure
- [ ] Interaction feels intuitive and responsive
- [ ] User can make informed decisions about game concept direction

### Code Quality Criteria
- [ ] Implementation builds cleanly on MS1A foundation
- [ ] Code structure supports future enhancement to full MS1B/MS1C
- [ ] Basic error handling prevents crashes
- [ ] Integration points clearly defined for next development phase

---

## Transition Strategy

### If Concept Validates
Upon successful user evaluation:
1. Proceed with full MS1B data pipeline implementation
2. Enhance rendering system to full MS1C specification
3. Continue with MS1D game logic engine
4. Refactor prototype code into production architecture

### If Adjustments Needed
Based on user feedback:
1. Modify visual representation approach
2. Adjust data structures as needed
3. Revise game concept based on evaluation
4. Update full milestone specifications accordingly

### Technical Debt Management
- Document prototype shortcuts and temporary implementations
- Plan refactoring strategy for production code
- Maintain clean integration points for future enhancement
- Preserve user feedback insights for design decisions

---

## Risk Assessment

### Technical Risks
1. **Integration Complexity** - Risk: Low, builds on existing MS1A foundation
2. **Performance Issues** - Risk: Low, simple example contracts only
3. **Visual Quality** - Risk: Medium, basic implementation may lack polish

### User Experience Risks
1. **Incomplete Feature Set** - Risk: High, but expected for prototype
2. **Concept Validation Failure** - Risk: Medium, but valuable learning opportunity
3. **Technical Limitations** - Risk: Low, prototype scope is achievable

### Mitigation Strategies
- Clearly communicate prototype limitations to user
- Focus on core concept validation over feature completeness
- Plan enhancement path based on evaluation results
- Maintain flexibility for concept adjustments

This specification provides a clear roadmap for implementing essential visualization capabilities that enable meaningful user evaluation of the Johnson Prototype game concept while maintaining a path toward full production implementation.