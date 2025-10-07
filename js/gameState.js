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
            this.contractData = contractData.map(node => {
                const baseNode = {
                    id: node['Node ID'] || node.id,
                    description: node['Description'] || node.description,
                    effectDescription: node['Effect Desc'] || node.effectDescription,
                    effect1: node['Effect 1'] || node.effect1,
                    effect2: node['Effect 2'] || node.effect2,
                    type: node['Type'] || node.type,
                    color: node['Color'] || node.color,
                    gateCondition: node['GateCondition'] || node.gateCondition || '',
                    connections: this.parseConnections(node['Connections'] || node.connections),
                    selected: false,
                    available: this.shouldBeInitiallyAvailable(node)
                };

                // Handle both X,Y format and legacy Layer/Slot format
                if (typeof node.x === 'number' && typeof node.y === 'number') {
                    // New X,Y positioning format
                    baseNode.x = node.x;
                    baseNode.y = node.y;
                    baseNode.layer = node.layer || 0; // Keep for backward compatibility
                    baseNode.slot = node.slot || '';
                } else {
                    // Legacy Layer/Slot format
                    baseNode.layer = parseInt(node['Layer'] || node.layer) || 0;
                    baseNode.slot = node['Slot'] || node.slot || '';
                    // X,Y will be calculated by layout algorithm
                    baseNode.x = 0;
                    baseNode.y = 0;
                }

                return baseNode;
            });

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
     * @param {string|Array} connections - Connection string from CSV or array from editor
     * @returns {Array} Array of connected node IDs
     */
    parseConnections(connections) {
        if (!connections) {
            return [];
        }

        // Handle array format (from editor)
        if (Array.isArray(connections)) {
            return connections.filter(c => c && c.trim() !== '');
        }

        // Handle string format (from CSV)
        if (typeof connections === 'string') {
            if (connections.trim() === '') {
                return [];
            }
            // Support both comma and semicolon separators
            const separator = connections.includes(',') ? ',' : ';';
            return connections.split(separator).map(c => c.trim()).filter(c => c !== '');
        }

        return [];
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

        // PASS 1: Collect and separate effects by operator type
        const standardEffects = [];
        const percentageEffects = [];

        this.selectedNodes.forEach(nodeId => {
            const node = this.getNodeById(nodeId);
            if (node && node.type !== 'Gate') {
                // Separate effects by operator type
                [node.effect1, node.effect2].forEach(effect => {
                    if (!effect || effect.trim() === '') return;

                    const parts = effect.split(';');
                    if (parts.length >= 4) {
                        const operator = parts[1];
                        if (operator === '%') {
                            percentageEffects.push(effect);
                        } else {
                            standardEffects.push(effect);
                        }
                    }
                });
            }
        });

        // PASS 2: Apply standard effects first (+, -, *, /)
        standardEffects.forEach(effect => this.applyEffect(effect));

        // PASS 3: Calculate preliminary prevention for prevention-based conditions
        this.calculatePreventionAmounts();

        // PASS 4: Apply percentage effects (after all base calculations)
        percentageEffects.forEach(effect => this.applyEffect(effect));

        // PASS 5: Apply final prevention mechanics (unchanged, runs last)
        this.applyPreventionMechanics();

        const endTime = performance.now();
        if (endTime - startTime > 100) {
            console.warn(`Slow calculation detected: ${endTime - startTime}ms for ${this.selectedNodes.length} nodes`);
        }

        return { ...this.currentPools };
    }

    /**
     * Calculate prevention amounts based on current pool values
     * This runs AFTER standard effects but BEFORE percentage effects
     * Stores results in this.preventionData for use by prevention-based conditions
     */
    calculatePreventionAmounts() {
        // Calculate maximum prevention based on current Grit/Veil
        const maxDamagePrevention = Math.floor(this.currentPools.grit / 2);
        const maxRiskPrevention = Math.floor(this.currentPools.veil / 2);

        // Calculate actual prevention (capped at damage/risk values)
        const actualDamagePrevented = Math.min(maxDamagePrevention, this.currentPools.damage);
        const actualRiskPrevented = Math.min(maxRiskPrevention, this.currentPools.risk);

        // Store for use by prevention-based conditions
        // Note: This is preliminary data - final prevention happens in applyPreventionMechanics()
        if (!this.preventionData) {
            this.preventionData = {};
        }

        this.preventionData.preliminaryDamagePrevented = Math.max(0, actualDamagePrevented);
        this.preventionData.preliminaryRiskPrevented = Math.max(0, actualRiskPrevented);

        // Log for debugging
        if (actualDamagePrevented > 0 || actualRiskPrevented > 0) {
            console.log(`Preliminary prevention: ${actualDamagePrevented} damage, ${actualRiskPrevented} risk`);
        }
    }

    /**
     * Apply effects from a specific node
     * @param {Object} node - Node to apply effects from
     */
    applyNodeEffects(node) {
        // Skip gate nodes - they don't have effects
        if (node.type === 'Gate') {
            return;
        }

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
                case '%':
                    // Percentage modification: current + (current * percentage/100)
                    // effectiveAmount already includes condition multiplier
                    const percentageMultiplier = effectiveAmount / 100;
                    newValue = currentValue + (currentValue * percentageMultiplier);
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
            // RunnerType: Count how many runners of this type are configured
            if (condition.startsWith('RunnerType:')) {
                const requiredType = condition.split(':')[1];
                const count = this.runners.filter(runner => runner.type === requiredType).length;
                return count;
            }

            // RunnerStat: Calculate multiplier based on stat total divided by threshold
            if (condition.startsWith('RunnerStat:')) {
                return this.evaluateRunnerStatCondition(condition);
            }

            // NodeColor: Count how many nodes of this color are selected (excludes Gate nodes)
            if (condition.startsWith('NodeColor:')) {
                const requiredColor = condition.split(':')[1];
                const count = this.selectedNodes.filter(nodeId => {
                    const node = this.getNodeById(nodeId);
                    return node && node.color === requiredColor && node.type !== 'Gate';
                }).length;
                return count;
            }

            // NodeColorCombo: Count complete sets of the color combination
            // For example, if you need Red,Blue and have 3 Red and 2 Blue, you have 2 complete sets
            if (condition.startsWith('NodeColorCombo:')) {
                const requiredColors = condition.split(':')[1].split(',').map(c => c.trim());

                // Count how many of each required color we have
                const colorCounts = requiredColors.map(color => {
                    return this.selectedNodes.filter(nodeId => {
                        const node = this.getNodeById(nodeId);
                        return node && node.color === color && node.type !== 'Gate';
                    }).length;
                });

                // Return the minimum count (limiting factor for complete sets)
                // If any required color has 0 nodes, the whole combo fails (returns 0)
                return colorCounts.length > 0 ? Math.min(...colorCounts) : 0;
            }

            // PrevDam: Returns multiplier based on damage prevented by Grit
            if (condition === 'PrevDam' || condition.startsWith('PrevDam;')) {
                // Handle both "PrevDam" and "PrevDam;" formats for flexibility
                if (!this.preventionData || typeof this.preventionData.preliminaryDamagePrevented !== 'number') {
                    return 0; // No prevention data available
                }

                const damagePrevented = this.preventionData.preliminaryDamagePrevented;

                // Return the amount of damage prevented as the multiplier
                // If 3 damage prevented, effects using PrevDam will be 3x stronger
                return Math.max(0, damagePrevented);
            }

            // PrevRisk: Returns multiplier based on risk prevented by Veil
            if (condition === 'PrevRisk' || condition.startsWith('PrevRisk;')) {
                // Handle both "PrevRisk" and "PrevRisk;" formats for flexibility
                if (!this.preventionData || typeof this.preventionData.preliminaryRiskPrevented !== 'number') {
                    return 0; // No prevention data available
                }

                const riskPrevented = this.preventionData.preliminaryRiskPrevented;

                // Return the amount of risk prevented as the multiplier
                // If 4 risk prevented, effects using PrevRisk will be 4x stronger
                return Math.max(0, riskPrevented);
            }

            // RiskDamPair: Returns multiplier based on pairs of damage AND risk prevented
            // For every point where both damage and risk are prevented, count 1
            if (condition === 'RiskDamPair' || condition.startsWith('RiskDamPair;')) {
                // Handle both "RiskDamPair" and "RiskDamPair;" formats for flexibility
                if (!this.preventionData ||
                    typeof this.preventionData.preliminaryDamagePrevented !== 'number' ||
                    typeof this.preventionData.preliminaryRiskPrevented !== 'number') {
                    return 0; // No prevention data available
                }

                const damagePrevented = this.preventionData.preliminaryDamagePrevented;
                const riskPrevented = this.preventionData.preliminaryRiskPrevented;

                // Return the minimum of the two (pairs require both damage AND risk)
                // If 5 damage prevented and 3 risk prevented, you have 3 pairs
                return Math.min(damagePrevented, riskPrevented);
            }

            // ColorForEach: Count how many different colors of nodes are selected
            // Each unique color counts once, regardless of how many nodes of that color
            if (condition === 'ColorForEach' || condition.startsWith('ColorForEach;')) {
                // Collect all unique colors from selected nodes (excluding Gate nodes)
                const uniqueColors = new Set();

                this.selectedNodes.forEach(nodeId => {
                    const node = this.getNodeById(nodeId);
                    if (node && node.type !== 'Gate' && node.color) {
                        uniqueColors.add(node.color);
                    }
                });

                // Return the count of unique colors
                return uniqueColors.size;
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
     * Nodes become available when:
     * 1. They are start nodes (layer 0 or Type 'Start')
     * 2. They are Synergy nodes (always available)
     * 3. They are Gate nodes AND gate condition is met AND at least one connected predecessor is selected
     * 4. They are normal nodes AND at least one connected predecessor node is selected
     */
    updateAvailableNodes() {
        if (!this.contractData) return;

        this.contractData.forEach(node => {
            // Skip already selected nodes
            if (node.selected) {
                node.available = false;
                return;
            }

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

            // Gate node availability logic
            if (node.type === 'Gate') {
                // Gate must have connection availability AND gate condition met
                const hasConnectionAvailability = this.hasAvailableConnection(node);
                const gateConditionMet = this.evaluateGateCondition(node);

                node.available = hasConnectionAvailability && gateConditionMet;
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
     * Check if node has at least one selected predecessor
     * @param {Object} node - Node to check
     * @returns {boolean} True if has available connection
     */
    hasAvailableConnection(node) {
        // Find nodes that connect TO this node
        const predecessors = this.contractData.filter(otherNode => {
            return otherNode.connections && otherNode.connections.includes(node.id);
        });

        // Node is available if any predecessor is selected
        return predecessors.some(pred => pred.selected);
    }

    /**
     * Evaluate gate condition for a gate node
     * @param {Object} node - Gate node to evaluate
     * @returns {boolean} True if condition is met
     */
    evaluateGateCondition(node) {
        if (node.type !== 'Gate') {
            return true; // Non-gate nodes are always available based on connections
        }

        if (!node.gateCondition || node.gateCondition.trim() === '') {
            console.warn(`Gate node ${node.id} has no gate condition`);
            return false;
        }

        try {
            const [conditionPart, thresholdStr] = node.gateCondition.split(';');
            const threshold = parseInt(thresholdStr);

            if (isNaN(threshold)) {
                console.error(`Invalid threshold in gate condition: ${node.gateCondition}`);
                return false;
            }

            // Node condition (check if specific nodes are selected)
            if (conditionPart.startsWith('Node:')) {
                return this.evaluateNodeGateCondition(conditionPart, threshold);
            }

            // RunnerType condition
            if (conditionPart.startsWith('RunnerType:')) {
                return this.evaluateRunnerTypeGateCondition(conditionPart, threshold);
            }

            // RunnerStat condition
            if (conditionPart.startsWith('RunnerStat:')) {
                return this.evaluateRunnerStatGateCondition(conditionPart, threshold);
            }

            console.warn(`Unknown gate condition type: ${conditionPart}`);
            return false;

        } catch (error) {
            console.error(`Error evaluating gate condition for ${node.id}:`, error);
            return false;
        }
    }

    /**
     * Evaluate Node gate condition
     * @param {string} conditionPart - Condition part (e.g., "Node:NODE001,NODE002")
     * @param {number} threshold - Required count (0 = ALL nodes must be selected, >0 = at least threshold nodes)
     * @returns {boolean} True if condition is met
     */
    evaluateNodeGateCondition(conditionPart, threshold) {
        // Extract node IDs from condition
        const nodeIdsStr = conditionPart.substring('Node:'.length);
        const requiredNodeIds = nodeIdsStr.split(',').map(id => id.trim()).filter(id => id !== '');

        if (requiredNodeIds.length === 0) {
            console.warn('Node gate condition has no node IDs specified');
            return false;
        }

        // Count how many of the required nodes are selected
        const selectedCount = requiredNodeIds.filter(nodeId => {
            return this.selectedNodes.includes(nodeId);
        }).length;

        // Evaluate based on threshold
        if (threshold === 0) {
            // Threshold of 0 means ALL specified nodes must be selected (AND logic)
            return selectedCount === requiredNodeIds.length;
        } else {
            // Threshold > 0 means at least that many nodes must be selected
            return selectedCount >= threshold;
        }
    }

    /**
     * Evaluate RunnerType gate condition
     * @param {string} conditionPart - Condition part (e.g., "RunnerType:hacker,muscle")
     * @param {number} threshold - Required count
     * @returns {boolean} True if condition is met
     */
    evaluateRunnerTypeGateCondition(conditionPart, threshold) {
        const typesStr = conditionPart.substring('RunnerType:'.length);
        const requiredTypes = typesStr.split(',').map(t => t.trim().toLowerCase());

        // Count runners matching any of the required types
        const matchingCount = this.runners.filter(runner => {
            return requiredTypes.includes(runner.type.toLowerCase());
        }).length;

        return matchingCount >= threshold;
    }

    /**
     * Evaluate RunnerStat gate condition
     * @param {string} conditionPart - Condition part (e.g., "RunnerStat:muscle,stealth")
     * @param {number} threshold - Required stat sum
     * @returns {boolean} True if condition is met
     */
    evaluateRunnerStatGateCondition(conditionPart, threshold) {
        const statsStr = conditionPart.substring('RunnerStat:'.length);
        const requiredStats = statsStr.split(',').map(s => s.trim().toLowerCase());

        // Sum the required stats across all runners
        let totalStats = 0;
        this.runners.forEach(runner => {
            requiredStats.forEach(statName => {
                totalStats += runner.stats[statName] || 0;
            });
        });

        return totalStats >= threshold;
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
     * Execute contract with current configuration
     * @returns {Object} Execution results
     */
    executeContract() {
        const startTime = performance.now();

        // Validate configuration before execution
        if (!this.validateConfiguration()) {
            throw new Error('Invalid configuration for contract execution');
        }

        // Calculate current pools one final time
        this.calculateCurrentPools();

        // Store pre-execution state
        const preExecutionState = {
            money: this.playerMoney,
            risk: this.playerRisk,
            contracts: this.contractsCompleted,
            currentPools: { ...this.currentPools }
        };

        // Apply final effects to player state
        const finalDamage = Math.max(0, this.currentPools.damage);
        const finalRisk = Math.max(0, this.currentPools.risk);
        const moneyEarned = Math.max(0, this.currentPools.money);

        // Update player state
        this.playerMoney += moneyEarned;
        this.playerRisk += finalRisk;
        this.contractsCompleted += 1;

        // Determine execution success/failure
        const success = finalDamage <= 5 && finalRisk <= 10; // Basic thresholds

        // Create execution results
        const executionResults = {
            success: success,
            preExecution: preExecutionState,
            postExecution: {
                money: this.playerMoney,
                risk: this.playerRisk,
                contracts: this.contractsCompleted
            },
            finalPools: { ...this.currentPools },
            finalDamage: finalDamage,
            finalRisk: finalRisk,
            moneyEarned: moneyEarned,
            preventionApplied: this.getPreventionDetails(),
            selectedNodesCount: this.selectedNodes.length,
            executionTime: performance.now() - startTime
        };

        // Save session state after execution
        this.saveSessionState();

        return executionResults;
    }

    /**
     * Get prevention mechanics details for results display
     * @returns {string} Prevention details
     */
    getPreventionDetails() {
        const damagePreventionPossible = Math.floor(this.currentPools.grit / 2);
        const riskPreventionPossible = Math.floor(this.currentPools.veil / 2);

        if (damagePreventionPossible === 0 && riskPreventionPossible === 0) {
            return 'None';
        }

        const details = [];
        if (damagePreventionPossible > 0) {
            details.push(`${damagePreventionPossible} Damage prevented by Grit`);
        }
        if (riskPreventionPossible > 0) {
            details.push(`${riskPreventionPossible} Risk prevented by Veil`);
        }

        return details.join(', ');
    }

    /**
     * Reset contract state for new contract
     */
    resetContract() {
        this.selectedNodes = [];
        this.contractData = null;
        this.currentPools = this.initializePools();

        // Clear UI state but preserve session data
        console.log('Contract state reset for new contract');
    }

    /**
     * Reset entire game session
     */
    resetSession() {
        this.resetContract();
        this.runners = this.initializeRunners();
        this.playerMoney = 0;
        this.playerRisk = 0;
        this.contractsCompleted = 0;

        // Clear session storage
        this.clearSessionState();
        console.log('Full game session reset');
    }

    /**
     * Save current state to session storage
     */
    saveSessionState() {
        try {
            const sessionData = {
                playerMoney: this.playerMoney,
                playerRisk: this.playerRisk,
                contractsCompleted: this.contractsCompleted,
                runners: this.runners,
                timestamp: Date.now()
            };

            sessionStorage.setItem('johnsonGameState', JSON.stringify(sessionData));
            console.log('Session state saved successfully');
        } catch (error) {
            console.warn('Failed to save session state:', error);
        }
    }

    /**
     * Load state from session storage
     * @returns {boolean} True if state was loaded successfully
     */
    loadSessionState() {
        try {
            const sessionData = sessionStorage.getItem('johnsonGameState');
            if (!sessionData) {
                return false;
            }

            const parsedData = JSON.parse(sessionData);

            // Validate session data structure
            if (typeof parsedData.playerMoney !== 'number' ||
                typeof parsedData.playerRisk !== 'number' ||
                typeof parsedData.contractsCompleted !== 'number' ||
                !Array.isArray(parsedData.runners)) {
                console.warn('Invalid session data structure, ignoring');
                return false;
            }

            // Check if session is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (parsedData.timestamp && (Date.now() - parsedData.timestamp) > maxAge) {
                console.log('Session data too old, starting fresh');
                this.clearSessionState();
                return false;
            }

            // Restore state
            this.playerMoney = parsedData.playerMoney;
            this.playerRisk = parsedData.playerRisk;
            this.contractsCompleted = parsedData.contractsCompleted;
            this.runners = parsedData.runners;

            console.log('Session state loaded successfully');
            return true;
        } catch (error) {
            console.warn('Failed to load session state:', error);
            return false;
        }
    }

    /**
     * Clear session storage
     */
    clearSessionState() {
        try {
            sessionStorage.removeItem('johnsonGameState');
            console.log('Session state cleared');
        } catch (error) {
            console.warn('Failed to clear session state:', error);
        }
    }

    /**
     * Check if session state exists
     * @returns {boolean} True if session state exists
     */
    hasSessionState() {
        try {
            return !!sessionStorage.getItem('johnsonGameState');
        } catch (error) {
            return false;
        }
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
            gameState: this.getGameState(),
            hasSessionState: this.hasSessionState()
        };
    }
}