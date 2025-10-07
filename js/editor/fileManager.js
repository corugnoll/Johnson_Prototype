/**
 * Johnson Contract Editor - File Manager
 * Comprehensive file operations with advanced validation and error handling
 */

class FileManager {
    constructor(nodeManager, connectionManager) {
        this.nodeManager = nodeManager;
        this.connectionManager = connectionManager;

        // File validation configuration
        this.requiredColumns = ['Node ID', 'Description', 'X', 'Y', 'Connections'];
        this.optionalColumns = ['Effect Desc', 'Effect 1', 'Effect 2', 'Type', 'Color', 'Width', 'Height', 'GateCondition'];
        this.allValidColumns = [...this.requiredColumns, ...this.optionalColumns];

        // Data validation rules
        this.validNodeTypes = ['Normal', 'Synergy', 'Start', 'End', 'Gate'];
        this.validColors = ['Red', 'Yellow', 'Green', 'Blue', 'Purple', 'Grey'];

        // Export format options
        this.exportFormats = {
            csv: { extension: 'csv', mimeType: 'text/csv' },
            json: { extension: 'json', mimeType: 'application/json' }
        };

        console.log('FileManager initialized with enhanced validation');
    }

    /**
     * Export contract to CSV format with comprehensive data validation
     * @param {string} filename - Optional filename (will generate if not provided)
     * @returns {Promise<boolean>} Success status
     */
    async exportContract(filename = null) {
        try {
            const nodes = this.nodeManager.getAllNodes();

            if (nodes.length === 0) {
                this.showExportError('No nodes to export. Create some nodes first.');
                return false;
            }

            // Validate export data before processing
            const validationResult = this.validateExportData(nodes);
            if (!validationResult.isValid) {
                this.showExportError(`Export validation failed: ${validationResult.errors.join(', ')}`);
                return false;
            }

            // Generate CSV content
            const csvContent = this.generateCSVContent(nodes);

            // Generate filename if not provided
            const exportFilename = filename || this.generateFilename();

            // Download the file
            const success = this.downloadFile(csvContent, exportFilename, this.exportFormats.csv.mimeType);

            if (success) {
                this.showExportSuccess(exportFilename);
                console.log(`Contract exported successfully: ${exportFilename}`);
                return true;
            } else {
                this.showExportError('Failed to download export file');
                return false;
            }

        } catch (error) {
            console.error('Export failed:', error);
            this.showExportError(`Export failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate CSV content from node data with proper formatting
     * @param {Array} nodes - Array of node objects to export
     * @returns {string} CSV content
     */
    generateCSVContent(nodes) {
        // Prepare data for CSV export
        const csvData = nodes.map(node => {
            // Build connections string from array
            const connectionsStr = Array.isArray(node.connections)
                ? node.connections.join(',')
                : (node.connections || '');

            return {
                'Node ID': node.id || '',
                'Description': node.description || '',
                'Effect Desc': node.effectDesc || '',
                'Effect 1': node.effect1 || '',
                'Effect 2': node.effect2 || '',
                'Type': node.type || 'Normal',
                'Color': node.color || 'Grey',
                'X': this.formatCoordinate(node.x),
                'Y': this.formatCoordinate(node.y),
                'Width': this.formatCoordinate(node.width),
                'Height': this.formatCoordinate(node.height),
                'GateCondition': node.gateCondition || '',
                'Connections': connectionsStr
            };
        });

        // Use Papa Parse to generate well-formatted CSV
        return Papa.unparse(csvData, {
            quotes: true,
            quoteChar: '"',
            escapeChar: '"',
            delimiter: ',',
            header: true,
            newline: '\r\n'
        });
    }

    /**
     * Import contract from file with comprehensive validation
     * @param {File} file - File object to import
     * @returns {Promise<boolean>} Success status
     */
    async importContract(file) {
        try {
            if (!file) {
                this.showImportError('No file selected');
                return false;
            }

            // Validate file type
            if (!this.isValidFileType(file)) {
                this.showImportError('Invalid file type. Please select a CSV file.');
                return false;
            }

            // Read file content
            const csvContent = await this.readFileContent(file);

            // Parse and validate CSV content
            const parseResult = await this.parseCSVContent(csvContent);
            if (!parseResult.success) {
                this.showImportError(`Import failed: ${parseResult.error}`);
                return false;
            }

            // Validate imported data
            const validationResult = this.validateImportData(parseResult.data);
            if (!validationResult.isValid) {
                this.showImportError(`Data validation failed: ${validationResult.errors.join(', ')}`);
                return false;
            }

            // Convert to node objects
            const nodes = this.convertToNodeObjects(parseResult.data);

            // Ask for confirmation if there are existing nodes
            if (this.nodeManager.getAllNodes().length > 0) {
                const confirmed = confirm(`Import will replace all existing nodes (${this.nodeManager.getAllNodes().length} nodes). Continue?`);
                if (!confirmed) {
                    return false;
                }
            }

            // Import the nodes
            this.nodeManager.setAllNodes(nodes);

            // Build connections automatically
            if (this.connectionManager) {
                this.connectionManager.buildAllConnections();
            }

            // Calculate canvas dimensions for nodes
            nodes.forEach(node => {
                const dimensions = TextUtils.calculateNodeDimensions(node);
                node.width = dimensions.width;
                node.height = dimensions.height;
            });

            const connectionCount = this.connectionManager ? this.connectionManager.getAllConnections().length : 0;
            this.showImportSuccess(`Imported ${nodes.length} nodes and ${connectionCount} connections`);

            console.log(`Contract imported successfully: ${nodes.length} nodes, ${connectionCount} connections`);
            return true;

        } catch (error) {
            console.error('Import failed:', error);
            this.showImportError(`Import failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Parse CSV content with error handling
     * @param {string} csvContent - Raw CSV content
     * @returns {Promise<Object>} Parse result with success status and data/error
     */
    async parseCSVContent(csvContent) {
        return new Promise((resolve) => {
            try {
                Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim(),
                    transform: (value) => value.trim(),
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            const criticalErrors = results.errors.filter(error => error.type === 'Delimiter');
                            if (criticalErrors.length > 0) {
                                resolve({
                                    success: false,
                                    error: `CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`
                                });
                                return;
                            }
                        }

                        if (!results.data || results.data.length === 0) {
                            resolve({
                                success: false,
                                error: 'No data found in CSV file'
                            });
                            return;
                        }

                        resolve({
                            success: true,
                            data: results.data,
                            errors: results.errors
                        });
                    },
                    error: (error) => {
                        resolve({
                            success: false,
                            error: `CSV parsing failed: ${error.message}`
                        });
                    }
                });
            } catch (error) {
                resolve({
                    success: false,
                    error: `CSV parsing exception: ${error.message}`
                });
            }
        });
    }

    /**
     * Validate imported data structure and content
     * @param {Array} data - Parsed CSV data
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateImportData(data) {
        const errors = [];

        if (!Array.isArray(data) || data.length === 0) {
            errors.push('No valid data rows found');
            return { isValid: false, errors };
        }

        // Validate CSV format (headers)
        const firstRow = data[0];
        const headers = Object.keys(firstRow);

        const formatValidation = this.validateCSVFormat(headers);
        if (!formatValidation.isValid) {
            errors.push(...formatValidation.errors);
        }

        // Validate individual node data
        const nodeIds = new Set();
        const invalidNodes = [];

        data.forEach((row, index) => {
            const nodeValidation = this.validateNodeData(row, index + 1);
            if (!nodeValidation.isValid) {
                invalidNodes.push(`Row ${index + 1}: ${nodeValidation.errors.join(', ')}`);
            }

            // Check for duplicate node IDs
            const nodeId = row['Node ID'];
            if (nodeId && nodeIds.has(nodeId)) {
                errors.push(`Duplicate node ID '${nodeId}' found`);
            } else if (nodeId) {
                nodeIds.add(nodeId);
            }
        });

        if (invalidNodes.length > 0) {
            errors.push(`Invalid node data: ${invalidNodes.join('; ')}`);
        }

        // Validate connection references
        const connectionValidation = this.validateConnectionReferences(data);
        if (!connectionValidation.isValid) {
            errors.push(...connectionValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate CSV format and required columns
     * @param {Array} headers - CSV headers
     * @returns {Object} Validation result
     */
    validateCSVFormat(headers) {
        const errors = [];

        // Check for required columns
        const missingRequired = this.requiredColumns.filter(col => !headers.includes(col));
        if (missingRequired.length > 0) {
            errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
        }

        // Check for unknown columns (warning, not error)
        const unknownColumns = headers.filter(header => !this.allValidColumns.includes(header));
        if (unknownColumns.length > 0) {
            console.warn(`Unknown columns found (will be ignored): ${unknownColumns.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate individual node data
     * @param {Object} nodeData - Single node data row
     * @param {number} rowNumber - Row number for error reporting
     * @returns {Object} Validation result
     */
    validateNodeData(nodeData, rowNumber) {
        const errors = [];

        // Validate Node ID
        const nodeId = nodeData['Node ID'];
        if (!nodeId || nodeId.trim() === '') {
            errors.push('Node ID is required');
        } else if (nodeId.length > 50) {
            errors.push('Node ID too long (max 50 characters)');
        }

        // Validate coordinates
        const x = parseFloat(nodeData['X']);
        const y = parseFloat(nodeData['Y']);

        if (isNaN(x)) {
            errors.push('X coordinate must be a valid number');
        } else if (x < -10000 || x > 10000) {
            errors.push('X coordinate out of valid range (-10000 to 10000)');
        }

        if (isNaN(y)) {
            errors.push('Y coordinate must be a valid number');
        } else if (y < -10000 || y > 10000) {
            errors.push('Y coordinate out of valid range (-10000 to 10000)');
        }

        // Validate optional fields
        const nodeType = nodeData['Type'];
        if (nodeType && !this.validNodeTypes.includes(nodeType)) {
            errors.push(`Invalid node type '${nodeType}'. Valid types: ${this.validNodeTypes.join(', ')}`);
        }

        const nodeColor = nodeData['Color'];
        if (nodeColor && !this.validColors.includes(nodeColor)) {
            errors.push(`Invalid node color '${nodeColor}'. Valid colors: ${this.validColors.join(', ')}`);
        }

        // Validate description (can be empty for Gate nodes)
        const description = nodeData['Description'];
        const isGate = nodeType === 'Gate';

        // For non-Gate nodes, description length validation
        if (description && description.length > 200) {
            errors.push('Description too long (max 200 characters)');
        }

        // Gate nodes should have GateCondition
        if (isGate) {
            const gateCondition = nodeData['GateCondition'];
            if (!gateCondition || gateCondition.trim() === '') {
                errors.push('Gate nodes require a GateCondition');
            } else {
                const gateValidation = this.validateGateCondition(gateCondition, nodeId);
                if (!gateValidation.valid) {
                    errors.push(gateValidation.message);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate connection references in imported data
     * @param {Array} data - Imported node data
     * @returns {Object} Validation result
     */
    validateConnectionReferences(data) {
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

    /**
     * Convert parsed CSV data to node objects
     * @param {Array} data - Parsed CSV data
     * @returns {Array} Array of node objects
     */
    convertToNodeObjects(data) {
        return data.map(row => {
            // Parse connections string into array
            const connectionsStr = row['Connections'] || '';
            const connections = connectionsStr.trim() === ''
                ? []
                : connectionsStr.split(',').map(id => id.trim()).filter(id => id);

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
                width: parseFloat(row['Width']) || 80,
                height: parseFloat(row['Height']) || 60,
                gateCondition: row['GateCondition'] || '',
                connections: connections,
                selected: false
            };
        });
    }

    /**
     * Validate export data before processing
     * @param {Array} nodes - Nodes to export
     * @returns {Object} Validation result
     */
    validateExportData(nodes) {
        const errors = [];

        if (!Array.isArray(nodes) || nodes.length === 0) {
            errors.push('No nodes to export');
            return { isValid: false, errors };
        }

        // Check for nodes without required data
        nodes.forEach((node, index) => {
            if (!node.id || node.id.trim() === '') {
                errors.push(`Node ${index + 1} missing ID`);
            }

            if (typeof node.x !== 'number' || isNaN(node.x)) {
                errors.push(`Node ${node.id || index + 1} has invalid X coordinate`);
            }

            if (typeof node.y !== 'number' || isNaN(node.y)) {
                errors.push(`Node ${node.id || index + 1} has invalid Y coordinate`);
            }

            // Gate-specific validation
            if (node.type === 'Gate') {
                if (!node.gateCondition || node.gateCondition.trim() === '') {
                    errors.push(`Node ${node.id}: Gate nodes require a GateCondition`);
                } else {
                    const gateValidation = this.validateGateCondition(node.gateCondition, node.id);
                    if (!gateValidation.valid) {
                        errors.push(`Node ${node.id}: ${gateValidation.message}`);
                    }
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate gate condition string format
     * @param {string} conditionString - Gate condition to validate
     * @param {string} nodeId - Node ID for error reporting
     * @returns {Object} Validation result with valid flag and message
     */
    validateGateCondition(conditionString, nodeId) {
        if (!conditionString || conditionString.trim() === '') {
            return { valid: false, message: 'Gate condition cannot be empty' };
        }

        try {
            const parts = conditionString.split(';');
            if (parts.length !== 2) {
                return { valid: false, message: 'Gate condition must have exactly 2 parts separated by semicolon (Type:Params;Threshold)' };
            }

            const [conditionPart, thresholdStr] = parts;

            // Validate threshold
            const threshold = parseInt(thresholdStr);
            if (isNaN(threshold) || threshold < 0) {
                return { valid: false, message: 'Gate condition threshold must be a non-negative integer' };
            }

            // Validate condition type
            if (conditionPart.startsWith('Node:')) {
                // Validate Node condition format
                const nodeIdsStr = conditionPart.substring('Node:'.length);
                const nodeIds = nodeIdsStr.split(',').map(id => id.trim()).filter(id => id !== '');

                if (nodeIds.length === 0) {
                    return { valid: false, message: 'Node gate condition requires at least one node ID' };
                }

                // Validate each node ID format
                for (const nodeId of nodeIds) {
                    if (!/^[a-zA-Z0-9_-]+$/.test(nodeId)) {
                        return { valid: false, message: `Invalid node ID '${nodeId}' in gate condition. Must contain only letters, numbers, underscores, and hyphens` };
                    }
                }
            }
            else if (conditionPart.startsWith('RunnerType:')) {
                const types = conditionPart.substring('RunnerType:'.length).split(',').map(t => t.trim());
                const validRunnerTypes = ['Face', 'Muscle', 'Hacker', 'Ninja', 'face', 'muscle', 'hacker', 'ninja'];

                for (const type of types) {
                    if (!validRunnerTypes.includes(type)) {
                        return { valid: false, message: `Invalid runner type '${type}' in gate condition. Valid types: Face, Muscle, Hacker, Ninja (case-insensitive)` };
                    }
                }

                if (types.length === 0) {
                    return { valid: false, message: 'RunnerType gate condition requires at least one runner type' };
                }
            }
            else if (conditionPart.startsWith('RunnerStat:')) {
                const stats = conditionPart.substring('RunnerStat:'.length).split(',').map(s => s.trim());
                const validStats = ['face', 'muscle', 'hacker', 'ninja'];

                for (const stat of stats) {
                    if (!validStats.includes(stat.toLowerCase())) {
                        return { valid: false, message: `Invalid stat '${stat}' in gate condition. Valid stats: face, muscle, hacker, ninja (case-insensitive)` };
                    }
                }

                if (stats.length === 0) {
                    return { valid: false, message: 'RunnerStat gate condition requires at least one stat' };
                }
            }
            else {
                return { valid: false, message: 'Gate condition must start with Node:, RunnerType:, or RunnerStat:' };
            }

        } catch (error) {
            return { valid: false, message: `Error parsing gate condition: ${error.message}` };
        }

        return { valid: true, message: 'Valid gate condition' };
    }

    /**
     * Download file to user's computer
     * @param {string} content - File content
     * @param {string} filename - Filename for download
     * @param {string} mimeType - MIME type for download
     * @returns {boolean} Success status
     */
    downloadFile(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
            return true;

        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }

    /**
     * Read file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Check if file type is valid for import
     * @param {File} file - File to check
     * @returns {boolean} True if valid file type
     */
    isValidFileType(file) {
        const validExtensions = ['.csv'];
        const validMimeTypes = ['text/csv', 'application/csv', 'text/plain'];

        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        const hasValidMimeType = validMimeTypes.includes(file.type);

        return hasValidExtension || hasValidMimeType;
    }

    /**
     * Generate filename for export
     * @returns {string} Generated filename
     */
    generateFilename() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        return `contract-${timestamp}.csv`;
    }

    /**
     * Format coordinate for export
     * @param {number} coordinate - Coordinate value
     * @returns {string} Formatted coordinate
     */
    formatCoordinate(coordinate) {
        if (typeof coordinate !== 'number' || isNaN(coordinate)) {
            return '0';
        }
        return coordinate.toFixed(1);
    }

    /**
     * Show export success message
     * @param {string} filename - Exported filename
     */
    showExportSuccess(filename) {
        this.showMessage(`Successfully exported: ${filename}`, 'success');
    }

    /**
     * Show export error message
     * @param {string} message - Error message
     */
    showExportError(message) {
        this.showMessage(`Export Error: ${message}`, 'error');
    }

    /**
     * Show import success message
     * @param {string} message - Success message
     */
    showImportSuccess(message) {
        this.showMessage(`Import Success: ${message}`, 'success');
    }

    /**
     * Show import error message
     * @param {string} message - Error message
     */
    showImportError(message) {
        this.showMessage(`Import Error: ${message}`, 'error');
    }

    /**
     * Show status message (delegates to main application)
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        // Try to find status element
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-${type}`;

            // Clear message after 5 seconds for errors, 3 seconds for others
            const timeout = type === 'error' ? 5000 : 3000;
            setTimeout(() => {
                statusElement.textContent = 'Ready';
                statusElement.className = '';
            }, timeout);
        }

        // Also log to console
        console.log(`${type.toUpperCase()}: ${message}`);

        // For errors, also show alert as fallback
        if (type === 'error') {
            setTimeout(() => alert(message), 100);
        }
    }

    /**
     * Get file validation summary
     * @returns {Object} Validation rules summary
     */
    getValidationSummary() {
        return {
            requiredColumns: [...this.requiredColumns],
            optionalColumns: [...this.optionalColumns],
            validNodeTypes: [...this.validNodeTypes],
            validColors: [...this.validColors],
            coordinateRange: { min: -10000, max: 10000 },
            maxDescriptionLength: 200,
            maxNodeIdLength: 50
        };
    }

    /**
     * Test file manager functionality
     * @returns {Object} Test results
     */
    runSelfTest() {
        console.log('Running FileManager self-test...');

        const testResults = {
            csvGeneration: false,
            dataValidation: false,
            errorHandling: false
        };

        try {
            // Test CSV generation
            const testNodes = [
                {
                    id: 'TEST1',
                    description: 'Test Node',
                    x: 100,
                    y: 200,
                    connections: ['TEST2'],
                    type: 'Normal',
                    color: 'Red'
                }
            ];

            const csvContent = this.generateCSVContent(testNodes);
            testResults.csvGeneration = csvContent.includes('TEST1');

            // Test data validation
            const validationResult = this.validateExportData(testNodes);
            testResults.dataValidation = validationResult.isValid;

            // Test error handling
            const invalidData = [{ id: '', x: 'invalid', y: 'invalid' }];
            const errorResult = this.validateExportData(invalidData);
            testResults.errorHandling = !errorResult.isValid;

            console.log('FileManager self-test completed:', testResults);

        } catch (error) {
            console.error('FileManager self-test failed:', error);
        }

        return testResults;
    }
}