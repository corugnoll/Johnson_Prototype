# RunnerStat Condition Syntax Guide

## Problem Solved
Node ID 5 in `Contract_Example3_conditions.csv` had incorrect RunnerStat condition syntax. The issue was using comma separator instead of comparison operators.

## Correct RunnerStat Syntax

### Format
```
RunnerStat:[stat_name][operator][threshold]
```

### Supported Operators
- `>=` - Greater than or equal to
- `<=` - Less than or equal to
- `>` - Greater than
- `<` - Less than
- `==` or `=` - Equal to

### Stat Names (case-sensitive, lowercase)
- `face` - Total face stat across all runners
- `muscle` - Total muscle stat across all runners
- `hacker` - Total hacker stat across all runners
- `ninja` - Total ninja stat across all runners

### Examples

#### Correct Examples
```
RunnerStat:muscle>=3;+;1;Veil          # Add 1 Veil if total muscle stat >= 3
RunnerStat:face>2;+;2;Money           # Add 2 Money if total face stat > 2
RunnerStat:hacker==5;-;1;Risk         # Subtract 1 Risk if total hacker stat equals 5
RunnerStat:ninja<=1;+;3;Damage        # Add 3 Damage if total ninja stat <= 1
```

#### Incorrect Examples (DO NOT USE)
```
RunnerStat:Muscle,3;+;1;Veil          # Wrong: Uses comma instead of operator
RunnerStat:MuscleStat>=3;+;1;Veil     # Wrong: Incorrect stat name
RunnerStat:MUSCLE>=3;+;1;Veil         # Wrong: Uppercase stat name
```

## Full Effect String Format
```
[Condition];[Operator];[Amount];[Stat]
```

### Other Condition Types
- `None` - Always applies
- `RunnerType:[type]` - If specific runner type is configured (Face, Muscle, Hacker, Ninja)
- `NodeColor:[color]` - If specific color nodes are selected (Red, Green, Blue, Purple, Yellow, Grey)
- `NodeColorCombo:[color1,color2]` - If multiple specific colors are selected

### Example Complete Effects
```
None;+;2;Grit                          # Always add 2 Grit
RunnerType:Hacker;-;2;Damage          # Subtract 2 Damage if Hacker is configured
NodeColor:Red;+;1;Veil                # Add 1 Veil if Red node is selected
NodeColorCombo:Red,Green;+;100;Money  # Add 100 Money if both Red and Green nodes selected
RunnerStat:muscle>=3;+;1;Veil         # Add 1 Veil if total muscle stat >= 3
```

## Testing the Fix

The corrected syntax for Node ID 5 is:
```
"RunnerStat:muscle>=3;+;1;Veil"
```

This means:
- **Condition**: If total muscle stat across all runners is >= 3
- **Operator**: + (add)
- **Amount**: 1
- **Stat**: Veil
- **Result**: Adds 1 Veil to the current pools when condition is met

## Implementation Details

The condition is evaluated in `gameState.js` in the `evaluateRunnerStatCondition()` function (lines 316-370), which:

1. Parses the condition string after the colon
2. Identifies the comparison operator
3. Splits on the operator to get stat name and threshold
4. Gets total stat value using `getTotalRunnerStat()`
5. Performs the comparison and returns boolean result

The stat totaling is done in `getTotalRunnerStat()` function (lines 305-309), which sums the specified stat across all three runner slots.