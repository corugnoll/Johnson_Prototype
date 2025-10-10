/**
 * Balancing Configuration Loader
 * Loads and validates balancing.csv configuration file
 */

/**
 * Load balancing configuration from embedded data
 * @returns {Promise<Object>} Balancing configuration object
 */
async function loadBalancingConfig() {
    return new Promise((resolve) => {
        // Use embedded BALANCING_DATA from resourceData.js
        if (typeof BALANCING_DATA !== 'undefined') {
            console.log('Balancing configuration loaded from embedded data');
            resolve(BALANCING_DATA);
        } else {
            console.warn('BALANCING_DATA not found, using defaults');
            resolve(getDefaultBalancingConfig());
        }
    });
}

/**
 * Parse balancing CSV data into config object
 * @param {Array} csvData - Parsed CSV data
 * @returns {Object} Balancing configuration
 */
function parseBalancingData(csvData) {
    const config = getDefaultBalancingConfig();

    csvData.forEach(row => {
        const parameter = row.Parameter;
        const value = parseFloat(row.Value);

        if (config.hasOwnProperty(parameter) && !isNaN(value)) {
            config[parameter] = value;
        }
    });

    return config;
}

/**
 * Get default balancing configuration
 * @returns {Object} Default balancing config
 */
function getDefaultBalancingConfig() {
    return {
        generatedRunnerBatchSize: 5,
        hiringCost: 150,
        contractBaseReward: 1000,
        playerLevelPerContract: 1,
        runnerLevelUpStatGain: 4,
        runnerMainStatAllocation: 2,
        runnerRandomStatAllocation: 2,
        damageRollDelay: 200,
        maxDamageRollValue: 100,
        playerStartingMoney: 600
    };
}

/**
 * Validate balancing configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateBalancingConfig(config) {
    const errors = [];

    if (config.generatedRunnerBatchSize < 1 || config.generatedRunnerBatchSize > 20) {
        errors.push('generatedRunnerBatchSize must be between 1 and 20');
    }

    if (config.hiringCost < 0) {
        errors.push('hiringCost cannot be negative');
    }

    if (config.contractBaseReward < 0) {
        errors.push('contractBaseReward cannot be negative');
    }

    if (config.damageRollDelay < 0) {
        errors.push('damageRollDelay cannot be negative');
    }

    if (config.maxDamageRollValue < 1) {
        errors.push('maxDamageRollValue must be at least 1');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
