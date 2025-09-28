/**
 * Visual Prototype Module
 * Canvas-based visualization system for contract node trees
 */

class VisualPrototypeRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.contractData = null;
        this.nodePositions = new Map();
        this.onNodeSelectionChange = null; // Callback for node selection changes

        // Visual configuration - optimized for horizontal layout
        this.nodeSize = { width: 180, height: 90 };
        this.nodeSpacing = { horizontal: 250, vertical: 120 };

        // Pan state management for scrollable interface
        this.panOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };
        this.treeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        // Node colors with exact hex values from specification
        this.nodeColors = {
            'Red': '#FF6467',
            'Yellow': '#FFDF20',
            'Green': '#4ADE80',
            'Blue': '#51A2FF',
            'Purple': '#8B5CF6',
            'Grey': '#666666'
        };

        this.setupCanvas();
        this.setupEventListeners();
    }

    /**
     * Set up canvas configuration
     */
    setupCanvas() {
        // Set up responsive canvas sizing
        this.resizeCanvas();

        // Basic canvas setup for prototype
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '24px Arial';

        // Ensure canvas is cleared
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up resize observer for responsive canvas
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeCanvas();
                if (this.contractData) {
                    this.calculateLayout();
                    this.render();
                }
            });
            this.resizeObserver.observe(this.canvas.parentElement);
        }
    }

    /**
     * Resize canvas to fill its container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // Set canvas size to use full container space with minimal padding
        const padding = 10;
        this.canvas.width = Math.max(500, containerRect.width - padding);
        this.canvas.height = Math.max(400, containerRect.height - padding);

        // Apply device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Scale the canvas back down using CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Scale the drawing buffer up to account for device pixel ratio
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Scale the drawing context so everything draws at the correct size
        this.ctx.scale(dpr, dpr);

        // Reset context properties after resize
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '24px Arial';
    }

    /**
     * Load contract data and render
     * @param {VisualContractData} contractData - Contract data to visualize
     */
    loadContract(contractData) {
        this.contractData = contractData;
        this.calculateLayout();
        this.render();
        console.log(`Visual prototype loaded contract with ${contractData.metadata.nodeCount} nodes`);
    }

    /**
     * Calculate node positions using layer/slot algorithm with synergy node support
     */
    calculateLayout() {
        if (!this.contractData) return;

        const startTime = performance.now();

        // Separate synergy nodes from regular nodes
        const synergyNodes = [];
        const regularLayers = new Map();

        this.contractData.nodes.forEach(node => {
            if (node.type === 'Synergy') {
                synergyNodes.push(node);
            } else {
                if (!regularLayers.has(node.layer)) {
                    regularLayers.set(node.layer, []);
                }
                regularLayers.get(node.layer).push(node);
            }
        });

        const canvasCenterX = this.canvas.width / 2;
        const synergyRowHeight = 50;
        const regularStartY = synergyNodes.length > 0 ? synergyRowHeight + this.nodeSpacing.vertical : 50;

        // Position synergy nodes at the top
        this.positionSynergyNodes(synergyNodes, canvasCenterX, synergyRowHeight);

        // Position regular nodes below synergy nodes
        this.positionRegularNodes(regularLayers, canvasCenterX, regularStartY);

        // Calculate tree bounds for pan constraints
        this.calculateTreeBounds();

        const endTime = performance.now();
        if (endTime - startTime > 25) {
            console.warn(`Slow layout calculation: ${endTime - startTime}ms`);
        }
    }

    /**
     * Position synergy nodes at the top of the tree
     * @param {Array} synergyNodes - Array of synergy nodes
     * @param {number} centerX - Canvas center X coordinate
     * @param {number} y - Y position for synergy row
     */
    positionSynergyNodes(synergyNodes, centerX, y) {
        if (synergyNodes.length === 0) return;

        // Calculate horizontal spacing for synergy nodes
        const totalWidth = (synergyNodes.length - 1) * this.nodeSpacing.horizontal;
        const startX = centerX - (totalWidth / 2);

        synergyNodes.forEach((node, index) => {
            const x = startX + (index * this.nodeSpacing.horizontal);

            this.nodePositions.set(node.id, {
                x: x - this.nodeSize.width / 2,
                y: y,
                width: this.nodeSize.width,
                height: this.nodeSize.height
            });

            node.position = { x, y };
        });
    }

    /**
     * Position regular nodes in layers (left-to-right layout)
     * @param {Map} layers - Map of layer number to nodes
     * @param {number} centerX - Canvas center X coordinate (unused in horizontal layout)
     * @param {number} startY - Starting Y position
     */
    positionRegularNodes(layers, centerX, startY) {
        const sortedLayers = Array.from(layers.keys()).sort((a, b) => a - b);
        const canvasCenterY = this.canvas.height / 2;

        sortedLayers.forEach((layerNum, layerIndex) => {
            const layerNodes = layers.get(layerNum);
            // NEW: Use X position for layers instead of Y (left-to-right)
            const x = 100 + (layerIndex * this.nodeSpacing.horizontal);

            // Calculate vertical spacing to center the layer column
            const totalHeight = (layerNodes.length - 1) * this.nodeSpacing.vertical;
            const layerStartY = canvasCenterY - (totalHeight / 2);

            layerNodes.forEach((node, nodeIndex) => {
                const y = layerStartY + (nodeIndex * this.nodeSpacing.vertical);

                this.nodePositions.set(node.id, {
                    x: x - this.nodeSize.width / 2,
                    y: y - this.nodeSize.height / 2,
                    width: this.nodeSize.width,
                    height: this.nodeSize.height
                });

                node.position = { x, y };
            });
        });
    }

    /**
     * Render the complete visualization
     */
    render() {
        if (!this.contractData) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply pan transformation
        this.ctx.save();
        this.ctx.translate(this.panOffset.x, this.panOffset.y);

        // Render connections first (so they appear behind nodes)
        this.renderConnections();

        // Render nodes
        this.renderNodes();

        // Restore transformation
        this.ctx.restore();
    }

    /**
     * Render all nodes
     */
    renderNodes() {
        this.contractData.nodes.forEach(node => {
            this.renderNode(node);
        });
    }

    /**
     * Render a single node
     * @param {VisualNode} node - Node to render
     */
    renderNode(node) {
        const pos = this.nodePositions.get(node.id);
        if (!pos) return;

        // Special styling for synergy nodes
        if (node.type === 'Synergy') {
            this.renderSynergyNode(node, pos);
        } else {
            this.renderRegularNode(node, pos);
        }

        // Draw node ID in corner for debugging
        this.ctx.fillStyle = '#666666';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(node.id, pos.x + 4, pos.y + 24);
        this.ctx.textAlign = 'center';
    }

    /**
     * Render a regular node with standard styling
     * @param {VisualNode} node - Node to render
     * @param {Object} pos - Node position and dimensions
     */
    renderRegularNode(node, pos) {
        const color = this.nodeColors[node.color] || '#CCCCCC';

        // Apply state styling
        if (node.state === 'selected') {
            this.ctx.strokeStyle = '#FFDF20';  // Yellow border for selected
            this.ctx.lineWidth = 3;
        } else if (node.state === 'unavailable') {
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 1;
        } else {
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 1;
        }

        // Draw node rectangle
        this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
        this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Render node text with description and effect description
        this.renderNodeText(node, pos);
    }

    /**
     * Render a synergy node with special styling
     * @param {VisualNode} node - Synergy node to render
     * @param {Object} pos - Node position and dimensions
     */
    renderSynergyNode(node, pos) {
        const color = this.nodeColors[node.color] || '#CCCCCC';

        // Special synergy node styling - diamond shape with glow effect
        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;
        const halfWidth = pos.width / 2;
        const halfHeight = pos.height / 2;

        // Draw glow effect for synergy nodes
        if (node.state === 'selected') {
            this.ctx.shadowColor = '#FFDF20';
            this.ctx.shadowBlur = 10;
        } else if (node.state === 'available') {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5;
        }

        // Draw diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, pos.y);           // Top
        this.ctx.lineTo(pos.x + pos.width, centerY); // Right
        this.ctx.lineTo(centerX, pos.y + pos.height); // Bottom
        this.ctx.lineTo(pos.x, centerY);           // Left
        this.ctx.closePath();

        // Fill diamond
        this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
        this.ctx.fill();

        // Stroke diamond with special border
        if (node.state === 'selected') {
            this.ctx.strokeStyle = '#FFDF20';
            this.ctx.lineWidth = 4;
        } else if (node.state === 'unavailable') {
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
        }
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Render text with special styling for synergy nodes
        this.renderSynergyNodeText(node, pos);
    }

    /**
     * Render synergy node text with special styling
     * @param {VisualNode} node - Synergy node to render text for
     * @param {Object} pos - Node position and dimensions
     */
    renderSynergyNodeText(node, pos) {
        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;

        // Synergy nodes get a more compact text display
        const descriptionText = this.truncateText(node.description || '', pos.width * 0.8, 16);
        const effectText = this.truncateText(node.effectDescription || '', pos.width * 0.8, 14);

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Render description with bold white text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(descriptionText, centerX, centerY - 12);

        // Render effect text slightly below with smaller font
        if (effectText && effectText.trim() !== '') {
            this.ctx.fillStyle = '#E0E0E0';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(effectText, centerX, centerY + 12);
        }
    }

    /**
     * Render node text with description and effect description
     * @param {VisualNode} node - Node to render text for
     * @param {Object} pos - Node position and dimensions
     */
    renderNodeText(node, pos) {
        const padding = 6;
        const availableWidth = pos.width - (padding * 2);

        // Calculate text sections with improved truncation
        const descriptionText = this.truncateText(node.description || '', availableWidth, 18);
        const effectText = this.truncateText(node.effectDescription || '', availableWidth, 16);

        // Font configuration for better readability in smaller nodes - doubled sizes
        const primaryFontSize = 18;
        const secondaryFontSize = 14;
        const lineHeight = 20;
        const separatorHeight = 4;

        // Calculate vertical positioning - optimized for dual-line display
        const totalTextHeight = lineHeight * 2 + separatorHeight;
        const startY = pos.y + (pos.height - totalTextHeight) / 2;

        const descriptionY = startY + lineHeight/2;
        const separatorY = descriptionY + lineHeight/2 + separatorHeight/2;
        const effectTextY = separatorY + separatorHeight/2 + lineHeight/2;

        // Ensure text alignment is centered
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Render description text (primary) with white text for better contrast
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${primaryFontSize}px Arial`;
        this.ctx.fillText(descriptionText, pos.x + pos.width/2, descriptionY);

        // Always render separator and effect text if available
        if (effectText && effectText.trim() !== '') {
            // Render visual separator (horizontal line)
            this.ctx.strokeStyle = '#CCCCCC';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x + padding + 8, separatorY);
            this.ctx.lineTo(pos.x + pos.width - padding - 8, separatorY);
            this.ctx.stroke();

            // Render effect description text (secondary) with lighter color
            this.ctx.fillStyle = '#E0E0E0';
            this.ctx.font = `${secondaryFontSize}px Arial`;
            this.ctx.fillText(effectText, pos.x + pos.width/2, effectTextY);
        }
    }

    /**
     * Render all connection lines
     */
    renderConnections() {
        if (!this.contractData) return;

        const connections = this.contractData.getAllConnections();
        connections.forEach(connection => {
            this.renderConnection(connection.from, connection.to);
        });
    }

    /**
     * Render a connection line between two nodes (orthogonal routing)
     * @param {string} fromId - Source node ID
     * @param {string} toId - Target node ID
     */
    renderConnection(fromId, toId) {
        const fromPos = this.nodePositions.get(fromId);
        const toPos = this.nodePositions.get(toId);

        if (!fromPos || !toPos) return;

        // Calculate connection points and routing path
        const { fromPoint, toPoint } = this.calculateConnectionPoints(fromPos, toPos);
        const path = this.generateOrthogonalPath(fromPoint, toPoint);

        // Render the connection path
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);

        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }

        this.ctx.stroke();
    }

    /**
     * Set up event listeners for interaction
     */
    setupEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });

        this.canvas.addEventListener('mousemove', (event) => {
            this.handleCanvasHover(event);
        });

        // Pan event listeners
        this.canvas.addEventListener('mousedown', (event) => {
            this.handleMouseDown(event);
        });

        this.canvas.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        this.canvas.addEventListener('mouseup', (event) => {
            this.handleMouseUp(event);
        });

        this.canvas.addEventListener('mouseleave', (event) => {
            this.handleMouseLeave(event);
        });

        // Optional: wheel scrolling support
        this.canvas.addEventListener('wheel', (event) => {
            this.handleWheel(event);
        });
    }

    /**
     * Handle canvas click events
     * @param {MouseEvent} event - Click event
     */
    handleCanvasClick(event) {
        // Ignore clicks during drag operations
        if (this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedNode = this.getNodeAtPosition(x, y);
        if (clickedNode) {
            const wasSelected = this.toggleNodeSelection(clickedNode);
            this.render();

            // Notify game state of node selection change
            if (this.onNodeSelectionChange) {
                this.onNodeSelectionChange(clickedNode.id, wasSelected);
            }

            console.log(`Node ${clickedNode.id} clicked - state: ${clickedNode.state}`);
        }
    }

    /**
     * Handle canvas hover events for cursor feedback
     * @param {MouseEvent} event - Mouse move event
     */
    handleCanvasHover(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hoveredNode = this.getNodeAtPosition(x, y);
        this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
    }

    /**
     * Get node at specific position (accounting for pan offset)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {VisualNode|null} Node at position or null
     */
    getNodeAtPosition(x, y) {
        // Convert screen coordinates to world coordinates
        const worldX = x - this.panOffset.x;
        const worldY = y - this.panOffset.y;

        for (let [nodeId, pos] of this.nodePositions) {
            if (worldX >= pos.x && worldX <= pos.x + pos.width &&
                worldY >= pos.y && worldY <= pos.y + pos.height) {
                return this.contractData.nodes.get(nodeId);
            }
        }
        return null;
    }

    /**
     * Toggle node selection state
     * @param {VisualNode} node - Node to toggle
     * @returns {boolean} True if node is now selected
     */
    toggleNodeSelection(node) {
        if (node.state === 'selected') {
            node.state = 'available';
            return false;
        } else if (node.state === 'available') {
            node.state = 'selected';
            return true;
        }
        // Don't toggle unavailable nodes
        return false;
    }

    /**
     * Handle mouse down events for pan start
     * @param {MouseEvent} event - Mouse down event
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on a node
        const clickedNode = this.getNodeAtPosition(x, y);
        if (!clickedNode) {
            // Start dragging on empty areas
            this.isDragging = true;
            this.dragStartPos = { x, y };
            this.lastMousePos = { x, y };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move events for panning
     * @param {MouseEvent} event - Mouse move event
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.isDragging) {
            // Calculate pan offset
            const deltaX = x - this.lastMousePos.x;
            const deltaY = y - this.lastMousePos.y;

            this.panOffset.x += deltaX;
            this.panOffset.y += deltaY;

            // Apply boundary constraints
            this.constrainPanOffset();

            this.lastMousePos = { x, y };
            this.render();
        } else {
            // Handle hover for cursor feedback
            this.handleCanvasHover(event);
        }
    }

    /**
     * Handle mouse up events for pan end
     * @param {MouseEvent} event - Mouse up event
     */
    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Handle mouse leave events for pan end
     * @param {MouseEvent} event - Mouse leave event
     */
    handleMouseLeave(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Handle wheel events for scrolling
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event) {
        event.preventDefault();

        const scrollSpeed = 30;
        this.panOffset.x -= event.deltaX * scrollSpeed / 100;
        this.panOffset.y -= event.deltaY * scrollSpeed / 100;

        // Apply boundary constraints
        this.constrainPanOffset();

        this.render();
    }

    /**
     * Truncate text to fit within specified width
     * @param {string} text - Text to truncate
     * @param {number} maxWidth - Maximum width in pixels
     * @param {number} fontSize - Font size for better character width estimation
     * @returns {string} Truncated text
     */
    truncateText(text, maxWidth, fontSize = 10) {
        if (!text) return '';

        // Improved character-based truncation with font size consideration
        const avgCharWidth = fontSize * 0.6; // More accurate character width estimation
        const maxChars = Math.floor(maxWidth / avgCharWidth);

        if (text.length <= maxChars) return text;
        return text.substring(0, maxChars - 3) + '...';
    }

    /**
     * Desaturate a color for unavailable state
     * @param {string} color - Hex color
     * @returns {string} Desaturated color
     */
    desaturateColor(color) {
        // Simple desaturation by mixing with gray
        // This is a basic implementation for the prototype
        return color + '80'; // Add alpha for transparency effect
    }

    /**
     * Calculate connection points for two nodes (center of closest edges)
     * @param {Object} fromPos - From node position and dimensions
     * @param {Object} toPos - To node position and dimensions
     * @returns {Object} Connection points {fromPoint, toPoint}
     */
    calculateConnectionPoints(fromPos, toPos) {
        const fromCenter = {
            x: fromPos.x + fromPos.width / 2,
            y: fromPos.y + fromPos.height / 2
        };
        const toCenter = {
            x: toPos.x + toPos.width / 2,
            y: toPos.y + toPos.height / 2
        };

        let fromPoint, toPoint;

        // Determine relative positions and connect closest edges
        const deltaX = toCenter.x - fromCenter.x;
        const deltaY = toCenter.y - fromCenter.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Primarily horizontal relationship
            if (deltaX > 0) {
                // From is left of to - connect right edge to left edge
                fromPoint = {
                    x: fromPos.x + fromPos.width,
                    y: fromCenter.y
                };
                toPoint = {
                    x: toPos.x,
                    y: toCenter.y
                };
            } else {
                // From is right of to - connect left edge to right edge
                fromPoint = {
                    x: fromPos.x,
                    y: fromCenter.y
                };
                toPoint = {
                    x: toPos.x + toPos.width,
                    y: toCenter.y
                };
            }
        } else {
            // Primarily vertical relationship
            if (deltaY > 0) {
                // From is above to - connect bottom edge to top edge
                fromPoint = {
                    x: fromCenter.x,
                    y: fromPos.y + fromPos.height
                };
                toPoint = {
                    x: toCenter.x,
                    y: toPos.y
                };
            } else {
                // From is below to - connect top edge to bottom edge
                fromPoint = {
                    x: fromCenter.x,
                    y: fromPos.y
                };
                toPoint = {
                    x: toCenter.x,
                    y: toPos.y + toPos.height
                };
            }
        }

        return { fromPoint, toPoint };
    }

    /**
     * Generate orthogonal path between two points (only 90° angles)
     * @param {Object} fromPoint - Starting point {x, y}
     * @param {Object} toPoint - Ending point {x, y}
     * @returns {Array} Array of points forming the path
     */
    generateOrthogonalPath(fromPoint, toPoint) {
        const path = [fromPoint];

        // Simple L-shaped routing for skill tree appearance
        if (fromPoint.x !== toPoint.x && fromPoint.y !== toPoint.y) {
            // For horizontal layout, prefer horizontal-then-vertical routing
            const midPoint = { x: toPoint.x, y: fromPoint.y };
            path.push(midPoint);
        }

        path.push(toPoint);
        return path;
    }

    /**
     * Calculate tree bounding box for pan constraints
     */
    calculateTreeBounds() {
        if (!this.contractData || this.nodePositions.size === 0) {
            this.treeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (let pos of this.nodePositions.values()) {
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x + pos.width);
            maxY = Math.max(maxY, pos.y + pos.height);
        }

        // Add padding buffer
        const padding = 200;
        this.treeBounds = {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
    }

    /**
     * Constrain pan offset to keep tree content visible
     */
    constrainPanOffset() {
        if (!this.contractData) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Calculate maximum allowed pan offset
        const maxPanX = Math.max(0, this.treeBounds.maxX - canvasWidth);
        const minPanX = Math.min(0, this.treeBounds.minX);
        const maxPanY = Math.max(0, this.treeBounds.maxY - canvasHeight);
        const minPanY = Math.min(0, this.treeBounds.minY);

        // Constrain pan offset
        this.panOffset.x = Math.max(minPanX, Math.min(maxPanX, this.panOffset.x));
        this.panOffset.y = Math.max(minPanY, Math.min(maxPanY, this.panOffset.y));
    }

    /**
     * Resize canvas and recalculate layout
     */
    handleResize() {
        if (this.contractData) {
            this.calculateLayout();
            this.render();
        }
    }

    /**
     * Get current visualization state
     * @returns {Object} Current state information
     */
    getVisualizationState() {
        if (!this.contractData) {
            return { loaded: false };
        }

        const selectedNodes = Array.from(this.contractData.nodes.values())
            .filter(node => node.state === 'selected')
            .map(node => node.id);

        return {
            loaded: true,
            nodeCount: this.contractData.metadata.nodeCount,
            connectionCount: this.contractData.metadata.connectionCount,
            selectedNodes: selectedNodes,
            layers: this.contractData.layers.size
        };
    }

    /**
     * Set node availability states
     * @param {Array} availableNodeIds - Array of node IDs that should be available
     */
    setAvailableNodes(availableNodeIds) {
        if (!this.contractData) return;

        this.contractData.nodes.forEach(node => {
            if (availableNodeIds.includes(node.id)) {
                if (node.state === 'unavailable') {
                    node.state = 'available';
                }
            } else {
                if (node.state === 'available') {
                    node.state = 'unavailable';
                }
            }
        });

        this.render();
    }

    /**
     * Get selected node IDs
     * @returns {Array} Array of selected node IDs
     */
    getSelectedNodes() {
        if (!this.contractData) return [];

        return Array.from(this.contractData.nodes.values())
            .filter(node => node.state === 'selected')
            .map(node => node.id);
    }

    /**
     * Clear all selections
     */
    clearSelections() {
        if (!this.contractData) return;

        this.contractData.nodes.forEach(node => {
            if (node.state === 'selected') {
                node.state = 'available';
            }
        });

        this.render();
    }

    /**
     * Set callback for node selection changes
     * @param {Function} callback - Callback function(nodeId, isSelected)
     */
    setNodeSelectionCallback(callback) {
        this.onNodeSelectionChange = callback;
    }

    /**
     * Sync visual node states with game state selected nodes
     * @param {Array} selectedNodeIds - Array of selected node IDs from game state
     */
    syncWithGameState(selectedNodeIds) {
        if (!this.contractData) return;

        this.contractData.nodes.forEach(node => {
            if (selectedNodeIds.includes(node.id)) {
                node.state = 'selected';
            } else if (node.state === 'selected') {
                node.state = 'available';
            }
        });

        this.render();
    }
}