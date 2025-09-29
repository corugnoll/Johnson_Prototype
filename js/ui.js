/**
 * UI Manager Module
 * Handles user interface interactions and updates
 */

class UIManager {
    constructor(gameState, csvLoader) {
        this.gameState = gameState;
        this.csvLoader = csvLoader;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the UI manager
     */
    async init() {
        try {
            // Initialize canvas
            this.initializeCanvas();

            // Set up form validation
            this.setupFormValidation();

            // Initialize display states
            this.updatePoolsDisplay();
            this.updateGameStateDisplay();

            this.isInitialized = true;
            console.log('UI Manager initialized successfully');

        } catch (error) {
            console.error('Failed to initialize UI Manager:', error);
            throw error;
        }
    }

    /**
     * Initialize canvas for game board
     */
    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.warn('Game canvas not found - continuing without canvas');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Draw placeholder content
        this.drawPlaceholder();
    }

    /**
     * Resize canvas to fit container while maintaining aspect ratio
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // Set canvas size based on container with some padding
        const padding = 20;
        const maxWidth = containerRect.width - padding;
        const maxHeight = containerRect.height - padding;

        // Maintain 4:3 aspect ratio
        const aspectRatio = 4 / 3;
        let width = Math.min(maxWidth, maxHeight * aspectRatio);
        let height = width / aspectRatio;

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    /**
     * Draw placeholder content on canvas
     */
    drawPlaceholder() {
        if (!this.ctx) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, width, height);

        // Draw border
        this.ctx.strokeStyle = '#533a7b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, width - 2, height - 2);

        // Draw placeholder text
        this.ctx.fillStyle = '#bbbbbb';
        this.ctx.font = '16px Segoe UI';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Contract Tree Visualization', width / 2, height / 2 - 10);
        this.ctx.fillText('(Coming in next milestone)', width / 2, height / 2 + 10);

        // Draw some placeholder nodes
        this.drawPlaceholderNodes();
    }

    /**
     * Draw placeholder nodes to show layout concept
     */
    drawPlaceholderNodes() {
        if (!this.ctx) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        // Node positions for demonstration
        const nodes = [
            { x: width / 2, y: height * 0.2, color: '#FF6467', label: 'Start' },
            { x: width * 0.3, y: height * 0.5, color: '#27AE60', label: 'Choice A' },
            { x: width * 0.7, y: height * 0.5, color: '#9B59B6', label: 'Choice B' },
            { x: width / 2, y: height * 0.8, color: '#51A2FF', label: 'End' }
        ];

        const nodeRadius = 20;

        // Draw connections
        this.ctx.strokeStyle = '#533a7b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(nodes[0].x, nodes[0].y + nodeRadius);
        this.ctx.lineTo(nodes[1].x, nodes[1].y - nodeRadius);
        this.ctx.moveTo(nodes[0].x, nodes[0].y + nodeRadius);
        this.ctx.lineTo(nodes[2].x, nodes[2].y - nodeRadius);
        this.ctx.moveTo(nodes[1].x, nodes[1].y + nodeRadius);
        this.ctx.lineTo(nodes[3].x, nodes[3].y - nodeRadius);
        this.ctx.moveTo(nodes[2].x, nodes[2].y + nodeRadius);
        this.ctx.lineTo(nodes[3].x, nodes[3].y - nodeRadius);
        this.ctx.stroke();

        // Draw nodes
        nodes.forEach(node => {
            // Node circle
            this.ctx.fillStyle = node.color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
            this.ctx.fill();

            // Node border
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Node label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Segoe UI';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.label, node.x, node.y);
        });
    }

    /**
     * Handle canvas resize events
     */
    handleCanvasResize() {
        if (this.canvas) {
            this.resizeCanvas();
            this.drawPlaceholder();
        }
    }

    /**
     * Set up form validation for inputs
     */
    setupFormValidation() {
        // Validate runner stat inputs
        for (let i = 1; i <= 3; i++) {
            ['face', 'muscle', 'hacker', 'ninja'].forEach(stat => {
                const input = document.getElementById(`runner${i}-${stat}`);
                if (input) {
                    input.addEventListener('input', this.validateStatInput.bind(this));
                    input.addEventListener('blur', this.validateStatInput.bind(this));
                }
            });
        }
    }

    /**
     * Validate stat input values
     */
    validateStatInput(event) {
        const input = event.target;
        const value = parseInt(input.value);

        // Remove invalid class first
        input.classList.remove('invalid');

        if (isNaN(value) || value < 0 || value > 10) {
            input.classList.add('invalid');
            input.setCustomValidity('Stat must be between 0 and 10');
        } else {
            input.setCustomValidity('');
        }
    }

    /**
     * Update contract display information
     */
    updateContractDisplay(contractName) {
        const contractNameElement = document.getElementById('contract-name');
        if (contractNameElement) {
            contractNameElement.textContent = contractName || 'No contract loaded';
        }
    }

    /**
     * Update pools display with current calculated values
     */
    updatePoolsDisplay() {
        if (!this.gameState) return;

        const pools = this.gameState.calculateCurrentPools();
        const gameState = this.gameState.getGameState();

        // Show original pool values (before prevention) in the main display
        // Use prevention data to show the actual original values if prevention occurred
        const displayDamage = gameState.preventionData ? gameState.preventionData.originalDamage : pools.damage;
        const displayRisk = gameState.preventionData ? gameState.preventionData.originalRisk : pools.risk;
        const displayGrit = gameState.preventionData ? gameState.preventionData.originalGrit : pools.grit;
        const displayVeil = gameState.preventionData ? gameState.preventionData.originalVeil : pools.veil;

        // Update pool displays - show original values, not reduced ones
        this.updateElementText('current-damage', displayDamage);
        this.updateElementText('current-risk', displayRisk);
        this.updateElementText('current-money', `$${pools.money}`);
        this.updateElementText('current-grit', displayGrit);
        this.updateElementText('current-veil', displayVeil);

        // Update prevention information if available
        this.updatePreventionDisplay(gameState.preventionData);
    }

    /**
     * Format pool value with prevention information
     * @param {number} finalValue - Final pool value after prevention
     * @param {Object} preventionData - Prevention data from game state
     * @param {string} poolType - Type of pool ('damage' or 'risk')
     * @returns {string} Formatted string showing prevention
     */
    formatPoolValue(finalValue, preventionData, poolType) {
        if (!preventionData) return finalValue.toString();

        if (poolType === 'damage' && preventionData.damagePrevented > 0) {
            return `${finalValue} (${preventionData.originalDamage} - ${preventionData.damagePrevented})`;
        }

        if (poolType === 'risk' && preventionData.riskPrevented > 0) {
            return `${finalValue} (${preventionData.originalRisk} - ${preventionData.riskPrevented})`;
        }

        return finalValue.toString();
    }

    /**
     * Update prevention display with detailed information
     * @param {Object} preventionData - Prevention data from game state
     */
    updatePreventionDisplay(preventionData) {
        const preventionElement = document.getElementById('prevention-info');
        if (!preventionElement) return;

        if (!preventionData || (preventionData.damagePrevented === 0 && preventionData.riskPrevented === 0)) {
            preventionElement.innerHTML = '';
            preventionElement.style.display = 'none';
            return;
        }

        let html = '<div class="prevention-summary"><h4>Prevention Effects:</h4>';

        if (preventionData.damagePrevented > 0) {
            html += `<div class="prevention-item">• ${preventionData.gritUsed} Grit prevents ${preventionData.damagePrevented} Damage (final: ${preventionData.finalDamage})</div>`;
        }

        if (preventionData.riskPrevented > 0) {
            html += `<div class="prevention-item">• ${preventionData.veilUsed} Veil prevents ${preventionData.riskPrevented} Risk (final: ${preventionData.finalRisk})</div>`;
        }

        html += '</div>';

        preventionElement.innerHTML = html;
        preventionElement.style.display = 'block';
    }

    /**
     * Update game state display
     */
    updateGameStateDisplay() {
        if (!this.gameState) return;

        const gameState = this.gameState.getGameState();

        // Update player information
        this.updateElementText('player-money', `$${gameState.playerMoney}`);
        this.updateElementText('player-risk', gameState.playerRisk);
        this.updateElementText('contracts-completed', gameState.contractsCompleted);
    }

    /**
     * Update button states based on current application state
     */
    updateButtonStates() {
        const hasContract = this.gameState && this.gameState.contractData;
        const isConfigValid = hasContract && this.gameState.validateConfiguration();

        // Update validate button
        const validateBtn = document.getElementById('validate-config');
        if (validateBtn) {
            validateBtn.disabled = !hasContract;
        }

        // Update execute button
        const executeBtn = document.getElementById('execute-contract');
        if (executeBtn) {
            executeBtn.disabled = !isConfigValid;
        }
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.className = 'loading';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.textContent = `Error: ${message}`;
            loadingElement.className = 'error';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.className = 'success';
        }
    }

    /**
     * Utility method to safely update element text content
     */
    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Utility method to safely update element HTML content
     */
    updateElementHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    /**
     * Get runner configuration from UI
     */
    getRunnerConfigFromUI() {
        const runners = [];

        for (let i = 1; i <= 3; i++) {
            const typeSelect = document.getElementById(`runner${i}-type`);
            const faceInput = document.getElementById(`runner${i}-face`);
            const muscleInput = document.getElementById(`runner${i}-muscle`);
            const hackerInput = document.getElementById(`runner${i}-hacker`);
            const ninjaInput = document.getElementById(`runner${i}-ninja`);

            if (typeSelect && faceInput && muscleInput && hackerInput && ninjaInput) {
                runners.push({
                    type: typeSelect.value,
                    stats: {
                        face: parseInt(faceInput.value) || 0,
                        muscle: parseInt(muscleInput.value) || 0,
                        hacker: parseInt(hackerInput.value) || 0,
                        ninja: parseInt(ninjaInput.value) || 0
                    }
                });
            }
        }

        return runners;
    }

    /**
     * Reset all UI elements to default state
     */
    resetUI() {
        // Reset contract display
        this.updateContractDisplay('No contract loaded');

        // Reset pools display
        this.updateElementText('current-damage', '0');
        this.updateElementText('current-risk', '0');
        this.updateElementText('current-money', '$0');
        this.updateElementText('current-grit', '0');
        this.updateElementText('current-veil', '0');

        // Reset buttons
        const validateBtn = document.getElementById('validate-config');
        const executeBtn = document.getElementById('execute-contract');

        if (validateBtn) validateBtn.disabled = true;
        if (executeBtn) executeBtn.disabled = true;

        // Clear file input
        const fileInput = document.getElementById('contract-file');
        if (fileInput) fileInput.value = '';

        // Reset canvas
        if (this.canvas) {
            this.drawPlaceholder();
        }
    }

    /**
     * Show contract execution results modal
     * @param {Object} executionResults - Results from contract execution
     */
    showExecutionResults(executionResults) {
        const modal = document.getElementById('results-modal');
        if (!modal) {
            console.error('Results modal not found');
            return;
        }

        // Update execution status
        const statusElement = document.querySelector('.execution-status');
        const outcomeElement = document.getElementById('execution-outcome');
        const messageElement = document.getElementById('execution-message');

        if (executionResults.success) {
            statusElement.className = 'execution-status success';
            outcomeElement.textContent = 'Contract Completed Successfully!';
            messageElement.textContent = 'Your team has successfully completed the contract with minimal risk.';
        } else {
            statusElement.className = 'execution-status failure';
            outcomeElement.textContent = 'Contract Completed with Complications';
            messageElement.textContent = 'The contract was completed but with significant damage or risk.';
        }

        // Update before/after comparison
        this.updateElementText('before-money', `$${executionResults.preExecution.money}`);
        this.updateElementText('before-risk', executionResults.preExecution.risk);
        this.updateElementText('before-contracts', executionResults.preExecution.contracts);

        this.updateElementText('after-money', `$${executionResults.postExecution.money}`);
        this.updateElementText('after-risk', executionResults.postExecution.risk);
        this.updateElementText('after-contracts', executionResults.postExecution.contracts);

        // Update execution details
        this.updateElementText('final-damage', executionResults.finalDamage);
        this.updateElementText('final-risk', executionResults.finalRisk);
        this.updateElementText('money-earned', `$${executionResults.moneyEarned}`);
        this.updateElementText('prevention-applied', executionResults.preventionApplied);

        // Show modal
        modal.style.display = 'flex';

        // Set up modal event listeners if not already set
        this.setupResultsModalListeners();
    }

    /**
     * Hide execution results modal
     */
    hideExecutionResults() {
        const modal = document.getElementById('results-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Set up event listeners for results modal
     */
    setupResultsModalListeners() {
        // Prevent setting up listeners multiple times
        if (this.resultsModalListenersSetup) {
            return;
        }

        const modal = document.getElementById('results-modal');
        const closeButton = document.getElementById('close-results');
        const newContractButton = document.getElementById('start-new-contract');
        const continueButton = document.getElementById('continue-session');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideExecutionResults();
            });
        }

        if (newContractButton) {
            newContractButton.addEventListener('click', () => {
                this.hideExecutionResults();
                this.resetContractForNew();
            });
        }

        if (continueButton) {
            continueButton.addEventListener('click', () => {
                this.hideExecutionResults();
                // Just close modal, keep current state
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideExecutionResults();
                }
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('results-modal');
                if (modal && modal.style.display === 'flex') {
                    this.hideExecutionResults();
                }
            }
        });

        this.resultsModalListenersSetup = true;
    }

    /**
     * Reset interface for new contract
     */
    resetContractForNew() {
        // Reset contract-specific UI elements
        this.updateContractDisplay('No contract loaded');

        // Reset pools display
        this.updateElementText('current-damage', '0');
        this.updateElementText('current-risk', '0');
        this.updateElementText('current-money', '$0');
        this.updateElementText('current-grit', '0');
        this.updateElementText('current-veil', '0');

        // Reset buttons
        const validateBtn = document.getElementById('validate-config');
        const executeBtn = document.getElementById('execute-contract');

        if (validateBtn) validateBtn.disabled = true;
        if (executeBtn) executeBtn.disabled = false; // Keep enabled for next execution

        // Clear file input
        const fileInput = document.getElementById('contract-file');
        if (fileInput) fileInput.value = '';

        // Reset canvas
        if (this.canvas) {
            this.drawPlaceholder();
        }

        // Clear prevention display
        const preventionElement = document.getElementById('prevention-info');
        if (preventionElement) {
            preventionElement.innerHTML = '';
            preventionElement.style.display = 'none';
        }

        // Reset contract data in game state
        if (this.gameState) {
            this.gameState.resetContract();
        }

        this.updateLoadingMessage('Ready to load next contract');
    }

    /**
     * Update game state display
     */
    updateGameStateDisplay() {
        if (!this.gameState) return;

        const gameState = this.gameState.getGameState();

        this.updateElementText('player-money', `$${gameState.playerMoney}`);
        this.updateElementText('player-risk', gameState.playerRisk);
        this.updateElementText('contracts-completed', gameState.contractsCompleted);
    }

    /**
     * Set loading state for execution button
     * @param {boolean} loading - Whether to show loading state
     */
    setExecutionLoading(loading) {
        const executeBtn = document.getElementById('execute-contract');
        if (!executeBtn) return;

        if (loading) {
            executeBtn.classList.add('loading');
            executeBtn.disabled = true;
            executeBtn.setAttribute('aria-label', 'Executing contract...');
        } else {
            executeBtn.classList.remove('loading');
            executeBtn.disabled = false;
            executeBtn.setAttribute('aria-label', 'Execute contract');
        }
    }

    /**
     * Load and restore UI state from session
     * @param {Object} sessionData - Session data to restore
     */
    restoreUIFromSession(sessionData) {
        // Restore runner configuration
        if (sessionData.runners && Array.isArray(sessionData.runners)) {
            for (let i = 0; i < Math.min(sessionData.runners.length, 3); i++) {
                const runner = sessionData.runners[i];
                const slotIndex = i + 1;

                // Restore runner type
                const typeSelect = document.getElementById(`runner${slotIndex}-type`);
                if (typeSelect && runner.type) {
                    typeSelect.value = runner.type;
                }

                // Restore runner stats
                if (runner.stats) {
                    const faceInput = document.getElementById(`runner${slotIndex}-face`);
                    const muscleInput = document.getElementById(`runner${slotIndex}-muscle`);
                    const hackerInput = document.getElementById(`runner${slotIndex}-hacker`);
                    const ninjaInput = document.getElementById(`runner${slotIndex}-ninja`);

                    if (faceInput) faceInput.value = runner.stats.face || 0;
                    if (muscleInput) muscleInput.value = runner.stats.muscle || 0;
                    if (hackerInput) hackerInput.value = runner.stats.hacker || 0;
                    if (ninjaInput) ninjaInput.value = runner.stats.ninja || 0;
                }
            }
        }

        // Update game state display
        this.updateGameStateDisplay();
        this.updatePoolsDisplay();
    }

    /**
     * Get UI state for debugging
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            hasCanvas: !!this.canvas,
            canvasSize: this.canvas ? { width: this.canvas.width, height: this.canvas.height } : null,
            runnerConfig: this.getRunnerConfigFromUI(),
            resultsModalListenersSetup: !!this.resultsModalListenersSetup
        };
    }
}