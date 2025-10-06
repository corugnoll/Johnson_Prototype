# Android Tablet Port - Project Brief
**Johnson Prototype: Samsung Galaxy Tab S10 FE+ Touch Support**

---

## Goal

Enable touch controls for the Johnson Prototype so it's playable on your Samsung Galaxy Tab S10 FE+ tablet. The game is already deployed via GitHub Pages and displays correctly on the large screen—it just needs touch event support to be fully functional.

---

## Current State

**What's working:**
- ✅ Game deployed and accessible via GitHub Pages
- ✅ UI renders correctly on tablet's large screen
- ✅ Text is readable without resizing
- ✅ Layout works without modifications

**What's not working:**
- ❌ Canvas nodes cannot be selected (no touch event handlers)
- ❌ Cannot pan/zoom canvas with touch gestures
- ❌ Game only responds to mouse events
- ❌ No contract dropdown/pre-loading system (relies on file picker)

**Two core blockers:** Touch event support + Contract pre-loading

---

## Required Changes

### 1. Touch Event Support (CRITICAL)
**What:** Add touch event handlers to make the canvas interactive
**Why:** Current game only works with mouse; tablet needs touch gestures

**Implementation:**
- Add touch event handlers (`touchstart`, `touchmove`, `touchend`)
- Map touch events to existing mouse event logic
- Implement single-finger pan (drag canvas)
- Implement two-finger pinch-to-zoom
- Make nodes selectable by tapping
- Prevent accidental browser zooming (`touch-action: none`)

**File to modify:** `js/visualPrototype.js`

**Effort estimate:** 3-4 hours
**Risk level:** LOW - straightforward event mapping

---

### 2. Contract Pre-Loading System (CRITICAL)
**What:** Embed contract CSV files into the app with dropdown selection
**Why:** Android file picker is unreliable; embedded contracts work consistently

**Implementation:**
- Create `js/contractLibrary.js` with all contract CSV data embedded
- Add dropdown menu to `index.html` for contract selection
- Modify `js/csvLoader.js` to load from embedded library
- Keep file input as optional fallback for custom contracts

**Files to modify/create:**
- New: `js/contractLibrary.js`
- Modify: `index.html`, `js/csvLoader.js`, `js/main.js`

**Effort estimate:** 2-3 hours
**Risk level:** LOW - straightforward data bundling

---

## Effort Estimate

**Core MVP implementation:** 5-7 hours
- Touch event handlers (3-4 hours)
- Contract pre-loading system (2-3 hours)
- Testing and refinement (1 hour)

**Total time:** 6-8 hours (including tablet testing)

**Risk Level:** LOW
**Feasibility:** HIGH - Two focused changes to existing code

## Optional Future Enhancements

**These are NOT needed now but might be useful later:**

### UI Optimization
**Status:** Not needed on current device
**Why it might help later:** If testing on smaller tablets or phones, may need to increase touch targets, enlarge fonts, or add zoom control buttons.

**Only implement if:** Targeting smaller screens or user feedback indicates accessibility issues

### PWA Manifest
**Status:** Nice to have
**Why it might help:** Enables "Add to Home Screen" with custom icon and standalone app experience.

**Only implement if:** Regular tablet demos justify the polish

---

## Testing Checklist

### Desktop Testing (Before deploying to tablet)
- [ ] Test with Chrome DevTools device emulation
- [ ] Verify touch events work in emulator
- [ ] Ensure no console errors
- [ ] Test node selection with simulated touch

### Tablet Testing (After deploying MVP features)
- [ ] Select contract from dropdown menu
- [ ] Verify contract loads and displays correctly
- [ ] Tap nodes to select/deselect
- [ ] Test single-finger pan (drag to move canvas)
- [ ] Test two-finger pinch zoom
- [ ] Load multiple different contracts from dropdown
- [ ] Configure runners using touch keyboard
- [ ] Execute contract and verify results
- [ ] Test orientation changes (landscape/portrait)
- [ ] Verify no performance lag during panning/zooming

---

## Success Criteria

**Core functionality:**
- ✅ Can select contracts from dropdown menu
- ✅ Contracts load correctly without file picker
- ✅ Can tap nodes to select/deselect them
- ✅ Can pan canvas with single-finger drag
- ✅ Can pinch-zoom with two fingers
- ✅ Canvas doesn't trigger browser zoom accidentally
- ✅ All existing mouse-based features still work on desktop
- ✅ Performance smooth (no lag during interaction)

---

## Implementation Timeline

**Core MVP features:**
- Implement contract pre-loading system (2-3 hours)
- Implement touch event handlers (3-4 hours)
- Test on physical tablet (1 hour)
- Refine based on feedback (30 minutes)

**Total time:** 6-8 hours

---

## Deployment Updates

**Current status:** GitHub Pages already configured and working

**To deploy touch control updates:**
1. Commit changes to repository
2. Push to main branch
3. Wait 1-2 minutes for GitHub Pages auto-deployment
4. Refresh game on tablet to see updates

**No additional setup needed**

---

## Resources

### Technical Documentation
- [Touch Events API](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) - Complete reference for touch event handlers
- [Preventing Default Touch Behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) - CSS `touch-action` property

### Testing Tools
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/) - Desktop touch simulation
- [Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/) - Debug tablet via USB (if needed)

### Reference Implementation
See `ANDROID_PORT_EVALUATION.md` for detailed code examples and technical patterns for touch event implementation.

---

**Prepared:** 2025-10-06
**Updated:** 2025-10-06 (simplified based on current deployment state)
**Target Device:** Samsung Galaxy Tab S10 FE+
**Current Status:** GitHub Pages deployed, UI working, need touch controls + contract pre-loading
**Estimated Effort:** 6-8 hours
**Risk Level:** LOW
