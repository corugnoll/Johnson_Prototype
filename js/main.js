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
     * Initialize the application (MODIFIED for Runner Generation System)
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

            // NEW: Load balancing configuration, name table, and damage table
            this.updateLoadingMessage('Loading game configuration...');

            const balancingConfig = await loadBalancingConfig();
            this.gameState.setBalancingConfig(balancingConfig);

            const nameTable = await this.csvLoader.loadNameTable();
            this.gameState.setNameTable(nameTable.firstParts, nameTable.secondParts);

            const damageTable = await this.csvLoader.loadDamageTable();
            this.gameState.setDamageTable(damageTable);

            // Load session state if available
            const sessionLoaded = this.gameState.loadSessionState();
            if (sessionLoaded) {
                this.updateLoadingMessage('Session state restored successfully.');
                console.log('Previous session restored');
            } else {
                // NEW: Generate initial runner batch if no session
                this.updateLoadingMessage('Generating initial runners...');
                const initialRunners = generateRunnerBatch(
                    balancingConfig.generatedRunnerBatchSize,
                    this.gameState.nameTable,
                    balancingConfig
                );
                this.gameState.setGeneratedRunners(initialRunners);

                // Give player starting money (from balancing config)
                this.gameState.playerMoney = balancingConfig.playerStartingMoney;
            }

            // Set up event listeners
            this.setupEventListeners();

            // Initialize UI
            await this.uiManager.init();

            // Initialize hired runners display
            this.uiManager.updateHiredRunnersDisplay();
            this.uiManager.updateGameStateDisplay();

            // Restore UI from session if session was loaded
            if (sessionLoaded) {
                const sessionData = {
                    playerLevel: this.gameState.playerLevel,
                    playerMoney: this.gameState.playerMoney,
                    playerRisk: this.gameState.playerRisk,
                    contractsCompleted: this.gameState.contractsCompleted,
                    hiredRunners: this.gameState.hiredRunners,
                    generatedRunners: this.gameState.generatedRunners
                };
                this.uiManager.restoreUIFromSession(sessionData);
                this.updateLoadingMessage('Previous session restored. Ready to load contract.');
            } else {
                this.updateLoadingMessage('Application initialized. Ready to load contract.');
            }

            this.isInitialized = true;
            console.log('Johnson Prototype application initialized successfully');
            console.log(`Generated ${this.gameState.generatedRunners.length} initial runners`);
            console.log(`Player starting money: $${this.gameState.playerMoney}`);

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

        // Handle contract execution
        const executeBtn = document.getElementById('execute-contract');
        if (executeBtn) {
            executeBtn.addEventListener('click', this.handleExecuteContract.bind(this));
        }

        // Runner Index modal controls
        const toggleRunnerIndexBtn = document.getElementById('toggle-runner-index');
        if (toggleRunnerIndexBtn) {
            toggleRunnerIndexBtn.addEventListener('click', this.handleToggleRunnerIndex.bind(this));
        }

        const closeRunnerIndexBtn = document.getElementById('close-runner-index');
        if (closeRunnerIndexBtn) {
            closeRunnerIndexBtn.addEventListener('click', this.handleCloseRunnerIndex.bind(this));
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleTabSwitch(e.target.dataset.tab);
            });
        });

        // Generate new runners button
        const generateBtn = document.getElementById('generate-new-runners');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.handleGenerateNewRunners.bind(this));
        }

        // Handle window resize for responsive canvas
        window.addEventListener('resize', this.handleResize.bind(this));
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

                // Enable execute button if runners are hired
                const executeBtn = document.getElementById('execute-contract');
                if (executeBtn) {
                    executeBtn.disabled = this.gameState.hiredRunners.length === 0;
                }

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

                // Enable execute button if runners are hired
                const executeBtn = document.getElementById('execute-contract');
                if (executeBtn) {
                    executeBtn.disabled = this.gameState.hiredRunners.length === 0;
                }

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

                // Enable execute button if runners are hired
                const executeBtn = document.getElementById('execute-contract');
                if (executeBtn) {
                    executeBtn.disabled = this.gameState.hiredRunners.length === 0;
                }
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
     * Toggle Runner Index modal visibility
     */
    handleToggleRunnerIndex() {
        const modal = document.getElementById('runner-index-modal');
        if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
            if (modal.style.display === 'flex') {
                this.renderRunnerIndex();
            }
        }
    }

    /**
     * Close Runner Index modal
     */
    handleCloseRunnerIndex() {
        const modal = document.getElementById('runner-index-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Handle tab switching in Runner Index
     */
    handleTabSwitch(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Map tab names to their content div IDs
        const tabIdMap = {
            'generated': 'generated-runners-tab',
            'previously-hired': 'previously-hired-tab'
        };

        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            const shouldBeActive = content.id === tabIdMap[tabName];
            if (shouldBeActive) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Re-render the active tab to ensure content is displayed
        if (tabName === 'generated') {
            this.renderGeneratedRunners();
        } else if (tabName === 'previously-hired') {
            this.renderPreviouslyHiredRunners();
        }
    }

    /**
     * Generate new batch of runners
     */
    handleGenerateNewRunners() {
        const newRunners = generateRunnerBatch(
            this.gameState.balancingConfig.generatedRunnerBatchSize,
            this.gameState.nameTable,
            this.gameState.balancingConfig
        );
        this.gameState.setGeneratedRunners(newRunners);
        this.renderRunnerIndex();
        this.gameState.saveSessionState();
    }

    /**
     * Render Runner Index modal content
     */
    renderRunnerIndex() {
        this.renderGeneratedRunners();
        this.renderPreviouslyHiredRunners();
    }

    /**
     * Render generated runners grid
     */
    renderGeneratedRunners() {
        const grid = document.getElementById('generated-runners-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.gameState.generatedRunners.forEach(runner => {
            const card = this.createRunnerCard(runner, true);
            grid.appendChild(card);
        });
    }

    /**
     * Render previously hired runners grid
     */
    renderPreviouslyHiredRunners() {
        const grid = document.getElementById('previously-hired-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Sort by last hired timestamp (most recent first)
        const sorted = [...this.gameState.previouslyHiredRunners].sort((a, b) =>
            b.lastHiredTimestamp - a.lastHiredTimestamp
        );

        sorted.forEach(runner => {
            const card = this.createRunnerCard(runner, false);
            grid.appendChild(card);
        });
    }

    /**
     * Create a runner card element
     */
    createRunnerCard(runner, isGenerated) {
        const card = document.createElement('div');
        card.className = 'runner-card';

        if (runner.runnerState === 'Dead') {
            card.classList.add('dead');
        } else if (runner.runnerState === 'Injured') {
            card.classList.add('injured');
        }

        if (runner.hiringState === 'Hired') {
            card.classList.add('hired');
        }

        card.innerHTML = `
            <div class="runner-card-header">
                <div class="runner-card-name">${runner.name}</div>
                <div class="runner-card-type">${runner.runnerType}</div>
            </div>
            <div class="runner-card-level">Level ${runner.level}</div>
            <div class="runner-card-stats">
                <div class="runner-card-stat"><span>Face:</span><span>${runner.stats.face}</span></div>
                <div class="runner-card-stat"><span>Muscle:</span><span>${runner.stats.muscle}</span></div>
                <div class="runner-card-stat"><span>Hacker:</span><span>${runner.stats.hacker}</span></div>
                <div class="runner-card-stat"><span>Ninja:</span><span>${runner.stats.ninja}</span></div>
            </div>
            <div class="runner-card-state ${runner.runnerState.toLowerCase()}">${runner.runnerState}</div>
        `;

        // Add hire button
        const validation = validateHiring(runner, this.gameState);
        const hireButton = document.createElement('button');
        hireButton.className = 'hire-button';
        hireButton.textContent = `Hire - $${this.gameState.balancingConfig.hiringCost}`;
        hireButton.disabled = !validation.canHire;

        if (!validation.canHire) {
            const costDiv = document.createElement('div');
            costDiv.className = 'runner-card-cost';
            costDiv.textContent = validation.reason;
            costDiv.style.color = 'var(--error-color)';
            card.appendChild(costDiv);
        }

        hireButton.addEventListener('click', () => {
            const result = hireRunner(runner, this.gameState);
            if (result.success) {
                this.updateLoadingMessage(result.message);
                this.renderRunnerIndex();
                this.uiManager.updateHiredRunnersDisplay();
                this.uiManager.updateGameStateDisplay();

                // Update execute button state
                const executeBtn = document.getElementById('execute-contract');
                if (executeBtn && this.gameState.contractData) {
                    executeBtn.disabled = this.gameState.hiredRunners.length === 0;
                }

                this.gameState.saveSessionState();
            }
        });

        card.appendChild(hireButton);
        return card;
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
