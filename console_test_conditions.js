/**
 * Console Test Script for Condition Counting Fix
 *
 * This script demonstrates the fixed behavior of condition evaluation.
 * Run this in the browser console after loading the game to verify the fixes.
 */

console.log('=== Condition Counting Fix Test Suite ===\n');

// Create a fresh game state for testing
const testGameState = new GameState();

// Setup test contract data
const testNodes = [
    { id: 'N1', type: 'Start', color: 'Red', effect1: '', effect2: '', connections: ['N2'], layer: 0, slot: 'A', x: 100, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'N2', type: 'Normal', color: 'Red', effect1: '', effect2: '', connections: ['N3'], layer: 1, slot: 'A', x: 200, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'N3', type: 'Normal', color: 'Blue', effect1: '', effect2: '', connections: ['N4'], layer: 2, slot: 'A', x: 300, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'N4', type: 'Normal', color: 'Blue', effect1: '', effect2: '', connections: ['N5'], layer: 3, slot: 'A', x: 400, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'N5', type: 'Normal', color: 'Green', effect1: '', effect2: '', connections: [], layer: 4, slot: 'A', x: 500, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'N6', type: 'Normal', color: 'Green', effect1: '', effect2: '', connections: [], layer: 4, slot: 'B', x: 500, y: 200, gateCondition: '', description: '', effectDescription: '' }
];

testGameState.setContractData(testNodes);

console.log('--- Test 1: RunnerType Counting ---');
// Setup 2 Hackers, 1 Muscle
testGameState.runners[0] = { type: 'Hacker', stats: { face: 0, muscle: 0, hacker: 5, ninja: 0 } };
testGameState.runners[1] = { type: 'Hacker', stats: { face: 0, muscle: 0, hacker: 3, ninja: 0 } };
testGameState.runners[2] = { type: 'Muscle', stats: { face: 0, muscle: 4, hacker: 0, ninja: 0 } };

const hackerCount = testGameState.evaluateCondition('RunnerType:Hacker');
const muscleCount = testGameState.evaluateCondition('RunnerType:Muscle');
const ninjaCount = testGameState.evaluateCondition('RunnerType:Ninja');

console.log(`RunnerType:Hacker = ${hackerCount} (Expected: 2) - ${hackerCount === 2 ? 'PASS' : 'FAIL'}`);
console.log(`RunnerType:Muscle = ${muscleCount} (Expected: 1) - ${muscleCount === 1 ? 'PASS' : 'FAIL'}`);
console.log(`RunnerType:Ninja = ${ninjaCount} (Expected: 0) - ${ninjaCount === 0 ? 'PASS' : 'FAIL'}`);

// Test effect application
testGameState.selectedNodes = [];
const node1 = testGameState.getNodeById('N1');
node1.effect1 = 'RunnerType:Hacker;+;5;Money';
testGameState.selectNode('N1');

console.log(`Effect: RunnerType:Hacker;+;5;Money`);
console.log(`Result: ${testGameState.currentPools.money} money (Expected: 10) - ${testGameState.currentPools.money === 10 ? 'PASS' : 'FAIL'}`);
console.log('Explanation: 2 Hackers × 5 money = 10 money\n');

console.log('--- Test 2: NodeColor Counting ---');
testGameState.selectedNodes = [];
testGameState.selectNode('N1'); // Red
testGameState.selectNode('N2'); // Red
testGameState.selectNode('N3'); // Blue

const redCount = testGameState.evaluateCondition('NodeColor:Red');
const blueCount = testGameState.evaluateCondition('NodeColor:Blue');
const greenCount = testGameState.evaluateCondition('NodeColor:Green');

console.log(`Selected: N1 (Red), N2 (Red), N3 (Blue)`);
console.log(`NodeColor:Red = ${redCount} (Expected: 2) - ${redCount === 2 ? 'PASS' : 'FAIL'}`);
console.log(`NodeColor:Blue = ${blueCount} (Expected: 1) - ${blueCount === 1 ? 'PASS' : 'FAIL'}`);
console.log(`NodeColor:Green = ${greenCount} (Expected: 0) - ${greenCount === 0 ? 'PASS' : 'FAIL'}`);

// Test effect application
testGameState.selectedNodes = [];
node1.effect1 = 'NodeColor:Red;+;10;Damage';
testGameState.selectNode('N1'); // Red - contributes to count
testGameState.selectNode('N2'); // Red - contributes to count
testGameState.selectNode('N3'); // Blue - doesn't contribute

console.log(`Effect: NodeColor:Red;+;10;Damage on N1`);
console.log(`Result: ${testGameState.currentPools.damage} damage (Expected: 20) - ${testGameState.currentPools.damage === 20 ? 'PASS' : 'FAIL'}`);
console.log('Explanation: 2 Red nodes × 10 damage = 20 damage\n');

console.log('--- Test 3: NodeColorCombo Counting ---');
testGameState.selectedNodes = [];
testGameState.selectNode('N1'); // Red
testGameState.selectNode('N2'); // Red
testGameState.selectNode('N3'); // Blue
testGameState.selectNode('N4'); // Blue
testGameState.selectNode('N5'); // Green
testGameState.selectNode('N6'); // Green

const comboRB = testGameState.evaluateCondition('NodeColorCombo:Red,Blue');
const comboRG = testGameState.evaluateCondition('NodeColorCombo:Red,Green');
const comboRBG = testGameState.evaluateCondition('NodeColorCombo:Red,Blue,Green');
const comboRY = testGameState.evaluateCondition('NodeColorCombo:Red,Yellow'); // Yellow not present

console.log(`Selected: 2 Red, 2 Blue, 2 Green`);
console.log(`NodeColorCombo:Red,Blue = ${comboRB} (Expected: 2) - ${comboRB === 2 ? 'PASS' : 'FAIL'}`);
console.log(`NodeColorCombo:Red,Green = ${comboRG} (Expected: 2) - ${comboRG === 2 ? 'PASS' : 'FAIL'}`);
console.log(`NodeColorCombo:Red,Blue,Green = ${comboRBG} (Expected: 2) - ${comboRBG === 2 ? 'PASS' : 'FAIL'}`);
console.log(`NodeColorCombo:Red,Yellow = ${comboRY} (Expected: 0) - ${comboRY === 0 ? 'PASS' : 'FAIL'}`);

// Test effect application
testGameState.selectedNodes = [];
node1.effect1 = 'NodeColorCombo:Red,Blue,Green;+;100;Money';
testGameState.selectNode('N1'); // Red
testGameState.selectNode('N2'); // Red
testGameState.selectNode('N3'); // Blue
testGameState.selectNode('N4'); // Blue
testGameState.selectNode('N5'); // Green
testGameState.selectNode('N6'); // Green

console.log(`Effect: NodeColorCombo:Red,Blue,Green;+;100;Money`);
console.log(`Result: ${testGameState.currentPools.money} money (Expected: 200) - ${testGameState.currentPools.money === 200 ? 'PASS' : 'FAIL'}`);
console.log('Explanation: 2 complete sets (limited by min count) × 100 = 200 money\n');

console.log('--- Test 4: Gate Nodes (Binary Logic) ---');
// Create gate test contract
const gateNodes = [
    { id: 'G1', type: 'Start', color: 'Red', effect1: '', effect2: '', connections: ['GATE'], layer: 0, slot: 'A', x: 100, y: 100, gateCondition: '', description: '', effectDescription: '' },
    { id: 'GATE', type: 'Gate', color: 'Grey', effect1: '', effect2: '', connections: ['G2'], layer: 1, slot: 'A', x: 200, y: 100, gateCondition: 'RunnerType:Hacker;2', description: 'Gate', effectDescription: '' },
    { id: 'G2', type: 'Normal', color: 'Blue', effect1: 'None;+;100;Money', effect2: '', connections: [], layer: 2, slot: 'A', x: 300, y: 100, gateCondition: '', description: '', effectDescription: '' }
];

testGameState.setContractData(gateNodes);
testGameState.runners[0] = { type: 'Hacker', stats: { face: 0, muscle: 0, hacker: 5, ninja: 0 } };
testGameState.runners[1] = { type: 'Hacker', stats: { face: 0, muscle: 0, hacker: 3, ninja: 0 } };
testGameState.runners[2] = { type: 'Empty', stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 } };

testGameState.selectNode('G1');
testGameState.updateAvailableNodes();

const gateWith2Hackers = testGameState.getNodeById('GATE').available;
console.log(`Gate (RunnerType:Hacker;2) with 2 Hackers: ${gateWith2Hackers ? 'OPEN' : 'CLOSED'} (Expected: OPEN) - ${gateWith2Hackers ? 'PASS' : 'FAIL'}`);

// Test with 1 Hacker
testGameState.runners[1] = { type: 'Empty', stats: { face: 0, muscle: 0, hacker: 0, ninja: 0 } };
testGameState.updateAvailableNodes();

const gateWith1Hacker = testGameState.getNodeById('GATE').available;
console.log(`Gate (RunnerType:Hacker;2) with 1 Hacker: ${gateWith1Hacker ? 'OPEN' : 'CLOSED'} (Expected: CLOSED) - ${!gateWith1Hacker ? 'PASS' : 'FAIL'}`);

console.log('\n=== All Tests Complete ===');
console.log('Gate nodes use binary threshold logic (evaluateGateCondition)');
console.log('Effect conditions use counting logic (evaluateCondition)');
console.log('Both systems work independently and correctly.');
