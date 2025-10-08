# Runner Generation System - Technical Specification

## Document Version: 1.0
**Last Updated:** 2025-10-08
**Status:** Draft - Ready for Implementation

---

## 1. Executive Summary

### 1.1 Feature Overview
The Runner Generation System transforms the Johnson Prototype from a manual runner configuration system to a dynamic hiring and management system. Players will generate batches of runners with randomized attributes, hire them using in-game currency, and manage them across multiple contracts. This system introduces risk-reward mechanics through damage evaluation, runner state management (Ready/Injured/Dead), and persistent runner progression.

### 1.2 Key Technical Changes

**New Systems:**
- Runner generation with procedural name and stat allocation
- Runner hiring/unhiring with money cost
- Contract resolution with damage table-based outcomes
- Runner state transitions (Ready → Injured → Dead)
- Player level tracking
- Balancing configuration via CSV

**Modified Systems:**
- Replace "Runner Configuration" section with "Runners" display section
- Remove validation button entirely
- Enhanced contract resolution window with damage roll animations
- Game state expanded to track generated runners, hired runners, and player level
- Contract base rewards added (1000 Money default)

**Removed Systems:**
- Manual runner type selection dropdowns
- Manual runner stat input fields
- "Validate Configuration" button and related logic

### 1.3 Impact on Existing Systems

| System | Impact Level | Changes Required |
|--------|-------------|------------------|
| gameState.js | HIGH | Add runner pools, player level, balancing config |
| index.html | HIGH | Replace Runner Configuration section entirely |
| styles.css | MEDIUM | New styles for Runner Index window, Runners section |
| visualPrototype.js | MEDIUM | Update contract execution flow |
| csvLoader.js | LOW | Add balancing.csv and name table loading |

---

## 2. Data Structures

### 2.1 Runner Object

```javascript
/**
 * Complete runner data structure
 * @typedef {Object} Runner
 */
const RunnerTemplate = {
    // Unique identifier
    id: String,               // Format: "RUNNER_{timestamp}_{random}"

    // Display information
    name: String,             // Generated from name table: "FirstPart SecondPart"

    // Core attributes
    level: Number,            // Integer, starts at 1
    runnerType: String,       // "Hacker" | "Face" | "Muscle" | "Ninja"

    // Stats object
    stats: {
        face: Number,         // Integer, 0+
        muscle: Number,       // Integer, 0+
        hacker: Number,       // Integer, 0+
        ninja: Number        // Integer, 0+
    },

    // State tracking
    runnerState: String,      // "Ready" | "Injured" | "Dead"
    hiringState: String,      // "Hired" | "Unhired"

    // Metadata
    timesHired: Number,       // Count of how many times hired
    contractsCompleted: Number, // Count of completed contracts
    lastHiredTimestamp: Number, // Unix timestamp of last hire
    generatedTimestamp: Number  // Unix timestamp of generation
};
```

### 2.2 State Management Updates

**New properties for GameState class:**

```javascript
class GameState {
    constructor() {
        // ... existing properties ...

        // NEW PROPERTIES

        // Player progression
        this.playerLevel = 0;

        // Runner pools
        this.generatedRunners = [];      // Current batch of generated runners
        this.previouslyHiredRunners = []; // All runners hired during this session
        this.hiredRunners = [];          // Currently hired runners (max 3)

        // Balancing configuration
        this.balancingConfig = null;     // Loaded from balancing.csv

        // Name generation data
        this.nameTable = {
            firstParts: [],              // From runner_name_table.csv
            secondParts: []              // From runner_name_table.csv
        };

        // Damage table
        this.damageTable = [];           // From damage_table.csv

        // Contract state
        this.contractBaseReward = 1000;  // Default, overridden by balancing
    }
}
```

### 2.3 Balancing Configuration Structure

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\Resources\balancing.csv`

```csv
Parameter,Value,Description
generatedRunnerBatchSize,5,Number of runners generated per batch
hiringCost,150,Base cost to hire a runner
contractBaseReward,1000,Base money reward for all contracts
playerLevelPerContract,1,How much player level increases per contract
runnerLevelUpStatGain,4,Total stat points gained per level
runnerMainStatAllocation,2,Stat points allocated to main stat on level up
runnerRandomStatAllocation,2,Stat points randomly distributed on level up
damageRollDelay,200,Milliseconds between damage roll displays
maxDamageRollValue,100,Maximum value for damage table rolls
```

**Code representation:**

```javascript
const BalancingConfig = {
    generatedRunnerBatchSize: 5,
    hiringCost: 150,
    contractBaseReward: 1000,
    playerLevelPerContract: 1,
    runnerLevelUpStatGain: 4,
    runnerMainStatAllocation: 2,
    runnerRandomStatAllocation: 2,
    damageRollDelay: 200,
    maxDamageRollValue: 100
};
```

---

## 3. System Architecture

### 3.1 Module Overview

**New Modules:**
- `js/runnerGenerator.js` - Generates runners with procedural stats and names
- `js/runnerManager.js` - Manages hiring, unhiring, state transitions
- `js/contractResolution.js` - Handles contract completion, damage rolls, rewards
- `js/damageEvaluator.js` - Evaluates damage table and applies effects
- `js/balancingLoader.js` - Loads and validates balancing.csv

**Modified Modules:**
- `js/gameState.js` - Add runner pools and player level
- `js/visualPrototype.js` - Update to use new runner system
- `js/ui.js` - Add Runner Index window and Runners section
- `js/csvLoader.js` - Load name table and damage table
- `index.html` - Replace Runner Configuration with Runners section
- `css/styles.css` - Add styles for new UI components

### 3.2 Data Flow

```
Game Initialization
    ↓
Load CSV Data (balancing.csv, runner_name_table.csv, damage_table.csv)
    ↓
Generate Initial Runner Batch (5 runners)
    ↓
Player Opens Runner Index
    ↓
Player Hires Runner (costs money, fills slot)
    ↓
Player Selects Nodes (existing system)
    ↓
Player Executes Contract
    ↓
Contract Resolution Begins
    ├── Calculate Base Pools (existing system)
    ├── Apply Base Reward (1000 Money)
    ├── Calculate Unprevented Damage/Risk
    ├── Process Damage Rolls (one per unprevented damage)
    │   ├── Roll random number (1-100)
    │   ├── Lookup outcome in damage table
    │   ├── Apply effect (Injury, Death, Reduce, Extra, No Effect)
    │   └── Display with delay (200ms)
    ├── Apply Risk to Player Risk
    ├── Level Up All Non-Dead Runners (level +1, NO stat gain in MVP)
    ├── Calculate Final Money Reward
    └── Add Money to Player, Increase Player Level
    ↓
Unhire All Runners (return to Runner Index)
    ↓
Reset Contract, Player Can Select New Contract
```

### 3.3 Dependencies

```
balancingLoader.js
    ↓
runnerGenerator.js ← nameTable (from csvLoader.js)
    ↓
runnerManager.js ← gameState.js
    ↓
damageEvaluator.js ← damageTable (from csvLoader.js)
    ↓
contractResolution.js ← runnerManager.js, damageEvaluator.js
    ↓
visualPrototype.js, ui.js
```

---

## 4. Module Specifications

### 4.1 New Module: runnerGenerator.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\runnerGenerator.js`

**Responsibilities:**
- Generate individual runners with procedural stats
- Generate random names from name table
- Allocate stats based on runner type and level
- Validate generated runners

**Key Functions:**

```javascript
/**
 * Generate a single runner
 * @param {Number} level - Runner level (default 1 for MVP)
 * @param {Array} firstNameParts - Available first name parts
 * @param {Array} secondNameParts - Available second name parts
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Runner} Generated runner object
 */
function generateRunner(level, firstNameParts, secondNameParts, balancingConfig) {
    // Implementation details in section 6.1
}

/**
 * Generate a batch of runners
 * @param {Number} batchSize - Number of runners to generate
 * @param {Object} nameTable - Object with firstParts and secondParts arrays
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Array<Runner>} Array of generated runners
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
 * @param {String} runnerType - Runner type
 * @param {Number} level - Runner level
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Object} Stats object {face, muscle, hacker, ninja}
 */
function allocateStats(runnerType, level, balancingConfig) {
    // Implementation details in section 6.3
}

/**
 * Generate random runner name from name table
 * @param {Array} firstParts - First name parts
 * @param {Array} secondParts - Second name parts
 * @returns {String} Generated name
 */
function generateRunnerName(firstParts, secondParts) {
    // Implementation details in section 6.2
}
```

**Dependencies:**
- None (pure utility module)

---

### 4.2 New Module: runnerManager.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\runnerManager.js`

**Responsibilities:**
- Manage hiring and unhiring of runners
- Validate hiring conditions
- Track runner states
- Handle runner slot management

**Key Functions:**

```javascript
/**
 * Hire a runner
 * @param {Runner} runner - Runner to hire
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

    return {
        success: true,
        message: `Hired ${runner.name}`,
        slot: gameState.hiredRunners.length - 1
    };
}

/**
 * Validate if runner can be hired
 * @param {Runner} runner - Runner to validate
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
 * @param {Runner} runner - Runner to unhire
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
    gameState.hiredRunners = [];
}

/**
 * Update runner state based on damage evaluation
 * @param {Runner} runner - Runner to update
 * @param {String} newState - "Injured" | "Dead"
 */
function updateRunnerState(runner, newState) {
    runner.runnerState = newState;
}

/**
 * Get runners by state
 * @param {Array<Runner>} runners - Array of runners
 * @param {String} state - "Ready" | "Injured" | "Dead"
 * @returns {Array<Runner>} Filtered runners
 */
function getRunnersByState(runners, state) {
    return runners.filter(r => r.runnerState === state);
}
```

**Dependencies:**
- `gameState.js` (accesses game state)

---

### 4.3 New Module: damageEvaluator.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\damageEvaluator.js`

**Responsibilities:**
- Load and parse damage table
- Execute damage rolls
- Determine outcomes from damage table
- Apply damage effects to runners and rewards

**Key Functions:**

```javascript
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
 * @param {Array<Runner>} hiredRunners - Currently hired runners
 * @param {Object} rewardState - Object with currentReward property
 * @returns {Object} {description: string, targetRunner: Runner|null}
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
 * @param {Array<Runner>} hiredRunners - Currently hired runners
 * @returns {Object} {description: string, targetRunner: Runner|null}
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
 * @param {Array<Runner>} hiredRunners - Currently hired runners
 * @returns {Object} {description: string, targetRunner: Runner|null}
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
        description: `Rewards reduced by ${percentage}%, New Total: ${Math.floor(rewardState.currentReward)}`,
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
        description: `Rewards increased by ${percentage}%, New Total: ${Math.floor(rewardState.currentReward)}`,
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
```

**Dependencies:**
- None (pure utility module)

---

### 4.4 New Module: contractResolution.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\contractResolution.js`

**Responsibilities:**
- Orchestrate contract resolution flow
- Process damage rolls with animation delay
- Calculate final rewards
- Update runner levels
- Update player level
- Display resolution window

**Key Functions:**

```javascript
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

            // NOTE: In MVP, stats DO NOT increase on level up
            // This is intentionally left for future implementation
        }
    });

    // Apply rewards and risk to player
    gameState.playerMoney += resolutionResults.finalReward;
    gameState.playerRisk += resolutionResults.riskApplied;
    gameState.playerLevel += resolutionResults.playerLevelGained;
    gameState.contractsCompleted += 1;

    // Unhire all runners
    gameState.hiredRunners.forEach(runner => {
        runner.hiringState = 'Unhired';
    });
    gameState.hiredRunners = [];

    return resolutionResults;
}

/**
 * Process a single damage roll
 * @param {Number} rollNumber - Roll number (1-indexed)
 * @param {Array<Runner>} hiredRunners - Currently hired runners
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
```

**Dependencies:**
- `damageEvaluator.js` (rollDamage, applyDamageEffect)
- `runnerManager.js` (unhireAllRunners)
- `gameState.js` (accesses and modifies game state)

---

### 4.5 New Module: balancingLoader.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\balancingLoader.js`

**Responsibilities:**
- Load balancing.csv file
- Parse and validate balancing parameters
- Provide default values if file is missing

**Key Functions:**

```javascript
/**
 * Load balancing configuration from CSV
 * @param {String} csvPath - Path to balancing.csv
 * @returns {Promise<Object>} Balancing configuration object
 */
async function loadBalancingConfig(csvPath = 'Resources/balancing.csv') {
    return new Promise((resolve, reject) => {
        Papa.parse(csvPath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('Balancing CSV has errors:', results.errors);
                }

                const config = parseBalancingData(results.data);
                resolve(config);
            },
            error: (error) => {
                console.error('Failed to load balancing config:', error);
                // Return defaults if file not found
                resolve(getDefaultBalancingConfig());
            }
        });
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
        maxDamageRollValue: 100
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
```

**Dependencies:**
- Papa Parse library (already included)

---

### 4.6 Modified Module: gameState.js

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\js\gameState.js`

**Changes Required:**

```javascript
// In constructor, add new properties:
constructor() {
    // ... existing properties ...

    // NEW: Player level
    this.playerLevel = 0;

    // NEW: Runner pools
    this.generatedRunners = [];
    this.previouslyHiredRunners = [];
    this.hiredRunners = [];

    // NEW: Configuration data
    this.balancingConfig = null;
    this.nameTable = {firstParts: [], secondParts: []};
    this.damageTable = [];
}

// NEW: Set balancing config
setBalancingConfig(config) {
    this.balancingConfig = config;
    console.log('Balancing config loaded:', config);
}

// NEW: Set name table
setNameTable(firstParts, secondParts) {
    this.nameTable.firstParts = firstParts;
    this.nameTable.secondParts = secondParts;
    console.log(`Name table loaded: ${firstParts.length} first parts, ${secondParts.length} second parts`);
}

// NEW: Set damage table
setDamageTable(damageTable) {
    this.damageTable = damageTable;
    console.log(`Damage table loaded with ${damageTable.length} entries`);
}

// NEW: Set generated runners
setGeneratedRunners(runners) {
    this.generatedRunners = runners;
    console.log(`Generated ${runners.length} runners`);
}

// NEW: Add to previously hired
addToPreviouslyHired(runner) {
    if (!this.previouslyHiredRunners.find(r => r.id === runner.id)) {
        this.previouslyHiredRunners.push(runner);
    }
}

// NEW: Get runner stat totals for hired runners
getHiredRunnerStatTotals() {
    const totals = {face: 0, muscle: 0, hacker: 0, ninja: 0};

    this.hiredRunners.forEach(runner => {
        totals.face += runner.stats.face;
        totals.muscle += runner.stats.muscle;
        totals.hacker += runner.stats.hacker;
        totals.ninja += runner.stats.ninja;
    });

    return totals;
}

// MODIFY: Update initializeRunners to return empty array (runners are now hired, not configured)
initializeRunners() {
    return []; // Hired runners start empty
}

// MODIFY: Remove setRunnerType and setRunnerStat methods (no longer needed)
// These can be commented out or removed entirely

// MODIFY: Update getTotalRunnerStat to use hiredRunners instead of runners
getTotalRunnerStat(statType) {
    return this.hiredRunners.reduce((total, runner) => {
        return total + (runner.stats[statType] || 0);
    }, 0);
}

// MODIFY: Update evaluateCondition for RunnerType to use hiredRunners
// In evaluateCondition, change:
// const count = this.runners.filter(runner => runner.type === requiredType).length;
// To:
// const count = this.hiredRunners.filter(runner => runner.runnerType === requiredType).length;

// MODIFY: Update validateConfiguration
validateConfiguration() {
    // Check if at least one runner is hired
    if (this.hiredRunners.length === 0) {
        console.warn('No runners hired');
        return false;
    }

    // Check if contract is loaded
    if (!this.contractData || this.contractData.length === 0) {
        console.warn('No contract data loaded');
        return false;
    }

    return true;
}

// MODIFY: Update resetSession to include new properties
resetSession() {
    this.resetContract();
    this.hiredRunners = [];
    this.generatedRunners = [];
    this.previouslyHiredRunners = [];
    this.playerMoney = 0;
    this.playerRisk = 0;
    this.playerLevel = 0;
    this.contractsCompleted = 0;

    this.clearSessionState();
    console.log('Full game session reset');
}

// MODIFY: Update saveSessionState to include new properties
saveSessionState() {
    try {
        const sessionData = {
            playerMoney: this.playerMoney,
            playerRisk: this.playerRisk,
            playerLevel: this.playerLevel,
            contractsCompleted: this.contractsCompleted,
            hiredRunners: this.hiredRunners,
            generatedRunners: this.generatedRunners,
            previouslyHiredRunners: this.previouslyHiredRunners,
            timestamp: Date.now()
        };

        sessionStorage.setItem('johnsonGameState', JSON.stringify(sessionData));
        console.log('Session state saved successfully');
    } catch (error) {
        console.warn('Failed to save session state:', error);
    }
}

// MODIFY: Update loadSessionState to include new properties
loadSessionState() {
    try {
        const sessionData = sessionStorage.getItem('johnsonGameState');
        if (!sessionData) {
            return false;
        }

        const parsedData = JSON.parse(sessionData);

        // Validate and restore
        this.playerMoney = parsedData.playerMoney || 0;
        this.playerRisk = parsedData.playerRisk || 0;
        this.playerLevel = parsedData.playerLevel || 0;
        this.contractsCompleted = parsedData.contractsCompleted || 0;
        this.hiredRunners = parsedData.hiredRunners || [];
        this.generatedRunners = parsedData.generatedRunners || [];
        this.previouslyHiredRunners = parsedData.previouslyHiredRunners || [];

        console.log('Session state loaded successfully');
        return true;
    } catch (error) {
        console.warn('Failed to load session state:', error);
        return false;
    }
}
```

---

### 4.7 Modified Module: index.html

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\index.html`

**Changes Required:**

**1. Replace entire "Runner Configuration" section (lines 20-101) with new "Runners" section:**

```html
<aside class="setup-section" role="complementary" aria-label="Hired Runners">
    <h2>Hired Runners</h2>

    <!-- Runner Slots Display -->
    <div class="hired-runner-slots">
        <div class="hired-runner-slot" data-slot="0">
            <div class="empty-slot-message">Empty Slot</div>
        </div>
        <div class="hired-runner-slot" data-slot="1">
            <div class="empty-slot-message">Empty Slot</div>
        </div>
        <div class="hired-runner-slot" data-slot="2">
            <div class="empty-slot-message">Empty Slot</div>
        </div>
    </div>

    <!-- Stat Summary -->
    <div class="stat-summary">
        <h3>Total Stats</h3>
        <div class="stat-summary-grid">
            <div class="stat-summary-item">
                <label>Face:</label>
                <span id="total-face-stat">0</span>
            </div>
            <div class="stat-summary-item">
                <label>Muscle:</label>
                <span id="total-muscle-stat">0</span>
            </div>
            <div class="stat-summary-item">
                <label>Hacker:</label>
                <span id="total-hacker-stat">0</span>
            </div>
            <div class="stat-summary-item">
                <label>Ninja:</label>
                <span id="total-ninja-stat">0</span>
            </div>
        </div>
    </div>

    <!-- Runner Index Toggle Button -->
    <button type="button" id="toggle-runner-index" class="btn btn-primary">Open Runner Index</button>
</aside>
```

**2. Update Game State section to include Player Level (around line 103):**

```html
<aside class="game-state-section" role="complementary" aria-label="Game State">
    <h2>Game State</h2>
    <div class="player-info">
        <!-- NEW: Player Level -->
        <div class="stat-display">
            <label for="player-level">Player Level:</label>
            <span id="player-level" class="stat-value" aria-label="Player level">0</span>
        </div>

        <div class="stat-display">
            <label for="player-money">Player Money:</label>
            <span id="player-money" class="stat-value" aria-label="Current player money">$0</span>
        </div>

        <div class="stat-display">
            <label for="player-risk">Player Risk:</label>
            <span id="player-risk" class="stat-value" aria-label="Current player risk">0</span>
        </div>

        <div class="stat-display">
            <label for="contracts-completed">Contracts Completed:</label>
            <span id="contracts-completed" class="stat-value" aria-label="Number of completed contracts">0</span>
        </div>
    </div>

    <div class="loading-status">
        <p id="loading-message" aria-live="polite">Ready to load contract</p>
    </div>
</aside>
```

**3. Remove "Validate Configuration" button from Options section (line 148):**

```html
<!-- DELETE THIS ENTIRE LINE:
<button type="button" id="validate-config" disabled aria-label="Validate runner configuration">Validate Configuration</button>
-->
```

**4. Add Runner Index Modal before closing </body> tag:**

```html
<!-- Runner Index Modal -->
<div id="runner-index-modal" class="modal-overlay" style="display: none;">
    <div class="modal-content runner-index-content">
        <div class="modal-header">
            <h2>Runner Index</h2>
            <button type="button" id="close-runner-index" class="close-button" aria-label="Close runner index">&times;</button>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
            <button type="button" class="tab-button active" data-tab="generated">Generated Runners</button>
            <button type="button" class="tab-button" data-tab="previously-hired">Previously Hired</button>
        </div>

        <div class="modal-body">
            <!-- Generated Runners Tab -->
            <div id="generated-runners-tab" class="tab-content active">
                <div class="runner-grid" id="generated-runners-grid">
                    <!-- Populated dynamically -->
                </div>
                <button type="button" id="generate-new-runners" class="btn btn-secondary">Generate New Runners</button>
            </div>

            <!-- Previously Hired Tab -->
            <div id="previously-hired-tab" class="tab-content">
                <div class="runner-grid" id="previously-hired-grid">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    </div>
</div>
```

**5. Add new script includes before closing </body> tag:**

```html
<script src="js/balancingLoader.js"></script>
<script src="js/runnerGenerator.js"></script>
<script src="js/runnerManager.js"></script>
<script src="js/damageEvaluator.js"></script>
<script src="js/contractResolution.js"></script>
```

---

### 4.8 Modified Module: styles.css

**File:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\css\styles.css`

**Changes Required:**

**1. Add styles for Hired Runners section:**

```css
/* Hired Runners Section */
.hired-runner-slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.hired-runner-slot {
    background-color: var(--accent-bg);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    position: relative;
}

.hired-runner-slot.filled {
    border-color: var(--text-primary);
}

.empty-slot-message {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    margin: auto;
    font-size: 0.8rem;
}

.hired-runner-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.hired-runner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.hired-runner-name {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 0.85rem;
}

.hired-runner-type {
    font-size: 0.75rem;
    color: var(--text-secondary);
    background-color: var(--primary-bg);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
}

.hired-runner-level {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.hired-runner-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.2rem;
    font-size: 0.7rem;
    margin-top: 0.25rem;
}

.hired-runner-stat {
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
}

.hired-runner-state {
    font-size: 0.7rem;
    font-weight: bold;
    margin-top: 0.25rem;
}

.hired-runner-state.ready {
    color: var(--success-color);
}

.hired-runner-state.injured {
    color: var(--warning-color);
}

.hired-runner-state.dead {
    color: var(--error-color);
}

.unhire-button {
    padding: 0.2rem 0.4rem;
    font-size: 0.7rem;
    margin-top: 0.25rem;
    background-color: var(--warning-color);
}

.unhire-button:hover {
    background-color: #e67e22;
}

/* Stat Summary */
.stat-summary {
    background-color: var(--accent-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    margin-bottom: 0.5rem;
}

.stat-summary h3 {
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
    color: var(--text-primary);
}

.stat-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
}

.stat-summary-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-secondary);
}

.stat-summary-item label {
    color: var(--text-muted);
}

.stat-summary-item span {
    font-weight: bold;
    color: var(--text-primary);
}
```

**2. Add styles for Runner Index Modal:**

```css
/* Runner Index Modal */
.runner-index-content {
    max-width: 900px;
    width: 95%;
}

.tab-navigation {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--primary-bg);
    border-bottom: 2px solid var(--border-color);
}

.tab-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background-color: var(--accent-bg);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.tab-button:hover {
    background-color: var(--border-color);
}

.tab-button.active {
    background-color: var(--text-primary);
    color: white;
    border-color: var(--text-primary);
}

.tab-content {
    display: none;
    padding: 1rem;
}

.tab-content.active {
    display: block;
}

/* Runner Grid */
.runner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
    max-height: 60vh;
    overflow-y: auto;
}

.runner-card {
    background-color: var(--accent-bg);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.runner-card:hover {
    border-color: var(--text-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.runner-card.hired {
    border-color: var(--success-color);
    background-color: rgba(39, 174, 96, 0.1);
}

.runner-card.dead {
    opacity: 0.6;
    border-color: var(--text-muted);
}

.runner-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
}

.runner-card-name {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 0.95rem;
}

.runner-card-type {
    font-size: 0.75rem;
    color: var(--text-secondary);
    background-color: var(--primary-bg);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
}

.runner-card-body {
    flex: 1;
}

.runner-card-level {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
}

.runner-card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.3rem;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
}

.runner-card-stat {
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
}

.runner-card-stat label {
    color: var(--text-muted);
}

.runner-card-state {
    font-size: 0.8rem;
    font-weight: bold;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    text-align: center;
}

.runner-card-state.ready {
    background-color: rgba(39, 174, 96, 0.2);
    color: var(--success-color);
}

.runner-card-state.injured {
    background-color: rgba(243, 156, 18, 0.2);
    color: var(--warning-color);
}

.runner-card-state.dead {
    background-color: rgba(231, 76, 60, 0.2);
    color: var(--error-color);
}

.runner-card-footer {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.hire-button {
    padding: 0.5rem;
    font-size: 0.8rem;
    background-color: var(--success-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
}

.hire-button:hover:not(:disabled) {
    background-color: #229954;
    transform: translateY(-1px);
}

.hire-button:disabled {
    background-color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.6;
}

.hire-cost {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-align: center;
}

.hire-restriction {
    font-size: 0.65rem;
    color: var(--error-color);
    text-align: center;
    font-style: italic;
}
```

**3. Add styles for Enhanced Contract Resolution Window:**

```css
/* Enhanced Resolution Window */
.resolution-runners {
    margin-bottom: 1.5rem;
}

.resolution-runners h4 {
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
}

.resolution-runner-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.resolution-runner-item {
    background-color: var(--primary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.resolution-runner-info {
    flex: 1;
}

.resolution-runner-name {
    font-weight: bold;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.resolution-runner-level {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.resolution-runner-level.level-up {
    color: var(--success-color);
}

.resolution-runner-state {
    font-size: 0.75rem;
    font-weight: bold;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
}

.resolution-runner-state.ready {
    background-color: rgba(39, 174, 96, 0.2);
    color: var(--success-color);
}

.resolution-runner-state.injured {
    background-color: rgba(243, 156, 18, 0.2);
    color: var(--warning-color);
}

.resolution-runner-state.dead {
    background-color: rgba(231, 76, 60, 0.2);
    color: var(--error-color);
}

/* Damage Rolls Section */
.damage-rolls-section {
    margin-bottom: 1.5rem;
}

.damage-rolls-section h4 {
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
}

.damage-roll-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
}

.damage-roll-item {
    background-color: var(--primary-bg);
    border-left: 3px solid var(--border-color);
    padding: 0.5rem;
    border-radius: var(--border-radius);
    animation: rollFadeIn 0.3s ease-out;
}

@keyframes rollFadeIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.damage-roll-item.injury {
    border-left-color: var(--warning-color);
}

.damage-roll-item.death {
    border-left-color: var(--error-color);
}

.damage-roll-item.reduce {
    border-left-color: var(--error-color);
}

.damage-roll-item.extra {
    border-left-color: var(--success-color);
}

.damage-roll-item.no-effect {
    border-left-color: var(--text-muted);
}

.damage-roll-header {
    font-weight: bold;
    color: var(--text-primary);
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
}

.damage-roll-description {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

/* Reward Display */
.reward-display {
    background-color: var(--accent-bg);
    border: 2px solid var(--success-color);
    border-radius: var(--border-radius);
    padding: 1rem;
    text-align: center;
    margin-bottom: 1rem;
}

.reward-display h3 {
    color: var(--success-color);
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.reward-amount {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--text-primary);
}
```

---

## 5. UI Component Specifications

### 5.1 Runner Index Window

**HTML Structure:**

The Runner Index is a modal window with two tabs and a grid layout for displaying runners.

**Key Elements:**
- Modal overlay with backdrop
- Header with "Runner Index" title and close button
- Tab navigation (Generated Runners / Previously Hired)
- Scrollable runner grid
- "Generate New Runners" button (only in Generated Runners tab)

**CSS Styling Requirements:**
- Modal centered on screen
- Backdrop with 80% opacity black
- Runner cards in responsive grid (250px min width)
- Hover effects on runner cards
- State-based visual indicators (Ready/Injured/Dead)
- Different styling for hired vs unhired runners

**Event Handlers:**

```javascript
// Toggle Runner Index visibility
document.getElementById('toggle-runner-index').addEventListener('click', () => {
    const modal = document.getElementById('runner-index-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
});

// Close button
document.getElementById('close-runner-index').addEventListener('click', () => {
    document.getElementById('runner-index-modal').style.display = 'none';
});

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        switchTab(targetTab);
    });
});

// Generate new runners
document.getElementById('generate-new-runners').addEventListener('click', () => {
    generateNewRunnerBatch();
    renderGeneratedRunners();
});

// Hire button (dynamically added to each runner card)
function createHireButton(runner) {
    const button = document.createElement('button');
    button.className = 'hire-button';
    button.textContent = `Hire - $${gameState.balancingConfig.hiringCost}`;

    const validation = validateHiring(runner, gameState);
    button.disabled = !validation.canHire;

    if (!validation.canHire) {
        const restriction = document.createElement('div');
        restriction.className = 'hire-restriction';
        restriction.textContent = validation.reason;
        // Add restriction message below button
    }

    button.addEventListener('click', () => {
        const result = hireRunner(runner, gameState);
        if (result.success) {
            renderHiredRunners();
            renderGeneratedRunners();
            updateStatSummary();
        }
    });

    return button;
}
```

**Tab Content:**

**Generated Runners Tab:**
- Displays runners from `gameState.generatedRunners`
- Each runner shown as a card with:
  - Name (bold, primary color)
  - Type (badge)
  - Level
  - Stats (grid: Face, Muscle, Hacker, Ninja)
  - State (Ready/Injured/Dead with color coding)
  - Hire button with cost
  - Restriction message if cannot hire
- "Generate New Runners" button at bottom

**Previously Hired Tab:**
- Displays runners from `gameState.previouslyHiredRunners`
- Sorted by `lastHiredTimestamp` descending (most recent first)
- Same card layout as Generated Runners
- Hire button enabled/disabled based on current state
- Shows dead runners (grayed out, cannot hire)

---

### 5.2 Runners Section (replaces Runner Configuration)

**HTML Structure:**

```html
<aside class="setup-section">
    <h2>Hired Runners</h2>

    <!-- 3 Runner Slots -->
    <div class="hired-runner-slots">
        <div class="hired-runner-slot" data-slot="0">
            <!-- Either empty or filled with runner info -->
        </div>
        <div class="hired-runner-slot" data-slot="1"></div>
        <div class="hired-runner-slot" data-slot="2"></div>
    </div>

    <!-- Stat Summary -->
    <div class="stat-summary">
        <h3>Total Stats</h3>
        <div class="stat-summary-grid">
            <!-- Face, Muscle, Hacker, Ninja totals -->
        </div>
    </div>

    <!-- Toggle Runner Index Button -->
    <button id="toggle-runner-index">Open Runner Index</button>
</aside>
```

**Display States:**

**Empty Slot:**
```html
<div class="hired-runner-slot" data-slot="0">
    <div class="empty-slot-message">Empty Slot</div>
</div>
```

**Filled Slot:**
```html
<div class="hired-runner-slot filled" data-slot="0">
    <div class="hired-runner-info">
        <div class="hired-runner-header">
            <span class="hired-runner-name">Decker Hauser</span>
            <span class="hired-runner-type">Hacker</span>
        </div>
        <div class="hired-runner-level">Level 1</div>
        <div class="hired-runner-stats">
            <div class="hired-runner-stat">
                <span>Face:</span><span>0</span>
            </div>
            <div class="hired-runner-stat">
                <span>Muscle:</span><span>1</span>
            </div>
            <div class="hired-runner-stat">
                <span>Hacker:</span><span>2</span>
            </div>
            <div class="hired-runner-stat">
                <span>Ninja:</span><span>1</span>
            </div>
        </div>
        <div class="hired-runner-state ready">Ready</div>
        <button class="unhire-button">Unhire</button>
    </div>
</div>
```

**Unhire Functionality:**

```javascript
function renderHiredRunners() {
    const slots = document.querySelectorAll('.hired-runner-slot');

    // Clear all slots
    slots.forEach(slot => {
        slot.innerHTML = '<div class="empty-slot-message">Empty Slot</div>';
        slot.classList.remove('filled');
    });

    // Fill hired slots
    gameState.hiredRunners.forEach((runner, index) => {
        if (index < 3) {
            const slot = slots[index];
            slot.classList.add('filled');
            slot.innerHTML = createHiredRunnerHTML(runner);

            // Add unhire event listener
            const unhireBtn = slot.querySelector('.unhire-button');
            unhireBtn.addEventListener('click', () => {
                const result = unhireRunner(runner, gameState);
                if (result.success) {
                    renderHiredRunners();
                    renderGeneratedRunners();
                    updateStatSummary();
                }
            });
        }
    });
}

function createHiredRunnerHTML(runner) {
    const stateClass = runner.runnerState.toLowerCase();
    return `
        <div class="hired-runner-info">
            <div class="hired-runner-header">
                <span class="hired-runner-name">${runner.name}</span>
                <span class="hired-runner-type">${runner.runnerType}</span>
            </div>
            <div class="hired-runner-level">Level ${runner.level}</div>
            <div class="hired-runner-stats">
                <div class="hired-runner-stat"><span>Face:</span><span>${runner.stats.face}</span></div>
                <div class="hired-runner-stat"><span>Muscle:</span><span>${runner.stats.muscle}</span></div>
                <div class="hired-runner-stat"><span>Hacker:</span><span>${runner.stats.hacker}</span></div>
                <div class="hired-runner-stat"><span>Ninja:</span><span>${runner.stats.ninja}</span></div>
            </div>
            <div class="hired-runner-state ${stateClass}">${runner.runnerState}</div>
            <button class="unhire-button">Unhire</button>
        </div>
    `;
}
```

**Stat Summary Display:**

```javascript
function updateStatSummary() {
    const totals = gameState.getHiredRunnerStatTotals();

    document.getElementById('total-face-stat').textContent = totals.face;
    document.getElementById('total-muscle-stat').textContent = totals.muscle;
    document.getElementById('total-hacker-stat').textContent = totals.hacker;
    document.getElementById('total-ninja-stat').textContent = totals.ninja;
}
```

---

### 5.3 Contract Resolution Window

**Enhanced Display Structure:**

```html
<div id="results-modal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Contract Resolution</h2>
            <button id="close-results" class="close-button">&times;</button>
        </div>

        <div class="modal-body">
            <!-- Runners Section -->
            <div class="resolution-runners">
                <h4>Hired Runners</h4>
                <div class="resolution-runner-list" id="resolution-runner-list">
                    <!-- Dynamically populated -->
                </div>
            </div>

            <!-- Damage Rolls Section -->
            <div class="damage-rolls-section">
                <h4>Damage Rolls</h4>
                <div class="damage-roll-list" id="damage-roll-list">
                    <!-- Dynamically populated with animation -->
                </div>
            </div>

            <!-- Risk Applied -->
            <div class="execution-details">
                <div class="detail-item">
                    <label>Risk Applied to Player:</label>
                    <span id="risk-applied">0</span>
                </div>
            </div>

            <!-- Reward Display -->
            <div class="reward-display">
                <h3>Final Reward</h3>
                <div class="reward-amount" id="final-reward-amount">$0</div>
            </div>

            <!-- Player Level Increase -->
            <div class="execution-details">
                <div class="detail-item">
                    <label>Player Level Increased:</label>
                    <span id="player-level-increase">+1</span>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button id="continue-session" class="btn btn-primary">Continue</button>
        </div>
    </div>
</div>
```

**Damage Roll Animation:**

```javascript
async function displayDamageRolls(damageRolls) {
    const container = document.getElementById('damage-roll-list');
    container.innerHTML = ''; // Clear previous

    for (const roll of damageRolls) {
        // Create roll item
        const rollItem = document.createElement('div');
        rollItem.className = `damage-roll-item ${getEffectClass(roll.effect)}`;

        rollItem.innerHTML = `
            <div class="damage-roll-header">
                Damage Roll ${roll.rollNumber}: ${roll.roll}
            </div>
            <div class="damage-roll-description">
                ${roll.description}
            </div>
        `;

        // Add to container
        container.appendChild(rollItem);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Wait for delay
        await sleep(gameState.balancingConfig.damageRollDelay);
    }
}

function getEffectClass(effect) {
    switch(effect) {
        case 'Injury': return 'injury';
        case 'Death': return 'death';
        case 'Reduce': return 'reduce';
        case 'Extra': return 'extra';
        default: return 'no-effect';
    }
}
```

**Runner State Display with Level Up:**

```javascript
function displayResolutionRunners(runners, leveledUpRunners) {
    const container = document.getElementById('resolution-runner-list');
    container.innerHTML = '';

    runners.forEach(runner => {
        const leveledUp = leveledUpRunners.find(r => r.id === runner.id);
        const stateClass = runner.runnerState.toLowerCase();

        const runnerItem = document.createElement('div');
        runnerItem.className = 'resolution-runner-item';

        runnerItem.innerHTML = `
            <div class="resolution-runner-info">
                <div class="resolution-runner-name">${runner.name}</div>
                <div class="resolution-runner-level ${leveledUp ? 'level-up' : ''}">
                    Level ${runner.level}${leveledUp ? ' (+1 Level Up!)' : ''}
                </div>
            </div>
            <div class="resolution-runner-state ${stateClass}">
                ${runner.runnerState}
            </div>
        `;

        container.appendChild(runnerItem);
    });
}
```

---

## 6. Algorithm Specifications

### 6.1 Runner Generation Algorithm

**Step-by-step process:**

```javascript
function generateRunner(level, firstNameParts, secondNameParts, balancingConfig) {
    // Step 1: Generate unique ID
    const id = `RUNNER_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Step 2: Generate random name
    const name = generateRunnerName(firstNameParts, secondNameParts);

    // Step 3: Randomly select runner type
    const runnerType = randomRunnerType();

    // Step 4: Allocate stats based on level
    const stats = allocateStats(runnerType, level, balancingConfig);

    // Step 5: Create runner object
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
```

**Edge Cases:**
- Empty name table: Use fallback names "Runner #1", "Runner #2", etc.
- Invalid level: Default to level 1
- Missing balancing config: Use default values

---

### 6.2 Name Generation Algorithm

**Process:**

```javascript
function generateRunnerName(firstParts, secondParts) {
    // Validate inputs
    if (!firstParts || firstParts.length === 0) {
        console.warn('No first name parts available');
        firstParts = ['Runner'];
    }

    if (!secondParts || secondParts.length === 0) {
        console.warn('No second name parts available');
        secondParts = ['Unknown'];
    }

    // Randomly select one from each array
    const firstName = firstParts[Math.floor(Math.random() * firstParts.length)];
    const secondName = secondParts[Math.floor(Math.random() * secondParts.length)];

    // Combine with space
    return `${firstName} ${secondName}`;
}
```

**Example:**
- First Parts: ["Decker", "Bonny", "Magnus"]
- Second Parts: ["Hauser", "Blip", "III."]
- Possible Names: "Decker Hauser", "Bonny III.", "Magnus Blip", etc.

---

### 6.3 Stat Distribution Algorithm

**Process:**

```javascript
function allocateStats(runnerType, level, balancingConfig) {
    // Initialize stats at 0
    const stats = {
        face: 0,
        muscle: 0,
        hacker: 0,
        ninja: 0
    };

    // Map runner type to main stat
    const mainStatMap = {
        'Face': 'face',
        'Muscle': 'muscle',
        'Hacker': 'hacker',
        'Ninja': 'ninja'
    };

    const mainStat = mainStatMap[runnerType];

    // Allocate stats for each level
    for (let currentLevel = 1; currentLevel <= level; currentLevel++) {
        // Get stat allocation values from balancing
        const mainStatAllocation = balancingConfig.runnerMainStatAllocation; // Default: 2
        const randomStatAllocation = balancingConfig.runnerRandomStatAllocation; // Default: 2

        // Allocate main stat points
        stats[mainStat] += mainStatAllocation;

        // Randomly distribute remaining points
        for (let i = 0; i < randomStatAllocation; i++) {
            const randomStatKey = ['face', 'muscle', 'hacker', 'ninja'][Math.floor(Math.random() * 4)];
            stats[randomStatKey] += 1;
        }
    }

    return stats;
}
```

**Example for Level 1 Hacker:**
- Main stat (hacker): +2
- Random allocation: 2 points randomly distributed
- Possible outcome: {face: 0, muscle: 1, hacker: 2, ninja: 1}
- Total: 4 stat points

**Example for Level 5 Muscle:**
- Each level: +2 muscle (guaranteed) + 2 random
- After 5 levels: {face: 2, muscle: 13, hacker: 1, ninja: 4} (example)
- Total: 20 stat points

**MVP Note:**
Runners are generated at level 1 only. When they level up during contract completion, their level number increases but stats do NOT change (for MVP implementation).

---

### 6.4 Damage Evaluation Algorithm

**Process:**

```javascript
function evaluateDamage(unpreventedDamage, hiredRunners, rewardState, damageTable, balancingConfig) {
    const damageRolls = [];

    // Roll once for each unprevented damage point
    for (let i = 0; i < unpreventedDamage; i++) {
        // Roll random number (1 to maxDamageRollValue)
        const roll = Math.floor(Math.random() * balancingConfig.maxDamageRollValue) + 1;

        // Find matching range in damage table
        const outcome = damageTable.find(entry => {
            return roll >= entry.minRange && roll <= entry.maxRange;
        });

        if (!outcome) {
            console.error('No damage table entry for roll:', roll);
            continue;
        }

        // Apply effect
        const effectResult = applyDamageEffect(outcome, hiredRunners, rewardState);

        // Record roll
        damageRolls.push({
            rollNumber: i + 1,
            roll: roll,
            effect: outcome.effect,
            description: effectResult.description,
            targetRunner: effectResult.targetRunner,
            newReward: Math.floor(rewardState.currentReward)
        });
    }

    return damageRolls;
}
```

**Damage Table Lookup Example:**

Given roll = 56 and damage table:
```
1-10: Death
11-30: Injury
31-50: Reduce 15
51-70: Reduce 10
71-94: No Effect
95-100: Extra 5
```

Roll 56 falls in range 51-70, result is "Reduce 10"

---

### 6.5 Runner State Transitions

**State Machine:**

```
Ready ──[Injury effect]──> Injured ──[Death effect]──> Dead
  │                           │
  └─[Death effect when       └─[Injury effect when
     no injured runners]        all runners injured]
```

**Transition Rules:**

1. **Injury Effect:**
   - If Ready runners exist → Pick random Ready runner → Set to Injured
   - If no Ready runners → Pick random Injured runner → Set to Dead
   - If all Dead → No effect

2. **Death Effect:**
   - If Injured runners exist → Pick random Injured runner → Set to Dead
   - If no Injured runners → Pick random Ready runner → Set to Injured
   - If all Dead → No effect

3. **State Persistence:**
   - Dead runners remain Dead permanently
   - Injured runners do NOT heal (in MVP)
   - Ready runners can become Injured or (rarely) Dead

---

## 7. API/Function Definitions

### 7.1 Core Runner Generation Functions

```javascript
/**
 * Generate a batch of runners
 * @param {Number} batchSize - Number of runners to generate
 * @param {Object} nameTable - {firstParts: Array, secondParts: Array}
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Array<Runner>} Array of generated runners
 */
function generateRunnerBatch(batchSize, nameTable, balancingConfig);

/**
 * Generate a single runner
 * @param {Number} level - Runner level (default 1)
 * @param {Array} firstNameParts - First name parts
 * @param {Array} secondNameParts - Second name parts
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Runner} Generated runner
 */
function generateRunner(level, firstNameParts, secondNameParts, balancingConfig);

/**
 * Allocate stats for a runner
 * @param {String} runnerType - "Face" | "Muscle" | "Hacker" | "Ninja"
 * @param {Number} level - Runner level
 * @param {Object} balancingConfig - Balancing configuration
 * @returns {Object} Stats object {face, muscle, hacker, ninja}
 */
function allocateStats(runnerType, level, balancingConfig);

/**
 * Generate random runner name
 * @param {Array} firstParts - First name parts
 * @param {Array} secondParts - Second name parts
 * @returns {String} Generated name
 */
function generateRunnerName(firstParts, secondParts);
```

### 7.2 Runner Management Functions

```javascript
/**
 * Hire a runner
 * @param {Runner} runner - Runner to hire
 * @param {GameState} gameState - Current game state
 * @returns {Object} {success: boolean, message: string, slot: number}
 */
function hireRunner(runner, gameState);

/**
 * Unhire a runner
 * @param {Runner} runner - Runner to unhire
 * @param {GameState} gameState - Current game state
 * @returns {Object} {success: boolean, message: string}
 */
function unhireRunner(runner, gameState);

/**
 * Validate if runner can be hired
 * @param {Runner} runner - Runner to validate
 * @param {GameState} gameState - Current game state
 * @returns {Object} {canHire: boolean, reason: string}
 */
function validateHiring(runner, gameState);

/**
 * Unhire all runners
 * @param {GameState} gameState - Current game state
 */
function unhireAllRunners(gameState);

/**
 * Update runner state
 * @param {Runner} runner - Runner to update
 * @param {String} newState - "Ready" | "Injured" | "Dead"
 */
function updateRunnerState(runner, newState);
```

### 7.3 Contract Resolution Functions

```javascript
/**
 * Execute complete contract resolution
 * @param {GameState} gameState - Current game state
 * @param {Function} updateUICallback - Callback for UI updates
 * @returns {Promise<Object>} Resolution results
 */
async function executeContractResolution(gameState, updateUICallback);

/**
 * Process a single damage roll
 * @param {Number} rollNumber - Roll number (1-indexed)
 * @param {Array<Runner>} hiredRunners - Currently hired runners
 * @param {Object} rewardState - Mutable reward state {currentReward: number}
 * @param {Array} damageTable - Damage table
 * @param {Object} balancingConfig - Balancing configuration
 * @param {Function} updateUICallback - UI update callback
 * @returns {Promise<Object>} Damage roll result
 */
async function processDamageRoll(rollNumber, hiredRunners, rewardState, damageTable, balancingConfig, updateUICallback);
```

### 7.4 Damage Evaluation Functions

```javascript
/**
 * Roll damage and return outcome
 * @param {Number} maxRollValue - Maximum roll value
 * @param {Array} damageTable - Damage table array
 * @returns {Object} {roll: number, effect: string, effectValue: number}
 */
function rollDamage(maxRollValue, damageTable);

/**
 * Apply damage effect
 * @param {Object} damageOutcome - Outcome from rollDamage()
 * @param {Array<Runner>} hiredRunners - Currently hired runners
 * @param {Object} rewardState - {currentReward: number}
 * @returns {Object} {description: string, targetRunner: Runner|null}
 */
function applyDamageEffect(damageOutcome, hiredRunners, rewardState);

/**
 * Parse damage table CSV
 * @param {Array} csvData - Parsed CSV from Papa Parse
 * @returns {Array} Processed damage table
 */
function parseDamageTable(csvData);
```

### 7.5 Balancing Loader Functions

```javascript
/**
 * Load balancing configuration
 * @param {String} csvPath - Path to balancing.csv
 * @returns {Promise<Object>} Balancing configuration
 */
async function loadBalancingConfig(csvPath);

/**
 * Get default balancing configuration
 * @returns {Object} Default configuration
 */
function getDefaultBalancingConfig();

/**
 * Validate balancing configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
function validateBalancingConfig(config);
```

---

## 8. Implementation Phases

### Phase 1: Core Data Structures and Runner Generation

**Tasks:**
1. Create `balancing.csv` file with all parameters
2. Implement `balancingLoader.js` module
3. Implement `runnerGenerator.js` module
4. Update `gameState.js` with new properties
5. Update `csvLoader.js` to load name table and damage table
6. Parse `runner_name_table.csv` and `damage_table.csv`

**Testing:**
- Test balancing config loading with valid/invalid files
- Test runner generation with various parameters
- Verify stat allocation algorithm produces correct totals
- Verify name generation produces valid combinations
- Test edge cases (empty name table, level 0, etc.)

**Dependencies:**
- None (can start immediately)

**Acceptance Criteria:**
- `balancing.csv` exists and loads correctly
- `generateRunnerBatch()` produces valid runner objects
- Stats are allocated correctly based on type and level
- Names are generated from name table
- All runner properties are initialized correctly

---

### Phase 2: UI Components (Runner Index, Runners Section)

**Tasks:**
1. Update `index.html` with new Runner Index modal
2. Update `index.html` to replace Runner Configuration with Runners section
3. Add CSS styles for Runner Index window
4. Add CSS styles for Runners section
5. Add CSS styles for runner cards
6. Implement tab switching functionality
7. Implement runner card rendering
8. Add "Open Runner Index" button functionality

**Testing:**
- Test Runner Index modal open/close
- Test tab switching between Generated/Previously Hired
- Test runner card display with different states (Ready/Injured/Dead)
- Test responsive grid layout
- Test hired runner slot display (empty vs filled)
- Test stat summary display

**Dependencies:**
- Phase 1 (needs runner generation)

**Acceptance Criteria:**
- Runner Index window opens and closes correctly
- Tabs switch properly
- Runner cards display all information correctly
- Runners section shows hired runners
- Stat summary calculates totals correctly
- UI is responsive and matches design mockup

---

### Phase 3: Hiring System

**Tasks:**
1. Implement `runnerManager.js` module
2. Implement `validateHiring()` function
3. Implement `hireRunner()` function
4. Implement `unhireRunner()` function
5. Add hire button event handlers
6. Add unhire button event handlers
7. Update Runner Index to show hiring restrictions
8. Update UI after hiring/unhiring

**Testing:**
- Test hiring when conditions are met
- Test hiring when money insufficient
- Test hiring when slots full
- Test hiring dead runners (should fail)
- Test unhiring and money refund
- Test previously hired tracking
- Test UI updates after hiring/unhiring

**Dependencies:**
- Phase 1 (runner generation)
- Phase 2 (UI components)

**Acceptance Criteria:**
- Hiring deducts correct money amount
- Hired runners appear in Runners section
- Unhiring refunds money
- Validation prevents invalid hiring
- Previously hired list tracks all hired runners
- Dead runners cannot be hired
- UI updates immediately on hire/unhire

---

### Phase 4: Contract Resolution and Damage Evaluation

**Tasks:**
1. Implement `damageEvaluator.js` module
2. Implement `contractResolution.js` module
3. Update contract execution flow in `visualPrototype.js`
4. Add damage roll animation display
5. Implement runner state transitions
6. Implement runner level-up (level number only, no stats in MVP)
7. Update resolution window UI
8. Add base contract reward to all contracts
9. Implement player level increase
10. Unhire all runners after contract completion

**Testing:**
- Test damage rolls with various unprevented damage values
- Test damage table lookup for all ranges
- Test Injury effect on Ready/Injured/Dead runners
- Test Death effect on Ready/Injured/Dead runners
- Test Reduce/Extra reward effects
- Test runner level-up (verify stats don't change in MVP)
- Test player level increase
- Test unhiring after contract completion
- Test animation timing and display

**Dependencies:**
- Phase 1 (data structures)
- Phase 2 (UI components)
- Phase 3 (hiring system)

**Acceptance Criteria:**
- Damage rolls execute correctly
- Damage table effects apply as specified
- Runner states transition correctly
- Runners level up after successful contracts
- Player level increases by configured amount
- All hired runners are unhired after resolution
- Resolution window displays all information
- Animation timing is configurable and works smoothly
- Base reward is added to all contracts

---

### Phase 5: Integration and Polish

**Tasks:**
1. Remove "Validate Configuration" button
2. Remove manual runner configuration UI completely
3. Update all references to `gameState.runners` to use `gameState.hiredRunners`
4. Generate initial runner batch on game load
5. Test full gameplay loop (generate → hire → contract → resolution → repeat)
6. Add "Generate New Runners" functionality
7. Polish animations and transitions
8. Add error handling and edge case coverage
9. Update session state save/load for new properties
10. Test session persistence

**Testing:**
- Full integration test: complete multiple contracts
- Test session save/load with runners
- Test edge cases (all runners dead, no money, etc.)
- Test UI responsiveness across screen sizes
- Performance testing with large runner lists

**Dependencies:**
- All previous phases

**Acceptance Criteria:**
- Old runner configuration system completely removed
- Game flows smoothly from generation to resolution
- Session persistence works with new data structures
- No critical bugs or errors in console
- UI is polished and responsive
- All edge cases handled gracefully
- Performance is acceptable (no lag during rolls)

---

## 9. CSV File Formats

### 9.1 balancing.csv

**File Path:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\Resources\balancing.csv`

**Format:**

```csv
Parameter,Value,Description
generatedRunnerBatchSize,5,Number of runners generated per batch
hiringCost,150,Base cost to hire a runner
contractBaseReward,1000,Base money reward for all contracts
playerLevelPerContract,1,How much player level increases per contract
runnerLevelUpStatGain,4,Total stat points gained per level
runnerMainStatAllocation,2,Stat points allocated to main stat on level up
runnerRandomStatAllocation,2,Stat points randomly distributed on level up
damageRollDelay,200,Milliseconds between damage roll displays
maxDamageRollValue,100,Maximum value for damage table rolls
```

**Columns:**
- `Parameter` (String): Parameter name (must match code exactly)
- `Value` (Number): Numeric value for the parameter
- `Description` (String): Human-readable description

**Validation:**
- All values must be numeric
- `generatedRunnerBatchSize`: 1-20
- `hiringCost`: >= 0
- `contractBaseReward`: >= 0
- `damageRollDelay`: >= 0
- `maxDamageRollValue`: >= 1

---

### 9.2 runner_name_table.csv

**File Path:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\Resources\runner_name_table.csv`

**Format:**

```csv
First Part,Second Part
Decker,Hauser
Bonny,Blip
Magnus,III.
...
```

**Columns:**
- `First Part` (String): First name or title
- `Second Part` (String): Last name or designation

**Usage:**
- One random entry from `First Part` column
- One random entry from `Second Part` column
- Combine with space: `"${firstPart} ${secondPart}"`

**Notes:**
- Currently has 101 entries (index 0-100)
- Can be expanded without code changes
- Both columns should have equal or similar lengths for balanced generation

---

### 9.3 damage_table.csv

**File Path:** `D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\Resources\damage_table.csv`

**Current Format:**

```csv
Roll Range,Effect
1-10,Death
11-30,Injury
31-50,Reduce 15
51-70,Reduce 10
71-94,No Effect
95-100,Extra 5
```

**Columns:**
- `Roll Range` (String): Range in format "min-max" (e.g., "1-10")
- `Effect` (String): Effect type and optional value

**Effect Types:**
- `Death` - Attempts to kill an injured runner
- `Injury` - Attempts to injure a ready runner
- `Reduce X` - Reduces reward by X percent (e.g., "Reduce 15")
- `Extra X` - Increases reward by X percent (e.g., "Extra 5")
- `No Effect` - No effect

**Parsing Logic:**

```javascript
// Parse range
const [min, max] = row['Roll Range'].split('-').map(s => parseInt(s.trim()));

// Parse effect
let effect = row['Effect'];
let value = 0;

if (effect.startsWith('Reduce ')) {
    const parts = effect.split(' ');
    effect = 'Reduce';
    value = parseInt(parts[1]);
} else if (effect.startsWith('Extra ')) {
    const parts = effect.split(' ');
    effect = 'Extra';
    value = parseInt(parts[1]);
}
```

**Validation:**
- Ranges must not overlap
- Ranges must be contiguous (no gaps)
- Ranges must cover 1 to maxDamageRollValue
- Reduce/Extra values must be >= 0

**Extensibility:**
New effects can be added by:
1. Adding new effect type to CSV
2. Adding parsing logic in `parseDamageTable()`
3. Adding handler in `applyDamageEffect()`

---

## 10. Edge Cases and Validation

### 10.1 All Runners Dead Scenario

**Situation:** All 3 hired runners are dead

**Behavior:**
- Further Injury/Death effects have no impact
- Damage rolls still display but show "No effect (all runners dead)"
- Contract can still complete
- Player still receives rewards (potentially reduced)
- Dead runners are still unhired after contract
- Player can hire new runners for next contract

**Code:**

```javascript
// In applyInjury() and applyDeath()
if (hiredRunners.every(r => r.runnerState === 'Dead')) {
    return {description: 'No effect (all runners dead)', targetRunner: null};
}
```

---

### 10.2 No Money to Hire Scenario

**Situation:** Player has less money than hiring cost

**Behavior:**
- Hire button is disabled
- Restriction message displays "Not enough money"
- Player must complete contracts to earn money
- Player can unhire already-hired runners to get refund

**Code:**

```javascript
if (gameState.playerMoney < gameState.balancingConfig.hiringCost) {
    return {canHire: false, reason: 'Not enough money'};
}
```

**UI Indication:**
- Grayed out hire button
- Red text: "Not enough money"
- Cost displayed: "Hire - $150"

---

### 10.3 All Slots Full Scenario

**Situation:** Player has 3 hired runners already

**Behavior:**
- Cannot hire additional runners
- Hire button disabled with reason "All slots full"
- Player must unhire a runner to free a slot
- Generate New Runners still works (doesn't auto-hire)

**Code:**

```javascript
if (gameState.hiredRunners.length >= 3) {
    return {canHire: false, reason: 'All slots full'};
}
```

---

### 10.4 Hiring Dead Runners

**Situation:** Player tries to hire a runner with state "Dead"

**Behavior:**
- Hire button is disabled
- Restriction message displays "Runner is dead"
- Dead runners remain visible in Previously Hired tab
- No way to revive dead runners (permanent)

**Code:**

```javascript
if (runner.runnerState === 'Dead') {
    return {canHire: false, reason: 'Runner is dead'};
}
```

**Visual:**
- Card has reduced opacity
- "Dead" badge in red
- Hire button grayed out

---

### 10.5 Already Hired Runner

**Situation:** Player tries to hire a runner already in a slot

**Behavior:**
- Hire button disabled
- Reason: "Already hired"
- Visual indication: green border on card

**Code:**

```javascript
if (runner.hiringState === 'Hired') {
    return {canHire: false, reason: 'Already hired'};
}
```

---

### 10.6 Generate New Runners with Hired Runners

**Situation:** Player clicks "Generate New Runners" while some runners are hired

**Behavior:**
- Current generated batch is replaced
- Hired runners are NOT affected
- Previously hired runners are NOT affected
- New batch does not include currently hired runners

**Implementation:**

```javascript
document.getElementById('generate-new-runners').addEventListener('click', () => {
    // Generate new batch
    const newBatch = generateRunnerBatch(
        gameState.balancingConfig.generatedRunnerBatchSize,
        gameState.nameTable,
        gameState.balancingConfig
    );

    // Replace generated runners
    gameState.generatedRunners = newBatch;

    // Re-render (hired runners unchanged)
    renderGeneratedRunners();
});
```

---

### 10.7 Empty Name Table

**Situation:** `runner_name_table.csv` fails to load or is empty

**Behavior:**
- Use fallback names: "Runner #1", "Runner #2", etc.
- Log warning to console
- Game continues to function

**Code:**

```javascript
function generateRunnerName(firstParts, secondParts) {
    if (!firstParts || firstParts.length === 0) {
        console.warn('No first name parts, using fallback');
        return `Runner #${Math.floor(Math.random() * 1000)}`;
    }
    // ... normal logic
}
```

---

### 10.8 Contract with Zero Unprevented Damage

**Situation:** Contract has 0 unprevented damage (Grit prevented everything)

**Behavior:**
- No damage rolls occur
- Damage rolls section shows "No damage taken"
- Runners still level up
- Rewards still calculated and applied

**Code:**

```javascript
if (unpreventedDamage === 0) {
    // Skip damage roll loop
    document.getElementById('damage-roll-list').innerHTML =
        '<div class="no-damage-message">No damage taken!</div>';
}
```

---

### 10.9 No Contract Loaded

**Situation:** Player tries to execute contract without loading one

**Behavior:**
- Execute button remains disabled
- Warning message in console
- Existing validation prevents execution

**Code:**

```javascript
// In gameState.validateConfiguration()
if (!this.contractData || this.contractData.length === 0) {
    console.warn('No contract data loaded');
    return false;
}
```

---

### 10.10 Session Persistence Edge Cases

**Situation:** Player refreshes browser mid-contract

**Behavior:**
- Contract state is lost (nodes reset)
- Hired runners are preserved
- Player stats (money, risk, level) are preserved
- Generated runners batch is preserved

**Code:**

```javascript
// Session data includes:
{
    playerMoney: number,
    playerRisk: number,
    playerLevel: number,
    contractsCompleted: number,
    hiredRunners: Array,
    generatedRunners: Array,
    previouslyHiredRunners: Array
}

// Contract data is NOT saved (intentional design)
```

---

## 11. Testing Strategy

### 11.1 Unit Testing Approach

**Modules to Test:**

1. **runnerGenerator.js**
   - Test `generateRunner()` with various levels
   - Test `allocateStats()` produces correct totals
   - Test `generateRunnerName()` with various inputs
   - Test edge cases (empty name table, level 0)

2. **runnerManager.js**
   - Test `validateHiring()` with all conditions
   - Test `hireRunner()` updates state correctly
   - Test `unhireRunner()` refunds money
   - Test `unhireAllRunners()` clears all slots

3. **damageEvaluator.js**
   - Test `rollDamage()` returns valid outcomes
   - Test `applyInjury()` with different runner states
   - Test `applyDeath()` with different runner states
   - Test `applyRewardReduction()` calculates correctly
   - Test `parseDamageTable()` handles all formats

4. **balancingLoader.js**
   - Test loading valid CSV
   - Test loading invalid CSV (falls back to defaults)
   - Test validation function

**Testing Tools:**
- Browser console for manual testing
- `console.assert()` for inline validation
- Custom test HTML page with automated checks

**Example Test:**

```javascript
// Test runner generation
function testRunnerGeneration() {
    const config = getDefaultBalancingConfig();
    const firstParts = ['Test'];
    const secondParts = ['Runner'];

    const runner = generateRunner(1, firstParts, secondParts, config);

    console.assert(runner.id, 'Runner has ID');
    console.assert(runner.name === 'Test Runner', 'Runner name correct');
    console.assert(runner.level === 1, 'Runner level correct');
    console.assert(['Hacker', 'Face', 'Muscle', 'Ninja'].includes(runner.runnerType), 'Valid type');

    const totalStats = runner.stats.face + runner.stats.muscle + runner.stats.hacker + runner.stats.ninja;
    console.assert(totalStats === 4, 'Stat total correct for level 1');

    console.log('Runner generation test passed');
}
```

---

### 11.2 Integration Testing

**Test Scenarios:**

1. **Full Contract Flow**
   - Load game
   - Verify initial runner batch generated
   - Open Runner Index
   - Hire 3 runners
   - Load contract
   - Select nodes
   - Execute contract
   - Verify damage rolls display
   - Verify runners level up
   - Verify rewards applied
   - Verify all runners unhired

2. **Hiring Flow**
   - Generate runners
   - Hire runner (verify money deduction)
   - Unhire runner (verify money refund)
   - Hire multiple runners
   - Try to hire 4th runner (should fail)
   - Hire dead runner (should fail)

3. **Damage Evaluation Flow**
   - Create contract with known damage
   - Hire runners
   - Execute contract
   - Verify damage rolls match expected count
   - Verify runner states update correctly
   - Verify reward changes apply

4. **Session Persistence**
   - Generate and hire runners
   - Complete contract
   - Refresh browser
   - Verify runners persist
   - Verify player stats persist

---

### 11.3 UI Testing Considerations

**Manual Testing Checklist:**

- [ ] Runner Index opens/closes smoothly
- [ ] Tab switching works correctly
- [ ] Runner cards display all information
- [ ] Hire buttons enable/disable correctly
- [ ] Unhire buttons work
- [ ] Stat summary updates on hire/unhire
- [ ] Contract resolution window displays correctly
- [ ] Damage rolls animate with delay
- [ ] Runner states update visually
- [ ] Rewards update in real-time
- [ ] Mobile responsiveness works

**Visual Regression:**
- Take screenshots of key states
- Compare before/after changes
- Verify CSS updates don't break layout

---

## 12. Migration Notes

### 12.1 Removed Functionality

**Components to Remove:**

1. **Runner Configuration Section (index.html lines 20-101):**
   - All runner type dropdowns
   - All stat input fields
   - Runner slot structure
   - Related labels and containers

2. **Validate Configuration Button (index.html line 148):**
   - Button element
   - Event listener
   - Related validation logic

3. **gameState.js Methods:**
   - `setRunnerType()` - no longer needed
   - `setRunnerStat()` - no longer needed
   - Manual runner initialization logic

4. **CSS for Runner Configuration:**
   - `.runner-slot` styles (replaced with `.hired-runner-slot`)
   - Stats grid for manual input
   - Dropdown styles

**Migration Steps:**
1. Comment out old code first (don't delete)
2. Test new system completely
3. Once confirmed working, delete old code
4. Update any references in documentation

---

### 12.2 Preserved Functionality

**Keep Intact:**

1. **Node Selection System:**
   - Canvas rendering
   - Node clicking
   - Connection availability
   - Gate conditions
   - All existing node logic

2. **Effect Calculation:**
   - Pool calculation (Damage, Risk, Money, Grit, Veil)
   - Effect string parsing
   - Condition evaluation
   - Prevention mechanics
   - All existing effect operators

3. **Contract Loading:**
   - CSV loader for contracts
   - Contract dropdown
   - File upload
   - Contract library

4. **Game State Persistence:**
   - Session storage
   - Player stats (Money, Risk, Contracts Completed)
   - Add new properties without breaking existing ones

---

### 12.3 Backward Compatibility Considerations

**Session Storage:**

Old session format:
```json
{
    "playerMoney": 5000,
    "playerRisk": 10,
    "contractsCompleted": 3,
    "runners": [...]
}
```

New session format:
```json
{
    "playerMoney": 5000,
    "playerRisk": 10,
    "playerLevel": 3,
    "contractsCompleted": 3,
    "hiredRunners": [],
    "generatedRunners": [],
    "previouslyHiredRunners": []
}
```

**Migration Strategy:**

```javascript
loadSessionState() {
    const data = JSON.parse(sessionStorage.getItem('johnsonGameState'));

    // Check if old format
    if (data.runners && !data.hiredRunners) {
        console.log('Migrating old session format');
        // Old format detected - clear and start fresh
        this.clearSessionState();
        return false;
    }

    // Load new format
    this.hiredRunners = data.hiredRunners || [];
    this.generatedRunners = data.generatedRunners || [];
    // ... etc
}
```

**Recommendation:**
- Clear session storage on first load of new version
- Show notification to players that old sessions are incompatible
- This is acceptable for a prototype/playtest environment

---

## 13. Implementation Checklist

### 13.1 File Creation Checklist

- [ ] Create `Resources/balancing.csv`
- [ ] Create `js/balancingLoader.js`
- [ ] Create `js/runnerGenerator.js`
- [ ] Create `js/runnerManager.js`
- [ ] Create `js/damageEvaluator.js`
- [ ] Create `js/contractResolution.js`

### 13.2 File Modification Checklist

- [ ] Modify `js/gameState.js` - Add runner pools, player level
- [ ] Modify `js/csvLoader.js` - Load name table and damage table
- [ ] Modify `js/visualPrototype.js` - Update contract execution
- [ ] Modify `js/ui.js` - Add Runner Index and Runners section
- [ ] Modify `index.html` - Replace Runner Configuration, add Player Level, add Runner Index modal
- [ ] Modify `css/styles.css` - Add all new styles
- [ ] Modify `js/main.js` - Initialize new systems on load

### 13.3 Testing Checklist

- [ ] Test runner generation (various levels)
- [ ] Test stat allocation algorithm
- [ ] Test name generation
- [ ] Test hiring/unhiring
- [ ] Test hiring validation (all edge cases)
- [ ] Test damage rolls
- [ ] Test damage effects (Injury, Death, Reduce, Extra)
- [ ] Test runner state transitions
- [ ] Test contract resolution flow
- [ ] Test player level increase
- [ ] Test session persistence
- [ ] Test UI responsiveness
- [ ] Test all edge cases from section 10

### 13.4 Code Review Checklist

- [ ] All functions have JSDoc comments
- [ ] All edge cases are handled
- [ ] Console logging is appropriate (not excessive)
- [ ] Error handling is in place
- [ ] Code follows existing style conventions
- [ ] No hardcoded values (all use balancing config)
- [ ] Variable names are clear and consistent
- [ ] No unused code or commented-out blocks

---

## 14. Final Notes

### 14.1 MVP Scope Reminder

**In Scope for MVP:**
- Runner generation at level 1 only
- Hiring/unhiring system
- Damage evaluation with state transitions
- Runner level increases (number only, NO stat gains)
- Player level tracking
- Contract base rewards
- All UI components

**Out of Scope for MVP (Future Features):**
- Stat gains on level up
- Runner healing (Injured → Ready)
- Generating runners at higher levels
- Runner progression/XP system
- Advanced runner management (filtering, sorting)
- Runner abilities or special traits

### 14.2 Performance Considerations

**Expected Performance:**
- Runner generation: < 10ms for batch of 5
- Damage roll animation: ~200ms per roll
- Contract with 10 unprevented damage: ~2 seconds total
- UI rendering: < 50ms for all updates

**Optimization Opportunities:**
- Cache runner cards in DOM instead of recreating
- Use CSS transforms for animations (GPU accelerated)
- Debounce stat summary updates
- Lazy load Previously Hired tab

### 14.3 Extensibility Points

**Easy to Extend:**
- Add new damage effects (modify damage_table.csv and add handler)
- Adjust balancing values (edit balancing.csv)
- Add more names (expand runner_name_table.csv)
- Change batch size (balancing.csv)
- Modify damage roll delay (balancing.csv)

**Requires Code Changes:**
- Add new runner states beyond Ready/Injured/Dead
- Change number of runner slots (currently hardcoded to 3)
- Add runner abilities or special mechanics
- Implement stat gains on level up (code exists but disabled)

---

## 15. Glossary

**Terms and Definitions:**

- **Runner:** A character that can be hired to execute contracts
- **Runner State:** The condition of a runner (Ready, Injured, Dead)
- **Hiring State:** Whether a runner is currently hired or available
- **Runner Slot:** One of three positions where hired runners are placed
- **Generated Batch:** The current set of randomly generated runners available for hire
- **Previously Hired:** All runners that have been hired at least once during the session
- **Damage Roll:** Random number rolled to determine damage outcome
- **Unprevented Damage:** Damage that was not prevented by Grit
- **Unprevented Risk:** Risk that was not prevented by Veil
- **Contract Base Reward:** Default money reward for all contracts (1000 Money)
- **Player Level:** Persistent level that increases with each contract completed
- **Balancing Config:** Configuration values loaded from balancing.csv
- **MVP:** Minimum Viable Product - initial implementation with core features only

---

**End of Technical Specification**

This document provides complete specifications for implementing the Runner Generation System in the Johnson Prototype. All modules, algorithms, UI components, and edge cases are defined in detail to enable unambiguous implementation by a programming agent.

For questions or clarifications, refer to the original design document:
`D:\Hobby_Projects\Johnson_Browser_test\Johnson_Prototype\documentation\Runner Generation Design.md`
