# Johnson Prototype Development Plan

## Project Overview
This is a cyberpunk simulation/puzzle game prototype focusing on contract execution through perk tree navigation. Players act as "Johnsons" (fixers) who select contracts, hire runners, and navigate strategic node-based challenges.

## Development Phases

### Phase 1 (MVP - Must Have)
Core functionality with single contract loading and basic interaction

### Phase 2 (Enhanced Features)
Complete game loop with contract execution cycle

### Phase 3 (Polish)
Visual feedback, testing, and production-ready features

---

## TASK #1: Create Core Project Structure and HTML Foundation
**PRIORITY:** Critical
**PHASE:** 1
**ESTIMATED EFFORT:** Small
**DEPENDENCIES:** None

**OBJECTIVE:** Establish the fundamental project architecture and main HTML file with proper layout sections

**TECHNICAL REQUIREMENTS:**
- [ ] Create main index.html with responsive layout
- [ ] Set up CSS grid/flexbox for 4 main sections (Game Board, Setup, Game State, Options)
- [ ] Include viewport meta tags and modern browser compatibility
- [ ] Create modular JavaScript file structure

**ACCEPTANCE CRITERIA:**
- [ ] HTML validates and displays properly in modern browsers
- [ ] All 4 main UI sections are properly positioned
- [ ] Responsive design works on different screen sizes
- [ ] JavaScript modules can be imported successfully

---

## TASK #2: Implement CSV Loading and Parsing System
**PRIORITY:** Critical
**PHASE:** 1
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #1 (Project Structure)

**OBJECTIVE:** Create robust CSV file loading and parsing to handle contract data

**TECHNICAL REQUIREMENTS:**
- [ ] JavaScript CSV parser (consider Papa Parse or custom implementation)
- [ ] Async file loading with proper error handling
- [ ] Data validation for required CSV columns
- [ ] Support for multiple contract files

**ACCEPTANCE CRITERIA:**
- [ ] Can successfully load and parse Contract_Example1.csv
- [ ] All required columns are validated (Node ID, Description, Effect, etc.)
- [ ] Error handling for malformed CSV data
- [ ] Contract data is properly structured for use by other systems

---

## TASK #3: Build Basic UI Layout with All Required Sections
**PRIORITY:** High
**PHASE:** 1
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #1 (Project Structure)

**OBJECTIVE:** Implement the complete UI layout as specified in the design document

**TECHNICAL REQUIREMENTS:**
- [ ] Setup Section: 3 runner dropdowns + stat input fields + totals display
- [ ] Game State Section: PlayerMoney, PlayerRisk, completed contracts display
- [ ] Options Section: Help button, contract dropdown, action buttons
- [ ] Preview Section: Current pools display with prevented damage/risk

**ACCEPTANCE CRITERIA:**
- [ ] All UI elements are properly positioned and styled
- [ ] Form inputs work correctly
- [ ] Dropdown menus function properly
- [ ] Visual layout matches design specification

---

## TASK #4: Create Node Rendering System with Visual States
**PRIORITY:** Critical
**PHASE:** 1
**ESTIMATED EFFORT:** Large
**DEPENDENCIES:** Task #2 (CSV Loading)

**OBJECTIVE:** Build the core node visualization system with proper state management

**TECHNICAL REQUIREMENTS:**
- [ ] Canvas-based rendering for nodes (rectangles and pill shapes)
- [ ] Support for 6 node colors as specified (#FF6467, #FFDF20, etc.)
- [ ] Three visual states: Available, Selected, Unavailable
- [ ] Proper node positioning using Layer/Slot system
- [ ] Text rendering for descriptions and effects

**ACCEPTANCE CRITERIA:**
- [ ] Nodes render correctly with proper colors and shapes
- [ ] Visual state changes work (normal, selected outline, desaturated)
- [ ] Text is readable and properly positioned
- [ ] Layer/Slot positioning system works correctly

---

## TASK #5: Implement Connection Line Drawing System
**PRIORITY:** High
**PHASE:** 1
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #4 (Node Rendering)

**OBJECTIVE:** Create system to draw connection lines between nodes using 90-degree angles

**TECHNICAL REQUIREMENTS:**
- [ ] Canvas-based line drawing
- [ ] Parse connection data from CSV
- [ ] Calculate optimal paths with only straight lines and 90° angles
- [ ] Clean, readable line visualization

**ACCEPTANCE CRITERIA:**
- [ ] Connection lines draw correctly between specified nodes
- [ ] Lines use only straight segments and 90° angles
- [ ] Lines don't overlap with node content
- [ ] Visual appearance is clean and professional

---

## TASK #6: Build Runner Setup and Management Interface
**PRIORITY:** High
**PHASE:** 1
**ESTIMATED EFFORT:** Small
**DEPENDENCIES:** Task #3 (UI Layout)

**OBJECTIVE:** Implement the runner configuration system with stats and types

**TECHNICAL REQUIREMENTS:**
- [ ] 3 runner slots with type dropdowns (Empty, Face, Muscle, Hacker, Ninja)
- [ ] 4 stat input fields per runner (FaceStat, MuscleStat, HackerStat, NinjaStat)
- [ ] Automatic totaling of all runner stats
- [ ] Input validation for integer values

**ACCEPTANCE CRITERIA:**
- [ ] All runner dropdowns function correctly
- [ ] Stat inputs accept only valid integers
- [ ] Totals update automatically when values change
- [ ] Reset functionality works properly

---

## TASK #7: Create Effect Calculation Engine
**PRIORITY:** Critical
**PHASE:** 1
**ESTIMATED EFFORT:** Large
**DEPENDENCIES:** Task #6 (Runner Management), Task #4 (Node Rendering)

**OBJECTIVE:** Build the core system for calculating node effects based on complex conditions

**TECHNICAL REQUIREMENTS:**
- [ ] Parse effect strings from CSV (Condition;Operator;Amount;Stat format)
- [ ] Implement all condition types (None, RunnerType, RunnerStat, NodeColor, NodeColorCombo)
- [ ] Support all operators (+, -, *, /)
- [ ] Handle all stat types (Damage, Risk, Money, Grit, Veil)
- [ ] Process prevention calculations (Grit reduces Damage, Veil reduces Risk)

**ACCEPTANCE CRITERIA:**
- [ ] All effect examples from specification work correctly
- [ ] Complex conditions calculate properly
- [ ] Prevention mechanics work (2 Grit = 1 prevented Damage)
- [ ] Error handling for invalid effect strings

---

## TASK #8: Implement Real-time Preview System
**PRIORITY:** High
**PHASE:** 2
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #7 (Effect Calculation)

**OBJECTIVE:** Create live preview that updates whenever selections change

**TECHNICAL REQUIREMENTS:**
- [ ] Real-time calculation of all stat pools
- [ ] Display current pools: Grit, Veil, Damage, Risk, Money
- [ ] Show prevented amounts (from Grit/Veil)
- [ ] Update immediately on any selection change

**ACCEPTANCE CRITERIA:**
- [ ] Preview updates instantly when nodes are selected/deselected
- [ ] All pool calculations are accurate
- [ ] Prevention calculations display correctly
- [ ] Performance remains smooth with frequent updates

---

## TASK #9: Add Node Interaction and State Management
**PRIORITY:** High
**PHASE:** 2
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #4 (Node Rendering), Task #8 (Preview System)

**OBJECTIVE:** Implement clickable nodes with proper state transitions

**TECHNICAL REQUIREMENTS:**
- [ ] Click detection on canvas-rendered nodes
- [ ] State transitions: Available ↔ Selected, respect Unavailable state
- [ ] Visual feedback for hover and click events
- [ ] Proper state management for all nodes

**ACCEPTANCE CRITERIA:**
- [ ] Nodes respond correctly to clicks
- [ ] State transitions work as specified
- [ ] Visual feedback is immediate and clear
- [ ] State is properly maintained across all operations

---

## TASK #10: Implement Contract Execution and Completion Logic
**PRIORITY:** High
**PHASE:** 2
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** Task #8 (Preview System), Task #3 (UI Layout)

**OBJECTIVE:** Build the contract completion system that applies final effects to player stats

**TECHNICAL REQUIREMENTS:**
- [ ] "Execute Contract" button functionality
- [ ] Final effect calculation including synergy nodes
- [ ] Apply totals to PlayerRisk and PlayerMoney
- [ ] Proper cleanup and reset for new contracts

**ACCEPTANCE CRITERIA:**
- [ ] Contract execution applies all effects correctly
- [ ] Player stats update properly
- [ ] System resets cleanly for new contracts
- [ ] All pools are properly cleared

---

## TASK #11: Add Visual Feedback and Polish
**PRIORITY:** Medium
**PHASE:** 3
**ESTIMATED EFFORT:** Small
**DEPENDENCIES:** Task #9 (Node Interaction)

**OBJECTIVE:** Implement hover effects, click feedback, and visual polish as specified

**TECHNICAL REQUIREMENTS:**
- [ ] Hover effects for all interactive elements
- [ ] Click feedback animations
- [ ] Help system with tooltip display
- [ ] Visual consistency across all elements

**ACCEPTANCE CRITERIA:**
- [ ] All interactive elements provide clear visual feedback
- [ ] Help system works properly
- [ ] Visual design is polished and consistent
- [ ] User experience feels responsive and intuitive

---

## TASK #12: Create Comprehensive Testing and Validation
**PRIORITY:** Medium
**PHASE:** 3
**ESTIMATED EFFORT:** Medium
**DEPENDENCIES:** All previous tasks

**OBJECTIVE:** Ensure all systems work correctly with thorough testing

**TECHNICAL REQUIREMENTS:**
- [ ] Test all effect calculation examples from specification
- [ ] Validate contract loading with different CSV files
- [ ] Test edge cases and error conditions
- [ ] Performance testing with large node trees

**ACCEPTANCE CRITERIA:**
- [ ] All specification examples work correctly
- [ ] Error handling is robust
- [ ] Performance is acceptable with 100+ nodes
- [ ] System handles malformed data gracefully

---

## Critical Path and Dependencies

**Critical Path:** Tasks #1 → #2 → #4 → #7 → #8 → #9 → #10

**Parallel Development Opportunities:**
- Task #3 (UI Layout) can run parallel with Task #2
- Task #6 (Runner Management) can run parallel with Task #4
- Task #11 (Polish) can begin once Task #9 is complete

## Risk Mitigation

**High-Risk Areas:**
1. **Effect Calculation Engine** (Task #7) - Most complex logic
2. **Canvas Rendering Performance** (Task #4) - Could impact user experience
3. **Node Positioning Algorithm** (Task #4) - Complex layout requirements

**Mitigation Strategies:**
- Start with simplified effect calculations and build complexity incrementally
- Consider DOM-based rendering fallback if Canvas performance issues arise
- Use fixed positioning initially, then optimize layout algorithm

## Technology Stack

**Recommended Technologies:**
- **Frontend:** Vanilla JavaScript with modular ES6 modules
- **Rendering:** Canvas API for nodes and connection lines
- **Data Processing:** Custom CSV parser or Papa Parse library
- **Styling:** Modern CSS with Grid/Flexbox
- **Architecture:** Client-side only, no server required
- **Browser Support:** Modern browsers (2020+)

## File Structure Recommendation

```
Johnson_Prototype/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── csvLoader.js
│   ├── nodeRenderer.js
│   ├── effectCalculator.js
│   ├── gameState.js
│   └── ui.js
├── contracts/
│   └── Contract_Example1.csv
└── documentation/
    └── Johnson_Prototype_Design_Spec.md
```