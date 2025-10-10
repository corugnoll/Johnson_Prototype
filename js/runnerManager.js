/**
 * Runner Manager Module
 * Manages hiring, unhiring, and runner state transitions
 */

/**
 * Hire a runner
 * @param {Object} runner - Runner to hire
 * @param {GameState} gameState - Current game state
 * @returns {Object} {success: boolean, message: string, slot: number}
 */
function hireRunner(runner, gameState) {
    // Check conditions
    const validation = validateHiring(runner, gameState);
    if (!validation.canHire) {
        return {success: false, message: validation.reason, slot: -1};
    }

    // Deduct money
    gameState.playerMoney -= gameState.balancingConfig.hiringCost;

    // Add to hired runners
    gameState.hiredRunners.push(runner);

    // Update runner state
    runner.hiringState = 'Hired';
    runner.timesHired += 1;
    runner.lastHiredTimestamp = Date.now();

    // Add to previously hired if not already there
    if (!gameState.previouslyHiredRunners.find(r => r.id === runner.id)) {
        gameState.previouslyHiredRunners.push(runner);
    }

    // Recalculate pools
    gameState.calculateCurrentPools();

    return {
        success: true,
        message: `Hired ${runner.name}`,
        slot: gameState.hiredRunners.length - 1
    };
}

/**
 * Validate if runner can be hired
 * @param {Object} runner - Runner to validate
 * @param {GameState} gameState - Current game state
 * @returns {Object} {canHire: boolean, reason: string}
 */
function validateHiring(runner, gameState) {
    // Check if runner is dead
    if (runner.runnerState === 'Dead') {
        return {canHire: false, reason: 'Runner is dead'};
    }

    // Check if already hired
    if (runner.hiringState === 'Hired') {
        return {canHire: false, reason: 'Already hired'};
    }

    // Check if slots are full
    if (gameState.hiredRunners.length >= 3) {
        return {canHire: false, reason: 'All slots full'};
    }

    // Check if player has enough money
    if (gameState.playerMoney < gameState.balancingConfig.hiringCost) {
        return {canHire: false, reason: 'Not enough money'};
    }

    return {canHire: true, reason: ''};
}

/**
 * Unhire a runner
 * @param {Object} runner - Runner to unhire
 * @param {GameState} gameState - Current game state
 * @returns {Object} {success: boolean, message: string}
 */
function unhireRunner(runner, gameState) {
    // Find runner in hired list
    const index = gameState.hiredRunners.findIndex(r => r.id === runner.id);
    if (index === -1) {
        return {success: false, message: 'Runner not hired'};
    }

    // Remove from hired runners
    gameState.hiredRunners.splice(index, 1);

    // Update runner state
    runner.hiringState = 'Unhired';

    // Refund money
    gameState.playerMoney += gameState.balancingConfig.hiringCost;

    // Recalculate pools
    gameState.calculateCurrentPools();

    return {success: true, message: `Unhired ${runner.name}`};
}

/**
 * Unhire all runners (called after contract resolution)
 * @param {GameState} gameState - Current game state
 */
function unhireAllRunners(gameState) {
    gameState.hiredRunners.forEach(runner => {
        runner.hiringState = 'Unhired';
    });

    // Refund money for all runners
    const refundAmount = gameState.hiredRunners.length * gameState.balancingConfig.hiringCost;
    gameState.playerMoney += refundAmount;

    gameState.hiredRunners = [];

    // Recalculate pools
    gameState.calculateCurrentPools();
}

/**
 * Update runner state based on damage evaluation
 * @param {Object} runner - Runner to update
 * @param {String} newState - "Injured" | "Dead"
 */
function updateRunnerState(runner, newState) {
    runner.runnerState = newState;
}

/**
 * Get runners by state
 * @param {Array<Object>} runners - Array of runners
 * @param {String} state - "Ready" | "Injured" | "Dead"
 * @returns {Array<Object>} Filtered runners
 */
function getRunnersByState(runners, state) {
    return runners.filter(r => r.runnerState === state);
}

/**
 * Get runners by hiring state
 * @param {Array<Object>} runners - Array of runners
 * @param {String} hiringState - "Hired" | "Unhired"
 * @returns {Array<Object>} Filtered runners
 */
function getRunnersByHiringState(runners, hiringState) {
    return runners.filter(r => r.hiringState === hiringState);
}
