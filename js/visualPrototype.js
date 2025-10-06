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

class VisualPrototypeRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.contractData = null;
        this.nodePositions = new Map();
        this.onNodeSelectionChange = null; // Callback for node selection changes

        // Visual configuration - matching editor defaults
        this.nodeSize = { width: 80, height: 60 }; // Match editor minimums
        this.nodeSpacing = { horizontal: 250, vertical: 120 };

        // Pan state management for scrollable interface
        this.panOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };
        this.treeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

        // Zoom state management
        this.zoomLevel = 1.0;
        this.minZoom = 0.25;
        this.maxZoom = 3.0;
        this.zoomSpeed = 0.1;

        // Performance optimization settings
        this.performanceMode = false;
        this.lastRenderTime = 0;
        this.renderThrottleMs = 16; // 60 FPS max
        this.viewportCulling = true;
        this.connectionCache = new Map();
        this.textRenderCache = new Map();

        // Viewport culling bounds
        this.visibleBounds = { left: 0, top: 0, right: 0, bottom: 0 };

        // Node colors with exact hex values from specification
        this.nodeColors = {
            'Red': '#F87C63',
            'Yellow': '#F4D10B',
            'Green': '#88C987',
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

        // Calculate desired canvas size (use full container space with minimal padding)
        const padding = 10;
        const desiredWidth = Math.max(500, containerRect.width - padding);
        const desiredHeight = Math.max(400, containerRect.height - padding);

        // Apply device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;

        // Set CSS size (display size) - this is what the user sees
        this.canvas.style.width = desiredWidth + 'px';
        this.canvas.style.height = desiredHeight + 'px';

        // Set actual canvas resolution (drawing buffer size) accounting for DPR
        this.canvas.width = desiredWidth * dpr;
        this.canvas.height = desiredHeight * dpr;

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
     * Calculate node positions using direct X,Y coordinates from contract data
     */
    calculateLayout() {
        if (!this.contractData) return;

        const startTime = performance.now();

        // Use direct X,Y positioning from contract data
        this.contractData.nodes.forEach(node => {
            // Use the X,Y coordinates directly from the node data
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

        const endTime = performance.now();
        if (endTime - startTime > 10) {
            console.warn(`Slow layout calculation: ${endTime - startTime}ms`);
        }

        console.log(`Positioned ${this.contractData.nodes.size} nodes using X,Y coordinates`);

        // Enable performance mode for large contracts
        if (this.contractData.nodes.size > 50) {
            this.enablePerformanceMode();
        }
    }

    /**
     * Calculate optimal node size based on text content (editor-compatible approach)
     * @param {VisualNode} node - Node to calculate size for
     * @returns {Object} Optimal width and height
     * Updated 2025-09-30: Unified with editor text rendering system
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

    // Removed duplicate text processing functions - now using unified approach

    /**
     * Legacy positioning methods removed - now using direct X,Y coordinates
     * All positioning is handled in calculateLayout() using node.x and node.y
     */

    /**
     * Enable performance mode for large contracts
     */
    enablePerformanceMode() {
        this.performanceMode = true;
        this.renderThrottleMs = 33; // 30 FPS for performance
        console.log('Performance mode enabled for large contract');
    }

    /**
     * Disable performance mode
     */
    disablePerformanceMode() {
        this.performanceMode = false;
        this.renderThrottleMs = 16; // 60 FPS normal
        this.clearCaches();
        console.log('Performance mode disabled');
    }

    /**
     * Clear performance caches
     */
    clearCaches() {
        this.connectionCache.clear();
        this.textRenderCache.clear();
    }

    /**
     * Update visible bounds for viewport culling
     */
    updateVisibleBounds() {
        const padding = 100; // Extra padding for smooth scrolling
        // Use CSS dimensions (display size), not canvas buffer dimensions
        const canvasWidth = parseFloat(this.canvas.style.width) || this.canvas.clientWidth;
        const canvasHeight = parseFloat(this.canvas.style.height) || this.canvas.clientHeight;

        this.visibleBounds = {
            left: (-this.panOffset.x / this.zoomLevel) - padding,
            top: (-this.panOffset.y / this.zoomLevel) - padding,
            right: (-this.panOffset.x + canvasWidth) / this.zoomLevel + padding,
            bottom: (-this.panOffset.y + canvasHeight) / this.zoomLevel + padding
        };
    }

    /**
     * Check if a node is within the visible viewport
     * @param {Object} pos - Node position
     * @returns {boolean} True if visible
     */
    isNodeVisible(pos) {
        if (!this.viewportCulling) return true;

        return pos.x < this.visibleBounds.right &&
               pos.x + pos.width > this.visibleBounds.left &&
               pos.y < this.visibleBounds.bottom &&
               pos.y + pos.height > this.visibleBounds.top;
    }

    /**
     * Throttled render method for performance
     */
    renderThrottled() {
        const now = performance.now();
        if (now - this.lastRenderTime >= this.renderThrottleMs) {
            this.render();
            this.lastRenderTime = now;
        }
    }

    /**
     * Render the complete visualization
     */
    render() {
        if (!this.contractData) return;

        const startTime = performance.now();

        // Update visible bounds for viewport culling
        this.updateVisibleBounds();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply pan and zoom transformations
        this.ctx.save();
        this.ctx.translate(this.panOffset.x, this.panOffset.y);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);

        // Render connections first (so they appear behind nodes)
        this.renderConnections();

        // Render nodes
        this.renderNodes();

        // Restore transformation
        this.ctx.restore();

        // Performance monitoring
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 16 && !this.performanceMode) {
            console.warn(`Slow render: ${renderTime.toFixed(2)}ms`);
            if (renderTime > 50) {
                this.enablePerformanceMode();
            }
        }
    }

    /**
     * Render all nodes with viewport culling
     */
    renderNodes() {
        let renderedCount = 0;
        let culledCount = 0;

        this.contractData.nodes.forEach(node => {
            const pos = this.nodePositions.get(node.id);
            if (!pos) return;

            // Viewport culling - only render visible nodes
            if (this.isNodeVisible(pos)) {
                this.renderNode(node);
                renderedCount++;
            } else {
                culledCount++;
            }
        });

        // Log culling statistics for debugging large contracts
        if (this.performanceMode && culledCount > 0) {
            console.debug(`Rendered ${renderedCount} nodes, culled ${culledCount} nodes`);
        }
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

        // Clean node rendering without ID clutter
    }

    /**
     * Render a regular node with enhanced editor-style rendering
     * @param {VisualNode} node - Node to render
     * @param {Object} pos - Node position and dimensions
     */
    renderRegularNode(node, pos) {
        const color = this.nodeColors[node.color] || '#CCCCCC';

        // Check if this is a gate node
        if (node.type === 'Gate') {
            this.renderGateNode(node, pos, color);
        } else {
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
    }

    /**
     * Render a gate node with rounded rectangle shape
     * @param {VisualNode} node - Gate node to render
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
     * @param {VisualNode} node - Gate node
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

    /**
     * Get contrasting text color for background (from editor)
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

    /**
     * Render a synergy node with special styling
     * @param {VisualNode} node - Synergy node to render
     * @param {Object} pos - Node position and dimensions
     */
    renderSynergyNode(node, pos) {
        const color = this.nodeColors[node.color] || '#CCCCCC';

        // Special synergy node styling - rectangle shape with glow effect
        // Draw glow effect for synergy nodes
        if (node.state === 'selected') {
            this.ctx.shadowColor = '#FFDF20';
            this.ctx.shadowBlur = 10;
        } else if (node.state === 'available') {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5;
        }

        // Draw rectangle background
        this.ctx.fillStyle = node.state === 'unavailable' ? this.desaturateColor(color) : color;
        this.ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

        // Draw rectangle border with special styling
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
        this.ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Render enhanced text like regular nodes (not truncated)
        this.renderEnhancedNodeText(node, pos);
    }


    /**
     * Render all connection lines with viewport culling and caching
     */
    renderConnections() {
        if (!this.contractData) return;

        const connections = this.contractData.getAllConnections();
        let renderedConnections = 0;
        let culledConnections = 0;

        connections.forEach(connection => {
            const fromPos = this.nodePositions.get(connection.from);
            const toPos = this.nodePositions.get(connection.to);

            if (!fromPos || !toPos) return;

            // Connection culling - only render if either endpoint is visible
            const fromVisible = this.isNodeVisible(fromPos);
            const toVisible = this.isNodeVisible(toPos);

            if (fromVisible || toVisible) {
                this.renderConnection(connection.from, connection.to);
                renderedConnections++;
            } else {
                culledConnections++;
            }
        });

        // Log connection culling statistics for large contracts
        if (this.performanceMode && culledConnections > 0) {
            console.debug(`Rendered ${renderedConnections} connections, culled ${culledConnections} connections`);
        }
    }

    /**
     * Render a connection line between two nodes (enhanced editor-style routing)
     * @param {string} fromId - Source node ID
     * @param {string} toId - Target node ID
     */
    renderConnection(fromId, toId) {
        const fromPos = this.nodePositions.get(fromId);
        const toPos = this.nodePositions.get(toId);

        if (!fromPos || !toPos) return;

        // Calculate enhanced connection path using editor-style routing
        const path = this.calculateEnhancedConnectionPath(fromPos, toPos);
        if (!path || path.length < 2) return;

        this.ctx.save();

        // Enhanced line styling (matching editor)
        this.ctx.strokeStyle = '#FFFFFF';  // White lines like editor
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw the connection path
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);

        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }

        this.ctx.stroke();

        // Draw arrow head at the end
        this.drawConnectionArrow(path[path.length - 1], path[path.length - 2]);

        this.ctx.restore();
    }

    /**
     * Calculate enhanced connection path using editor-style routing
     * @param {Object} fromPos - From node position and dimensions
     * @param {Object} toPos - To node position and dimensions
     * @returns {Array} Array of points forming the connection path
     */
    calculateEnhancedConnectionPath(fromPos, toPos) {
        // Find best anchor points on node edges (like editor)
        const anchorPoints = this.findBestAnchorPoints(fromPos, toPos);
        const startPoint = anchorPoints.start;
        const endPoint = anchorPoints.end;

        // Generate 90-degree angle path
        return this.generateRightAnglePath(startPoint, endPoint);
    }

    /**
     * Find best anchor points on node edges for connection (matching editor implementation)
     * @param {Object} fromPos - From node position
     * @param {Object} toPos - To node position
     * @returns {Object} Start and end anchor points
     */
    findBestAnchorPoints(fromPos, toPos) {
        // Get center points of both nodes
        const center1 = {
            x: fromPos.x + fromPos.width / 2,
            y: fromPos.y + fromPos.height / 2
        };
        const center2 = {
            x: toPos.x + toPos.width / 2,
            y: toPos.y + toPos.height / 2
        };

        // Calculate direction from node1 to node2
        const dx = center2.x - center1.x;
        const dy = center2.y - center1.y;

        // Determine best anchor points based on relative positions
        let startAnchor, endAnchor;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection preferred
            if (dx > 0) {
                // Node2 is to the right of node1
                startAnchor = { x: fromPos.x + fromPos.width, y: center1.y };
                endAnchor = { x: toPos.x, y: center2.y };
            } else {
                // Node2 is to the left of node1
                startAnchor = { x: fromPos.x, y: center1.y };
                endAnchor = { x: toPos.x + toPos.width, y: center2.y };
            }
        } else {
            // Vertical connection preferred
            if (dy > 0) {
                // Node2 is below node1
                startAnchor = { x: center1.x, y: fromPos.y + fromPos.height };
                endAnchor = { x: center2.x, y: toPos.y };
            } else {
                // Node2 is above node1
                startAnchor = { x: center1.x, y: fromPos.y };
                endAnchor = { x: center2.x, y: toPos.y + toPos.height };
            }
        }

        return {
            start: startAnchor,
            end: endAnchor
        };
    }

    /**
     * Generate right-angle path with clean perpendicular entry/exit (matching editor implementation)
     * @param {Object} startPoint - Starting point
     * @param {Object} endPoint - Ending point
     * @returns {Array} Array of points forming the path
     */
    generateRightAnglePath(startPoint, endPoint) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;

        // If already aligned, use straight line
        if (Math.abs(dx) < 5) {
            return [startPoint, { x: startPoint.x, y: endPoint.y }];
        }
        if (Math.abs(dy) < 5) {
            return [startPoint, { x: endPoint.x, y: startPoint.y }];
        }

        // Use L-shaped routing with midpoint (matching editor implementation)
        const midPoint = {
            x: startPoint.x + dx * 0.5,
            y: startPoint.y
        };

        return [
            startPoint,
            midPoint,
            { x: midPoint.x, y: endPoint.y },
            endPoint
        ];
    }

    /**
     * Draw arrow head at connection endpoint (editor style)
     * @param {Object} endPoint - End point of connection
     * @param {Object} previousPoint - Previous point for direction calculation
     */
    drawConnectionArrow(endPoint, previousPoint) {
        if (!endPoint || !previousPoint) return;

        const dx = endPoint.x - previousPoint.x;
        const dy = endPoint.y - previousPoint.y;
        const angle = Math.atan2(dy, dx);

        // Arrow configuration (matching editor)
        const arrowLength = 8;
        const arrowAngle = Math.PI / 6; // 30 degrees

        const x1 = endPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = endPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = endPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = endPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(endPoint.x, endPoint.y);
        this.ctx.lineTo(x1, y1);
        this.ctx.moveTo(endPoint.x, endPoint.y);
        this.ctx.lineTo(x2, y2);
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
     * Get node at specific position (accounting for pan offset and zoom)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {VisualNode|null} Node at position or null
     */
    getNodeAtPosition(x, y) {
        // Convert screen coordinates to world coordinates (account for pan and zoom)
        const worldX = (x - this.panOffset.x) / this.zoomLevel;
        const worldY = (y - this.panOffset.y) / this.zoomLevel;

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

            // Use throttled rendering for smooth panning
            if (this.performanceMode) {
                this.renderThrottled();
            } else {
                this.render();
            }
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
     * Handle wheel events for zooming
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event) {
        event.preventDefault();

        // Get mouse position relative to canvas for zoom center
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Calculate zoom change (negative deltaY = zoom in, positive = zoom out)
        const zoomDirection = event.deltaY < 0 ? 1 : -1;
        const zoomChange = zoomDirection * this.zoomSpeed;
        const newZoomLevel = this.zoomLevel + zoomChange;

        // Apply zoom constraints
        const constrainedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoomLevel));

        if (constrainedZoom !== this.zoomLevel) {
            // Calculate world coordinates before zoom
            const worldX = (mouseX - this.panOffset.x) / this.zoomLevel;
            const worldY = (mouseY - this.panOffset.y) / this.zoomLevel;

            // Update zoom level
            this.zoomLevel = constrainedZoom;

            // Adjust pan offset to keep mouse position centered
            this.panOffset.x = mouseX - (worldX * this.zoomLevel);
            this.panOffset.y = mouseY - (worldY * this.zoomLevel);

            // Apply boundary constraints
            this.constrainPanOffset();

            this.render();
        }
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
     * Constrain pan offset to keep tree content visible (accounting for zoom)
     */
    constrainPanOffset() {
        if (!this.contractData) return;

        // Use CSS dimensions (display size), not canvas buffer dimensions
        const canvasWidth = parseFloat(this.canvas.style.width) || this.canvas.clientWidth;
        const canvasHeight = parseFloat(this.canvas.style.height) || this.canvas.clientHeight;

        // Calculate tree bounds in screen space (with zoom applied)
        const screenTreeMinX = this.treeBounds.minX * this.zoomLevel;
        const screenTreeMinY = this.treeBounds.minY * this.zoomLevel;
        const screenTreeMaxX = this.treeBounds.maxX * this.zoomLevel;
        const screenTreeMaxY = this.treeBounds.maxY * this.zoomLevel;

        // Calculate tree dimensions in screen space
        const treeWidth = screenTreeMaxX - screenTreeMinX;
        const treeHeight = screenTreeMaxY - screenTreeMinY;

        // Calculate pan constraints
        let minPanX, maxPanX, minPanY, maxPanY;

        // Horizontal constraints
        if (treeWidth <= canvasWidth) {
            // Tree fits horizontally - center it and don't allow much panning
            const centerOffset = (canvasWidth - treeWidth) / 2;
            minPanX = maxPanX = centerOffset - screenTreeMinX;
        } else {
            // Tree is wider than canvas - allow panning to see all content
            minPanX = canvasWidth - screenTreeMaxX; // Leftmost position (shows right edge)
            maxPanX = -screenTreeMinX; // Rightmost position (shows left edge)
        }

        // Vertical constraints
        if (treeHeight <= canvasHeight) {
            // Tree fits vertically - center it and don't allow much panning
            const centerOffset = (canvasHeight - treeHeight) / 2;
            minPanY = maxPanY = centerOffset - screenTreeMinY;
        } else {
            // Tree is taller than canvas - allow panning to see all content
            minPanY = canvasHeight - screenTreeMaxY; // Topmost position (shows bottom edge)
            maxPanY = -screenTreeMinY; // Bottommost position (shows top edge)
        }

        // Apply constraints
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
     * Reset zoom to default level
     */
    resetZoom() {
        this.zoomLevel = 1.0;
        this.panOffset = { x: 0, y: 0 };
        this.render();
    }

    /**
     * Set zoom level programmatically
     * @param {number} zoomLevel - Target zoom level
     * @param {number} centerX - Optional center X coordinate
     * @param {number} centerY - Optional center Y coordinate
     */
    setZoom(zoomLevel, centerX = null, centerY = null) {
        const constrainedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));

        if (centerX !== null && centerY !== null) {
            // Calculate world coordinates before zoom
            const worldX = (centerX - this.panOffset.x) / this.zoomLevel;
            const worldY = (centerY - this.panOffset.y) / this.zoomLevel;

            // Update zoom level
            this.zoomLevel = constrainedZoom;

            // Adjust pan offset to keep center position centered
            this.panOffset.x = centerX - (worldX * this.zoomLevel);
            this.panOffset.y = centerY - (worldY * this.zoomLevel);
        } else {
            this.zoomLevel = constrainedZoom;
        }

        this.constrainPanOffset();
        this.render();
    }

    /**
     * Get current zoom information
     * @returns {Object} Zoom state information
     */
    getZoomInfo() {
        return {
            currentZoom: this.zoomLevel,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            zoomSpeed: this.zoomSpeed,
            canZoomIn: this.zoomLevel < this.maxZoom,
            canZoomOut: this.zoomLevel > this.minZoom
        };
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

    /**
     * Get performance metrics
     * @returns {Object} Performance information
     */
    getPerformanceInfo() {
        const nodeCount = this.contractData ? this.contractData.nodes.size : 0;
        const connectionCount = this.contractData ? this.contractData.getAllConnections().length : 0;

        return {
            nodeCount,
            connectionCount,
            performanceMode: this.performanceMode,
            renderThrottleMs: this.renderThrottleMs,
            viewportCulling: this.viewportCulling,
            cacheSize: {
                connections: this.connectionCache.size,
                text: this.textRenderCache.size
            },
            estimatedComplexity: this.calculateRenderComplexity(nodeCount, connectionCount),
            recommendations: this.getPerformanceRecommendations(nodeCount, connectionCount)
        };
    }

    /**
     * Calculate render complexity score
     * @param {number} nodeCount - Number of nodes
     * @param {number} connectionCount - Number of connections
     * @returns {string} Complexity level
     */
    calculateRenderComplexity(nodeCount, connectionCount) {
        const score = nodeCount + (connectionCount * 0.5);

        if (score < 25) return 'Low';
        if (score < 75) return 'Medium';
        if (score < 150) return 'High';
        return 'Very High';
    }

    /**
     * Get performance recommendations
     * @param {number} nodeCount - Number of nodes
     * @param {number} connectionCount - Number of connections
     * @returns {Array} Array of recommendation strings
     */
    getPerformanceRecommendations(nodeCount, connectionCount) {
        const recommendations = [];

        if (nodeCount > 100) {
            recommendations.push('Consider splitting large contracts into smaller modules');
        }

        if (connectionCount > nodeCount * 2) {
            recommendations.push('High connection density may impact performance');
        }

        if (!this.performanceMode && nodeCount > 50) {
            recommendations.push('Enable performance mode for better rendering');
        }

        if (nodeCount > 200) {
            recommendations.push('Consider using level-of-detail rendering for very large contracts');
        }

        return recommendations;
    }

    /**
     * Enable or disable viewport culling
     * @param {boolean} enabled - Whether to enable viewport culling
     */
    setViewportCulling(enabled) {
        this.viewportCulling = enabled;
        console.log(`Viewport culling ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Force performance mode on/off
     * @param {boolean} enabled - Whether to enable performance mode
     */
    setPerformanceMode(enabled) {
        if (enabled) {
            this.enablePerformanceMode();
        } else {
            this.disablePerformanceMode();
        }
    }
}