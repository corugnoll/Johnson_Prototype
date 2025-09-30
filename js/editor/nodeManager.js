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
            height: this.minHeight
        };

        // Calculate proper dimensions based on content
        this.calculateNodeDimensions(node);

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

        this.canvas.render();
        return true;
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
            this.calculateNodeDimensions(node);
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

    /**
     * Calculate node dimensions based on content (both description and effect description)
     */
    calculateNodeDimensions(node) {
        // Create a temporary canvas to measure text
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        const padding = 6;
        const maxWidth = 200; // Maximum node width
        const lineHeight = 16;
        const separatorHeight = 4;

        // Process description text with linebreaks
        ctx.font = 'bold 14px Arial';
        const descLines = this.processTextWithLinebreaks(node.description || '', maxWidth - padding * 2, ctx, 14);
        const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

        // Process effect description text with linebreaks
        ctx.font = '12px Arial';
        const effectLines = this.processTextWithLinebreaks(node.effectDesc || '', maxWidth - padding * 2, ctx, 12);
        const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

        // Calculate dimensions
        const maxTextWidth = Math.max(descWidth, effectWidth);
        const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';

        const totalTextHeight = (descLines.length * lineHeight) +
                               (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

        // Calculate final dimensions with padding
        node.width = Math.max(this.minWidth, maxTextWidth + padding * 2);
        node.height = Math.max(this.minHeight, totalTextHeight + padding * 2);

        return { width: node.width, height: node.height };
    }

    /**
     * Wrap text to fit within specified width
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

    /**
     * Draw a single node with main game layout structure
     */
    drawNode(node, ctx) {
        ctx.save();

        // Get node color
        const color = this.nodeColors[node.color] || this.nodeColors.Grey;

        // Draw node background
        ctx.fillStyle = color;
        ctx.fillRect(node.x, node.y, node.width, node.height);

        // Draw node border
        ctx.strokeStyle = node.selected ? '#FFFFFF' : '#000000';
        ctx.lineWidth = node.selected ? 3 : 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);

        // Draw node ID in top-right corner
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

        ctx.restore();
    }

    /**
     * Render node text with description and effect description (matches main game)
     */
    renderNodeText(node, pos, ctx) {
        const padding = 6;
        const availableWidth = pos.width - (padding * 2);

        // Process text with linebreak support
        const descriptionText = this.processTextWithLinebreaks(node.description || '', availableWidth, ctx, 14);
        const effectText = this.processTextWithLinebreaks(node.effectDesc || '', availableWidth, ctx, 12);

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
     * Process text with linebreak support and word wrapping
     */
    processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
        if (!text) return [''];

        // Set font for measurement
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

        // Draw only visible nodes
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
            nodeConnections: document.getElementById('nodeConnections'),
            nodeX: document.getElementById('nodeX'),
            nodeY: document.getElementById('nodeY')
        };

        // Populate form fields
        if (elements.nodeId) elements.nodeId.value = node.id;
        if (elements.nodeDescription) elements.nodeDescription.value = node.description;
        if (elements.nodeEffectDesc) elements.nodeEffectDesc.value = node.effectDesc;
        if (elements.nodeEffect1) elements.nodeEffect1.value = node.effect1 || '';
        if (elements.nodeEffect2) elements.nodeEffect2.value = node.effect2 || '';
        if (elements.nodeType) elements.nodeType.value = node.type;
        if (elements.nodeColor) elements.nodeColor.value = node.color;
        if (elements.nodeConnections) elements.nodeConnections.value = node.connections.join(',');
        if (elements.nodeX) elements.nodeX.value = node.x;
        if (elements.nodeY) elements.nodeY.value = node.y;

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