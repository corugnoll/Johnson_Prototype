# Sub-Milestone 1A: Foundation Setup
## Johnson Prototype Game Development

---

## Executive Summary

Sub-Milestone 1A establishes the foundational architecture and basic user interface structure for the Johnson Prototype. This sub-milestone focuses on creating a solid technical foundation that supports all subsequent development phases while delivering a functional UI layout that demonstrates the application's core interface design.

**Key Deliverable:** A working web application with complete project structure, responsive UI layout, and basic CSV loading capabilities.

---

## Scope and Objectives

### Primary Objectives
1. **Establish Project Architecture** - Create maintainable file structure and module system
2. **Implement Responsive UI Layout** - Build all four main interface sections
3. **Basic Data Loading** - Implement CSV file loading and basic parsing
4. **Validate Technical Foundation** - Ensure browser compatibility and performance baseline

### Success Criteria
- Complete HTML5 application structure with semantic markup
- All four UI sections properly laid out and responsive
- CSV file loading works without errors
- Basic data validation identifies malformed files
- Application loads in under 2 seconds on target browsers
- Code follows modular ES6 architecture patterns

---

## Included Tasks

### TASK #1: Core Project Structure and HTML Foundation
**PRIORITY:** Critical
**OBJECTIVE:** Establish the foundational architecture and HTML structure for the entire application

**TECHNICAL REQUIREMENTS:**
- Complete project folder structure with logical organization
- Semantic HTML5 markup with proper ARIA accessibility
- CSS Grid-based responsive layout for 4 main sections
- ES6 module architecture setup
- Modern browser compatibility validation (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)

**ACCEPTANCE CRITERIA:**
- [ ] Project structure matches specification exactly
- [ ] HTML validates according to HTML5 standards
- [ ] CSS Grid layout responsive on screens 1024px+ width
- [ ] JavaScript modules load correctly in target browsers
- [ ] Application shell loads without errors
- [ ] All accessibility requirements met (proper ARIA labels)

**DEPENDENCIES:** None (foundational task)
**ESTIMATED EFFORT:** Small (1-2 days)

### TASK #3: Basic UI Layout with All Required Sections
**PRIORITY:** High
**OBJECTIVE:** Implement complete user interface layout with all four main sections functional

**TECHNICAL REQUIREMENTS:**
- **Setup Section:** 3 runner configuration panels with dropdowns and input fields
- **Game State Section:** PlayerMoney, PlayerRisk, and status displays
- **Options Section:** Contract selection dropdown and action buttons
- **Preview Section:** Current pools display area (content placeholder for later phases)
- Responsive design with consistent styling
- Form validation for all input fields

**ACCEPTANCE CRITERIA:**
- [ ] All four sections render correctly in CSS Grid layout
- [ ] Setup section accepts runner configurations (3 slots)
- [ ] Game State section displays player information clearly
- [ ] Options section provides contract selection interface
- [ ] Preview section layout prepared for future data display
- [ ] All form inputs have proper validation
- [ ] Layout works on different screen sizes (1024px+ minimum)
- [ ] Typography and spacing follow design consistency

**DEPENDENCIES:** Task #1 (Project Structure)
**ESTIMATED EFFORT:** Medium (2-3 days)

### TASK #2: CSV Loading and Parsing System (Basic Implementation)
**PRIORITY:** High
**OBJECTIVE:** Implement robust CSV file loading with basic parsing and validation

**TECHNICAL REQUIREMENTS:**
- Async file loading using File API
- Basic CSV parsing (custom parser or Papa Parse integration)
- Data validation for required columns (NodeID, Description, Effect, NodeColor, Shape, Layer, Slot, ConnectionsIn)
- Error handling with user-friendly messages
- Support for Contract_Example1.csv format

**ACCEPTANCE CRITERIA:**
- [ ] CSV files load successfully via file input or drag-drop
- [ ] Parser correctly identifies all required columns
- [ ] Data validation catches missing or malformed columns
- [ ] Error messages are clear and actionable
- [ ] Contract_Example1.csv loads without errors
- [ ] Parsed data structure ready for rendering system
- [ ] Loading performance under 1 second for typical files
- [ ] Memory usage remains efficient

**DEPENDENCIES:** Task #1 (Project Structure)
**ESTIMATED EFFORT:** Medium (2-3 days)

---

## Technical Architecture

### File Structure
```
Johnson_Prototype/
├── index.html                 # Main application entry point
├── css/
│   └── styles.css            # Responsive layout and component styles
├── js/
│   ├── main.js               # Application initialization and coordination
│   ├── csvLoader.js          # CSV file loading and parsing
│   ├── ui.js                 # UI interaction handlers
│   └── gameState.js          # Basic state management (placeholder)
├── contracts/
│   └── Contract_Example1.csv # Test data for validation
└── documentation/
    ├── ms1.md               # Main milestone specification
    └── ms1a.md              # This sub-milestone
```

### Module Dependencies
```
main.js → csvLoader.js → ui.js → gameState.js
```

### Technology Stack
- **Frontend:** Vanilla JavaScript ES6+ with modules
- **Styling:** CSS Grid, Flexbox, Custom Properties
- **Data Processing:** Custom CSV parser or Papa Parse
- **Browser APIs:** File API for CSV loading
- **Development:** No build tools required (direct browser execution)

---

## Detailed Implementation Specifications

### HTML Structure Requirements
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Standard meta tags, viewport, charset -->
    <!-- CSS Grid custom properties for layout -->
</head>
<body>
    <div class="app-container">
        <header class="game-board">
            <!-- Canvas container for future node rendering -->
        </header>
        <aside class="setup-section">
            <!-- Runner configuration interface -->
        </aside>
        <aside class="game-state-section">
            <!-- Player stats display -->
        </aside>
        <footer class="options-section">
            <!-- Contract selection and controls -->
        </footer>
        <section class="preview-section">
            <!-- Current pools display area -->
        </section>
    </div>
</body>
</html>
```

### CSS Layout Specifications
```css
.app-container {
    display: grid;
    grid-template-areas:
        "game-board game-board setup"
        "game-board game-board game-state"
        "options preview preview";
    grid-template-columns: 1fr 1fr 300px;
    grid-template-rows: 1fr 1fr auto;
    height: 100vh;
    gap: 1rem;
    padding: 1rem;
}

/* Responsive breakpoints for smaller screens */
@media (max-width: 1024px) {
    .app-container {
        grid-template-areas:
            "game-board"
            "setup"
            "game-state"
            "options"
            "preview";
        grid-template-columns: 1fr;
        grid-template-rows: auto;
    }
}
```

### CSV Loading Implementation
```javascript
// csvLoader.js module structure
export class CSVLoader {
    async loadFile(file) {
        // File validation and loading
    }

    parseCSV(csvText) {
        // CSV parsing with validation
    }

    validateData(parsedData) {
        // Data structure validation
    }
}
```

---

## Testing and Validation

### Functional Testing Checklist
- [ ] Application loads in all target browsers without errors
- [ ] HTML passes W3C validation
- [ ] CSS Grid layout displays correctly on various screen sizes
- [ ] All UI sections are properly labeled and accessible
- [ ] CSV file loading works with sample contract data
- [ ] Error handling displays appropriate messages
- [ ] Form inputs accept valid data and reject invalid data

### Performance Testing Checklist
- [ ] Initial page load completes under 2 seconds
- [ ] CSV loading completes under 1 second for typical files
- [ ] UI remains responsive during file loading
- [ ] Memory usage remains stable
- [ ] No console errors in browser developer tools

### Browser Compatibility Testing
- [ ] Chrome 80+ functionality verified
- [ ] Firefox 75+ functionality verified
- [ ] Safari 13+ functionality verified
- [ ] Edge 80+ functionality verified
- [ ] ES6 module loading works across browsers
- [ ] CSS Grid support confirmed

---

## Definition of Done

### Functional Criteria
- [ ] Complete project structure established with all required folders and files
- [ ] HTML application loads without errors in all target browsers
- [ ] All four UI sections display correctly with proper responsive behavior
- [ ] CSV loading system successfully processes Contract_Example1.csv
- [ ] Basic form validation works for all input fields
- [ ] Error handling provides clear feedback for common issues

### Code Quality Criteria
- [ ] JavaScript follows ES6 module patterns consistently
- [ ] CSS uses modern layout techniques (Grid, Flexbox)
- [ ] HTML follows semantic markup best practices
- [ ] Code includes basic documentation and comments
- [ ] No console errors or warnings in browser developer tools

### User Experience Criteria
- [ ] Interface is visually clean and professional
- [ ] Layout adapts properly to different screen sizes
- [ ] All interactive elements provide appropriate feedback
- [ ] Loading states are handled gracefully
- [ ] Error messages are helpful and actionable

---

## Risk Assessment

### Technical Risks
1. **Browser Compatibility Issues**
   - **Risk Level:** Low
   - **Mitigation:** Test early across all target browsers, use feature detection

2. **CSS Grid Layout Complexity**
   - **Risk Level:** Low
   - **Mitigation:** Start with simple grid, iterate to complex responsive behavior

3. **CSV Parsing Edge Cases**
   - **Risk Level:** Medium
   - **Mitigation:** Comprehensive validation, clear error messages

### Dependencies for Next Sub-Milestone
- Working CSV loader with validated data structure
- Stable UI layout that can accommodate dynamic content
- Module architecture that supports additional game logic components

---

## Transition to Sub-Milestone 1B

Upon completion of MS1A, the project will be ready for:
- **MS1B - Data Pipeline:** Enhanced CSV processing with complete validation
- Advanced data structures for node and connection management
- Integration testing with more complex contract files
- Performance optimization for larger datasets

**Deliverables Handoff:**
1. Complete working application shell
2. Functional CSV loading system
3. Responsive UI layout ready for dynamic content
4. Technical documentation for established architecture
5. Test validation of foundational components