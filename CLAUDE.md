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
- Condition types: None, RunnerType, RunnerStat, NodeColor, NodeColorCombo
- Operators: +, -, *, /
- Stats: Damage, Risk, Money, Grit, Veil
- Prevention mechanics: 2 Grit = 1 prevented Damage, 2 Veil = 1 prevented Risk

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