/**
 * Simple verification script for the condition calculation logic
 * Run this in the browser console after loading the main application
 */

function verifyConditionLogic() {
    console.log('=== Condition Logic Verification ===');

    // Check if we have access to the game state
    if (typeof GameState === 'undefined') {
        console.error('GameState class not available. Make sure gameState.js is loaded.');
        return;
    }

    // Create a new game state for testing
    const gameState = new GameState();

    // Test cases
    const testCases = [
        {
            name: 'Test 1: 9 muscle stats with threshold 3',
            muscle: [5, 4, 0],
            effect: 'RunnerStat:muscle>=3;+;1;Veil',
            expectedMultiplier: 3,
            expectedVeil: 3
        },
        {
            name: 'Test 2: 2 muscle stats with threshold 3 (insufficient)',
            muscle: [1, 1, 0],
            effect: 'RunnerStat:muscle>=3;+;1;Veil',
            expectedMultiplier: 0,
            expectedVeil: 0
        },
        {
            name: 'Test 3: 10 muscle stats with threshold 3',
            muscle: [4, 3, 3],
            effect: 'RunnerStat:muscle>=3;+;1;Veil',
            expectedMultiplier: 3, // 10/3 = 3.33, floored to 3
            expectedVeil: 3
        },
        {
            name: 'Test 4: 12 muscle stats with threshold 3',
            muscle: [4, 4, 4],
            effect: 'RunnerStat:muscle>=3;+;1;Veil',
            expectedMultiplier: 4, // 12/3 = 4
            expectedVeil: 4
        }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    testCases.forEach(testCase => {
        console.log(`\n--- ${testCase.name} ---`);

        // Set up runners
        testCase.muscle.forEach((muscle, index) => {
            gameState.setRunnerStat(index, 'muscle', muscle);
        });

        const totalMuscle = testCase.muscle.reduce((a, b) => a + b, 0);
        console.log(`Total muscle stats: ${totalMuscle}`);

        // Test the condition evaluation
        const multiplier = gameState.evaluateRunnerStatCondition('RunnerStat:muscle>=3');
        console.log(`Condition multiplier: ${multiplier} (expected: ${testCase.expectedMultiplier})`);

        // Reset pools and apply effect
        gameState.currentPools = gameState.initializePools();
        gameState.applyEffect(testCase.effect);

        const actualVeil = gameState.currentPools.veil;
        console.log(`Veil after effect: ${actualVeil} (expected: ${testCase.expectedVeil})`);

        // Check if test passed
        const multiplierMatch = multiplier === testCase.expectedMultiplier;
        const veilMatch = actualVeil === testCase.expectedVeil;
        const testPassed = multiplierMatch && veilMatch;

        if (testPassed) {
            console.log(`✅ PASS`);
            passedTests++;
        } else {
            console.log(`❌ FAIL`);
            if (!multiplierMatch) console.log(`  - Multiplier mismatch: got ${multiplier}, expected ${testCase.expectedMultiplier}`);
            if (!veilMatch) console.log(`  - Veil mismatch: got ${actualVeil}, expected ${testCase.expectedVeil}`);
        }
    });

    console.log(`\n=== Summary ===`);
    console.log(`Tests passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Condition logic is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the implementation.');
    }

    return passedTests === totalTests;
}

// Make the function available globally
window.verifyConditionLogic = verifyConditionLogic;

// Auto-run if called directly in console
if (typeof window !== 'undefined' && window.document) {
    console.log('Condition verification script loaded. Run verifyConditionLogic() to test.');
}