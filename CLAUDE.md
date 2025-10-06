# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Johnson Prototype - a browser-based cyberpunk simulation/puzzle game where players act as "fixers" selecting contracts, hiring runners, and navigating strategic node-based perk trees. The game is designed as a client-side only prototype using vanilla JavaScript, Canvas API, and CSV data loading.

## Architecture and Code Organization

### Core Game Loop
The game follows a specific flow: Contract Selection → Runner Configuration → Node Tree Navigation → Effect Calculation → Contract Execution. Each phase has distinct technical requirements and data dependencies.

### Data Flow Architecture
- **CSV Loading**: Contract data is loaded from `Contracts/` directory using Papa Parse
- **Node Rendering**: Canvas-based visualization with Layer/Slot positioning system
- **Effect Calculation**: Complex condition-based system (Condition;Operator;Amount;Stat format)
- **State Management**: Real-time preview updates with stat pools (Grit, Veil, Damage, Risk, Money)

### File Structure Conventions
```
├── index.html                 # Main application entry point
├── css/styles.css            # UI styling with 4-section layout
├── js/
│   ├── main.js               # Application initialization
│   ├── csvLoader.js          # Contract data parsing
│   ├── nodeRenderer.js       # Canvas-based node visualization
│   ├── effectCalculator.js   # Effect processing engine
│   ├── gameState.js          # State management
│   └── ui.js                 # User interface interactions
├── Contracts/                # CSV contract data files
└── Tools/                    # Development dependencies (Papa Parse)
```

## Development Commands

### Dependencies
```bash
cd Tools && npm install
```

### Testing Contract Data
Load and validate CSV files using Papa Parse from the Tools directory. All contract data follows the schema: Node ID, Description, Effect Desc, Effect 1, Effect 2, Type, Color, Layer, Slot, Connections.

### Development Server
No build process required - open index.html directly in modern browsers (2020+). The application is designed to run client-side only.

## Technical Implementation Details

### Canvas Rendering System
- Use Canvas API for node visualization and connection lines
- Support 6 node colors: Red (#FF6467), Yellow (#FFDF20), Green (#FFDF20), Blue (#51A2FF), Purple (#51A2FF), Grey (#51A2FF)
- Three node states: Available (normal), Selected (outlined), Unavailable (desaturated)
- Layer/Slot positioning system for organized node layout

### Effect Calculation Engine
Critical component that processes effects using format: `Condition;Operator;Amount;Stat`

#### Calculation Order (Multi-Pass System)
The game uses a multi-pass calculation system to ensure correct execution order:

1. **Standard Effects Pass**: All +, -, *, / operators are applied to pools
2. **Preliminary Prevention Calculation**: Calculate damage/risk prevention for condition evaluation
3. **Percentage Effects Pass**: All % operators are applied to pools
4. **Prevention-Based Effects**: PrevDam/PrevRisk conditions trigger
5. **Final Prevention Mechanics**: Grit/Veil reduce damage/risk in final pools

This ordering ensures that:
- Percentage calculations operate on the final base values after all additions/multiplications
- Prevention-based conditions have access to accurate prevention amounts
- Final prevention applies to the completed pool values

#### Operators

**Standard Operators:**
- `+` Addition: Adds amount to stat
- `-` Subtraction: Subtracts amount from stat
- `*` Multiplication: Multiplies stat by amount
- `/` Division: Divides stat by amount

**Percentage Operator (%):**
The percentage operator applies proportional modifications AFTER all additive and multiplicative effects:

- **Format**: `Condition;%;Amount;Stat`
- **Calculation**: `current_value + (current_value * amount/100)`
- **Example**: `None;%;10;Damage` = 10% damage increase
- **With Conditions**: `RunnerStat:hacker>=3;%;10;Money` = 10% per 3 hacker (30% if 9 hacker)
- **Negative**: `None;%;-25;Risk` = 25% risk reduction
- **Execution**: Runs after +, -, *, / operators but before final prevention

**Examples:**
```csv
Effect 1,Description,Calculation
None;%;20;Damage,20% damage increase,"If damage=10, result=12 (10 + 10*0.2)"
None;%;-10;Risk,10% risk reduction,"If risk=20, result=18 (20 - 20*0.1)"
RunnerStat:muscle>=3;%;15;Money,15% per 3 muscle,"If muscle=9, money=100: result=145 (100 + 100*0.45)"
```

#### Conditions

**Standard Conditions:**
- `None` - Always applies (multiplier = 1)
- `RunnerType:[type]` - If specific runner type configured (multiplier = 1 if true, 0 if false)
- `RunnerStat:[stat]>=[threshold]` - Based on stat total (multiplier = floor(total/threshold))
- `NodeColor:[color]` - If specific color selected (multiplier = 1 if true, 0 if false)
- `NodeColorCombo:[colors]` - If multiple colors selected (multiplier = 1 if true, 0 if false)

**Prevention-Based Conditions:**

**PrevDam:**
Triggers based on damage prevented by Grit (2 Grit prevents 1 Damage):

- **Format**: `PrevDam;Operator;Amount;Stat`
- **Multiplier**: Number of damage points prevented
- **Calculation**: `prevented = Math.min(Math.floor(grit/2), damage)`
- **Effect**: `effect_amount = amount * prevented`

**Examples:**
```csv
Effect,Description,Example Calculation
PrevDam;+;5;Money,+5 money per damage prevented,"Grit=8, Damage=10 → 4 prevented → +20 money"
PrevDam;%;10;Money,+10% money per damage prevented,"Grit=6, Damage=10, Money=100 → 3 prevented → +30% → 130 money"
PrevDam;+;1;Veil,+1 Veil per damage prevented,"Grit=4, Damage=5 → 2 prevented → +2 Veil"
```

**PrevRisk:**
Triggers based on risk prevented by Veil (2 Veil prevents 1 Risk):

- **Format**: `PrevRisk;Operator;Amount;Stat`
- **Multiplier**: Number of risk points prevented
- **Calculation**: `prevented = Math.min(Math.floor(veil/2), risk)`
- **Effect**: `effect_amount = amount * prevented`

**Examples:**
```csv
Effect,Description,Example Calculation
PrevRisk;+;3;Money,+3 money per risk prevented,"Veil=10, Risk=6 → 5 prevented (capped at 6) → +15 money"
PrevRisk;%;5;Damage,+5% damage per risk prevented,"Veil=8, Risk=10, Damage=20 → 4 prevented → +20% → 24 damage"
PrevRisk;+;1;Grit,+1 Grit per risk prevented,"Veil=6, Risk=8 → 3 prevented → +3 Grit"
```

**RiskDamPair:**
Triggers based on pairs where BOTH damage AND risk are prevented:

- **Format**: `RiskDamPair;Operator;Amount;Stat`
- **Multiplier**: Minimum of damage prevented and risk prevented
- **Calculation**: `pairs = Math.min(damagePrevented, riskPrevented)`
- **Effect**: `effect_amount = amount * pairs`

**Examples:**
```csv
Effect,Description,Example Calculation
RiskDamPair;+;10;Money,+10 money per prevention pair,"Damage prevented=5, Risk prevented=3 → 3 pairs → +30 money"
RiskDamPair;%;20;Grit,+20% grit per prevention pair,"Damage prevented=2, Risk prevented=8, Grit=10 → 2 pairs → +40% → 14 grit"
RiskDamPair;+;1;Damage,+1 damage per prevention pair,"Damage prevented=4, Risk prevented=4 → 4 pairs → +4 damage"
```

**Important Notes:**
- Requires BOTH damage and risk to be prevented
- If only damage OR only risk is prevented, returns 0
- Limited by whichever prevention is smaller

**ColorForEach:**
Triggers based on the number of unique colors selected:

- **Format**: `ColorForEach;Operator;Amount;Stat`
- **Multiplier**: Count of distinct colors in selected nodes (excludes Gate nodes)
- **Calculation**: `uniqueColors = new Set(selectedNodeColors).size`
- **Effect**: `effect_amount = amount * uniqueColors`

**Examples:**
```csv
Effect,Description,Example Calculation
ColorForEach;+;5;Money,+5 money per color type,"3 Red, 2 Blue, 1 Green selected → 3 colors → +15 money"
ColorForEach;%;15;Damage,+15% damage per color type,"5 Red nodes selected → 1 color → +15% damage"
ColorForEach;+;2;Veil,+2 veil per color type,"2 Red, 3 Blue, 1 Yellow, 4 Purple → 4 colors → +8 veil"
```

**Important Notes:**
- Each color counts only ONCE, regardless of quantity
- Gate nodes are excluded from color counting
- Rewards diverse node selection strategies

**Prevention-Based Condition Notes:**
- Prevention-based conditions use preliminary prevention calculations (before percentage effects)
- Prevention is capped at actual damage/risk values, not just Grit/Veil potential
- Feedback loops (e.g., PrevRisk adding Veil) don't recalculate prevention mid-pass
- If no prevention occurs, multiplier = 0 and effect doesn't trigger

#### Complete Effect String Examples

```csv
Effect String,Full Description
None;+;10;Damage,Add 10 damage (standard effect)
None;%;20;Damage,Add 20% damage (percentage effect - runs after standard)
RunnerType:Hacker;-;2;Risk,Subtract 2 risk if Hacker configured
RunnerStat:muscle>=3;+;5;Damage,Add 5 damage per 3 muscle stat
NodeColor:Red;+;100;Money,Add 100 money if Red node selected
PrevDam;+;5;Money,Add 5 money per damage prevented by Grit
PrevRisk;%;10;Money,Add 10% money per risk prevented by Veil
RiskDamPair;+;10;Money,Add 10 money per damage+risk prevention pair
ColorForEach;%;20;Damage,Add 20% damage per unique color selected
```

**Stats:**
- Damage, Risk, Money, Grit, Veil (case-insensitive)

**Prevention Mechanics:**
- 2 Grit = 1 prevented Damage
- 2 Veil = 1 prevented Risk

### Runner Management
- 3 runner slots with types: Empty, Face, Muscle, Hacker, Ninja
- 4 stats per runner: FaceStat, MuscleStat, HackerStat, NinjaStat
- Automatic totaling and validation of integer inputs

### UI Layout Requirements
Four main sections using CSS Grid/Flexbox:
- **Game Board** (center): Contract perk tree with synergy nodes
- **Setup Section** (top left): Runner configuration
- **Game State Section** (top center): PlayerMoney, PlayerRisk, completed contracts
- **Options Section** (bottom right): Contract dropdown, execution buttons

## Specialized Agents

### johnson-game-developer
Use this agent for implementing, modifying, or debugging Johnson prototype game code. This agent understands the specific architecture, CSV data format, Canvas rendering requirements, and effect calculation logic.

## Performance Requirements

- Handle up to 100 nodes smoothly
- Real-time preview updates without lag
- Responsive design for modern browsers
- Canvas performance optimized for frequent redraws

## Data Validation

Contract CSV files must contain all required columns. Effect strings must follow the specified format. Runner stats must be valid integers. The system should handle malformed data gracefully with proper error messages.

### Effect String Validation

The CSV loader validates all effect strings to ensure proper format. Valid effect format:
```
[Condition];[Operator];[Amount];[Stat]
```

**Valid Operators**: `+`, `-`, `*`, `/`, `%`

**Valid Conditions**:
- `None`
- `RunnerType:[Face|Muscle|Hacker|Ninja]`
- `RunnerStat:[face|muscle|hacker|ninja][>=|<=|>|<|==][number]`
- `NodeColor:[Red|Yellow|Green|Blue|Purple|Grey]`
- `NodeColorCombo:[color],[color],...`
- `PrevDam`
- `PrevRisk`
- `RiskDamPair`
- `ColorForEach`

**Valid Stats**: `Damage`, `Risk`, `Money`, `Grit`, `Veil` (case-insensitive)