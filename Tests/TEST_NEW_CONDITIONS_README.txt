===============================================================================
NEW CONDITIONS TESTING GUIDE
===============================================================================

Two new condition types have been implemented:
1. RiskDamPair - Rewards balanced prevention (Grit + Veil together)
2. ColorForEach - Rewards diverse node color selection

===============================================================================
HOW TO TEST
===============================================================================

AUTOMATED TESTS:
---------------
1. Open test_new_conditions.html in a browser
2. Click "Run All Tests"
3. All 10 tests should pass (100% pass rate)

MANUAL TESTS IN GAME:
--------------------
1. Open index.html
2. Load contract "test_new_conditions.csv" from dropdown
3. Try different combinations:

   TEST A: RiskDamPair Synergy
   ---------------------------
   - Select node3 (Add Grit +6)
   - Select node4 (Add Veil +8)
   - Select synergy1 (Prevention Pairs)
   - Result: Should get +45 Money (3 pairs × 15)
     - Damage prevented: 6 Grit ÷ 2 = 3
     - Risk prevented: 8 Veil ÷ 2 = 4
     - Pairs: min(3, 4) = 3

   TEST B: ColorForEach Synergy
   ----------------------------
   - Select node1 (Red), node2 (Blue), node5 (Purple)
   - Select synergy2 (Color Diversity)
   - Result: Should get +30% Damage (3 colors × 10%)
     - Base damage: 10
     - Final damage: 13 (10 + 30%)

   TEST C: Maximum Colors
   ----------------------
   - Select all 6 color nodes (node1-node6)
   - Select synergy3 (Color Money)
   - Result: Should get +48 Money (6 colors × 8)

   TEST D: Combined Effects
   -----------------------
   - Select node3, node4, node5, node6 (build up prevention)
   - Select synergy1 (pairs bonus)
   - Select bonus1 (percentage on pairs)
   - Watch Grit scale up from both effects

===============================================================================
EXPECTED TEST RESULTS
===============================================================================

Automated Test Summary:
- Test 1: RiskDamPair Equal Prevention - PASS
- Test 2: RiskDamPair Damage Limited - PASS
- Test 3: RiskDamPair Risk Limited - PASS
- Test 4: RiskDamPair Zero Pairs - PASS
- Test 5: RiskDamPair with Percentage - PASS
- Test 6: ColorForEach Multiple Colors - PASS
- Test 7: ColorForEach Single Color - PASS
- Test 8: ColorForEach All Six Colors - PASS
- Test 9: ColorForEach No Nodes - PASS
- Test 10: ColorForEach Gate Nodes Excluded - PASS

===============================================================================
FILES MODIFIED
===============================================================================

Core Implementation:
- js/gameState.js - Added RiskDamPair and ColorForEach condition logic
- js/csvLoader.js - Added validation for new conditions

Documentation:
- CLAUDE.md - Added condition documentation with examples
- NodeEffects.txt - Added detailed condition explanations
- editor.html - Updated help text to include new conditions

Test Files:
- test_new_conditions.html - Comprehensive automated test suite
- Contracts/test_new_conditions.csv - Demo contract showcasing features

===============================================================================
TECHNICAL DETAILS
===============================================================================

RiskDamPair Implementation:
- Returns: Math.min(damagePrevented, riskPrevented)
- Requires BOTH damage AND risk prevention to be > 0
- Uses preliminary prevention data (before percentage effects)
- Limited by whichever prevention is smaller

ColorForEach Implementation:
- Uses Set() to count unique colors
- Excludes Gate nodes from color counting
- Counts colors from all selected nodes
- Each color counts once regardless of quantity

===============================================================================
SUCCESS CRITERIA CHECKLIST
===============================================================================

[X] RiskDamPair condition correctly calculates pairs
[X] ColorForEach condition correctly counts unique colors
[X] Both conditions work with all operators (+, -, *, /, %)
[X] CSV validation accepts both new conditions
[X] Editor UI shows new conditions in help text
[X] CLAUDE.md documentation complete with examples
[X] NodeEffects.txt updated with detailed explanations
[X] All 10 test scenarios pass
[X] No regression in existing conditions
[X] Gate nodes properly excluded from ColorForEach

===============================================================================
