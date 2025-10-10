/**
 * Runner Generator Module
 * Generates runners with procedural stats and names
 */

/**
 * Generate a single runner
 * @param {Number} level - Runner level (default 1 for MVP)
 * @param {Array} firstNameParts - Available first name parts
 * @param {Array} secondNameParts - Available second name parts
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Object} Generated runner object
 */
function generateRunner(level, firstNameParts, secondNameParts, balancingConfig) {
    // Generate unique ID
    const id = `RUNNER_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Randomly select runner type
    const runnerType = randomRunnerType();

    // Generate name
    const name = generateRunnerName(firstNameParts, secondNameParts);

    // Allocate stats
    const stats = allocateStats(runnerType, level, balancingConfig);

    // Create runner object
    const runner = {
        id: id,
        name: name,
        level: level,
        runnerType: runnerType,
        stats: stats,
        runnerState: 'Ready',
        hiringState: 'Unhired',
        timesHired: 0,
        contractsCompleted: 0,
        lastHiredTimestamp: 0,
        generatedTimestamp: Date.now()
    };

    return runner;
}

/**
 * Generate a batch of runners
 * @param {Number} batchSize - Number of runners to generate
 * @param {Object} nameTable - Object with firstParts and secondParts arrays
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Array<Object>} Array of generated runners
 */
function generateRunnerBatch(batchSize, nameTable, balancingConfig) {
    const runners = [];
    for (let i = 0; i < batchSize; i++) {
        const runner = generateRunner(1, nameTable.firstParts, nameTable.secondParts, balancingConfig);
        runners.push(runner);
    }
    return runners;
}

/**
 * Randomly select runner type
 * @returns {String} "Hacker" | "Face" | "Muscle" | "Ninja"
 */
function randomRunnerType() {
    const types = ['Hacker', 'Face', 'Muscle', 'Ninja'];
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Allocate stats for a runner at a specific level
 * Stat allocation algorithm:
 * - Level 1: 4 points total (2 to main stat, 2 random)
 * - Main stat gets mainStatAllocation points (default 2)
 * - Remaining points distributed randomly
 *
 * @param {String} runnerType - Runner type
 * @param {Number} level - Runner level
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Object} Stats object {face, muscle, hacker, ninja}
 */
function allocateStats(runnerType, level, balancingConfig) {
    // Initialize all stats to 0
    const stats = {
        face: 0,
        muscle: 0,
        hacker: 0,
        ninja: 0
    };

    // Determine main stat based on runner type
    const mainStatKey = runnerType.toLowerCase();

    // Allocate main stat points
    const mainStatAllocation = balancingConfig.runnerMainStatAllocation || 2;
    stats[mainStatKey] = mainStatAllocation;

    // Allocate random stat points
    const randomStatAllocation = balancingConfig.runnerRandomStatAllocation || 2;
    const statKeys = ['face', 'muscle', 'hacker', 'ninja'];

    for (let i = 0; i < randomStatAllocation; i++) {
        // Pick a random stat
        const randomStatKey = statKeys[Math.floor(Math.random() * statKeys.length)];
        stats[randomStatKey] += 1;
    }

    return stats;
}

/**
 * Generate random runner name from name table
 * @param {Array} firstParts - First name parts
 * @param {Array} secondParts - Second name parts
 * @returns {String} Generated name
 */
function generateRunnerName(firstParts, secondParts) {
    if (!firstParts || firstParts.length === 0 || !secondParts || secondParts.length === 0) {
        console.warn('Name table not loaded, using default name');
        return 'Runner Unknown';
    }

    const firstName = firstParts[Math.floor(Math.random() * firstParts.length)];
    const secondName = secondParts[Math.floor(Math.random() * secondParts.length)];

    return `${firstName} ${secondName}`;
}
