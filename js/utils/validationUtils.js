/**
 * ValidationUtils - Centralized validation utility for Johnson Prototype
 *
 * This class consolidates all validation logic from csvLoader.js, fileManager.js, and gameState.js
 * into a single source of truth. It provides static methods for validating effect strings,
 * gate conditions, connections, node data, and all game data structures.
 *
 * Purpose: Eliminate ~400 lines of duplicate validation code and ensure consistency
 * across CSV import, editor operations, and runtime validation.
 */
class ValidationUtils {
    // ===== CONSTANTS =====

    static VALID_COLORS = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey'];
    static VALID_NODE_TYPES = ['Normal', 'Synergy', 'Start', 'End', 'Gate'];
    static VALID_OPERATORS = ['+', '-', '*', '/', '%'];
    static VALID_STATS = ['damage', 'risk', 'money', 'grit', 'veil'];
    static VALID_RUNNER_TYPES = ['Face', 'Muscle', 'Hacker', 'Ninja'];
    static VALID_RUNNER_STATS = ['face', 'muscle', 'hacker', 'ninja'];

    // Valid condition types for effect strings
    static VALID_CONDITION_TYPES = [
        'None',
        'RunnerType:',
        'RunnerStat:',
        'NodeColor:',
        'NodeColorCombo:',
        'PrevDam',
        'PrevRisk',
        'RiskDamPair',
        'ColorForEach'
    ];

    // Valid gate condition types
    static VALID_GATE_CONDITION_TYPES = [
        'Node:',
        'RunnerType:',
        'RunnerStat:'
    ];

    // ===== EFFECT STRING VALIDATION =====

    /**
     * Validate effect string format: Condition;Operator;Amount;Stat
     * Consolidates logic from csvLoader.js (lines 603-658)
     *
     * @param {string} effectString - Effect string to validate
     * @param {Object} context - Optional context for error reporting
     * @param {number} context.rowNumber - Row number for error messages
     * @param {string} context.columnName - Column name for error messages
     * @returns {Object} { errors: Array<string> }
     */
    static validateEffectString(effectString, context = {}) {
        const errors = [];
        const { rowNumber, columnName } = context;
        const prefix = rowNumber && columnName ? `Row ${rowNumber} ${columnName}` : 'Effect';

        try {
            const parts = effectString.split(';');
            if (parts.length !== 4) {
                errors.push(`${prefix}: Effect must have exactly 4 parts separated by semicolons. Got ${parts.length} parts: '${effectString}'`);
                return { errors };
            }

            const [condition, operator, amount, stat] = parts;

            // Validate condition part
            const conditionErrors = this.validateEffectCondition(condition, prefix);
            errors.push(...conditionErrors);

            // Validate operator
            if (!this.VALID_OPERATORS.includes(operator)) {
                errors.push(`${prefix}: Invalid operator '${operator}'. Must be one of: ${this.VALID_OPERATORS.join(', ')}`);
            }

            // Validate amount
            if (!amount || amount.trim() === '') {
                errors.push(`${prefix}: Amount part cannot be empty`);
            } else if (isNaN(parseFloat(amount))) {
                errors.push(`${prefix}: Amount must be a number, got '${amount}'`);
            } else if (operator === '/' && parseFloat(amount) === 0) {
                errors.push(`${prefix}: Division by zero is not allowed`);
            }

            // Validate stat (case-insensitive)
            if (!stat || stat.trim() === '') {
                errors.push(`${prefix}: Stat part cannot be empty`);
            } else if (!this.VALID_STATS.includes(stat.toLowerCase())) {
                errors.push(`${prefix}: Invalid stat '${stat}'. Must be one of: ${this.VALID_STATS.join(', ')} (case-insensitive)`);
            }

        } catch (error) {
            errors.push(`${prefix}: Error parsing effect string '${effectString}': ${error.message}`);
        }

        return { errors };
    }

    /**
     * Validate effect condition part
     * @param {string} condition - Condition string to validate
     * @param {string} prefix - Error message prefix
     * @returns {Array<string>} Array of error messages
     */
    static validateEffectCondition(condition, prefix) {
        const errors = [];

        if (!condition || condition.trim() === '') {
            errors.push(`${prefix}: Condition part cannot be empty`);
            return errors;
        }

        // Check if it's a valid condition type
        const isValidCondition = condition === 'None' ||
                                condition === 'PrevDam' ||
                                condition === 'PrevRisk' ||
                                condition === 'RiskDamPair' ||
                                condition === 'ColorForEach' ||
                                this.VALID_CONDITION_TYPES.some(type => condition.startsWith(type));

        if (!isValidCondition) {
            errors.push(`${prefix}: Invalid condition '${condition}'. Must be 'None', 'PrevDam', 'PrevRisk', 'RiskDamPair', 'ColorForEach', or start with: RunnerType:, RunnerStat:, NodeColor:, NodeColorCombo:`);
        }

        // Additional validation for specific condition types
        if (condition.startsWith('RunnerType:')) {
            const type = condition.substring('RunnerType:'.length);
            if (!type || type.trim() === '') {
                errors.push(`${prefix}: RunnerType condition must specify a runner type`);
            }
        }

        if (condition.startsWith('RunnerStat:')) {
            const statPart = condition.substring('RunnerStat:'.length);
            if (!statPart || statPart.trim() === '') {
                errors.push(`${prefix}: RunnerStat condition must specify a stat and threshold`);
            }
        }

        if (condition.startsWith('NodeColor:')) {
            const color = condition.substring('NodeColor:'.length);
            if (!color || color.trim() === '') {
                errors.push(`${prefix}: NodeColor condition must specify a color`);
            }
        }

        if (condition.startsWith('NodeColorCombo:')) {
            const colors = condition.substring('NodeColorCombo:'.length);
            if (!colors || colors.trim() === '') {
                errors.push(`${prefix}: NodeColorCombo condition must specify colors`);
            }
        }

        return errors;
    }

    // ===== GATE CONDITION VALIDATION =====

    /**
     * Validate gate condition format: Type:Params;Threshold
     * Consolidates logic from csvLoader.js (lines 753-800) and fileManager.js (lines 512-585)
     *
     * @param {string} conditionString - Gate condition to validate
     * @param {Object} context - Optional context for error reporting
     * @param {string} context.nodeId - Node ID for error messages
     * @param {number} context.rowNumber - Row number for error messages
     * @returns {Object} { valid: boolean, message: string, errors: Array<string> }
     */
    static validateGateCondition(conditionString, context = {}) {
        const errors = [];
        const { nodeId, rowNumber } = context;
        const prefix = rowNumber ? `Row ${rowNumber}` : (nodeId ? `Node ${nodeId}` : 'Gate condition');

        if (!conditionString || conditionString.trim() === '') {
            return {
                valid: false,
                message: 'Gate condition cannot be empty',
                errors: ['Gate condition cannot be empty']
            };
        }

        try {
            const parts = conditionString.split(';');
            if (parts.length !== 2) {
                const message = 'Gate condition must have exactly 2 parts separated by semicolon (Type:Params;Threshold)';
                return {
                    valid: false,
                    message: message,
                    errors: [`${prefix}: ${message}`]
                };
            }

            const [conditionPart, thresholdStr] = parts;

            // Validate threshold
            const threshold = parseInt(thresholdStr);
            if (isNaN(threshold) || threshold < 0) {
                errors.push(`${prefix}: Gate condition threshold must be a non-negative integer`);
            }

            // Validate condition type and parameters
            if (conditionPart.startsWith('Node:')) {
                const nodeErrors = this.validateNodeGateCondition(conditionPart, prefix);
                errors.push(...nodeErrors);
            }
            else if (conditionPart.startsWith('RunnerType:')) {
                const runnerTypeErrors = this.validateRunnerTypeGateCondition(conditionPart, prefix);
                errors.push(...runnerTypeErrors);
            }
            else if (conditionPart.startsWith('RunnerStat:')) {
                const runnerStatErrors = this.validateRunnerStatGateCondition(conditionPart, prefix);
                errors.push(...runnerStatErrors);
            }
            else {
                errors.push(`${prefix}: Gate condition must start with Node:, RunnerType:, or RunnerStat:`);
            }

        } catch (error) {
            const message = `Error parsing gate condition: ${error.message}`;
            return {
                valid: false,
                message: message,
                errors: [`${prefix}: ${message}`]
            };
        }

        const isValid = errors.length === 0;
        return {
            valid: isValid,
            message: isValid ? 'Valid gate condition' : errors[0],
            errors: errors
        };
    }

    /**
     * Validate Node gate condition format
     * @param {string} conditionPart - Condition part (e.g., "Node:NODE001,NODE002")
     * @param {string} prefix - Error message prefix
     * @returns {Array<string>} Array of error messages
     */
    static validateNodeGateCondition(conditionPart, prefix) {
        const errors = [];
        const nodeIdsStr = conditionPart.substring('Node:'.length);
        const nodeIds = nodeIdsStr.split(',').map(id => id.trim()).filter(id => id !== '');

        if (nodeIds.length === 0) {
            errors.push(`${prefix}: Node gate condition requires at least one node ID`);
            return errors;
        }

        // Validate each node ID format
        nodeIds.forEach(nodeId => {
            if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
                errors.push(`${prefix}: Invalid node ID '${nodeId}' in gate condition. Must contain only letters, numbers, underscores, and hyphens`);
            }
        });

        return errors;
    }

    /**
     * Validate RunnerType gate condition format
     * @param {string} conditionPart - Condition part (e.g., "RunnerType:hacker,muscle")
     * @param {string} prefix - Error message prefix
     * @returns {Array<string>} Array of error messages
     */
    static validateRunnerTypeGateCondition(conditionPart, prefix) {
        const errors = [];
        const typesStr = conditionPart.substring('RunnerType:'.length);
        const types = typesStr.split(',').map(t => t.trim()).filter(t => t !== '');

        if (types.length === 0) {
            errors.push(`${prefix}: RunnerType gate condition requires at least one runner type`);
            return errors;
        }

        // Case-insensitive validation
        const validTypesLower = this.VALID_RUNNER_TYPES.map(t => t.toLowerCase());

        types.forEach(type => {
            if (!validTypesLower.includes(type.toLowerCase())) {
                errors.push(`${prefix}: Invalid runner type '${type}' in gate condition. Valid types: ${this.VALID_RUNNER_TYPES.join(', ')} (case-insensitive)`);
            }
        });

        return errors;
    }

    /**
     * Validate RunnerStat gate condition format
     * @param {string} conditionPart - Condition part (e.g., "RunnerStat:muscle,stealth")
     * @param {string} prefix - Error message prefix
     * @returns {Array<string>} Array of error messages
     */
    static validateRunnerStatGateCondition(conditionPart, prefix) {
        const errors = [];
        const statsStr = conditionPart.substring('RunnerStat:'.length);
        const stats = statsStr.split(',').map(s => s.trim()).filter(s => s !== '');

        if (stats.length === 0) {
            errors.push(`${prefix}: RunnerStat gate condition requires at least one stat`);
            return errors;
        }

        stats.forEach(stat => {
            if (!this.VALID_RUNNER_STATS.includes(stat.toLowerCase())) {
                errors.push(`${prefix}: Invalid stat '${stat}' in gate condition. Valid stats: ${this.VALID_RUNNER_STATS.join(', ')} (case-insensitive)`);
            }
        });

        return errors;
    }

    // ===== CONNECTIONS VALIDATION =====

    /**
     * Validate connections string format
     * Consolidates logic from csvLoader.js (lines 667-688)
     * Supports both comma-separated (editor) and semicolon-separated (legacy) formats
     *
     * @param {string} connectionsString - Connections string to validate
     * @param {Object} context - Optional context for error reporting
     * @param {number} context.rowNumber - Row number for error messages
     * @returns {Object} { errors: Array<string> }
     */
    static validateConnectionsString(connectionsString, context = {}) {
        const errors = [];
        const { rowNumber } = context;
        const prefix = rowNumber ? `Row ${rowNumber}` : 'Connections';

        try {
            // Support both comma-separated (editor format) and semicolon-separated (legacy format)
            const separator = connectionsString.includes(',') ? ',' : ';';
            const connections = connectionsString.split(separator).map(c => c.trim()).filter(c => c !== '');

            connections.forEach(connection => {
                if (!connection || connection.trim() === '') {
                    errors.push(`${prefix}: Empty connection found in connections string`);
                } else if (!/^[a-zA-Z0-9_-]+$/.test(connection)) {
                    errors.push(`${prefix}: Invalid connection ID '${connection}'. Must contain only letters, numbers, underscores, and hyphens`);
                }
            });

        } catch (error) {
            errors.push(`${prefix}: Error parsing connections string '${connectionsString}': ${error.message}`);
        }

        return { errors };
    }

    /**
     * Validate connection references against available node IDs
     * Consolidates logic from fileManager.js (lines 405-425)
     *
     * @param {Array} data - Array of node data objects
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static validateConnectionReferences(data) {
        const errors = [];
        const nodeIds = new Set(data.map(row => row['Node ID']).filter(id => id));

        data.forEach((row, index) => {
            const connections = row['Connections'];
            if (connections && connections.trim() !== '') {
                const connectionIds = connections.split(',').map(id => id.trim()).filter(id => id);

                connectionIds.forEach(connectionId => {
                    if (!nodeIds.has(connectionId)) {
                        errors.push(`Row ${index + 1}: Connection reference '${connectionId}' not found in node IDs`);
                    }
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // ===== NODE DATA VALIDATION =====

    /**
     * Validate individual node data structure
     * Consolidates logic from fileManager.js (lines 334-397)
     *
     * @param {Object} nodeData - Single node data row
     * @param {Object} context - Optional context for error reporting
     * @param {number} context.rowNumber - Row number for error messages
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static validateNodeData(nodeData, context = {}) {
        const errors = [];
        const { rowNumber } = context;

        // Validate Node ID
        const nodeId = nodeData['Node ID'];
        if (!nodeId || nodeId.trim() === '') {
            errors.push('Node ID is required');
        } else if (nodeId.length > 50) {
            errors.push('Node ID too long (max 50 characters)');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
            errors.push(`Invalid node ID '${nodeId}'. Must contain only letters, numbers, underscores, and hyphens`);
        }

        // Validate coordinates (X, Y)
        const x = parseFloat(nodeData['X']);
        const y = parseFloat(nodeData['Y']);

        if (nodeData['X'] !== undefined && nodeData['X'] !== '') {
            if (isNaN(x)) {
                errors.push('X coordinate must be a valid number');
            } else if (x < -10000 || x > 10000) {
                errors.push('X coordinate out of valid range (-10000 to 10000)');
            }
        }

        if (nodeData['Y'] !== undefined && nodeData['Y'] !== '') {
            if (isNaN(y)) {
                errors.push('Y coordinate must be a valid number');
            } else if (y < -10000 || y > 10000) {
                errors.push('Y coordinate out of valid range (-10000 to 10000)');
            }
        }

        // Validate node type
        const nodeType = nodeData['Type'];
        if (nodeType && !this.VALID_NODE_TYPES.includes(nodeType)) {
            errors.push(`Invalid node type '${nodeType}'. Valid types: ${this.VALID_NODE_TYPES.join(', ')}`);
        }

        // Validate node color
        const nodeColor = nodeData['Color'];
        if (nodeColor && !this.VALID_COLORS.includes(nodeColor)) {
            errors.push(`Invalid node color '${nodeColor}'. Valid colors: ${this.VALID_COLORS.join(', ')}`);
        }

        // Validate description length
        const description = nodeData['Description'];
        if (description && description.length > 200) {
            errors.push('Description too long (max 200 characters)');
        }

        // Gate-specific validation
        const isGate = nodeType === 'Gate';
        if (isGate) {
            const gateCondition = nodeData['GateCondition'];
            if (!gateCondition || gateCondition.trim() === '') {
                errors.push('Gate nodes require a GateCondition');
            } else {
                const gateValidation = this.validateGateCondition(gateCondition, { nodeId, rowNumber });
                if (!gateValidation.valid) {
                    errors.push(...gateValidation.errors);
                }
            }
        }

        // Validate effect strings if present
        ['Effect 1', 'Effect 2'].forEach(effectCol => {
            const effectString = nodeData[effectCol];
            if (effectString && effectString.trim() !== '') {
                const effectValidation = this.validateEffectString(effectString, { rowNumber, columnName: effectCol });
                if (effectValidation.errors.length > 0) {
                    errors.push(...effectValidation.errors);
                }
            }
        });

        // Validate connections format if present
        const connections = nodeData['Connections'];
        if (connections && connections.trim() !== '') {
            const connectionsValidation = this.validateConnectionsString(connections, { rowNumber });
            if (connectionsValidation.errors.length > 0) {
                errors.push(...connectionsValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // ===== TYPE CHECKING UTILITIES =====

    /**
     * Check if a color is valid
     * @param {string} color - Color to validate
     * @returns {boolean} True if valid color
     */
    static isValidColor(color) {
        return this.VALID_COLORS.includes(color);
    }

    /**
     * Check if a node type is valid
     * @param {string} type - Node type to validate
     * @returns {boolean} True if valid node type
     */
    static isValidNodeType(type) {
        return this.VALID_NODE_TYPES.includes(type);
    }

    /**
     * Check if an operator is valid
     * @param {string} operator - Operator to validate
     * @returns {boolean} True if valid operator
     */
    static isValidOperator(operator) {
        return this.VALID_OPERATORS.includes(operator);
    }

    /**
     * Check if a stat is valid (case-insensitive)
     * @param {string} stat - Stat to validate
     * @returns {boolean} True if valid stat
     */
    static isValidStat(stat) {
        return this.VALID_STATS.includes(stat.toLowerCase());
    }

    /**
     * Check if a runner type is valid (case-insensitive)
     * @param {string} type - Runner type to validate
     * @returns {boolean} True if valid runner type
     */
    static isValidRunnerType(type) {
        return this.VALID_RUNNER_TYPES.map(t => t.toLowerCase()).includes(type.toLowerCase());
    }

    /**
     * Check if a runner stat is valid (case-insensitive)
     * @param {string} stat - Runner stat to validate
     * @returns {boolean} True if valid runner stat
     */
    static isValidRunnerStat(stat) {
        return this.VALID_RUNNER_STATS.includes(stat.toLowerCase());
    }

    // ===== BATCH VALIDATION =====

    /**
     * Validate all data in a contract CSV
     * Used for comprehensive validation during import
     *
     * @param {Array} data - Array of node data objects
     * @returns {Object} { isValid: boolean, errors: Array<string>, warnings: Array<string> }
     */
    static validateContractData(data) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(data) || data.length === 0) {
            errors.push('No valid data rows found');
            return { isValid: false, errors, warnings };
        }

        // Track node IDs for duplicate detection
        const nodeIds = new Set();

        // Validate each node
        data.forEach((row, index) => {
            const rowNumber = index + 1;

            // Check for duplicate node IDs
            const nodeId = row['Node ID'];
            if (nodeId) {
                if (nodeIds.has(nodeId)) {
                    errors.push(`Row ${rowNumber}: Duplicate node ID '${nodeId}' found`);
                } else {
                    nodeIds.add(nodeId);
                }
            }

            // Validate node data
            const nodeValidation = this.validateNodeData(row, { rowNumber });
            if (!nodeValidation.isValid) {
                errors.push(...nodeValidation.errors.map(err => `Row ${rowNumber}: ${err}`));
            }

            // Gate-specific warnings
            if (row['Type'] === 'Gate') {
                if (row['Effect 1'] && row['Effect 1'].trim() !== '') {
                    warnings.push(`Row ${rowNumber}: Gate node has Effect 1 defined but it will be ignored`);
                }
                if (row['Effect 2'] && row['Effect 2'].trim() !== '') {
                    warnings.push(`Row ${rowNumber}: Gate node has Effect 2 defined but it will be ignored`);
                }
            } else {
                // Non-gate warning
                if (row['GateCondition'] && row['GateCondition'].trim() !== '') {
                    warnings.push(`Row ${rowNumber}: Non-gate node has GateCondition defined but it will be ignored`);
                }
            }
        });

        // Validate connection references
        const connectionValidation = this.validateConnectionReferences(data);
        if (!connectionValidation.isValid) {
            errors.push(...connectionValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

// Export for use in Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}
