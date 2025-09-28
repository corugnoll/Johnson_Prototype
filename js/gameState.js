/**
 * Game State Module
 * Manages the current state of the game including runners, contracts, and calculated pools
 */

class GameState {
    constructor() {
        this.contractData = null;
        this.runners = this.initializeRunners();
        this.playerMoney = 0;
        this.playerRisk = 0;
        this.contractsCompleted = 0;
        this.selectedNodes = [];
        this.currentPools = this.initializePools();
    }

    /**
     * Initialize empty runner configuration
     */
    initializeRunners() {
        return [
            {
                type: 'Empty',
                stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 }
            },
            {
                type: 'Empty',
                stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 }
            },
            {
                type: 'Empty',
                stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 }
            }
        ];
    }

    /**
     * Initialize pools with default values
     */
    initializePools() {
        return {
            damage: 0,
            risk: 0,
            money: 0,
            grit: 0,
            veil: 0
        };
    }

    /**
     * Set contract data from CSV loader
     * @param {Array} contractData - Parsed contract data
     */
    setContractData(contractData) {
        try {
            this.contractData = contractData.map(node => ({
                id: node['Node ID'],
                description: node['Description'],
                effectDescription: node['Effect Desc'],
                effect1: node['Effect 1'],
                effect2: node['Effect 2'],
                type: node['Type'],
                color: node['Color'],
                layer: parseInt(node['Layer']) || 0,
                slot: node['Slot'],
                connections: this.parseConnections(node['Connections']),
                selected: false,
                available: this.shouldBeInitiallyAvailable(node)
            }));

            this.selectedNodes = [];

            // Update node availability after all nodes are loaded
            this.updateAvailableNodes();

            this.calculateCurrentPools();

            console.log(`Contract data set with ${this.contractData.length} nodes`);

        } catch (error) {
            console.error('Error setting contract data:', error);
            throw new Error(`Failed to process contract data: ${error.message}`);
        }
    }

    /**
     * Parse connection string into array
     * @param {string} connections - Connection string from CSV
     * @returns {Array} Array of connected node IDs
     */
    parseConnections(connections) {
        if (!connections || connections.trim() === '') {
            return [];
        }
        return connections.split(';').map(c => c.trim()).filter(c => c !== '');
    }

    /**
     * Check if a node is a start node (Layer 0 or Type 'Start')
     * @param {Object} node - Node data
     * @returns {boolean} True if start node
     */
    isStartNode(node) {
        return parseInt(node['Layer']) === 0 || node['Type'] === 'Start';
    }

    /**
     * Check if a node should be initially available
     * @param {Object} node - Node data from CSV
     * @returns {boolean} True if node should be initially available
     */
    shouldBeInitiallyAvailable(node) {
        // Start nodes (Layer 0 or Type 'Start') are always available
        if (this.isStartNode(node)) {
            return true;
        }

        // Synergy nodes are always available
        if (node['Type'] === 'Synergy') {
            return true;
        }

        // For other nodes, check if they have any incoming connections
        // If no other nodes connect to this node, it should be available
        return false; // Will be updated by updateAvailableNodes after all nodes are loaded
    }

    /**
     * Set runner type for a specific slot
     * @param {number} slotIndex - Runner slot index (0-2)
     * @param {string} runnerType - Runner type
     */
    setRunnerType(slotIndex, runnerType) {
        if (slotIndex >= 0 && slotIndex < 3) {
            this.runners[slotIndex].type = runnerType;
            this.calculateCurrentPools();
        }
    }

    /**
     * Set runner stat for a specific slot and stat type
     * @param {number} slotIndex - Runner slot index (0-2)
     * @param {string} statType - Stat type (face, muscle, hacker, ninja)
     * @param {number} value - Stat value
     */
    setRunnerStat(slotIndex, statType, value) {
        if (slotIndex >= 0 && slotIndex < 3 &&
            ['face', 'muscle', 'hacker', 'ninja'].includes(statType)) {
            this.runners[slotIndex].stats[statType] = Math.max(0, Math.min(10, value));
            this.calculateCurrentPools();
        }
    }

    /**
     * Calculate current pools based on selected nodes and runner configuration
     * @returns {Object} Current pool values
     */
    calculateCurrentPools() {
        const startTime = performance.now();

        // Reset pools
        this.currentPools = this.initializePools();

        // Add effects from selected nodes
        this.selectedNodes.forEach(nodeId => {
            const node = this.getNodeById(nodeId);
            if (node) {
                this.applyNodeEffects(node);
            }
        });

        // Apply prevention mechanics after all effects are calculated
        this.applyPreventionMechanics();

        const endTime = performance.now();
        if (endTime - startTime > 100) {
            console.warn(`Slow calculation detected: ${endTime - startTime}ms for ${this.selectedNodes.length} nodes`);
        }

        return { ...this.currentPools };
    }

    /**
     * Apply effects from a specific node
     * @param {Object} node - Node to apply effects from
     */
    applyNodeEffects(node) {
        if (node.effect1) {
            this.applyEffect(node.effect1);
        }
        if (node.effect2) {
            this.applyEffect(node.effect2);
        }
    }

    /**
     * Apply a single effect string
     * @param {string} effectString - Effect in format "Condition;Operator;Amount;Stat"
     */
    applyEffect(effectString) {
        try {
            const parts = effectString.split(';');
            if (parts.length < 4) {
                console.warn('Invalid effect format (requires 4 parts):', effectString);
                return;
            }

            const [condition, operator, amount, stat] = parts;

            // Evaluate condition - this now returns a multiplier (1 or greater) instead of boolean
            const conditionMultiplier = this.evaluateCondition(condition);
            if (conditionMultiplier === 0) {
                return; // Condition not met
            }

            // Validate and parse amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount)) {
                console.warn('Invalid amount in effect:', effectString);
                return;
            }

            // Validate stat
            const statKey = stat.toLowerCase();
            if (!this.currentPools.hasOwnProperty(statKey)) {
                console.warn('Invalid stat in effect:', stat);
                return;
            }

            // Apply the effect with condition multiplier
            const effectiveAmount = numAmount * conditionMultiplier;
            const currentValue = this.currentPools[statKey];
            let newValue = currentValue;

            switch (operator) {
                case '+':
                    newValue = currentValue + effectiveAmount;
                    break;
                case '-':
                    newValue = currentValue - effectiveAmount;
                    break;
                case '*':
                    newValue = currentValue * effectiveAmount;
                    break;
                case '/':
                    if (effectiveAmount === 0) {
                        console.warn('Division by zero in effect:', effectString);
                        return;
                    }
                    newValue = currentValue / effectiveAmount;
                    break;
                default:
                    console.warn('Unknown operator in effect:', operator);
                    return;
            }

            // Handle overflow and underflow
            if (!isFinite(newValue)) {
                console.warn('Non-finite result in effect:', effectString);
                return;
            }

            this.currentPools[statKey] = newValue;

            // Ensure no negative values except for money
            if (statKey !== 'money') {
                this.currentPools[statKey] = Math.max(0, this.currentPools[statKey]);
            }

        } catch (error) {
            console.error('Error applying effect:', effectString, error);
        }
    }

    /**
     * Evaluate condition and return multiplier
     * @param {string} condition - Condition to evaluate
     * @returns {number} Multiplier value (0 if condition not met, 1+ if met)
     */
    evaluateCondition(condition) {
        if (!condition || condition === 'None') {
            return 1; // No condition = always apply effect once
        }

        try {
            // RunnerType: Check if specific runner type is configured
            if (condition.startsWith('RunnerType:')) {
                const requiredType = condition.split(':')[1];
                const hasType = this.runners.some(runner => runner.type === requiredType);
                return hasType ? 1 : 0;
            }

            // RunnerStat: Calculate multiplier based on stat total divided by threshold
            if (condition.startsWith('RunnerStat:')) {
                return this.evaluateRunnerStatCondition(condition);
            }

            // NodeColor: Check if specific color nodes are selected
            if (condition.startsWith('NodeColor:')) {
                const requiredColor = condition.split(':')[1];
                const hasColor = this.selectedNodes.some(nodeId => {
                    const node = this.getNodeById(nodeId);
                    return node && node.color === requiredColor;
                });
                return hasColor ? 1 : 0;
            }

            // NodeColorCombo: Check if multiple specific colors are selected
            if (condition.startsWith('NodeColorCombo:')) {
                const requiredColors = condition.split(':')[1].split(',').map(c => c.trim());
                const hasAllColors = requiredColors.every(color => {
                    return this.selectedNodes.some(nodeId => {
                        const node = this.getNodeById(nodeId);
                        return node && node.color === color;
                    });
                });
                return hasAllColors ? 1 : 0;
            }

            // Log unknown condition types for debugging
            console.warn('Unknown condition type:', condition);
            return 1; // Default to apply effect once for unknown conditions

        } catch (error) {
            console.error('Error evaluating condition:', condition, error);
            return 0;
        }
    }

    /**
     * Get total stat across all runners
     * @param {string} statType - Stat type to sum
     * @returns {number} Total stat value
     */
    getTotalRunnerStat(statType) {
        return this.runners.reduce((total, runner) => {
            return total + (runner.stats[statType] || 0);
        }, 0);
    }

    /**
     * Evaluate runner stat conditions and return multiplier
     * @param {string} condition - RunnerStat condition to evaluate
     * @returns {number} Multiplier based on stat total divided by threshold
     */
    evaluateRunnerStatCondition(condition) {
        try {
            const conditionPart = condition.split(':')[1];

            // Parse the condition to extract stat types and threshold
            let statTypes, threshold;

            // Support format like "muscle>=3" or "face+muscle>=6" for multiple stats
            if (conditionPart.includes('>=')) {
                [statTypes, threshold] = conditionPart.split('>=');
            } else if (conditionPart.includes('<=')) {
                [statTypes, threshold] = conditionPart.split('<=');
            } else if (conditionPart.includes('==') || conditionPart.includes('=')) {
                [statTypes, threshold] = conditionPart.split(/==?/);
            } else if (conditionPart.includes('>')) {
                [statTypes, threshold] = conditionPart.split('>');
            } else if (conditionPart.includes('<')) {
                [statTypes, threshold] = conditionPart.split('<');
            } else {
                console.warn('Unknown operator in RunnerStat condition:', condition);
                return 0;
            }

            const thresholdValue = parseInt(threshold.trim());
            if (isNaN(thresholdValue) || thresholdValue <= 0) {
                console.warn('Invalid threshold in RunnerStat condition:', threshold);
                return 0;
            }

            // Calculate total stat value
            // Support multiple stats separated by '+' (e.g., "face+muscle")
            const statTypesList = statTypes.trim().split('+').map(s => s.trim());
            let totalStatValue = 0;

            for (const statType of statTypesList) {
                if (['face', 'muscle', 'hacker', 'ninja'].includes(statType)) {
                    totalStatValue += this.getTotalRunnerStat(statType);
                } else {
                    console.warn('Invalid stat type in condition:', statType);
                    return 0;
                }
            }

            // Calculate multiplier: total stat value divided by threshold (floored)
            const multiplier = Math.floor(totalStatValue / thresholdValue);

            // Return the multiplier (0 if condition not met, 1+ if met)
            return multiplier;

        } catch (error) {
            console.error('Error evaluating RunnerStat condition:', condition, error);
            return 0;
        }
    }

    /**
     * Apply prevention mechanics (2 Grit = 1 Damage prevention, 2 Veil = 1 Risk prevention)
     * For preview display, we calculate what would be prevented but don't actually reduce the pools
     */
    applyPreventionMechanics() {
        const startTime = performance.now();

        // Store original values for prevention calculation
        const originalDamage = this.currentPools.damage;
        const originalRisk = this.currentPools.risk;
        const originalGrit = this.currentPools.grit;
        const originalVeil = this.currentPools.veil;

        // Calculate prevention amounts
        const maxDamagePrevention = Math.floor(this.currentPools.grit / 2);
        const maxRiskPrevention = Math.floor(this.currentPools.veil / 2);

        // Calculate what would be prevented
        const actualDamagePrevented = Math.min(maxDamagePrevention, this.currentPools.damage);
        const actualRiskPrevented = Math.min(maxRiskPrevention, this.currentPools.risk);

        // For preview display, don't actually reduce the pools - just store prevention data
        // The UI will handle showing the prevention effects without modifying the displayed pool values

        const endTime = performance.now();
        if (endTime - startTime > 10) {
            console.warn(`Slow prevention calculation: ${endTime - startTime}ms`);
        }

        // Store prevention data for UI display
        this.preventionData = {
            damagePrevented: actualDamagePrevented,
            riskPrevented: actualRiskPrevented,
            gritUsed: actualDamagePrevented * 2,
            veilUsed: actualRiskPrevented * 2,
            originalDamage,
            originalRisk,
            originalGrit,
            originalVeil,
            // Store what the final values would be after prevention for display purposes
            finalDamage: Math.max(0, originalDamage - actualDamagePrevented),
            finalRisk: Math.max(0, originalRisk - actualRiskPrevented)
        };
    }

    /**
     * Get node by ID
     * @param {string} nodeId - Node ID to find
     * @returns {Object|null} Node object or null if not found
     */
    getNodeById(nodeId) {
        if (!this.contractData) return null;
        return this.contractData.find(node => node.id === nodeId) || null;
    }

    /**
     * Validate current runner configuration
     * @returns {boolean} True if configuration is valid
     */
    validateConfiguration() {
        // Check if at least one runner is configured
        const activeRunners = this.runners.filter(runner => runner.type !== 'Empty');

        if (activeRunners.length === 0) {
            console.warn('No runners configured');
            return false;
        }

        // Check if all active runners have valid stats
        for (const runner of activeRunners) {
            const totalStats = Object.values(runner.stats).reduce((sum, stat) => sum + stat, 0);
            if (totalStats === 0) {
                console.warn('Active runner has no stats configured');
                return false;
            }
        }

        // Check if contract is loaded
        if (!this.contractData || this.contractData.length === 0) {
            console.warn('No contract data loaded');
            return false;
        }

        return true;
    }

    /**
     * Select a node (for future milestone implementation)
     * @param {string} nodeId - Node ID to select
     * @returns {boolean} True if selection was successful
     */
    selectNode(nodeId) {
        const node = this.getNodeById(nodeId);
        if (!node || !node.available) {
            return false;
        }

        if (!this.selectedNodes.includes(nodeId)) {
            this.selectedNodes.push(nodeId);
            node.selected = true;

            // Update available nodes based on connections
            this.updateAvailableNodes();

            // Recalculate pools
            this.calculateCurrentPools();

            return true;
        }

        return false;
    }

    /**
     * Update which nodes are available for selection
     */
    updateAvailableNodes() {
        if (!this.contractData) return;

        this.contractData.forEach(node => {
            // Start nodes (Layer 0 or Type 'Start') are always available
            if (this.isStartNode(node)) {
                node.available = true;
                return;
            }

            // Synergy nodes should also be always available
            if (node.type === 'Synergy') {
                node.available = true;
                return;
            }

            // Check if any parent nodes are selected
            const parentNodes = this.contractData.filter(parentNode =>
                parentNode.connections.includes(node.id)
            );

            // If no parent nodes exist, this node should also be available (orphan nodes)
            if (parentNodes.length === 0) {
                node.available = true;
                return;
            }

            // Otherwise, check if any parent nodes are selected
            node.available = parentNodes.some(parentNode => parentNode.selected);
        });
    }

    /**
     * Reset game state to initial values
     */
    reset() {
        this.contractData = null;
        this.runners = this.initializeRunners();
        this.selectedNodes = [];
        this.currentPools = this.initializePools();
    }

    /**
     * Get current game state
     * @returns {Object} Current game state
     */
    getGameState() {
        return {
            playerMoney: this.playerMoney,
            playerRisk: this.playerRisk,
            contractsCompleted: this.contractsCompleted,
            hasContract: !!this.contractData,
            runnerCount: this.runners.filter(r => r.type !== 'Empty').length,
            selectedNodeCount: this.selectedNodes.length,
            currentPools: { ...this.currentPools },
            preventionData: this.preventionData || null
        };
    }

    /**
     * Get runner summary
     * @returns {Object} Runner summary information
     */
    getRunnerSummary() {
        return {
            runners: this.runners.map((runner, index) => ({
                slot: index,
                type: runner.type,
                stats: { ...runner.stats },
                totalStats: Object.values(runner.stats).reduce((sum, stat) => sum + stat, 0)
            })),
            totalStats: {
                face: this.getTotalRunnerStat('face'),
                muscle: this.getTotalRunnerStat('muscle'),
                hacker: this.getTotalRunnerStat('hacker'),
                ninja: this.getTotalRunnerStat('ninja')
            }
        };
    }

    /**
     * Get contract summary
     * @returns {Object} Contract summary information
     */
    getContractSummary() {
        if (!this.contractData) {
            return { loaded: false };
        }

        const nodesByLayer = {};
        const nodesByColor = {};

        this.contractData.forEach(node => {
            // Group by layer
            if (!nodesByLayer[node.layer]) {
                nodesByLayer[node.layer] = [];
            }
            nodesByLayer[node.layer].push(node);

            // Group by color
            if (!nodesByColor[node.color]) {
                nodesByColor[node.color] = 0;
            }
            nodesByColor[node.color]++;
        });

        return {
            loaded: true,
            totalNodes: this.contractData.length,
            selectedNodes: this.selectedNodes.length,
            availableNodes: this.contractData.filter(n => n.available).length,
            nodesByLayer,
            nodesByColor,
            layers: Object.keys(nodesByLayer).length
        };
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            contractLoaded: !!this.contractData,
            nodeCount: this.contractData ? this.contractData.length : 0,
            selectedNodes: this.selectedNodes,
            runners: this.getRunnerSummary(),
            currentPools: this.currentPools,
            gameState: this.getGameState()
        };
    }
}