# Milestone 2 Specification (Updated): Complete Game Logic Engine
## Johnson Prototype Game Development

---

## Executive Summary

Milestone 2 builds upon the successful Visual Prototype foundation to complete the core game mechanics that transform the Johnson Prototype into a fully functional cyberpunk simulation game. This milestone focuses on implementing the sophisticated effect calculation engine, prevention mechanics, and node dependency logic that were partially implemented in the Visual Prototype phase.

**Key Deliverable:** A complete game logic system that processes complex effect calculations, manages node dependencies, and provides accurate real-time gameplay mechanics.

---

## Scope Revision Based on Visual Prototype Foundation

### What Exists from Visual Prototype Implementation
- ✅ Basic effect parsing framework in `gameState.js`
- ✅ Runner configuration and validation system
- ✅ Real-time calculation pipeline (partial implementation)
- ✅ Canvas-based visual state management
- ✅ Data structures optimized for game logic (`VisualNode`, `VisualContractData`)
- ✅ UI integration points for real-time updates

### What Needs Implementation in Milestone 2
- **Complete Effect Calculation Engine:** All condition types and operators
- **Prevention Mechanics:** Full 2:1 Grit/Veil reduction system
- **Node Dependency Logic:** Connection-based availability rules
- **Advanced State Management:** Complex game rule validation
- **Performance Optimization:** Large contract handling
- **Error Handling Enhancement:** User-friendly error messages

---

## Updated Task Specifications

### TASK #8: Complete Effect Calculation Engine
**PRIORITY:** Critical
**OBJECTIVE:** Extend existing effect framework to handle all specified condition types and mathematical operations

**TECHNICAL REQUIREMENTS:**
- Build upon existing `gameState.js` effect processing
- Implement complete condition evaluation system (None, RunnerType, RunnerStat, NodeColor, NodeColorCombo)
- Add mathematical operator support (+, -, *, /) with proper edge case handling
- Integrate with existing `VisualNode` effect parsing
- Optimize calculation performance for real-time updates

**ACCEPTANCE CRITERIA:**
- [ ] All 5 condition types evaluate correctly with existing data structures
- [ ] Mathematical operations handle edge cases (division by zero, overflow)
- [ ] Integration with current `calculateCurrentPools()` function works seamlessly
- [ ] Performance maintains <100ms calculation time for 20+ effects
- [ ] Error handling provides specific feedback for malformed effect strings
- [ ] Real-time updates continue working with enhanced calculation engine

**DEPENDENCIES:** Existing Visual Prototype effect framework
**ESTIMATED EFFORT:** Medium (3-4 days) - Reduced from original due to existing foundation

### TASK #9: Implement Prevention Mechanics System
**PRIORITY:** High
**OBJECTIVE:** Complete the Grit/Veil prevention system hinted at in current pool calculations

**TECHNICAL REQUIREMENTS:**
- Extend existing pool calculation in `gameState.js`
- Implement 2 Grit = 1 Damage prevention logic
- Implement 2 Veil = 1 Risk prevention logic
- Integrate with current `currentPools` display system
- Add prevention summary for user feedback

**ACCEPTANCE CRITERIA:**
- [ ] Prevention mechanics apply correctly after all effect calculations
- [ ] Grit and Veil consumption follows 2:1 ratios accurately
- [ ] Prevention only applied up to available resource amounts
- [ ] Current pools display shows prevented amounts clearly
- [ ] Prevention calculations maintain real-time performance
- [ ] Integration with existing UI update mechanisms works correctly

**DEPENDENCIES:** Task #8 (Complete Effect Calculation)
**ESTIMATED EFFORT:** Small-Medium (2-3 days) - Foundation exists in current implementation

### TASK #10: Synergy Node Positioning and Rendering
**PRIORITY:** High
**OBJECTIVE:** Implement proper positioning and visual treatment for synergy nodes at the top of the contract tree

**TECHNICAL REQUIREMENTS:**
- Extend existing layout engine in `visualPrototype.js` to handle synergy node positioning
- Position synergy nodes above the main contract tree (top section)
- Implement special visual styling for synergy nodes (distinct from regular nodes)
- Integrate synergy nodes with existing connection line system
- Ensure synergy nodes connect properly to main tree nodes

**ACCEPTANCE CRITERIA:**
- [ ] Synergy nodes render above the main contract tree in dedicated top section
- [ ] Synergy nodes have distinctive visual styling (different from regular nodes)
- [ ] Connection lines from synergy nodes to main tree display correctly
- [ ] Layout algorithm accommodates both synergy and regular node positioning
- [ ] Synergy nodes integrate with existing click interaction system
- [ ] Visual hierarchy clearly shows synergy nodes as special tree elements

**DEPENDENCIES:** Existing Visual Prototype layout and rendering system
**ESTIMATED EFFORT:** Medium (2-3 days) - Enhancement to existing layout system

### TASK #11: Advanced Runner Integration
**PRIORITY:** Medium-High
**OBJECTIVE:** Enhance existing runner system with complete stat integration for effect calculations

**TECHNICAL REQUIREMENTS:**
- Extend current runner management in `gameState.js`
- Implement complete stat-based condition evaluation
- Add runner type validation for effect conditions
- Enhance stat totaling with effect calculation integration
- Optimize runner data access for calculation performance

**ACCEPTANCE CRITERIA:**
- [ ] RunnerType conditions evaluate correctly with current runner configuration
- [ ] RunnerStat conditions handle all comparison operators (>, <, =, >=, <=)
- [ ] Stat totaling integrates seamlessly with effect calculations
- [ ] Runner configuration changes trigger immediate recalculation
- [ ] Validation prevents impossible runner configurations
- [ ] Performance optimized for frequent runner updates

**DEPENDENCIES:** Existing runner management system
**ESTIMATED EFFORT:** Small-Medium (2-3 days) - Foundation exists, needs enhancement

### TASK #12: Enhanced Validation and Error Handling
**PRIORITY:** Medium
**OBJECTIVE:** Improve existing validation system for better user feedback during playtesting

**TECHNICAL REQUIREMENTS:**
- Enhance validation system built into `csvLoader.js`
- Improve error messages for malformed effect strings
- Add validation for synergy node requirements
- Implement better user feedback for calculation errors
- Optimize calculation performance for contracts up to 50 nodes

**ACCEPTANCE CRITERIA:**
- [ ] Contracts with up to 50 nodes maintain responsive performance
- [ ] Calculation caching reduces redundant computation
- [ ] Error handling provides actionable feedback for all edge cases
- [ ] Synergy node validation works correctly
- [ ] Enhanced error messages help with playtesting feedback
- [ ] Integration with existing UI remains smooth

**DEPENDENCIES:** All previous tasks completed
**ESTIMATED EFFORT:** Small-Medium (1-2 days) - Enhancement of existing systems

---

## Technical Architecture Integration

### Building on Existing Foundation

**Current Module Structure (Proven):**
```
js/
├── main.js                 # Application coordination (✅ Working)
├── csvLoader.js           # Data processing (✅ Working)
├── gameState.js           # State management (✅ Partial)
├── visualPrototype.js     # Canvas rendering (✅ Working)
└── ui.js                  # UI management (✅ Working)
```

**Enhancements for Milestone 2:**
```
js/
├── main.js                 # Enhanced coordination for complex game rules
├── csvLoader.js           # Enhanced validation for game logic
├── gameState.js           # Complete game logic implementation
├── visualPrototype.js     # Enhanced for dependency visualization
├── ui.js                  # Enhanced error feedback
└── [NEW] effectEngine.js  # Extracted complex calculation logic
```

### Data Flow Enhancement
**Current Flow (Working):**
```
CSV Load → Data Structures → Visual Rendering → Basic Calculation
```

**Enhanced Flow (Milestone 2):**
```
CSV Load → Validation → Data Structures → Dependency Logic → Complex Calculations → Prevention Mechanics → Visual Updates
```

### Integration Points with Existing System

**Leveraging Current Architecture:**
1. **Effect Parsing:** Extend existing effect processing in `gameState.js`
2. **Visual States:** Build upon proven node state management
3. **Real-time Updates:** Enhance existing calculation pipeline
4. **Data Structures:** Utilize optimized `VisualNode` and `VisualContractData`
5. **UI Integration:** Build upon working `ui.js` update mechanisms

---

## Performance Requirements (Updated)

### Calculation Performance Targets
- **Effect Processing:** Under 100ms for 25+ selected nodes (enhanced from current)
- **Real-time Updates:** Under 50ms for any configuration change (maintain current)
- **Prevention Calculation:** Under 10ms for all pools (new requirement)
- **Synergy Node Rendering:** Under 25ms for synergy node positioning (new requirement)

### Memory and Scalability
- **Contract Size:** Support up to 50 nodes with responsive performance (prototype scope)
- **Calculation Caching:** Efficient memoization for repeated calculations
- **Memory Stability:** No memory leaks during extended gameplay sessions
- **Browser Compatibility:** Maintain performance across all target browsers

---

## Testing and Validation Strategy

### Integration Testing with Existing System
- [ ] All current functionality continues working after enhancements
- [ ] Visual Prototype interaction remains smooth and responsive
- [ ] Real-time calculation updates maintain current performance
- [ ] Canvas rendering performance unaffected by logic complexity

### New Functionality Testing
- [ ] Complex effect calculations produce mathematically accurate results
- [ ] Prevention mechanics work correctly with all stat combinations
- [ ] Synergy nodes position and render correctly at top of tree
- [ ] Error handling provides clear, actionable feedback

### Performance Regression Testing
- [ ] Existing performance benchmarks maintained or improved
- [ ] Contract handling tested with up to 50 node examples (prototype scope)
- [ ] Memory usage profiled for extended gameplay sessions
- [ ] Browser compatibility verified across all target platforms

---

## Definition of Done

### Functional Criteria
- [ ] Complete effect calculation engine handles all specified condition types
- [ ] Prevention mechanics correctly implement 2:1 Grit/Veil reduction ratios
- [ ] Synergy nodes render correctly at the top of contract trees
- [ ] All mathematical operations produce accurate results with proper edge case handling
- [ ] Integration with existing Visual Prototype system maintains all current functionality
- [ ] Performance meets or exceeds requirements for contracts up to 50 nodes (prototype scope)

### Integration Criteria
- [ ] Seamless operation with existing Visual Prototype foundation
- [ ] Real-time calculation updates maintain responsive user experience
- [ ] Visual state management correctly reflects game logic state
- [ ] Error handling provides user-friendly feedback without breaking application flow
- [ ] All existing features continue working without regression

### Code Quality Criteria
- [ ] Game logic code maintains existing modular architecture patterns
- [ ] Mathematical calculations are thoroughly tested and documented
- [ ] Performance optimizations maintain code readability and maintainability
- [ ] Error handling covers all edge cases identified in existing system

---

## Risk Assessment (Updated)

### Risks Reduced Due to Existing Foundation
**Effect Calculation Complexity:** HIGH → MEDIUM
- *Reason:* Basic framework exists, reducing implementation risk
- *Mitigation:* Extend proven patterns instead of building from scratch

**Real-time Performance:** MEDIUM → LOW
- *Reason:* Current system already demonstrates acceptable performance
- *Mitigation:* Optimize existing pipeline instead of rebuilding

### New Risks Identified
**Integration Complexity:** MEDIUM
- *Risk:* Enhancing existing system without breaking current functionality
- *Mitigation:* Comprehensive regression testing and incremental changes

**Calculation Accuracy:** MEDIUM
- *Risk:* Complex mathematical operations with edge cases
- *Mitigation:* Extensive unit testing and validation against specification

**Scalability Limits:** LOW-MEDIUM
- *Risk:* Performance degradation with very large contracts
- *Mitigation:* Performance testing and optimization with 100+ node examples

---

## Transition to Milestone 3

Upon completion of Milestone 2, the project will have:
- **Complete Game Logic:** All core mechanics implemented and tested
- **Performance Baseline:** Established metrics for optimization decisions
- **Robust Foundation:** Architecture ready for advanced features
- **User Feedback:** Complete error handling and validation system

**Milestone 3 Preparation:**
- Game flow completion (contract execution) ready for implementation
- Advanced user experience features can build upon proven interaction patterns
- Save/load functionality can leverage existing state management
- Animation and polish can enhance proven visual system

**Estimated Timeline:** 8-10 days (significantly reduced due to existing foundation and focused scope)

---

## Success Metrics

### Quantitative Metrics
- [ ] All effect calculation examples from specification work correctly
- [ ] Performance benchmarks: <100ms calculations, <50ms updates, <10ms prevention
- [ ] Scalability: Up to 50 node contracts maintain responsive performance (prototype scope)
- [ ] Memory stability: No leaks during 30+ minute gameplay sessions

### Qualitative Metrics
- [ ] User experience remains smooth and responsive
- [ ] Error messages are clear and actionable
- [ ] Game mechanics feel accurate and fair
- [ ] Visual feedback correctly represents game state

### Integration Success
- [ ] All Visual Prototype functionality preserved and enhanced
- [ ] Seamless transition from current implementation to complete game logic
- [ ] Architecture supports planned Milestone 3 and 4 features
- [ ] Development velocity maintained or improved for future milestones