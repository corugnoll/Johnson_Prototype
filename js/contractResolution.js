/**
 * Contract Resolution Module
 * Orchestrates contract resolution flow with damage rolls and rewards
 */

/**
 * Execute complete contract resolution
 * @param {GameState} gameState - Current game state
 * @param {Function} updateUICallback - Callback to update UI during resolution
 * @returns {Promise<Object>} Resolution results
 */
async function executeContractResolution(gameState, updateUICallback) {
    // Calculate current pools (already done in gameState)
    const pools = gameState.currentPools;

    // Start with base reward
    let currentReward = gameState.balancingConfig.contractBaseReward;

    // Add any money from nodes
    currentReward += pools.money;

    // Calculate unprevented damage and risk
    const unpreventedDamage = Math.max(0, Math.floor(pools.damage - Math.floor(pools.grit / 2)));
    const unpreventedRisk = Math.max(0, Math.floor(pools.risk - Math.floor(pools.veil / 2)));

    // Initialize results
    const resolutionResults = {
        damageRolls: [],
        finalReward: currentReward,
        riskApplied: unpreventedRisk,
        runnersLeveledUp: [],
        playerLevelGained: gameState.balancingConfig.playerLevelPerContract
    };

    // Create reward state object (mutable for damage effects)
    const rewardState = {currentReward: currentReward};

    // Process damage rolls
    if (unpreventedDamage > 0) {
        for (let i = 0; i < unpreventedDamage; i++) {
            const damageRoll = await processDamageRoll(
                i + 1,
                gameState.hiredRunners,
                rewardState,
                gameState.damageTable,
                gameState.balancingConfig,
                updateUICallback
            );
            resolutionResults.damageRolls.push(damageRoll);

            // Wait for delay before next roll
            await sleep(gameState.balancingConfig.damageRollDelay);
        }
    }

    // Update final reward from damage effects
    resolutionResults.finalReward = Math.floor(rewardState.currentReward);

    // Level up all non-dead runners
    gameState.hiredRunners.forEach(runner => {
        if (runner.runnerState !== 'Dead') {
            runner.level += 1;
            runner.contractsCompleted += 1;
            resolutionResults.runnersLeveledUp.push(runner);

            // NOTE: In MVP Phase 1, stats DO NOT increase on level up
            // This is intentionally left for future implementation
        }
    });

    // Apply rewards and risk to player
    gameState.playerMoney += resolutionResults.finalReward;
    gameState.playerRisk += resolutionResults.riskApplied;
    gameState.playerLevel += resolutionResults.playerLevelGained;
    gameState.contractsCompleted += 1;

    // Unhire all runners (they return to Runner Index)
    gameState.hiredRunners.forEach(runner => {
        runner.hiringState = 'Unhired';
    });
    gameState.hiredRunners = [];

    return resolutionResults;
}

/**
 * Process a single damage roll
 * @param {Number} rollNumber - Roll number (1-indexed)
 * @param {Array<Object>} hiredRunners - Currently hired runners
 * @param {Object} rewardState - Mutable reward state object
 * @param {Array} damageTable - Damage table
 * @param {Object} balancingConfig - Balancing configuration
 * @param {Function} updateUICallback - Callback to update UI
 * @returns {Promise<Object>} Damage roll result
 */
async function processDamageRoll(rollNumber, hiredRunners, rewardState, damageTable, balancingConfig, updateUICallback) {
    // Roll damage
    const outcome = rollDamage(balancingConfig.maxDamageRollValue, damageTable);

    // Apply effect
    const effectResult = applyDamageEffect(outcome, hiredRunners, rewardState);

    // Create result object
    const rollResult = {
        rollNumber: rollNumber,
        roll: outcome.roll,
        effect: outcome.effect,
        description: effectResult.description,
        targetRunner: effectResult.targetRunner,
        newReward: Math.floor(rewardState.currentReward)
    };

    // Update UI
    if (updateUICallback) {
        updateUICallback(rollResult);
    }

    return rollResult;
}

/**
 * Sleep utility for delays
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
