/**
 * Main Application Module
 * Handles application initialization and coordination between modules
 */


class JohnsonApp {
    constructor() {
        this.csvLoader = null;
        this.uiManager = null;
        this.gameState = null;
        this.visualRenderer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize core modules
            this.gameState = new GameState();
            this.csvLoader = new CSVLoader();
            this.uiManager = new UIManager(this.gameState, this.csvLoader);

            // Initialize visual prototype renderer
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                this.visualRenderer = new VisualPrototypeRenderer(canvas);
                // Set up coordination with game state
                this.visualRenderer.setNodeSelectionCallback(this.handleNodeSelection.bind(this));
            } else {
                console.warn('Canvas element not found - visual prototype will not be available');
            }

            // Load session state if available
            const sessionLoaded = this.gameState.loadSessionState();
            if (sessionLoaded) {
                this.updateLoadingMessage('Session state restored successfully.');
                console.log('Previous session restored');
            }

            // Set up event listeners
            this.setupEventListeners();

            // Initialize UI
            await this.uiManager.init();

            // Restore UI from session if session was loaded
            if (sessionLoaded) {
                const sessionData = {
                    runners: this.gameState.runners,
                    playerMoney: this.gameState.playerMoney,
                    playerRisk: this.gameState.playerRisk,
                    contractsCompleted: this.gameState.contractsCompleted
                };
                this.uiManager.restoreUIFromSession(sessionData);
                this.updateLoadingMessage('Previous session restored. Ready to load contract.');
            } else {
                this.updateLoadingMessage('Application initialized. Ready to load contract.');
            }

            this.isInitialized = true;
            console.log('Johnson Prototype application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.updateLoadingMessage('Application initialization failed. Please refresh the page.');
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle contract dropdown selection
        const contractDropdown = document.getElementById('contract-dropdown');
        if (contractDropdown) {
            contractDropdown.addEventListener('change', this.handleDropdownSelection.bind(this));
        }

        // Handle file input changes
        const fileInput = document.getElementById('contract-file');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileLoad.bind(this));
        }

        // Handle configuration validation
        const validateBtn = document.getElementById('validate-config');
        if (validateBtn) {
            validateBtn.addEventListener('click', this.handleValidateConfig.bind(this));
        }

        // Handle contract execution
        const executeBtn = document.getElementById('execute-contract');
        if (executeBtn) {
            executeBtn.addEventListener('click', this.handleExecuteContract.bind(this));
        }

        // Handle runner configuration changes
        this.setupRunnerEventListeners();

        // Handle window resize for responsive canvas
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Set up event listeners for runner configuration
     */
    setupRunnerEventListeners() {
        for (let i = 1; i <= 3; i++) {
            // Runner type changes
            const typeSelect = document.getElementById(`runner${i}-type`);
            if (typeSelect) {
                typeSelect.addEventListener('change', (e) => {
                    this.handleRunnerTypeChange(i - 1, e.target.value);
                });
            }

            // Runner stat changes
            ['face', 'muscle', 'hacker', 'ninja'].forEach(stat => {
                const input = document.getElementById(`runner${i}-${stat}`);
                if (input) {
                    input.addEventListener('input', (e) => {
                        this.handleRunnerStatChange(i - 1, stat, e.target.value);
                    });
                }
            });
        }
    }

    /**
     * Handle contract dropdown selection
     */
    async handleDropdownSelection(event) {
        const contractKey = event.target.value;
        if (!contractKey) return; // Empty selection

        try {
            this.updateLoadingMessage('Loading contract from library...');

            // Load contract from library
            const contractData = await this.csvLoader.loadFromLibrary(contractKey);

            if (contractData && contractData.length > 0) {
                this.gameState.setContractData(contractData);

                // Get contract name from library
                const contractName = CONTRACT_LIBRARY[contractKey].name;
                this.uiManager.updateContractDisplay(contractName);

                // Create and load visual contract data
                if (this.visualRenderer) {
                    const visualContractData = this.csvLoader.createVisualContractData(contractData);
                    this.visualRenderer.loadContract(visualContractData);
                    // Sync initial state
                    this.syncVisualWithGameState();
                }

                this.updateLoadingMessage(`Contract "${contractName}" loaded successfully.`);

                // Enable validation button and reset execution button
                const validateBtn = document.getElementById('validate-config');
                const executeBtn = document.getElementById('execute-contract');
                if (validateBtn) validateBtn.disabled = false;
                if (executeBtn) executeBtn.disabled = true;

                // Clear file input
                const fileInput = document.getElementById('contract-file');
                if (fileInput) fileInput.value = '';
            } else {
                throw new Error('No valid data found in contract');
            }

        } catch (error) {
            console.error('Error loading contract from library:', error);
            this.updateLoadingMessage(`Error loading contract: ${error.message}`);
            this.uiManager.updateContractDisplay('Error loading contract');
            // Reset dropdown
            event.target.value = '';
        }
    }

    /**
     * Handle file loading from input
     */
    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.updateLoadingMessage('Loading contract file...');
            const contractData = await this.csvLoader.loadFile(file);

            if (contractData && contractData.length > 0) {
                this.gameState.setContractData(contractData);
                this.uiManager.updateContractDisplay(file.name);

                // Create and load visual contract data
                if (this.visualRenderer) {
                    const visualContractData = this.csvLoader.createVisualContractData(contractData);
                    this.visualRenderer.loadContract(visualContractData);
                    // Sync initial state
                    this.syncVisualWithGameState();
                }

                this.updateLoadingMessage(`Contract "${file.name}" loaded successfully.`);

                // Enable validation button and reset execution button
                const validateBtn = document.getElementById('validate-config');
                const executeBtn = document.getElementById('execute-contract');
                if (validateBtn) validateBtn.disabled = false;
                if (executeBtn) executeBtn.disabled = true;

                // Clear dropdown selection
                const dropdown = document.getElementById('contract-dropdown');
                if (dropdown) dropdown.value = '';
            } else {
                throw new Error('No valid data found in contract file');
            }

        } catch (error) {
            console.error('Error loading contract file:', error);
            this.updateLoadingMessage(`Error loading contract: ${error.message}`);
            this.uiManager.updateContractDisplay('Error loading contract');
        }
    }

    /**
     * Handle loading the example contract
     */
    async handleLoadExample() {
        try {
            this.updateLoadingMessage('Loading example contract...');

            // Fallback: use embedded CSV data for file:// protocol compatibility
            const csvText = `Node ID,Description,Effect Desc,Effect 1,Effect 2,Type,Color,Layer,Slot,Connections
1,Start Node,"+2 Grit",None;+;2;Grit,,Effect,Red,0,CE,2;3
2,Choice A,"+2 Risk",None;+;2;Risk,,Effect,Green,1,U1,4
3,Choice B,"+2 Dam",None;+;2;Damage,,Effect,Purple,1,D1,4
4,Final Node,"+2 Veil",None;+;2;Veil,,Effect,Blue,2,CE,`;

            // Try to fetch first, fall back to embedded data if it fails
            let actualCsvText = csvText;
            try {
                const response = await fetch('Contracts/Contract_Example1.csv');
                if (response.ok) {
                    actualCsvText = await response.text();
                    console.log('Loaded CSV from file successfully');
                } else {
                    console.log('Fetch failed, using embedded CSV data');
                }
            } catch (fetchError) {
                console.log('Fetch not available or failed, using embedded CSV data:', fetchError.message);
            }

            const contractData = this.csvLoader.parseCSV(actualCsvText);

            if (contractData && contractData.length > 0) {
                this.gameState.setContractData(contractData);
                this.uiManager.updateContractDisplay('Contract_Example1.csv');

                // Create and load visual contract data
                if (this.visualRenderer) {
                    const visualContractData = this.csvLoader.createVisualContractData(contractData);
                    this.visualRenderer.loadContract(visualContractData);
                    // Sync initial state
                    this.syncVisualWithGameState();
                }

                this.updateLoadingMessage('Example contract loaded successfully.');

                // Enable validation button and reset execution button
                const validateBtn = document.getElementById('validate-config');
                const executeBtn = document.getElementById('execute-contract');
                if (validateBtn) validateBtn.disabled = false;
                if (executeBtn) executeBtn.disabled = true;
            } else {
                throw new Error('No valid data found in example contract');
            }

        } catch (error) {
            console.error('Error loading example contract:', error);
            this.updateLoadingMessage(`Error loading example contract: ${error.message}`);
            this.uiManager.updateContractDisplay('Error loading example');
        }
    }

    /**
     * Handle runner type changes
     */
    handleRunnerTypeChange(slotIndex, runnerType) {
        if (this.gameState) {
            this.gameState.setRunnerType(slotIndex, runnerType);
            this.uiManager.updatePoolsDisplay();
            // Save session state when runner configuration changes
            this.gameState.saveSessionState();
        }
    }

    /**
     * Handle runner stat changes
     */
    handleRunnerStatChange(slotIndex, statType, value) {
        if (this.gameState) {
            const numValue = parseInt(value) || 0;
            this.gameState.setRunnerStat(slotIndex, statType, numValue);
            this.uiManager.updatePoolsDisplay();
            // Sync visual prototype with updated calculations
            this.syncVisualWithGameState();
            // Save session state when runner configuration changes
            this.gameState.saveSessionState();
        }
    }

    /**
     * Handle node selection from visual prototype
     * @param {string} nodeId - ID of the node that was clicked
     * @param {boolean} isSelected - Whether the node is now selected
     */
    handleNodeSelection(nodeId, isSelected) {
        if (!this.gameState) return;

        if (isSelected) {
            this.gameState.selectNode(nodeId);
        } else {
            // Remove node from selection
            const index = this.gameState.selectedNodes.indexOf(nodeId);
            if (index !== -1) {
                this.gameState.selectedNodes.splice(index, 1);
                const node = this.gameState.getNodeById(nodeId);
                if (node) {
                    node.selected = false;
                }
            }
        }

        // Update calculations and UI
        this.gameState.calculateCurrentPools();
        this.gameState.updateAvailableNodes();
        this.uiManager.updatePoolsDisplay();

        // Sync visual prototype with updated node availability
        this.syncVisualWithGameState();
    }

    /**
     * Sync visual prototype with game state
     */
    syncVisualWithGameState() {
        if (this.visualRenderer && this.gameState) {
            // Update visual node availability based on game state
            const availableNodeIds = this.gameState.contractData
                ? this.gameState.contractData.filter(node => node.available).map(node => node.id)
                : [];

            this.visualRenderer.setAvailableNodes(availableNodeIds);
            this.visualRenderer.syncWithGameState(this.gameState.selectedNodes);
        }
    }

    /**
     * Handle configuration validation
     */
    handleValidateConfig() {
        if (!this.gameState || !this.gameState.contractData) {
            this.updateLoadingMessage('No contract loaded for validation.');
            return;
        }

        try {
            const isValid = this.gameState.validateConfiguration();

            if (isValid) {
                this.updateLoadingMessage('Configuration validated successfully.');

                // Enable execute button
                const executeBtn = document.getElementById('execute-contract');
                if (executeBtn) executeBtn.disabled = false;
            } else {
                this.updateLoadingMessage('Configuration validation failed. Check runner setup.');
            }

        } catch (error) {
            console.error('Error validating configuration:', error);
            this.updateLoadingMessage(`Validation error: ${error.message}`);
        }
    }

    /**
     * Handle contract execution
     */
    async handleExecuteContract() {
        if (!this.gameState || !this.gameState.contractData) {
            this.updateLoadingMessage('No contract loaded for execution.');
            return;
        }

        try {
            // Show loading state
            this.uiManager.setExecutionLoading(true);
            this.updateLoadingMessage('Executing contract...');

            // Add small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 500));

            // Execute the contract
            const executionResults = this.gameState.executeContract();

            // Update UI with new game state
            this.uiManager.updateGameStateDisplay();

            // Clear loading state
            this.uiManager.setExecutionLoading(false);

            // Show results modal
            this.uiManager.showExecutionResults(executionResults);

            // Update loading message
            if (executionResults.success) {
                this.updateLoadingMessage('Contract completed successfully!');
            } else {
                this.updateLoadingMessage('Contract completed with complications.');
            }

            // Log execution details for debugging
            console.log('Contract execution completed:', {
                success: executionResults.success,
                moneyEarned: executionResults.moneyEarned,
                finalDamage: executionResults.finalDamage,
                finalRisk: executionResults.finalRisk,
                executionTime: executionResults.executionTime
            });

        } catch (error) {
            console.error('Error executing contract:', error);
            this.uiManager.setExecutionLoading(false);
            this.updateLoadingMessage(`Execution error: ${error.message}`);
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update canvas size if needed
        const canvas = document.getElementById('gameCanvas');
        if (canvas && this.uiManager) {
            this.uiManager.handleCanvasResize();
        }
    }

    /**
     * Update loading message display
     */
    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.setAttribute('aria-live', 'polite');
        }
    }

    /**
     * Get current application state for debugging
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasGameState: !!this.gameState,
            hasCSVLoader: !!this.csvLoader,
            hasUIManager: !!this.uiManager,
            contractLoaded: this.gameState ? !!this.gameState.contractData : false,
            runnerData: this.gameState ? this.gameState.runners : null
        };
    }
}

// Populate contract dropdown from CONTRACT_LIBRARY
function populateContractDropdown() {
    const dropdown = document.getElementById('contract-dropdown');
    if (!dropdown || typeof CONTRACT_LIBRARY === 'undefined') {
        console.warn('Contract dropdown or CONTRACT_LIBRARY not available');
        return;
    }

    // Get all contract keys and sort them alphabetically by name
    const contracts = Object.keys(CONTRACT_LIBRARY).map(key => ({
        key: key,
        name: CONTRACT_LIBRARY[key].name,
        description: CONTRACT_LIBRARY[key].description
    })).sort((a, b) => a.name.localeCompare(b.name));

    // Populate dropdown with sorted contracts
    contracts.forEach(contract => {
        const option = document.createElement('option');
        option.value = contract.key;
        option.textContent = contract.name;
        option.title = contract.description; // Tooltip showing description
        dropdown.appendChild(option);
    });

    console.log(`Loaded ${contracts.length} contracts into dropdown`);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Populate contract dropdown first
    populateContractDropdown();

    const app = new JohnsonApp();

    // Make app available globally for debugging
    window.johnsonApp = app;

    try {
        await app.init();
    } catch (error) {
        console.error('Failed to start Johnson Prototype:', error);
    }
});

// Export for potential module imports
