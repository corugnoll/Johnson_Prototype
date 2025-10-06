/**
 * CSV Loader Module
 * Handles CSV file loading, parsing, and validation using Papa Parse
 */

/**
 * Enhanced data structures for visual prototype
 */
class VisualNode {
    constructor(csvRow) {
        // Core properties from CSV
        this.id = csvRow['Node ID'];
        this.description = csvRow['Description'];
        this.effectDescription = csvRow['Effect Desc'];
        this.effect1 = csvRow['Effect 1'];
        this.effect2 = csvRow['Effect 2'];
        this.type = csvRow['Type'];
        this.color = csvRow['Color'];
        this.gateCondition = csvRow['GateCondition'] || ''; // NEW: Gate condition support

        // Position properties (X,Y coordinates)
        this.x = parseFloat(csvRow['X']) || 0;
        this.y = parseFloat(csvRow['Y']) || 0;

        // Dimension properties (width/height from editor)
        this.width = parseFloat(csvRow['Width']) || null;
        this.height = parseFloat(csvRow['Height']) || null;

        // Legacy layer/slot support for backward compatibility (will be ignored in new format)
        this.layer = parseInt(csvRow['Layer']) || 0;
        this.slot = csvRow['Slot'] || '';

        // Visual properties
        this.state = 'available';         // available, selected, unavailable
        this.position = null;             // Set by layout algorithm
        this.connections = new Set();     // Connected node IDs
    }
}

class VisualContractData {
    constructor(csvData) {
        this.nodes = new Map();           // NodeID → VisualNode
        this.connections = new Map();     // NodeID → Set<NodeID>
        this.layers = new Map();          // Layer → VisualNode[] (legacy support)
        this.metadata = {
            nodeCount: 0,
            connectionCount: 0,
            loadTime: Date.now(),
            format: 'unknown'             // 'xy' for X,Y format, 'legacy' for Layer/Slot
        };

        if (csvData) {
            this.processCSVData(csvData);
        }
    }

    processCSVData(csvData) {
        // Detect format: check if X,Y columns exist
        const hasXY = csvData.length > 0 &&
                      csvData[0].hasOwnProperty('X') &&
                      csvData[0].hasOwnProperty('Y');

        this.metadata.format = hasXY ? 'xy' : 'legacy';
        console.log(`Contract format detected: ${this.metadata.format}`);

        // First pass: create all nodes
        csvData.forEach(row => {
            const node = new VisualNode(row);
            this.nodes.set(node.id, node);

            // Legacy layer organization (for backward compatibility)
            if (!this.layers.has(node.layer)) {
                this.layers.set(node.layer, []);
            }
            this.layers.get(node.layer).push(node);
        });

        // Second pass: process connections
        csvData.forEach(row => {
            const nodeId = row['Node ID'];
            const connectionsString = row['Connections'];

            if (connectionsString && connectionsString.trim() !== '') {
                const connections = this.parseConnections(connectionsString);
                this.connections.set(nodeId, new Set(connections));

                // Set connections on the node object as well
                const node = this.nodes.get(nodeId);
                if (node) {
                    node.connections = new Set(connections);
                }
            } else {
                this.connections.set(nodeId, new Set());
            }
        });

        // Update metadata
        this.metadata.nodeCount = this.nodes.size;
        this.metadata.connectionCount = Array.from(this.connections.values())
            .reduce((total, connections) => total + connections.size, 0);
        this.metadata.loadTime = Date.now() - this.metadata.loadTime;
    }

    parseConnections(connectionsString) {
        if (!connectionsString || connectionsString.trim() === '') {
            return [];
        }
        // Support both comma-separated (editor format) and semicolon-separated (legacy format)
        const separator = connectionsString.includes(',') ? ',' : ';';
        return connectionsString.split(separator).map(id => id.trim()).filter(id => id !== '');
    }

    // Utility methods for visualization
    getNodesByLayer() {
        return new Map(this.layers);
    }

    getConnectedNodes(nodeId) {
        return this.connections.get(nodeId) || new Set();
    }

    getAllConnections() {
        const allConnections = [];
        this.connections.forEach((targets, sourceId) => {
            targets.forEach(targetId => {
                allConnections.push({ from: sourceId, to: targetId });
            });
        });
        return allConnections;
    }
}

class CSVLoader {
    constructor() {
        // New format requires X,Y coordinates instead of Layer,Slot
        this.requiredColumns = [
            'Node ID',
            'Description',
            'X',
            'Y',
            'Connections'
        ];

        // Optional columns for enhanced functionality
        this.optionalColumns = [
            'Effect Desc',
            'Effect 1',
            'Effect 2',
            'Type',
            'Color'
        ];

        // Legacy columns for backward compatibility
        this.legacyColumns = [
            'Layer',
            'Slot'
        ];

        this.maxFileSize = 5 * 1024 * 1024; // 5MB limit
    }

    /**
     * Load and parse CSV file from File API input
     * @param {File} file - The CSV file to load
     * @returns {Promise<Array>} Parsed and validated CSV data
     */
    async loadFile(file) {
        try {
            // Validate file type and size
            this.validateFile(file);

            // Read file content
            const csvText = await this.readFileAsText(file);

            // Parse CSV content
            const parsedData = this.parseCSV(csvText);

            // Validate data structure
            this.validateData(parsedData);

            console.log(`Successfully loaded contract file: ${file.name}`);
            console.log(`Parsed ${parsedData.length} nodes`);

            return parsedData;

        } catch (error) {
            console.error('Error loading CSV file:', error);
            throw new Error(`Failed to load contract file: ${error.message}`);
        }
    }

    /**
     * Load contract from embedded library (for Android/tablet compatibility)
     * @param {string} contractKey - Key identifying the contract in CONTRACT_LIBRARY
     * @returns {Promise<Array>} Parsed and validated CSV data
     */
    async loadFromLibrary(contractKey) {
        try {
            // Check if CONTRACT_LIBRARY is available
            if (typeof CONTRACT_LIBRARY === 'undefined') {
                throw new Error('Contract library not loaded. Ensure contractLibrary.js is included.');
            }

            // Get contract from library
            const contract = CONTRACT_LIBRARY[contractKey];
            if (!contract) {
                throw new Error(`Contract "${contractKey}" not found in library`);
            }

            console.log(`Loading contract from library: ${contract.name}`);

            // Parse CSV content directly from library
            const parsedData = this.parseCSV(contract.csv);

            // Validate data structure
            this.validateData(parsedData);

            console.log(`Successfully loaded contract "${contract.name}" from library`);
            console.log(`Parsed ${parsedData.length} nodes`);

            return parsedData;

        } catch (error) {
            console.error('Error loading contract from library:', error);
            throw new Error(`Failed to load contract from library: ${error.message}`);
        }
    }

    /**
     * Parse CSV text using Papa Parse
     * @param {string} csvText - Raw CSV content
     * @returns {Array} Parsed CSV data
     */
    parseCSV(csvText) {
        try {
            // Check if Papa Parse is available
            if (typeof Papa === 'undefined') {
                throw new Error('Papa Parse library not loaded');
            }

            // Parse CSV with Papa Parse
            const parseResult = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                trimHeaders: true,
                transform: (value, header) => {
                    // Clean up values
                    return value.trim();
                }
            });

            if (parseResult.errors && parseResult.errors.length > 0) {
                const errorMessages = parseResult.errors.map(err => err.message).join(', ');
                throw new Error(`CSV parsing errors: ${errorMessages}`);
            }

            if (!parseResult.data || parseResult.data.length === 0) {
                throw new Error('No data found in CSV file');
            }

            return parseResult.data;

        } catch (error) {
            console.error('Error parsing CSV:', error);
            throw new Error(`CSV parsing failed: ${error.message}`);
        }
    }

    /**
     * Validate file before processing
     * @param {File} file - File to validate
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.maxFileSize)})`);
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            throw new Error('File must be a CSV file (.csv extension)');
        }

        if (file.size === 0) {
            throw new Error('File is empty');
        }
    }

    /**
     * Validate parsed CSV data structure
     * @param {Array} data - Parsed CSV data to validate
     */
    validateData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No valid data rows found');
        }

        // Check if required columns exist in first row
        const firstRow = data[0];
        const availableColumns = Object.keys(firstRow);

        // Detect format and validate accordingly
        const hasXY = availableColumns.includes('X') && availableColumns.includes('Y');
        const hasLayerSlot = availableColumns.includes('Layer') && availableColumns.includes('Slot');

        if (!hasXY && !hasLayerSlot) {
            throw new Error('Invalid format: Must have either X,Y coordinates OR Layer,Slot positioning');
        }

        if (hasXY) {
            // Validate new X,Y format
            const missingColumns = this.requiredColumns.filter(col =>
                !availableColumns.includes(col)
            );

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns for X,Y format: ${missingColumns.join(', ')}`);
            }
            console.log('Validating X,Y positioning format');
        } else {
            // Legacy format validation (Layer/Slot)
            const legacyRequired = ['Node ID', 'Description', 'Layer', 'Slot', 'Connections'];
            const missingColumns = legacyRequired.filter(col =>
                !availableColumns.includes(col)
            );

            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns for Layer/Slot format: ${missingColumns.join(', ')}`);
            }
            console.warn('Using legacy Layer/Slot format. Consider upgrading to X,Y positioning for better editor support.');
        }

        // Enhanced validation with better error messages and performance
        const validationErrors = [];
        const nodeIds = new Set();
        const validColors = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey'];
        const validTypes = ['Normal', 'Effect', 'Choice', 'Start', 'End', 'Gate', 'Synergy', 'Special'];

        data.forEach((row, index) => {
            const rowNumber = index + 1;

            // Validate Node ID
            if (!row['Node ID'] || row['Node ID'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Node ID is required`);
            } else {
                const nodeId = row['Node ID'].trim();
                if (nodeIds.has(nodeId)) {
                    validationErrors.push(`Row ${rowNumber}: Duplicate Node ID '${nodeId}' found`);
                } else {
                    nodeIds.add(nodeId);
                }
            }

            // Validate Description (not required for Gate nodes)
            const isGateNode = row['Type'] === 'Gate';
            if (!isGateNode && (!row['Description'] || row['Description'].trim() === '')) {
                validationErrors.push(`Row ${rowNumber}: Description is required`);
            }

            // Validate positioning format
            if (hasXY) {
                // Validate X coordinate
                if (!row['X'] && row['X'] !== '0') {
                    validationErrors.push(`Row ${rowNumber}: X coordinate is required`);
                } else if (isNaN(parseFloat(row['X']))) {
                    validationErrors.push(`Row ${rowNumber}: X coordinate must be a number, got '${row['X']}'`);
                } else {
                    const x = parseFloat(row['X']);
                    if (x < -10000 || x > 10000) {
                        validationErrors.push(`Row ${rowNumber}: X coordinate out of range (-10000 to 10000), got ${x}`);
                    }
                }

                // Validate Y coordinate
                if (!row['Y'] && row['Y'] !== '0') {
                    validationErrors.push(`Row ${rowNumber}: Y coordinate is required`);
                } else if (isNaN(parseFloat(row['Y']))) {
                    validationErrors.push(`Row ${rowNumber}: Y coordinate must be a number, got '${row['Y']}'`);
                } else {
                    const y = parseFloat(row['Y']);
                    if (y < -10000 || y > 10000) {
                        validationErrors.push(`Row ${rowNumber}: Y coordinate out of range (-10000 to 10000), got ${y}`);
                    }
                }
            } else {
                // Validate Layer (legacy format)
                if (!row['Layer'] || row['Layer'].trim() === '') {
                    validationErrors.push(`Row ${rowNumber}: Layer is required (legacy format)`);
                } else if (isNaN(parseInt(row['Layer']))) {
                    validationErrors.push(`Row ${rowNumber}: Layer must be a number, got '${row['Layer']}'`);
                } else {
                    const layer = parseInt(row['Layer']);
                    if (layer < 0) {
                        validationErrors.push(`Row ${rowNumber}: Layer must be non-negative, got ${layer}`);
                    }
                }

                // Validate Slot (legacy format)
                if (row['Slot'] && row['Slot'].trim() !== '') {
                    const validSlotPattern = /^[A-Z]{1,2}[0-9]*$/;
                    if (!validSlotPattern.test(row['Slot'])) {
                        validationErrors.push(`Row ${rowNumber}: Invalid slot format '${row['Slot']}'. Expected pattern like 'CE', 'U1', 'D2'`);
                    }
                }
            }

            // Validate optional fields
            if (row['Color'] && row['Color'].trim() !== '') {
                if (!validColors.includes(row['Color'])) {
                    validationErrors.push(`Row ${rowNumber}: Invalid color '${row['Color']}'. Must be one of: ${validColors.join(', ')}`);
                }
            }

            if (row['Type'] && row['Type'].trim() !== '') {
                if (!validTypes.includes(row['Type'])) {
                    validationErrors.push(`Row ${rowNumber}: Invalid type '${row['Type']}'. Must be one of: ${validTypes.join(', ')}`);
                }
            }

            // Validate Effect strings if present
            ['Effect 1', 'Effect 2'].forEach(effectCol => {
                if (row[effectCol] && row[effectCol].trim() !== '') {
                    const effectValidation = this.validateEffectString(row[effectCol], rowNumber, effectCol);
                    if (effectValidation.errors.length > 0) {
                        validationErrors.push(...effectValidation.errors);
                    }
                }
            });

            // Validate Connections format if present
            if (row['Connections'] && row['Connections'].trim() !== '') {
                const connectionsValidation = this.validateConnectionsString(row['Connections'], rowNumber);
                if (connectionsValidation.errors.length > 0) {
                    validationErrors.push(...connectionsValidation.errors);
                }
            }

            // NEW: Validate Gate-specific rules
            if (row['Type'] === 'Gate') {
                // Gate nodes should have GateCondition
                if (!row['GateCondition'] || row['GateCondition'].trim() === '') {
                    validationErrors.push(`Row ${rowNumber}: Gate nodes require a GateCondition`);
                } else {
                    // Validate gate condition format
                    const gateValidation = this.validateGateConditionFormat(row['GateCondition'], rowNumber);
                    if (gateValidation.errors.length > 0) {
                        validationErrors.push(...gateValidation.errors);
                    }
                }

                // Gate nodes should not have Effect 1 or Effect 2 (warn if present)
                if (row['Effect 1'] && row['Effect 1'].trim() !== '') {
                    console.warn(`Row ${rowNumber}: Gate node has Effect 1 defined but it will be ignored`);
                }
                if (row['Effect 2'] && row['Effect 2'].trim() !== '') {
                    console.warn(`Row ${rowNumber}: Gate node has Effect 2 defined but it will be ignored`);
                }
            } else {
                // Non-gate nodes should not have GateCondition (warn if present)
                if (row['GateCondition'] && row['GateCondition'].trim() !== '') {
                    console.warn(`Row ${rowNumber}: Non-gate node has GateCondition defined but it will be ignored`);
                }
            }

            // Slot validation moved to positioning format section above
        });

        // Stop validation if there are too many errors (performance consideration)
        if (validationErrors.length > 50) {
            throw new Error(`Data validation failed with ${validationErrors.length} errors. First 50 errors:\n${validationErrors.slice(0, 50).join('\n')}\n... and ${validationErrors.length - 50} more errors.`);
        }

        if (validationErrors.length > 0) {
            throw new Error(`Data validation failed with ${validationErrors.length} error(s):\n${validationErrors.join('\n')}`);
        }

        console.log(`Data validation passed for ${data.length} nodes`);
    }

    /**
     * Read file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                resolve(event.target.result);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get sample data structure for testing
     * @returns {Array} Sample contract data
     */
    getSampleData() {
        return [
            {
                'Node ID': '1',
                'Description': 'Start Node',
                'Effect Desc': '+2 Grit',
                'Effect 1': 'None;+;2;Grit',
                'Effect 2': '',
                'Type': 'Effect',
                'Color': 'Red',
                'Layer': '0',
                'Slot': 'CE',
                'Connections': '2;3'
            },
            {
                'Node ID': '2',
                'Description': 'Choice A',
                'Effect Desc': '+2 Risk',
                'Effect 1': 'None;+;2;Risk',
                'Effect 2': '',
                'Type': 'Effect',
                'Color': 'Green',
                'Layer': '1',
                'Slot': 'U1',
                'Connections': '4'
            },
            {
                'Node ID': '3',
                'Description': 'Choice B',
                'Effect Desc': '+2 Dam',
                'Effect 1': 'None;+;2;Damage',
                'Effect 2': '',
                'Type': 'Effect',
                'Color': 'Purple',
                'Layer': '1',
                'Slot': 'D1',
                'Connections': '4'
            },
            {
                'Node ID': '4',
                'Description': 'Final Node',
                'Effect Desc': '+2 Veil',
                'Effect 1': 'None;+;2;Veil',
                'Effect 2': '',
                'Type': 'Effect',
                'Color': 'Blue',
                'Layer': '2',
                'Slot': 'CE',
                'Connections': ''
            }
        ];
    }

    /**
     * Convert parsed data to internal game format
     * @param {Array} rawData - Raw parsed CSV data
     * @returns {Array} Processed game data
     */
    processDataForGame(rawData) {
        const hasXY = rawData.length > 0 &&
                      rawData[0].hasOwnProperty('X') &&
                      rawData[0].hasOwnProperty('Y');

        return rawData.map(row => {
            const baseData = {
                id: row['Node ID'],
                description: row['Description'],
                effectDescription: row['Effect Desc'] || '',
                effect1: row['Effect 1'] || '',
                effect2: row['Effect 2'] || '',
                type: row['Type'] || 'Normal',
                color: row['Color'] || 'Grey',
                gateCondition: row['GateCondition'] || '',
                connections: row['Connections'] ? row['Connections'].split(',').map(c => c.trim()).filter(c => c) : [],
                selected: false,
                available: false
            };

            if (hasXY) {
                // New X,Y format
                baseData.x = parseFloat(row['X']) || 0;
                baseData.y = parseFloat(row['Y']) || 0;
                // Keep legacy fields for backward compatibility
                baseData.layer = parseInt(row['Layer']) || 0;
                baseData.slot = row['Slot'] || '';
            } else {
                // Legacy format
                baseData.layer = parseInt(row['Layer']) || 0;
                baseData.slot = row['Slot'] || '';
                // Default X,Y coordinates will be calculated by layout algorithm
                baseData.x = 0;
                baseData.y = 0;
            }

            return baseData;
        });
    }

    /**
     * Create VisualContractData object for visualization
     * @param {Array} parsedCSV - Parsed CSV data
     * @returns {VisualContractData} Visual contract data structure
     */
    createVisualContractData(parsedCSV) {
        return new VisualContractData(parsedCSV);
    }

    /**
     * Get column information for debugging
     * @param {Array} data - Parsed CSV data
     * @returns {Object} Column analysis
     */
    analyzeColumns(data) {
        if (!data || data.length === 0) {
            return { columns: [], columnCount: 0, requiredMissing: this.requiredColumns };
        }

        const availableColumns = Object.keys(data[0]);
        const missingRequired = this.requiredColumns.filter(col => !availableColumns.includes(col));
        const extraColumns = availableColumns.filter(col => !this.requiredColumns.includes(col));

        return {
            columns: availableColumns,
            columnCount: availableColumns.length,
            requiredMissing: missingRequired,
            extraColumns: extraColumns,
            isValid: missingRequired.length === 0
        };
    }

    /**
     * Validate effect string format
     * @param {string} effectString - Effect string to validate
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} columnName - Column name for error reporting
     * @returns {Object} Validation result with errors array
     */
    validateEffectString(effectString, rowNumber, columnName) {
        const errors = [];

        try {
            const parts = effectString.split(';');
            if (parts.length !== 4) {
                errors.push(`Row ${rowNumber} ${columnName}: Effect must have exactly 4 parts separated by semicolons. Got ${parts.length} parts: '${effectString}'`);
                return { errors };
            }

            const [condition, operator, amount, stat] = parts;

            // Validate condition
            if (!condition || condition.trim() === '') {
                errors.push(`Row ${rowNumber} ${columnName}: Condition part cannot be empty`);
            } else {
                const validConditionTypes = ['None', 'RunnerType:', 'RunnerStat:', 'NodeColor:', 'NodeColorCombo:', 'PrevDam', 'PrevRisk', 'RiskDamPair', 'ColorForEach'];
                const isValidCondition = condition === 'None' ||
                                         condition === 'PrevDam' ||
                                         condition === 'PrevRisk' ||
                                         condition === 'RiskDamPair' ||
                                         condition === 'ColorForEach' ||
                                         validConditionTypes.some(type => condition.startsWith(type));
                if (!isValidCondition) {
                    errors.push(`Row ${rowNumber} ${columnName}: Invalid condition '${condition}'. Must be 'None', 'PrevDam', 'PrevRisk', 'RiskDamPair', 'ColorForEach', or start with: RunnerType:, RunnerStat:, NodeColor:, NodeColorCombo:`);
                }
            }

            // Validate operator
            const validOperators = ['+', '-', '*', '/', '%'];
            if (!validOperators.includes(operator)) {
                errors.push(`Row ${rowNumber} ${columnName}: Invalid operator '${operator}'. Must be one of: ${validOperators.join(', ')}`);
            }

            // Validate amount
            if (!amount || amount.trim() === '') {
                errors.push(`Row ${rowNumber} ${columnName}: Amount part cannot be empty`);
            } else if (isNaN(parseFloat(amount))) {
                errors.push(`Row ${rowNumber} ${columnName}: Amount must be a number, got '${amount}'`);
            } else if (operator === '/' && parseFloat(amount) === 0) {
                errors.push(`Row ${rowNumber} ${columnName}: Division by zero is not allowed`);
            }

            // Validate stat (case-insensitive)
            const validStats = ['damage', 'risk', 'money', 'grit', 'veil'];
            if (!stat || stat.trim() === '') {
                errors.push(`Row ${rowNumber} ${columnName}: Stat part cannot be empty`);
            } else if (!validStats.includes(stat.toLowerCase())) {
                errors.push(`Row ${rowNumber} ${columnName}: Invalid stat '${stat}'. Must be one of: ${validStats.join(', ')} (case-insensitive)`);
            }

        } catch (error) {
            errors.push(`Row ${rowNumber} ${columnName}: Error parsing effect string '${effectString}': ${error.message}`);
        }

        return { errors };
    }

    /**
     * Validate connections string format
     * @param {string} connectionsString - Connections string to validate
     * @param {number} rowNumber - Row number for error reporting
     * @returns {Object} Validation result with errors array
     */
    validateConnectionsString(connectionsString, rowNumber) {
        const errors = [];

        try {
            // Support both comma-separated (editor format) and semicolon-separated (legacy format)
            const separator = connectionsString.includes(',') ? ',' : ';';
            const connections = connectionsString.split(separator).map(c => c.trim()).filter(c => c !== '');

            connections.forEach(connection => {
                if (!connection || connection.trim() === '') {
                    errors.push(`Row ${rowNumber}: Empty connection found in connections string`);
                } else if (!/^[a-zA-Z0-9_-]+$/.test(connection)) {
                    errors.push(`Row ${rowNumber}: Invalid connection ID '${connection}'. Must contain only letters, numbers, underscores, and hyphens`);
                }
            });

        } catch (error) {
            errors.push(`Row ${rowNumber}: Error parsing connections string '${connectionsString}': ${error.message}`);
        }

        return { errors };
    }

    /**
     * Enhanced performance optimization for large contracts
     * @param {Array} data - Contract data to optimize
     * @returns {Object} Performance metrics and optimization suggestions
     */
    analyzePerformance(data) {
        const nodeCount = data.length;
        const connectionCount = data.reduce((total, row) => {
            const connections = row['Connections'] ? row['Connections'].split(';').filter(c => c.trim()) : [];
            return total + connections.length;
        }, 0);

        const layerCount = new Set(data.map(row => parseInt(row['Layer']) || 0)).size;
        const synergyNodeCount = data.filter(row => row['Type'] === 'Synergy').length;

        const performance = {
            nodeCount,
            connectionCount,
            layerCount,
            synergyNodeCount,
            averageConnectionsPerNode: connectionCount / nodeCount,
            complexity: this.calculateComplexity(nodeCount, connectionCount, layerCount),
            recommendations: []
        };

        // Performance recommendations
        if (nodeCount > 50) {
            performance.recommendations.push(`High node count (${nodeCount}). Consider splitting into multiple contracts for better performance.`);
        }

        if (connectionCount > nodeCount * 3) {
            performance.recommendations.push(`High connection density (${Math.round(performance.averageConnectionsPerNode * 100) / 100} per node). May impact rendering performance.`);
        }

        if (layerCount > 10) {
            performance.recommendations.push(`Many layers (${layerCount}). Consider consolidating layers for better visual layout.`);
        }

        return performance;
    }

    /**
     * Calculate contract complexity score
     * @param {number} nodeCount - Number of nodes
     * @param {number} connectionCount - Number of connections
     * @param {number} layerCount - Number of layers
     * @returns {string} Complexity level
     */
    calculateComplexity(nodeCount, connectionCount, layerCount) {
        const score = nodeCount + (connectionCount * 0.5) + (layerCount * 2);

        if (score < 20) return 'Simple';
        if (score < 50) return 'Moderate';
        if (score < 100) return 'Complex';
        return 'Very Complex';
    }

    /**
     * Validate gate condition string format
     * @param {string} conditionString - Gate condition to validate
     * @param {number} rowNumber - Row number for error reporting
     * @returns {Object} Validation result with errors array
     */
    validateGateConditionFormat(conditionString, rowNumber) {
        const errors = [];

        try {
            const parts = conditionString.split(';');
            if (parts.length !== 2) {
                errors.push(`Row ${rowNumber}: Gate condition must have 2 parts (Type:Params;Threshold)`);
                return { errors };
            }

            const [conditionPart, thresholdStr] = parts;
            const threshold = parseInt(thresholdStr);

            if (isNaN(threshold) || threshold < 0) {
                errors.push(`Row ${rowNumber}: Gate condition threshold must be non-negative integer`);
            }

            if (!conditionPart.startsWith('RunnerType:') && !conditionPart.startsWith('RunnerStat:')) {
                errors.push(`Row ${rowNumber}: Gate condition must start with 'RunnerType:' or 'RunnerStat:'`);
            }

        } catch (error) {
            errors.push(`Row ${rowNumber}: Error parsing gate condition: ${error.message}`);
        }

        return { errors };
    }
}