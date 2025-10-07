/**
 * Johnson Contract Editor - Node Management System
 * Handles node creation, editing, positioning, rendering, and interactions
 */

class NodeManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.nodes = [];
        this.selectedNode = null;
        this.nextNodeId = 1;
        this.connectionManager = null; // Will be set by editorMain

        // Node appearance settings
        this.minWidth = 80;
        this.minHeight = 60;
        this.padding = 8;
        this.borderWidth = 2;

        // Node colors mapping
        this.nodeColors = {
            Red: "#FF6467",
            Yellow: "#FFDF20",
            Green: "#4CAF50",
            Blue: "#51A2FF",
            Purple: "#9C27B0",
            Grey: "#757575"
        };

        // Currently selected color for new nodes
        this.selectedColor = 'Red';

        // Set up event listeners
        this.setupEventListeners();

        console.log('NodeManager initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for canvas render events to draw nodes
        window.addEventListener('canvasRendered', (e) => {
            this.renderAllNodes();
        });
    }

    /**
     * Create a new node at the specified coordinates
     */
    createNode(x, y) {
        // Snap to grid if enabled
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

        // Calculate proper dimensions based on content
        const dimensions = TextUtils.calculateNodeDimensions(node);
        node.width = dimensions.width;
        node.height = dimensions.height;

        this.nodes.push(node);
        this.nextNodeId++;

        console.log('Created node:', node.id, 'at', coords.x, coords.y);

        // Update node count display
        this.updateNodeCount();

        // Trigger canvas re-render
        this.canvas.render();

        return node;
    }

    /**
     * Delete a node by ID
     */
    deleteNode(nodeId) {
        const index = this.nodes.findIndex(node => node.id === nodeId);
        if (index === -1) return false;

        const node = this.nodes[index];

        // Remove connections to this node from other nodes
        this.nodes.forEach(otherNode => {
            otherNode.connections = otherNode.connections.filter(connId => connId !== nodeId);
        });

        // Remove the node
        this.nodes.splice(index, 1);

        // Clear selection if this node was selected
        if (this.selectedNode && this.selectedNode.id === nodeId) {
            this.clearSelection();
        }

        console.log('Deleted node:', nodeId);

        // Update displays
        this.updateNodeCount();
        this.canvas.render();

        return true;
    }

    /**
     * Select a node by ID
     */
    selectNode(nodeId) {
        // Clear previous selection
        this.clearSelection();

        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return false;

        node.selected = true;
        this.selectedNode = node;

        console.log('Selected node:', nodeId);

        // Update properties panel
        this.updatePropertiesPanel(node);

        // Trigger re-render
        this.canvas.render();

        return true;
    }

    /**
     * Clear node selection
     */
    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.selected = false;
            this.selectedNode = null;
        }

        // Hide properties panel
        this.hidePropertiesPanel();

        // Trigger re-render
        this.canvas.render();
    }

    /**
     * Move a node to new coordinates
     */
    moveNode(nodeId, newX, newY) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return false;

        // Snap to grid if enabled
        const coords = this.canvas.snapToGridCoords(newX, newY);

        node.x = coords.x;
        node.y = coords.y;

        // Update position display if this node is selected
        if (this.selectedNode && this.selectedNode.id === nodeId) {
            const xInput = document.getElementById('nodeX');
            const yInput = document.getElementById('nodeY');
            if (xInput) xInput.value = coords.x;
            if (yInput) yInput.value = coords.y;
        }

        // Update connection paths if connections exist
        if (this.connectionManager) {
            this.connectionManager.updateConnectionPaths();
        }

        this.canvas.render();
        return true;
    }

    /**
     * Set the connection manager reference
     */
    setConnectionManager(connectionManager) {
        this.connectionManager = connectionManager;
    }

    /**
     * Update a node property
     */
    updateNodeProperty(nodeId, property, value) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return false;

        const oldValue = node[property];
        node[property] = value;

        // Handle special cases
        if (property === 'description' || property === 'effectDesc') {
            const dimensions = TextUtils.calculateNodeDimensions(node);
        node.width = dimensions.width;
        node.height = dimensions.height;
        } else if (property === 'connections') {
            // Parse connections string into array
            if (typeof value === 'string') {
                node.connections = value.split(',').map(s => s.trim()).filter(s => s);
            }
        }

        console.log('Updated node', nodeId, property, 'from', oldValue, 'to', value);

        this.canvas.render();
        return true;
    }

    // Text processing methods removed - now using shared TextUtils utility (js/utils/textUtils.js)

    /**
     * Draw a single node with main game layout structure
     */
    drawNode(node, ctx) {
        ctx.save();

        // Get node color
        const color = this.nodeColors[node.color] || this.nodeColors.Grey;

        // Choose drawing method based on node type
        if (node.type === 'Gate') {
            this.drawGateNode(node, ctx, color);
        } else {
            this.drawRegularNode(node, ctx, color);
        }

        ctx.restore();
    }

    /**
     * Draw gate node with rounded rectangle
     */
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

    /**
     * Draw regular node (existing logic)
     */
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

    /**
     * Draw rounded rectangle helper
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
     * Render gate node text (only effectDesc, centered)
     */
    renderGateNodeText(node, pos, ctx) {
        const padding = 6;
        const availableWidth = pos.width - (padding * 2);
        const fontSize = 12;
        const lineHeight = 16;

        // Process effect description text with linebreak support
        const effectText = TextUtils.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, fontSize);

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

    /**
     * Render node text with description and effect description (matches main game)
     */
    renderNodeText(node, pos, ctx) {
        const padding = 6;
        const availableWidth = pos.width - (padding * 2);

        // Process text with linebreak support
        const descriptionText = TextUtils.processTextWithLinebreaks(node.description || '', availableWidth, ctx, 14);
        const effectText = TextUtils.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, 12);

        // Font configuration matching main game
        const primaryFontSize = 14;
        const secondaryFontSize = 12;
        const lineHeight = 16;
        const separatorHeight = 4;

        // Calculate total text height needed
        const descLines = descriptionText.length;
        const effectLines = effectText.length;
        const hasEffect = effectText.length > 0 && effectText[0].trim() !== '';

        const totalTextHeight = (descLines * lineHeight) +
                               (hasEffect ? separatorHeight + (effectLines * lineHeight) : 0);

        // Center the text block vertically
        const startY = pos.y + (pos.height - totalTextHeight) / 2;

        // Render description text (primary)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${primaryFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        let currentY = startY;
        descriptionText.forEach((line, index) => {
            ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
        });
        currentY += descLines * lineHeight;

        // Render separator and effect text if available
        if (hasEffect) {
            // Render visual separator (horizontal line)
            const separatorY = currentY + separatorHeight/2;
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pos.x + padding + 8, separatorY);
            ctx.lineTo(pos.x + pos.width - padding - 8, separatorY);
            ctx.stroke();

            // Render effect description text (secondary)
            ctx.fillStyle = '#E0E0E0';
            ctx.font = `${secondaryFontSize}px Arial`;
            currentY += separatorHeight;

            effectText.forEach((line, index) => {
                ctx.fillText(line, pos.x + pos.width/2, currentY + (index * lineHeight));
            });
        }
    }


    /**
     * Get contrasting text color for background
     */
    getContrastColor(backgroundColor, alpha = 1) {
        // Convert hex to RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black or white based on luminance
        const color = luminance > 0.5 ? '#000000' : '#FFFFFF';
        return alpha < 1 ? color + Math.floor(alpha * 255).toString(16).padStart(2, '0') : color;
    }

    /**
     * Render all nodes on the canvas
     */
    renderAllNodes() {
        const ctx = this.canvas.ctx;
        ctx.save();

        // Apply transformations for zoom/pan
        ctx.scale(this.canvas.zoom, this.canvas.zoom);
        ctx.translate(this.canvas.panX / this.canvas.zoom, this.canvas.panY / this.canvas.zoom);

        // Get visible bounds for optimization
        const bounds = this.canvas.getVisibleBounds();

        // Draw connections first (behind nodes)
        if (this.connectionManager) {
            this.connectionManager.renderAllConnections();
        }

        // Draw only visible nodes on top of connections
        this.nodes.forEach(node => {
            if (this.isNodeVisible(node, bounds)) {
                this.drawNode(node, ctx);
            }
        });

        ctx.restore();
    }

    /**
     * Check if a node is visible in the current viewport
     */
    isNodeVisible(node, bounds) {
        return !(node.x + node.width < bounds.left ||
                 node.x > bounds.right ||
                 node.y + node.height < bounds.top ||
                 node.y > bounds.bottom);
    }

    /**
     * Get node at specified canvas coordinates
     */
    getNodeAt(x, y) {
        // Check nodes in reverse order (top to bottom in z-order)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (this.isPointInNode(x, y, this.nodes[i])) {
                return this.nodes[i];
            }
        }
        return null;
    }

    /**
     * Check if a point is inside a node
     */
    isPointInNode(x, y, node) {
        return x >= node.x && x <= node.x + node.width &&
               y >= node.y && y <= node.y + node.height;
    }

    /**
     * Get all nodes
     */
    getAllNodes() {
        return [...this.nodes];
    }

    /**
     * Set all nodes (for loading)
     */
    setAllNodes(nodeArray) {
        this.nodes = [...nodeArray];
        this.clearSelection();
        this.updateNodeCount();

        // Find highest node ID for next ID generation
        let maxId = 0;
        this.nodes.forEach(node => {
            const idNum = parseInt(node.id.replace(/\D/g, ''));
            if (idNum > maxId) maxId = idNum;
        });
        this.nextNodeId = maxId + 1;

        this.canvas.render();
    }

    /**
     * Validate node data
     */
    validateNode(node) {
        const required = ['id', 'description', 'effectDesc', 'type', 'color', 'x', 'y'];
        const errors = [];

        required.forEach(field => {
            if (node[field] === undefined || node[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        if (node.color && !this.nodeColors[node.color]) {
            errors.push(`Invalid color: ${node.color}`);
        }

        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
            errors.push('Position coordinates must be numbers');
        }

        return errors;
    }

    /**
     * Set selected color for new nodes
     */
    setSelectedColor(color) {
        if (this.nodeColors[color]) {
            this.selectedColor = color;
            console.log('Selected color for new nodes:', color);
        }
    }

    /**
     * Update properties panel with node data
     */
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

    /**
     * Hide properties panel
     */
    hidePropertiesPanel() {
        const nodeEditor = document.getElementById('nodeEditor');
        const noSelection = document.getElementById('noSelection');
        if (nodeEditor) nodeEditor.style.display = 'none';
        if (noSelection) noSelection.style.display = 'block';
    }

    /**
     * Update node count display
     */
    updateNodeCount() {
        const nodeCount = document.getElementById('nodeCount');
        if (nodeCount) {
            nodeCount.textContent = `Nodes: ${this.nodes.length}`;
        }
    }

    /**
     * Clear all nodes
     */
    clearAllNodes() {
        this.nodes = [];
        this.clearSelection();
        this.nextNodeId = 1;
        this.updateNodeCount();
        this.canvas.render();
    }

    /**
     * Get selected node
     */
    getSelectedNode() {
        return this.selectedNode;
    }

    /**
     * Get node by ID
     */
    getNodeById(nodeId) {
        return this.nodes.find(node => node.id === nodeId);
    }
}

// Export for use in other modules
window.NodeManager = NodeManager;