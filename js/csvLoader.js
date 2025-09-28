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
        this.layer = parseInt(csvRow['Layer']) || 0;
        this.slot = csvRow['Slot'];

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
        this.layers = new Map();          // Layer → VisualNode[]
        this.metadata = {
            nodeCount: 0,
            connectionCount: 0,
            loadTime: Date.now()
        };

        if (csvData) {
            this.processCSVData(csvData);
        }
    }

    processCSVData(csvData) {
        // First pass: create all nodes
        csvData.forEach(row => {
            const node = new VisualNode(row);
            this.nodes.set(node.id, node);

            // Organize by layers
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
        return connectionsString.split(';').map(id => id.trim()).filter(id => id !== '');
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
        this.requiredColumns = [
            'Node ID',
            'Description',
            'Effect Desc',
            'Effect 1',
            'Effect 2',
            'Type',
            'Color',
            'Layer',
            'Slot',
            'Connections'
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

        // Check for required columns
        const missingColumns = this.requiredColumns.filter(col =>
            !availableColumns.includes(col)
        );

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Enhanced validation with better error messages and performance
        const validationErrors = [];
        const nodeIds = new Set();
        const validColors = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey'];
        const validTypes = ['Effect', 'Choice', 'Start', 'End', 'Gate', 'Synergy'];

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

            // Validate Description
            if (!row['Description'] || row['Description'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Description is required`);
            }

            // Validate Color
            if (!row['Color'] || row['Color'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Color is required`);
            } else if (!validColors.includes(row['Color'])) {
                validationErrors.push(`Row ${rowNumber}: Invalid color '${row['Color']}'. Must be one of: ${validColors.join(', ')}`);
            }

            // Validate Layer (should be numeric)
            if (!row['Layer'] || row['Layer'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Layer is required`);
            } else if (isNaN(parseInt(row['Layer']))) {
                validationErrors.push(`Row ${rowNumber}: Layer must be a number, got '${row['Layer']}'`);
            } else {
                const layer = parseInt(row['Layer']);
                if (layer < 0) {
                    validationErrors.push(`Row ${rowNumber}: Layer must be non-negative, got ${layer}`);
                }
            }

            // Validate Type
            if (!row['Type'] || row['Type'].trim() === '') {
                validationErrors.push(`Row ${rowNumber}: Type is required`);
            } else if (!validTypes.includes(row['Type'])) {
                validationErrors.push(`Row ${rowNumber}: Invalid type '${row['Type']}'. Must be one of: ${validTypes.join(', ')}`);
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

            // Validate Slot format if present
            if (row['Slot'] && row['Slot'].trim() !== '') {
                const validSlotPattern = /^[A-Z]{1,2}[0-9]*$/;
                if (!validSlotPattern.test(row['Slot'])) {
                    validationErrors.push(`Row ${rowNumber}: Invalid slot format '${row['Slot']}'. Expected pattern like 'CE', 'U1', 'D2'`);
                }
            }
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
        return rawData.map(row => ({
            id: row['Node ID'],
            description: row['Description'],
            effectDescription: row['Effect Desc'],
            effect1: row['Effect 1'],
            effect2: row['Effect 2'],
            type: row['Type'],
            color: row['Color'],
            layer: parseInt(row['Layer']) || 0,
            slot: row['Slot'],
            connections: row['Connections'] ? row['Connections'].split(';').filter(c => c.trim()) : [],
            selected: false,
            available: false
        }));
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
                const validConditionTypes = ['None', 'RunnerType:', 'RunnerStat:', 'NodeColor:', 'NodeColorCombo:'];
                const isValidCondition = condition === 'None' || validConditionTypes.some(type => condition.startsWith(type));
                if (!isValidCondition) {
                    errors.push(`Row ${rowNumber} ${columnName}: Invalid condition '${condition}'. Must be 'None' or start with: ${validConditionTypes.slice(1).join(', ')}`);
                }
            }

            // Validate operator
            const validOperators = ['+', '-', '*', '/'];
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

            // Validate stat
            const validStats = ['damage', 'risk', 'money', 'grit', 'veil'];
            if (!stat || stat.trim() === '') {
                errors.push(`Row ${rowNumber} ${columnName}: Stat part cannot be empty`);
            } else if (!validStats.includes(stat.toLowerCase())) {
                errors.push(`Row ${rowNumber} ${columnName}: Invalid stat '${stat}'. Must be one of: ${validStats.join(', ')}`);
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
            const connections = connectionsString.split(';').map(c => c.trim()).filter(c => c !== '');

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
}