# Milestone 1 Specification: Foundation and Core Mechanics
## Johnson Prototype Game Development

---

## Executive Summary

Milestone 1 establishes the foundational architecture and core mechanics of the Johnson Prototype - a browser-based cyberpunk simulation/puzzle game. This milestone delivers a working prototype that demonstrates the fundamental concept: loading contracts, displaying interactive perk trees, and calculating effects based on runner selections and node interactions.

**Key Deliverable:** A functional web application that loads a contract from CSV data, renders it as an interactive node tree, allows runner configuration, and calculates effects in real-time.

---

## Milestone Objectives

### Primary Objectives
1. **Establish Technical Foundation** - Create a robust, maintainable codebase architecture
2. **Implement Core Data Pipeline** - CSV loading, parsing, and validation system
3. **Build Interactive Visualization** - Canvas-based node rendering with connection lines
4. **Create Effect Calculation Engine** - Complex condition-based effect processing
5. **Validate Core Concept** - Demonstrate the complete flow from contract loading to effect calculation

### Success Criteria
- Players can load and view a complete contract as a visual node tree
- All node types render correctly with proper colors and states
- Runner configuration interface is fully functional
- Effect calculations work accurately for all specified condition types
- Real-time preview updates show current stat pools
- System performs smoothly with the example contract data

---

## Scope and Deliverables

### Included in Milestone 1 (Phase 1 Tasks)

#### TASK #1: Core Project Structure and HTML Foundation
**Status:** Critical Path
- Complete HTML layout with responsive design
- Modular JavaScript architecture setup
- CSS grid/flexbox implementation for 4 main UI sections
- Modern browser compatibility validation

#### TASK #2: CSV Loading and Parsing System
**Status:** Critical Path
- Robust CSV file loading with async handling
- Data validation for all required columns
- Error handling for malformed data
- Support for contract data structure

#### TASK #3: Basic UI Layout with All Required Sections
**Status:** High Priority
- Setup Section: Runner dropdowns and stat inputs
- Game State Section: PlayerMoney, PlayerRisk display
- Options Section: Contract selection and action buttons
- Preview Section: Current pools with prevention calculations

#### TASK #4: Node Rendering System with Visual States
**Status:** Critical Path
- Canvas-based rendering engine
- Support for 6 node colors (#FF6467, #FFDF20, etc.)
- Three visual states: Available, Selected, Unavailable
- Layer/Slot positioning system
- Text rendering for descriptions and effects

#### TASK #5: Connection Line Drawing System
**Status:** High Priority
- Canvas-based line drawing between nodes
- 90-degree angle pathfinding algorithm
- Clean, professional visual appearance
- Proper connection parsing from CSV data

#### TASK #6: Runner Setup and Management Interface
**Status:** High Priority
- 3 runner configuration slots
- Type dropdowns (Empty, Face, Muscle, Hacker, Ninja)
- 4 stat input fields per runner
- Automatic totaling system with validation

#### TASK #7: Effect Calculation Engine
**Status:** Critical Path
- Parse complex effect strings from CSV
- Support all condition types (None, RunnerType, RunnerStat, NodeColor, NodeColorCombo)
- Implement all operators (+, -, *, /)
- Handle all stat types (Damage, Risk, Money, Grit, Veil)
- Prevention mechanics (Grit reduces Damage, Veil reduces Risk)

### Explicitly Excluded from Milestone 1
- Real-time preview system (Task #8 - Phase 2)
- Node click interaction (Task #9 - Phase 2)
- Contract execution logic (Task #10 - Phase 2)
- Visual polish and hover effects (Task #11 - Phase 3)
- Comprehensive testing suite (Task #12 - Phase 3)

---

## Technical Requirements and Constraints

### Architecture Requirements
- **Platform:** Modern web browsers (2020+)
- **Approach:** Client-side only, no server dependencies
- **Language:** Vanilla JavaScript with ES6 modules
- **Rendering:** Canvas API for nodes and connection lines
- **Performance:** Handle up to 100 nodes smoothly
- **File Structure:** Modular organization with clear separation of concerns

### Browser Compatibility
- **Target Browsers:** Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Required:** ES6 modules, Canvas API, CSS Grid, File API
- **Responsive Design:** Support 1024px+ screen widths minimum

### Data Requirements
- **Input Format:** CSV files with specific column structure
- **Validation:** All required columns must be present and valid
- **Error Handling:** Graceful degradation for malformed data
- **Sample Data:** Must work correctly with Contract_Example1.csv

### Performance Constraints
- **Load Time:** Initial page load under 2 seconds
- **Rendering:** Node tree renders under 1 second for 50+ nodes
- **Responsiveness:** UI updates within 100ms of user input
- **Memory:** Efficient cleanup of canvas resources

---

## Detailed Task Specifications

### Task #1: Core Project Structure and HTML Foundation
**Technical Implementation:**
```
Project Structure:
Johnson_Prototype/
├── index.html (main application file)
├── css/
│   └── styles.css (responsive layout styles)
├── js/
│   ├── main.js (application entry point)
│   ├── csvLoader.js (CSV processing module)
│   ├── nodeRenderer.js (canvas rendering engine)
│   ├── effectCalculator.js (effect processing engine)
│   ├── gameState.js (state management)
│   └── ui.js (UI interaction handlers)
├── contracts/
│   └── Contract_Example1.csv (test data)
└── documentation/
```

**HTML Layout Requirements:**
- Semantic HTML5 structure with proper ARIA labels
- CSS Grid layout for 4 main sections:
  - Game Board (canvas area for node tree)
  - Setup (runner configuration interface)
  - Game State (player stats display)
  - Options (contract selection and controls)
- Responsive viewport configuration
- Module script loading for JavaScript

**CSS Architecture:**
- Mobile-first responsive design approach
- CSS Grid for main layout, Flexbox for components
- CSS custom properties for theming
- No external CSS frameworks required

### Task #2: CSV Loading and Parsing System
**File Structure Requirements:**
```
Required CSV Columns:
- NodeID (unique identifier)
- Description (display text)
- Effect (effect calculation string)
- NodeColor (color designation)
- Shape (Rectangle/Pill)
- Layer (vertical positioning)
- Slot (horizontal positioning)
- ConnectionsIn (comma-separated node IDs)
```

**Implementation Specifications:**
- Async file loading with proper error boundaries
- Custom CSV parser or Papa Parse integration
- Data validation pipeline with descriptive error messages
- Support for multiple contract files in future
- Memory-efficient processing for large datasets

**Error Handling Requirements:**
- Invalid file format detection
- Missing required columns validation
- Malformed data row handling
- User-friendly error messages with specific issues

### Task #3: Basic UI Layout Implementation
**Setup Section Specifications:**
- 3 runner configuration panels with consistent styling
- Type dropdowns with 5 options: Empty, Face, Muscle, Hacker, Ninja
- 4 stat input fields per runner: FaceStat, MuscleStat, HackerStat, NinjaStat
- Real-time total calculation display
- Input validation for integer values only

**Game State Section Requirements:**
- PlayerMoney display with currency formatting
- PlayerRisk display with appropriate visual indicators
- Completed contracts counter
- Clean, readable typography

**Options Section Features:**
- Contract selection dropdown (populated from available files)
- Help button with tooltip functionality
- Action buttons for future contract execution
- Consistent button styling and spacing

**Preview Section Layout:**
- Current pools display: Grit, Veil, Damage, Risk, Money
- Prevention calculations: prevented Damage and Risk
- Real-time updates (placeholder for Phase 2)
- Clear visual hierarchy for stat importance

### Task #4: Node Rendering System Implementation
**Canvas Requirements:**
- High-DPI support for crisp rendering
- Efficient redraw mechanisms
- Proper scaling for different screen sizes
- Memory management for canvas resources

**Node Specifications:**
```
Colors (from specification):
- Red: #FF6467
- Yellow: #FFDF20
- Green: #4ADE80 (corrected from spec)
- Blue: #51A2FF
- Purple: #8B5CF6 (corrected from spec)
- Orange: #FB923C (additional)

Shapes:
- Rectangle: Standard nodes
- Pill: Special effect nodes

Visual States:
- Available: Normal color, solid border
- Selected: Normal color, highlighted border (3px yellow)
- Unavailable: Desaturated color (50% opacity)
```

**Text Rendering Requirements:**
- Multi-line text support for long descriptions
- Proper font sizing and readability
- Text clipping for oversized content
- Consistent typography with UI sections

**Positioning System:**
- Layer-based vertical positioning (0-based from top)
- Slot-based horizontal positioning within layers
- Automatic spacing calculations
- Collision detection and overlap prevention

### Task #5: Connection Line Drawing System
**Line Drawing Specifications:**
- Canvas-based vector graphics
- 90-degree angle pathfinding algorithm
- Optimal routing to avoid node overlap
- Clean, professional appearance

**Algorithm Requirements:**
- Parse connection data from CSV ConnectionsIn column
- Calculate connection points on node boundaries
- Route lines using only horizontal and vertical segments
- Implement basic collision avoidance

**Visual Standards:**
- Line width: 2px
- Color: #666666 (neutral gray)
- Style: Solid lines only
- End caps: Square for clean corners

### Task #6: Runner Setup and Management Interface
**Dropdown Implementation:**
- HTML select elements with proper styling
- Consistent appearance across browsers
- Keyboard navigation support
- Change event handling for real-time updates

**Stat Input System:**
- Number input fields with min/max validation
- Real-time calculation as values change
- Error state visualization for invalid inputs
- Clear indication of required vs. optional fields

**Totaling System:**
- Automatic calculation of all stat totals
- Display updates without page refresh
- Proper handling of empty/invalid inputs
- Mathematical accuracy for all operations

### Task #7: Effect Calculation Engine
**Effect String Parsing:**
```
Format: "Condition;Operator;Amount;Stat"
Examples:
- "None;+;50;Money" (unconditional money gain)
- "RunnerType:Face;+;2;Grit" (conditional on Face runner)
- "RunnerStat:FaceStat>5;*;2;Money" (conditional on stat threshold)
- "NodeColor:Red;-;1;Risk" (conditional on other red nodes selected)
- "NodeColorCombo:Red+Blue;+;3;Veil" (conditional on color combination)
```

**Condition Types Implementation:**
1. **None:** Always applies
2. **RunnerType:** Check if specific runner type is selected
3. **RunnerStat:** Evaluate stat comparisons (>, <, =, >=, <=)
4. **NodeColor:** Check if other nodes of specific color are selected
5. **NodeColorCombo:** Check for combinations of node colors

**Operator Support:**
- Addition (+): Standard stat increases
- Subtraction (-): Stat penalties
- Multiplication (*): Multiplier effects
- Division (/): Reduction effects

**Stat Type Handling:**
- **Damage:** Negative effects on mission success
- **Risk:** Potential for complications
- **Money:** Reward calculations
- **Grit:** Damage prevention resource
- **Veil:** Risk prevention resource

**Prevention Mechanics:**
- 2 Grit prevents 1 Damage
- 2 Veil prevents 1 Risk
- Prevention applied before final totals
- Proper rounding for fractional prevention

---

## Definition of "Done"

### Functional Criteria
- [ ] Application loads without errors in target browsers
- [ ] Contract_Example1.csv loads and parses successfully
- [ ] All nodes render with correct colors, shapes, and positions
- [ ] Connection lines draw properly between connected nodes
- [ ] Runner configuration interface accepts valid inputs
- [ ] Effect calculations produce correct results for all example cases
- [ ] UI layout is responsive and professional-looking
- [ ] All validation and error handling works as specified

### Code Quality Criteria
- [ ] JavaScript code follows ES6 module patterns
- [ ] Functions are properly documented with JSDoc comments
- [ ] Error handling covers all major failure scenarios
- [ ] Code is organized into logical, reusable modules
- [ ] CSS follows consistent naming conventions
- [ ] HTML validates according to HTML5 standards

### Performance Criteria
- [ ] Initial page load completes under 2 seconds
- [ ] Node rendering completes under 1 second for 50+ nodes
- [ ] UI remains responsive during all operations
- [ ] Memory usage remains stable during extended use

### User Experience Criteria
- [ ] Interface is intuitive without requiring documentation
- [ ] Visual feedback is immediate and clear
- [ ] Error messages are helpful and actionable
- [ ] Layout works properly on different screen sizes
- [ ] All interactive elements are clearly identifiable

---

## Dependencies and Prerequisites

### External Dependencies
- **Modern Web Browser:** Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Local File Access:** For loading CSV files (file:// protocol or local server)
- **CSV Parsing Library:** Papa Parse (optional) or custom implementation

### Internal Dependencies (Critical Path)
1. Task #1 (Project Structure) → Task #2 (CSV Loading)
2. Task #1 (Project Structure) → Task #3 (UI Layout)
3. Task #2 (CSV Loading) → Task #4 (Node Rendering)
4. Task #4 (Node Rendering) → Task #5 (Connection Lines)
5. Task #3 (UI Layout) → Task #6 (Runner Management)
6. Task #4 (Node Rendering) + Task #6 (Runner Management) → Task #7 (Effect Calculation)

### Parallel Development Opportunities
- Task #3 (UI Layout) can run parallel with Task #2 (CSV Loading)
- Task #6 (Runner Management) can run parallel with Task #4 (Node Rendering)
- Task #5 (Connection Lines) can begin once Task #4 node positioning is stable

---

## Risk Assessment and Mitigation Strategies

### High-Risk Areas

#### 1. Effect Calculation Engine (Task #7)
**Risk Level:** HIGH
**Risk Factors:**
- Most complex business logic in the system
- Complex parsing requirements for effect strings
- Multiple condition types with intricate interactions
- Mathematical calculations with prevention mechanics

**Mitigation Strategies:**
- Start with simple effect types (None conditions) and build complexity incrementally
- Create comprehensive unit tests for each condition type
- Implement extensive logging for debugging calculation issues
- Build a testing interface to validate calculations manually

#### 2. Canvas Rendering Performance (Task #4)
**Risk Level:** MEDIUM-HIGH
**Risk Factors:**
- Performance could degrade with many nodes
- Complex text rendering requirements
- Cross-browser canvas compatibility issues

**Mitigation Strategies:**
- Implement efficient redraw mechanisms (dirty rectangle updates)
- Consider DOM-based rendering fallback if performance issues arise
- Start with simple shapes and optimize progressively
- Use requestAnimationFrame for smooth updates

#### 3. Node Positioning Algorithm (Task #4)
**Risk Level:** MEDIUM
**Risk Factors:**
- Layer/Slot system may not handle all layout scenarios
- Node overlap potential with complex trees
- Connection routing complexity

**Mitigation Strategies:**
- Use fixed positioning initially based on CSV data
- Implement basic collision detection
- Plan for manual positioning override if automatic system fails
- Start with simple tree structures and expand gradually

### Medium-Risk Areas

#### 4. CSV Data Validation (Task #2)
**Risk Level:** MEDIUM
**Risk Factors:**
- Data quality issues in contract files
- Edge cases in CSV parsing
- Performance with large datasets

**Mitigation Strategies:**
- Implement comprehensive validation with clear error messages
- Build data quality checkers for contract files
- Set reasonable limits on data size
- Provide detailed documentation for CSV format requirements

#### 5. Browser Compatibility (All Tasks)
**Risk Level:** LOW-MEDIUM
**Risk Factors:**
- Canvas API differences across browsers
- ES6 module loading variations
- CSS Grid/Flexbox implementation differences

**Mitigation Strategies:**
- Test on all target browsers early and frequently
- Use feature detection for critical APIs
- Implement graceful degradation where possible
- Maintain compatibility matrix documentation

### Low-Risk Areas

#### 6. UI Layout Implementation (Task #3, #6)
**Risk Level:** LOW
**Risk Factors:**
- Standard web technologies with good browser support
- Well-understood implementation patterns

**Mitigation Strategies:**
- Use proven CSS patterns and frameworks
- Test responsive behavior early
- Implement accessibility best practices from start

---

## Estimated Timeline and Effort

### Task Effort Estimates

| Task | Estimated Effort | Rationale |
|------|------------------|-----------|
| Task #1: Project Structure | 1-2 days | Standard setup, well-defined requirements |
| Task #2: CSV Loading | 2-3 days | File handling, parsing, validation logic |
| Task #3: UI Layout | 2-3 days | Multiple UI sections, responsive design |
| Task #4: Node Rendering | 4-5 days | Complex canvas rendering, state management |
| Task #5: Connection Lines | 2-3 days | Pathfinding algorithm, visual implementation |
| Task #6: Runner Management | 1-2 days | Standard form interfaces, validation |
| Task #7: Effect Calculation | 4-6 days | Most complex business logic, multiple condition types |

### Critical Path Timeline
**Total Estimated Duration:** 16-24 days (3-5 weeks)

**Week 1:**
- Days 1-2: Task #1 (Project Structure)
- Days 3-5: Task #2 (CSV Loading) + Task #3 (UI Layout) in parallel

**Week 2:**
- Days 6-10: Task #4 (Node Rendering)
- Days 8-10: Task #6 (Runner Management) in parallel

**Week 3:**
- Days 11-13: Task #5 (Connection Lines)
- Days 14-16: Task #7 (Effect Calculation)

**Week 4:**
- Days 17-20: Integration testing and bug fixes
- Days 21-24: Buffer for complex issues and polish

### Resource Requirements
- **Primary Developer:** Full-time commitment for duration
- **Testing Support:** Part-time availability for validation
- **Design Review:** Periodic check-ins for UI/UX feedback

### Dependencies on External Factors
- **Contract Data:** Availability of properly formatted CSV test data
- **Browser Testing:** Access to target browser versions
- **Performance Testing:** Representative hardware for testing

---

## Success Metrics and Validation

### Functional Validation Criteria
1. **Contract Loading Test:** Successfully load and display Contract_Example1.csv
2. **Node Rendering Test:** All 6 node colors render correctly in both shapes
3. **Connection Test:** All connection lines draw properly between specified nodes
4. **Runner Configuration Test:** All 5 runner types and 4 stats work correctly
5. **Effect Calculation Test:** All example effects from specification calculate correctly
6. **Integration Test:** Complete flow from contract load to final calculation works

### Performance Validation Criteria
1. **Load Time:** Application ready for interaction within 2 seconds
2. **Rendering Speed:** Node tree renders within 1 second for typical contracts
3. **Responsiveness:** No UI lag during normal user interactions
4. **Memory Stability:** No memory leaks during extended use

### User Experience Validation Criteria
1. **Usability Test:** New user can understand interface without documentation
2. **Visual Quality:** Professional appearance matching design specifications
3. **Error Handling:** Clear, actionable error messages for all failure scenarios
4. **Accessibility:** Basic keyboard navigation and screen reader compatibility

### Technical Quality Validation Criteria
1. **Code Quality:** Passes ESLint validation with project standards
2. **Documentation:** All public functions documented with JSDoc
3. **Browser Compatibility:** Works correctly in all target browsers
4. **Maintainability:** Code structure supports future enhancement

---

## Post-Milestone 1 Transition Plan

### Deliverables for Milestone 2 Handoff
1. **Complete Working Application:** All Milestone 1 functionality operational
2. **Technical Documentation:** Code structure, API references, setup instructions
3. **Test Coverage:** Validation of all core functionality
4. **Known Issues Log:** Any limitations or bugs for future resolution
5. **Enhancement Recommendations:** Suggested improvements for Phase 2

### Phase 2 Preparation
- **Real-time Preview System:** Foundation ready for Task #8 implementation
- **Node Interaction:** Canvas click detection prepared for Task #9
- **State Management:** Architecture ready for contract execution (Task #10)

### Risk Mitigation for Future Phases
- **Performance Monitoring:** Baseline established for optimization decisions
- **Code Architecture:** Modular design supports feature additions
- **User Feedback Integration:** System ready for iterative improvements

---

## Conclusion

Milestone 1 establishes the critical foundation for the Johnson Prototype game, demonstrating the core concept through a working implementation of contract loading, visual node trees, and effect calculations. Upon completion, stakeholders will have a tangible prototype that validates the game mechanics and provides a solid platform for iterative development in subsequent phases.

The milestone delivers measurable value while maintaining focus on the essential features needed to test the core gameplay concept with users. The technical architecture established in this phase will support scalable enhancement and feature addition in future development cycles.