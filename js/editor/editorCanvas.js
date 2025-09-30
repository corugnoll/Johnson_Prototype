/**
 * Johnson Contract Editor - Canvas Management System
 * Handles canvas rendering, grid system, zoom, pan, and coordinate transformations
 */

class EditorCanvas {
    constructor(canvasId, initialWidth = 1200, initialHeight = 800) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = this.canvas.parentElement;

        // Canvas dimensions
        this.width = initialWidth;
        this.height = initialHeight;

        // Grid system
        this.gridSize = 15; // Default grid size in pixels
        this.gridVisible = true;
        this.snapToGrid = true;
        this.gridColor = '#2a3441';

        // Zoom and pan
        this.zoom = 1.0;
        this.minZoom = 0.25;
        this.maxZoom = 2.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;

        // Initialize canvas
        this.resizeCanvas(this.width, this.height);
        this.setupEventListeners();

        console.log('EditorCanvas initialized:', this.width, 'x', this.height);
    }

    /**
     * Set up event listeners for canvas interactions
     */
    setupEventListeners() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Middle mouse pan
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle mouse wheel for zooming
     */
    handleWheel(event) {
        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert to canvas coordinates
        const canvasX = (mouseX - this.panX) / this.zoom;
        const canvasY = (mouseY - this.panY) / this.zoom;

        // Zoom delta
        const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomDelta));

        if (newZoom !== this.zoom) {
            // Adjust pan to zoom around mouse position
            this.panX = mouseX - canvasX * newZoom;
            this.panY = mouseY - canvasY * newZoom;
            this.zoom = newZoom;

            this.render();
            this.updateZoomDisplay();
        }
    }

    /**
     * Handle mouse down for panning
     */
    handleMouseDown(event) {
        if (event.button === 1) { // Middle mouse button
            event.preventDefault();
            this.isPanning = true;
            this.lastPanX = event.clientX;
            this.lastPanY = event.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move for panning
     */
    handleMouseMove(event) {
        if (this.isPanning) {
            const deltaX = event.clientX - this.lastPanX;
            const deltaY = event.clientY - this.lastPanY;

            this.panX += deltaX;
            this.panY += deltaY;

            this.lastPanX = event.clientX;
            this.lastPanY = event.clientY;

            this.render();
        }
    }

    /**
     * Handle mouse up to stop panning
     */
    handleMouseUp(event) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        const canvasX = (screenX - this.panX) / this.zoom;
        const canvasY = (screenY - this.panY) / this.zoom;

        return { x: canvasX, y: canvasY };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    getScreenCoordinates(canvasX, canvasY) {
        const screenX = canvasX * this.zoom + this.panX;
        const screenY = canvasY * this.zoom + this.panY;

        return { x: screenX, y: screenY };
    }

    /**
     * Snap coordinates to grid if enabled
     */
    snapToGridCoords(x, y) {
        if (!this.snapToGrid) {
            return { x, y };
        }

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        return { x: snappedX, y: snappedY };
    }

    /**
     * Set grid size
     */
    setGridSize(size) {
        this.gridSize = Math.max(5, Math.min(50, size));
        this.render();
    }

    /**
     * Toggle grid visibility
     */
    toggleGridVisibility() {
        this.gridVisible = !this.gridVisible;
        this.render();
        return this.gridVisible;
    }

    /**
     * Toggle snap to grid
     */
    toggleSnapToGrid() {
        this.snapToGrid = !this.snapToGrid;
        return this.snapToGrid;
    }

    /**
     * Draw the grid
     */
    drawGrid() {
        if (!this.gridVisible) return;

        this.ctx.save();
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        // Calculate grid bounds based on current view
        const startX = Math.floor((-this.panX / this.zoom) / this.gridSize) * this.gridSize;
        const startY = Math.floor((-this.panY / this.zoom) / this.gridSize) * this.gridSize;
        const endX = startX + (this.canvas.width / this.zoom) + this.gridSize;
        const endY = startY + (this.canvas.height / this.zoom) + this.gridSize;

        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Resize canvas
     */
    resizeCanvas(width, height) {
        this.width = Math.max(800, Math.min(3000, width));
        this.height = Math.max(600, Math.min(2000, height));

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Update canvas info display
        this.updateCanvasInfo();

        this.render();
    }

    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Set zoom level
     */
    setZoom(zoomLevel) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel / 100));

        if (newZoom !== this.zoom) {
            // Center zoom on canvas center
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            const canvasX = (centerX - this.panX) / this.zoom;
            const canvasY = (centerY - this.panY) / this.zoom;

            this.panX = centerX - canvasX * newZoom;
            this.panY = centerY - canvasY * newZoom;
            this.zoom = newZoom;

            this.render();
            this.updateZoomDisplay();
        }
    }

    /**
     * Pan the canvas by delta amounts
     */
    panCanvas(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
        this.render();
    }

    /**
     * Zoom to fit all content (implementation depends on nodeManager)
     */
    zoomToFit(nodes = []) {
        if (nodes.length === 0) {
            this.resetView();
            return;
        }

        // Calculate bounding box of all nodes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + (node.width || 100));
            maxY = Math.max(maxY, node.y + (node.height || 60));
        });

        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // Calculate required zoom and pan
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        const zoomX = this.canvas.width / contentWidth;
        const zoomY = this.canvas.height / contentHeight;

        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(zoomX, zoomY) * 0.9));

        this.panX = (this.canvas.width - contentWidth * this.zoom) / 2 - minX * this.zoom;
        this.panY = (this.canvas.height - contentHeight * this.zoom) / 2 - minY * this.zoom;

        this.render();
        this.updateZoomDisplay();
    }

    /**
     * Reset view to default
     */
    resetView() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.render();
        this.updateZoomDisplay();
    }

    /**
     * Main render function
     */
    render() {
        // Set up the rendering context
        this.ctx.save();

        // Clear canvas
        this.clearCanvas();

        // Apply zoom and pan transformations
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX / this.zoom, this.panY / this.zoom);

        // Draw grid
        this.drawGrid();

        // Restore context for other rendering
        this.ctx.restore();

        // Notify that canvas has been rendered (for external components)
        window.dispatchEvent(new CustomEvent('canvasRendered', { detail: { canvas: this } }));
    }

    /**
     * Update zoom display in UI
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoomDisplay');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoom * 100) + '%';
        }

        const zoomSlider = document.getElementById('zoomLevel');
        if (zoomSlider) {
            zoomSlider.value = Math.round(this.zoom * 100);
        }
    }

    /**
     * Update canvas info display
     */
    updateCanvasInfo() {
        const canvasInfo = document.getElementById('canvasInfo');
        if (canvasInfo) {
            canvasInfo.textContent = `Canvas: ${this.width}x${this.height}`;
        }

        // Update size inputs
        const widthInput = document.getElementById('canvasWidth');
        const heightInput = document.getElementById('canvasHeight');
        if (widthInput) widthInput.value = this.width;
        if (heightInput) heightInput.value = this.height;
    }

    /**
     * Get current transformation matrix values
     */
    getTransform() {
        return {
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
    }

    /**
     * Check if a point is visible in the current viewport
     */
    isPointVisible(x, y) {
        const screenCoords = this.getScreenCoordinates(x, y);
        return screenCoords.x >= 0 && screenCoords.x <= this.canvas.width &&
               screenCoords.y >= 0 && screenCoords.y <= this.canvas.height;
    }

    /**
     * Get the visible canvas bounds in canvas coordinates
     */
    getVisibleBounds() {
        const topLeft = this.getCanvasCoordinates({ clientX: 0, clientY: 0 });
        const bottomRight = this.getCanvasCoordinates({
            clientX: this.canvas.width,
            clientY: this.canvas.height
        });

        // Adjust for canvas rect
        const rect = this.canvas.getBoundingClientRect();
        topLeft.x = (-this.panX) / this.zoom;
        topLeft.y = (-this.panY) / this.zoom;
        bottomRight.x = (this.canvas.width - this.panX) / this.zoom;
        bottomRight.y = (this.canvas.height - this.panY) / this.zoom;

        return {
            left: topLeft.x,
            top: topLeft.y,
            right: bottomRight.x,
            bottom: bottomRight.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
    }
}

// Export for use in other modules
window.EditorCanvas = EditorCanvas;