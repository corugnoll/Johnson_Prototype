/**
 * Damage Evaluator Module
 * Handles damage rolls and applies effects based on damage table
 */

/**
 * Roll damage and return outcome
 * @param {Number} maxRollValue - Maximum roll value (from balancing)
 * @param {Array} damageTable - Damage table array
 * @returns {Object} {roll: number, effect: string, effectValue: number}
 */
function rollDamage(maxRollValue, damageTable) {
    // Roll random number
    const roll = Math.floor(Math.random() * maxRollValue) + 1;

    // Find matching range in damage table
    const outcome = damageTable.find(entry => {
        return roll >= entry.minRange && roll <= entry.maxRange;
    });

    if (!outcome) {
        console.error('No damage table entry found for roll:', roll);
        return {roll: roll, effect: 'No Effect', effectValue: 0};
    }

    return {
        roll: roll,
        effect: outcome.effect,
        effectValue: outcome.value || 0
    };
}

/**
 * Apply damage effect to game state
 * @param {Object} damageOutcome - Outcome from rollDamage()
 * @param {Array<Object>} hiredRunners - Currently hired runners
 * @param {Object} rewardState - Object with currentReward property
 * @returns {Object} {description: string, targetRunner: Object|null}
 */
function applyDamageEffect(damageOutcome, hiredRunners, rewardState) {
    const effect = damageOutcome.effect;

    switch(effect) {
        case 'Injury':
            return applyInjury(hiredRunners);

        case 'Death':
            return applyDeath(hiredRunners);

        case 'Reduce':
            return applyRewardReduction(rewardState, damageOutcome.effectValue);

        case 'Extra':
            return applyRewardIncrease(rewardState, damageOutcome.effectValue);

        case 'No Effect':
            return {description: 'No effect', targetRunner: null};

        default:
            console.error('Unknown damage effect:', effect);
            return {description: 'Unknown effect', targetRunner: null};
    }
}

/**
 * Apply injury effect
 * @param {Array<Object>} hiredRunners - Currently hired runners
 * @returns {Object} {description: string, targetRunner: Object|null}
 */
function applyInjury(hiredRunners) {
    // Get all uninjured, non-dead runners
    const readyRunners = hiredRunners.filter(r => r.runnerState === 'Ready');

    if (readyRunners.length > 0) {
        // Randomly injure one
        const target = readyRunners[Math.floor(Math.random() * readyRunners.length)];
        target.runnerState = 'Injured';
        return {
            description: `${target.name} got injured`,
            targetRunner: target
        };
    }

    // All runners are injured, randomly kill one
    const injuredRunners = hiredRunners.filter(r => r.runnerState === 'Injured');
    if (injuredRunners.length > 0) {
        const target = injuredRunners[Math.floor(Math.random() * injuredRunners.length)];
        target.runnerState = 'Dead';
        return {
            description: `${target.name} died (all runners were already injured)`,
            targetRunner: target
        };
    }

    // All runners are dead
    return {description: 'No effect (all runners dead)', targetRunner: null};
}

/**
 * Apply death effect
 * @param {Array<Object>} hiredRunners - Currently hired runners
 * @returns {Object} {description: string, targetRunner: Object|null}
 */
function applyDeath(hiredRunners) {
    // Get all injured runners
    const injuredRunners = hiredRunners.filter(r => r.runnerState === 'Injured');

    if (injuredRunners.length > 0) {
        // Randomly kill one injured runner
        const target = injuredRunners[Math.floor(Math.random() * injuredRunners.length)];
        target.runnerState = 'Dead';
        return {
            description: `${target.name} died`,
            targetRunner: target
        };
    }

    // No injured runners, randomly injure a ready runner
    const readyRunners = hiredRunners.filter(r => r.runnerState === 'Ready');
    if (readyRunners.length > 0) {
        const target = readyRunners[Math.floor(Math.random() * readyRunners.length)];
        target.runnerState = 'Injured';
        return {
            description: `${target.name} got injured (no runners were injured)`,
            targetRunner: target
        };
    }

    // All runners are dead
    return {description: 'No effect (all runners dead)', targetRunner: null};
}

/**
 * Apply reward reduction
 * @param {Object} rewardState - Object with currentReward property
 * @param {Number} percentage - Percentage to reduce (e.g., 15)
 * @returns {Object} {description: string, targetRunner: null}
 */
function applyRewardReduction(rewardState, percentage) {
    const oldReward = rewardState.currentReward;
    const reduction = oldReward * (percentage / 100);
    rewardState.currentReward -= reduction;
    rewardState.currentReward = Math.max(0, rewardState.currentReward);

    return {
        description: `Rewards reduced by ${percentage}%, New Total: $${Math.floor(rewardState.currentReward)}`,
        targetRunner: null
    };
}

/**
 * Apply reward increase
 * @param {Object} rewardState - Object with currentReward property
 * @param {Number} percentage - Percentage to increase (e.g., 5)
 * @returns {Object} {description: string, targetRunner: null}
 */
function applyRewardIncrease(rewardState, percentage) {
    const oldReward = rewardState.currentReward;
    const increase = oldReward * (percentage / 100);
    rewardState.currentReward += increase;

    return {
        description: `Rewards increased by ${percentage}%, New Total: $${Math.floor(rewardState.currentReward)}`,
        targetRunner: null
    };
}

/**
 * Parse damage table CSV data
 * @param {Array} csvData - Parsed CSV array from Papa Parse
 * @returns {Array} Processed damage table entries
 */
function parseDamageTable(csvData) {
    return csvData.map(row => {
        // Parse range (e.g., "1-10" or "95-100")
        const rangeParts = row['Roll Range'].split('-');
        const minRange = parseInt(rangeParts[0]);
        const maxRange = parseInt(rangeParts[1] || rangeParts[0]);

        // Parse effect (e.g., "Injury", "Reduce 15", "Extra 5")
        const effectString = row['Effect'];
        let effect = effectString;
        let value = 0;

        if (effectString.startsWith('Reduce ')) {
            effect = 'Reduce';
            value = parseInt(effectString.split(' ')[1]);
        } else if (effectString.startsWith('Extra ')) {
            effect = 'Extra';
            value = parseInt(effectString.split(' ')[1]);
        }

        return {
            minRange,
            maxRange,
            effect,
            value
        };
    });
}
