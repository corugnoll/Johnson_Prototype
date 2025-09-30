/**
 * Johnson Contract Editor - Main Application Logic
 * Handles initialization, event coordination, and UI state management
 */

class EditorMain {
    constructor() {
        this.canvas = null;
        this.nodeManager = null;
        this.connectionManager = null;
        this.isDragging = false;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.doubleClickDelay = 300;

        console.log('EditorMain initializing...');
    }

    /**
     * Initialize the editor application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components
            this.initializeComponents();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();

            // Show ready status
            this.showMessage('Editor ready', 'success');

            console.log('Editor initialized successfully');

        } catch (error) {
            console.error('Failed to initialize editor:', error);
            this.showMessage('Failed to initialize editor', 'error');
        }
    }

    /**
     * Initialize core components
     */
    initializeComponents() {
        // Initialize canvas
        this.canvas = new EditorCanvas('editorCanvas', 1200, 800);

        // Initialize node manager
        this.nodeManager = new NodeManager(this.canvas);

        // Initialize connection manager
        this.connectionManager = new ConnectionManager(this.nodeManager, this.canvas);

        // Connect components
        this.nodeManager.setConnectionManager(this.connectionManager);

        // Update initial displays
        this.updateToolbarState();
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Canvas click events
        this.canvas.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));

        // Toolbar controls
        this.setupToolbarEvents();

        // Properties panel events
        this.setupPropertiesPanelEvents();

        // Creation panel events
        this.setupCreationPanelEvents();
    }

    /**
     * Set up toolbar event listeners
     */
    setupToolbarEvents() {
        // File controls
        const newBtn = document.getElementById('newContractBtn');
        const openBtn = document.getElementById('openContractBtn');
        const saveBtn = document.getElementById('saveContractBtn');
        const fileInput = document.getElementById('fileInput');

        if (newBtn) newBtn.addEventListener('click', () => this.newContract());
        if (openBtn) openBtn.addEventListener('click', () => this.openContract());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveContract());
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Canvas controls
        const gridToggle = document.getElementById('gridToggleBtn');
        const snapToggle = document.getElementById('snapToggleBtn');
        const buildConnections = document.getElementById('buildConnectionsBtn');
        const zoomFit = document.getElementById('zoomFitBtn');
        const resetView = document.getElementById('resetViewBtn');

        if (gridToggle) gridToggle.addEventListener('click', () => this.toggleGrid());
        if (snapToggle) snapToggle.addEventListener('click', () => this.toggleSnap());
        if (buildConnections) buildConnections.addEventListener('click', () => this.buildConnections());
        if (zoomFit) zoomFit.addEventListener('click', () => this.zoomToFit());
        if (resetView) resetView.addEventListener('click', () => this.resetView());

        // Canvas size controls
        const resizeBtn = document.getElementById('resizeCanvasBtn');
        if (resizeBtn) resizeBtn.addEventListener('click', () => this.resizeCanvas());

        // Zoom control
        const zoomSlider = document.getElementById('zoomLevel');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.canvas.setZoom(parseInt(e.target.value));
            });
        }
    }

    /**
     * Set up properties panel event listeners
     */
    setupPropertiesPanelEvents() {
        const updateBtn = document.getElementById('updateNodeBtn');
        const deleteBtn = document.getElementById('deleteNodeBtn');

        if (updateBtn) updateBtn.addEventListener('click', () => this.updateSelectedNode());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelectedNode());

        // Auto-update on input changes
        const inputs = [
            'nodeId', 'nodeDescription', 'nodeEffectDesc', 'nodeEffect1',
            'nodeEffect2', 'nodeType', 'nodeColor', 'nodeConnections'
        ];

        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('input', () => this.updateSelectedNode());
            }
        });
    }

    /**
     * Set up creation panel event listeners
     */
    setupCreationPanelEvents() {
        // Color selection buttons
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectColor(btn.dataset.color));
        });

        // Create node button
        const createBtn = document.getElementById('createNodeBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createNodeAtCenter());
        }

        // Set initial color selection
        this.selectColor('Red');
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only process shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelectedNode();
                    break;

                case 'Escape':
                    e.preventDefault();
                    this.nodeManager.clearSelection();
                    break;

                case 'n':
                case 'N':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.newContract();
                    }
                    break;

                case 'o':
                case 'O':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.openContract();
                    }
                    break;

                case 's':
                case 'S':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveContract();
                    }
                    break;
            }
        });
    }

    /**
     * Handle canvas click events
     */
    handleCanvasClick(event) {
        if (event.button !== 0) return; // Only handle left clicks

        const coords = this.canvas.getCanvasCoordinates(event);
        const clickedNode = this.nodeManager.getNodeAt(coords.x, coords.y);

        if (clickedNode) {
            // Select the clicked node
            this.nodeManager.selectNode(clickedNode.id);
        } else {
            // Clear selection and create new node
            this.nodeManager.clearSelection();

            // Check for double-click to create node
            const currentTime = Date.now();
            if (currentTime - this.lastClickTime < this.doubleClickDelay) {
                this.createNodeAt(coords.x, coords.y);
            }
            this.lastClickTime = currentTime;
        }
    }

    /**
     * Handle canvas mouse down for dragging
     */
    handleCanvasMouseDown(event) {
        if (event.button !== 0) return; // Only handle left mouse button

        const coords = this.canvas.getCanvasCoordinates(event);
        const clickedNode = this.nodeManager.getNodeAt(coords.x, coords.y);

        if (clickedNode) {
            this.isDragging = true;
            this.dragNode = clickedNode;
            this.dragOffset = {
                x: coords.x - clickedNode.x,
                y: coords.y - clickedNode.y
            };

            // Select the node being dragged
            this.nodeManager.selectNode(clickedNode.id);

            // Change cursor
            this.canvas.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle canvas mouse move for dragging and connection hover
     */
    handleCanvasMouseMove(event) {
        const coords = this.canvas.getCanvasCoordinates(event);

        // Handle connection hover effects
        if (this.connectionManager && !this.isDragging) {
            this.connectionManager.handleMouseMove(coords.x, coords.y);
        }

        // Handle node dragging
        if (this.isDragging && this.dragNode) {
            const newX = coords.x - this.dragOffset.x;
            const newY = coords.y - this.dragOffset.y;
            this.nodeManager.moveNode(this.dragNode.id, newX, newY);
        }
    }

    /**
     * Handle canvas mouse up to stop dragging
     */
    handleCanvasMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragNode = null;
            this.canvas.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * Create a new node at the center of the canvas
     */
    createNodeAtCenter() {
        const bounds = this.canvas.getVisibleBounds();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;

        this.createNodeAt(centerX, centerY);
    }

    /**
     * Create a new node at specific coordinates
     */
    createNodeAt(x, y) {
        const node = this.nodeManager.createNode(x, y);
        if (node) {
            // Select the newly created node
            this.nodeManager.selectNode(node.id);
            this.showMessage(`Created node ${node.id}`, 'success');
        }
    }

    /**
     * Select a color for new nodes
     */
    selectColor(color) {
        // Update node manager
        this.nodeManager.setSelectedColor(color);

        // Update UI
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        const selectedBtn = document.querySelector(`[data-color="${color}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }

    /**
     * Update the currently selected node with form data
     */
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
            connections: document.getElementById('nodeConnections')?.value
        };

        // Apply updates
        Object.entries(updates).forEach(([property, value]) => {
            if (value !== undefined && value !== selectedNode[property]) {
                this.nodeManager.updateNodeProperty(selectedNode.id, property, value);
            }
        });
    }

    /**
     * Delete the currently selected node
     */
    deleteSelectedNode() {
        const selectedNode = this.nodeManager.getSelectedNode();
        if (!selectedNode) return;

        if (confirm(`Delete node ${selectedNode.id}?`)) {
            this.nodeManager.deleteNode(selectedNode.id);
            this.showMessage(`Deleted node ${selectedNode.id}`, 'success');
        }
    }

    /**
     * Create a new contract (clear all)
     */
    newContract() {
        if (this.nodeManager.getAllNodes().length > 0) {
            if (!confirm('Create new contract? All current nodes will be lost.')) {
                return;
            }
        }

        this.nodeManager.clearAllNodes();
        this.showMessage('New contract created', 'success');
    }

    /**
     * Open a contract file
     */
    openContract() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Handle file selection for opening contracts
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.loadContractFromCSV(e.target.result);
            } catch (error) {
                console.error('Failed to load contract:', error);
                this.showMessage('Failed to load contract file', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Load contract from CSV content
     */
    loadContractFromCSV(csvContent) {
        // Parse CSV using Papa Parse
        const results = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true
        });

        if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            this.showMessage('CSV parsing failed', 'error');
            return;
        }

        // Convert CSV data to node objects
        const nodes = results.data.map(row => {
            return {
                id: row['Node ID'] || '',
                description: row['Description'] || '',
                effectDesc: row['Effect Desc'] || '',
                effect1: row['Effect 1'] || '',
                effect2: row['Effect 2'] || '',
                type: row['Type'] || 'Normal',
                color: row['Color'] || 'Grey',
                x: parseFloat(row['X']) || 0,
                y: parseFloat(row['Y']) || 0,
                connections: row['Connections'] ? row['Connections'].split(',').map(s => s.trim()) : [],
                selected: false,
                width: 80,
                height: 60
            };
        });

        // Validate and load nodes
        const validNodes = nodes.filter(node => {
            const errors = this.nodeManager.validateNode(node);
            if (errors.length > 0) {
                console.warn('Invalid node data:', node, errors);
                return false;
            }
            return true;
        });

        // Calculate dimensions for all nodes
        validNodes.forEach(node => {
            this.nodeManager.calculateNodeDimensions(node);
        });

        // Set the nodes
        this.nodeManager.setAllNodes(validNodes);

        // Build connections automatically
        if (this.connectionManager) {
            this.connectionManager.buildAllConnections();
        }

        // Zoom to fit
        this.zoomToFit();

        const connectionCount = this.connectionManager ? this.connectionManager.getAllConnections().length : 0;
        this.showMessage(`Loaded ${validNodes.length} nodes and ${connectionCount} connections`, 'success');
    }

    /**
     * Save the current contract
     */
    saveContract() {
        const nodes = this.nodeManager.getAllNodes();
        if (nodes.length === 0) {
            this.showMessage('No nodes to save', 'warning');
            return;
        }

        // Generate CSV content
        const csvData = nodes.map(node => ({
            'Node ID': node.id,
            'Description': node.description,
            'Effect Desc': node.effectDesc,
            'Effect 1': node.effect1 || '',
            'Effect 2': node.effect2 || '',
            'Type': node.type,
            'Color': node.color,
            'X': node.x,
            'Y': node.y,
            'Connections': node.connections.join(',')
        }));

        const csv = Papa.unparse(csvData);

        // Download the file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contract.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        this.showMessage('Contract saved', 'success');
    }

    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        const visible = this.canvas.toggleGridVisibility();
        const btn = document.getElementById('gridToggleBtn');
        if (btn) {
            btn.textContent = visible ? 'Hide Grid' : 'Show Grid';
        }
    }

    /**
     * Toggle snap to grid
     */
    toggleSnap() {
        const enabled = this.canvas.toggleSnapToGrid();
        const btn = document.getElementById('snapToggleBtn');
        if (btn) {
            btn.textContent = enabled ? 'Snap: ON' : 'Snap: OFF';
        }
    }

    /**
     * Zoom to fit all nodes
     */
    zoomToFit() {
        const nodes = this.nodeManager.getAllNodes();
        this.canvas.zoomToFit(nodes);
    }

    /**
     * Reset canvas view
     */
    resetView() {
        this.canvas.resetView();
    }

    /**
     * Build and display connections between nodes
     */
    buildConnections() {
        if (!this.connectionManager) {
            this.showMessage('Connection manager not initialized', 'error');
            return;
        }

        // Validate and remove invalid connections first
        this.connectionManager.removeInvalidConnections();

        // Build all connections from node data
        this.connectionManager.buildAllConnections();

        const connectionCount = this.connectionManager.getAllConnections().length;
        this.showMessage(`Built ${connectionCount} connections`, 'success');

        console.log('Connection data:', this.connectionManager.exportConnectionData());
    }

    /**
     * Resize canvas based on input values
     */
    resizeCanvas() {
        const widthInput = document.getElementById('canvasWidth');
        const heightInput = document.getElementById('canvasHeight');

        if (widthInput && heightInput) {
            const width = parseInt(widthInput.value);
            const height = parseInt(heightInput.value);
            this.canvas.resizeCanvas(width, height);
            this.showMessage(`Canvas resized to ${width}x${height}`, 'success');
        }
    }

    /**
     * Update toolbar state
     */
    updateToolbarState() {
        // Update grid button text
        const gridBtn = document.getElementById('gridToggleBtn');
        if (gridBtn) {
            gridBtn.textContent = this.canvas?.gridVisible ? 'Hide Grid' : 'Show Grid';
        }

        // Update snap button text
        const snapBtn = document.getElementById('snapToggleBtn');
        if (snapBtn) {
            snapBtn.textContent = this.canvas?.snapToGrid ? 'Snap: ON' : 'Snap: OFF';
        }
    }

    /**
     * Show a status message
     */
    showMessage(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-${type}`;

            // Clear message after 3 seconds
            setTimeout(() => {
                statusElement.textContent = 'Ready';
                statusElement.className = '';
            }, 3000);
        }

        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize the application when the script loads
const editorApp = new EditorMain();
editorApp.init();

// Export for debugging/external access
window.editorApp = editorApp;