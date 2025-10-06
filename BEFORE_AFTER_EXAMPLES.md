# Before/After Examples - Condition Counting Fix

## Quick Reference: What Changed?

### The Problem
Conditions were returning 1 or 0 (binary) instead of counting how many instances matched the condition.

### The Solution
Conditions now return the actual count of matching instances, allowing effects to scale properly.

---

## Example 1: Multiple Hackers

### Setup
- Runner 1: Hacker (Hacker stat: 5)
- Runner 2: Hacker (Hacker stat: 3)
- Runner 3: Muscle (Muscle stat: 4)

### Effect
```
RunnerType:Hacker;+;5;Money
```

### Before Fix (WRONG)
```
Condition evaluates to: 1 (has any Hacker?)
Effect calculates: 1 × 5 = 5
Result: +5 Money
```

### After Fix (CORRECT)
```
Condition evaluates to: 2 (how many Hackers?)
Effect calculates: 2 × 5 = 10
Result: +10 Money
```

---

## Example 2: Red Node Damage Boost

### Setup
Selected nodes:
- N1 (Red node)
- N2 (Red node)
- N3 (Red node)
- N4 (Blue node)
- N5 (Green node)

### Effect
```
NodeColor:Red;%;20;Damage
```

### Before Fix (WRONG)
```
Condition evaluates to: 1 (has any Red node?)
Effect calculates: 20% damage boost
With 50 base damage: 50 + (50 × 0.20) = 60 Damage
```

### After Fix (CORRECT)
```
Condition evaluates to: 3 (how many Red nodes?)
Effect calculates: 3 × 20% = 60% damage boost
With 50 base damage: 50 + (50 × 0.60) = 80 Damage
```

---

## Example 3: Rainbow Synergy Node

### Setup
Selected nodes:
- 4 Red nodes
- 3 Blue nodes
- 5 Green nodes

### Effect
```
NodeColorCombo:Red,Blue,Green;+;100;Money
```

### Before Fix (WRONG)
```
Condition evaluates to: 1 (has all three colors?)
Effect calculates: 1 × 100 = 100
Result: +100 Money
```

### After Fix (CORRECT)
```
Red count: 4
Blue count: 3
Green count: 5
Complete sets: min(4, 3, 5) = 3

Condition evaluates to: 3 (how many complete sets?)
Effect calculates: 3 × 100 = 300
Result: +300 Money
```

**Explanation:** You can make 3 complete Rainbow sets because you're limited by Blue (the color you have least of).

---

## Example 4: Two-Color Combo

### Setup
Selected nodes:
- 6 Red nodes
- 2 Blue nodes

### Effect
```
NodeColorCombo:Red,Blue;+;50;Damage
```

### Before Fix (WRONG)
```
Condition evaluates to: 1 (has both colors?)
Effect calculates: 1 × 50 = 50
Result: +50 Damage
```

### After Fix (CORRECT)
```
Red count: 6
Blue count: 2
Complete sets: min(6, 2) = 2

Condition evaluates to: 2 (how many complete sets?)
Effect calculates: 2 × 50 = 100
Result: +100 Damage
```

---

## Example 5: Missing Color

### Setup
Selected nodes:
- 5 Red nodes
- 0 Blue nodes
- 3 Green nodes

### Effect
```
NodeColorCombo:Red,Blue,Green;+;200;Money
```

### Before Fix (WRONG)
```
Condition evaluates to: 0 (missing Blue)
Effect calculates: 0 × 200 = 0
Result: +0 Money
```

### After Fix (CORRECT)
```
Red count: 5
Blue count: 0
Green count: 3
Complete sets: min(5, 0, 3) = 0

Condition evaluates to: 0 (no complete sets possible)
Effect calculates: 0 × 200 = 0
Result: +0 Money
```

**Both behaviors are the same here** - incomplete combos give nothing. The difference is in WHY it's zero (not "missing a color" but "zero complete sets").

---

## Example 6: Gate Node (UNCHANGED)

### Setup
- Runner 1: Hacker
- Runner 2: Hacker
- Gate condition: `RunnerType:Hacker;2`

### Before Fix
```
Gate evaluates: Count Hackers (2) >= Threshold (2)
Result: Gate OPENS
```

### After Fix
```
Gate evaluates: Count Hackers (2) >= Threshold (2)
Result: Gate OPENS
```

**Gate behavior is UNCHANGED.** Gates use `evaluateGateCondition()` which has always used threshold-based counting. The fix only affected `evaluateCondition()` used by effects.

---

## Key Differences Table

| Condition Type | Before (Binary) | After (Counting) | Gate Behavior |
|----------------|-----------------|------------------|---------------|
| RunnerType:Hacker | 1 if any, 0 if none | Count of Hackers | Threshold check (unchanged) |
| NodeColor:Red | 1 if any, 0 if none | Count of Red nodes | N/A (gates don't use) |
| NodeColorCombo:R,B | 1 if both, 0 if missing | Min count of all colors | N/A (gates don't use) |
| RunnerStat:muscle>=3 | Already counting | Already counting | Threshold check (unchanged) |
| PrevDam | Already counting | Already counting | N/A (gates don't use) |
| PrevRisk | Already counting | Already counting | N/A (gates don't use) |
| None | Always 1 | Always 1 | N/A |

---

## Strategic Impact

### Before Fix
- No benefit to having multiple runners of the same type
- No benefit to selecting many nodes of the same color
- Synergy nodes gave flat bonuses regardless of combo size

### After Fix
- **Specialization Strategy**: Stack multiple Hackers for bigger Hacker bonuses
- **Color Stacking**: Select many Red nodes to maximize Red-based effects
- **Balanced Synergies**: Build equal counts of combo colors for maximum synergy bonuses
- **Trade-offs**: More strategic depth in node selection and runner composition

---

## Testing Your Own Contracts

To test if your contract is affected:

1. **Look for these condition types:**
   - `RunnerType:X`
   - `NodeColor:X`
   - `NodeColorCombo:X,Y` or `NodeColorCombo:X,Y,Z`

2. **Check the effect operator:**
   - `+` (additive) - Most impacted
   - `%` (percentage) - Very impacted
   - `*` (multiplicative) - Can be very impacted
   - `-` (subtractive) - Less common but affected
   - `/` (division) - Rare, affected

3. **Calculate expected values:**
   - Multiply the effect amount by the count
   - For combos, use the minimum color count

4. **Test in-game:**
   - Load your contract
   - Configure matching runners/select matching nodes
   - Check if pool values match expected calculations
