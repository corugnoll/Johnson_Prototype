# Phase 4 Quick Reference

## What Changed?

Connection path calculation logic was moved from `visualPrototype.js` and `connectionManager.js` into a shared utility class `ConnectionUtils`.

## Files Modified

1. **js/utils/connectionUtils.js** - NEW shared utility
2. **js/visualPrototype.js** - Uses ConnectionUtils
3. **js/editor/connectionManager.js** - Uses ConnectionUtils
4. **index.html** - Includes connectionUtils.js script
5. **editor.html** - Includes connectionUtils.js script

## Using ConnectionUtils

### Calculate Connection Path

```javascript
// Input: Two node objects with {x, y, width, height}
const fromNode = { x: 100, y: 100, width: 80, height: 40 };
const toNode = { x: 300, y: 200, width: 80, height: 40 };

// Output: Array of points forming the path
const path = ConnectionUtils.calculateConnectionPath(fromNode, toNode);
// Returns: [{x, y}, {x, y}, {x, y}, {x, y}]
```

### Find Anchor Points Only

```javascript
const anchorPoints = ConnectionUtils.findBestAnchorPoints(fromNode, toNode);
// Returns: { start: {x, y}, end: {x, y} }
```

### Generate Path from Points

```javascript
const path = ConnectionUtils.generateRightAnglePath(startPoint, endPoint);
// Returns: [{x, y}, {x, y}, {x, y}, {x, y}]
```

### Calculate Arrow Head

```javascript
const endPoint = { x: 300, y: 200 };
const previousPoint = { x: 250, y: 200 };

const arrowPoints = ConnectionUtils.calculateArrowHead(endPoint, previousPoint);
// Returns: { point1: {x, y}, point2: {x, y} }

// Optional parameters
const customArrow = ConnectionUtils.calculateArrowHead(
    endPoint,
    previousPoint,
    10,           // arrow length (default: 8)
    Math.PI / 4   // arrow angle (default: Math.PI / 6)
);
```

## Method Reference

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `calculateConnectionPath()` | fromNode, toNode | Array of points | Complete path calculation |
| `findBestAnchorPoints()` | fromNode, toNode | {start, end} | Edge anchor points |
| `generateRightAnglePath()` | startPoint, endPoint | Array of points | 90-degree routing |
| `calculateArrowHead()` | endPoint, previousPoint, [length], [angle] | {point1, point2} | Arrow wing points |

## Algorithm Behavior

### Anchor Point Selection
- **Horizontal connections**: Uses left/right edges of nodes (when dx > dy)
- **Vertical connections**: Uses top/bottom edges of nodes (when dy > dx)
- **Direction**: Based on relative center positions

### Path Routing
- **Aligned nodes** (< 5px): Straight line
- **Diagonal nodes**: L-shaped path with midpoint at 50%
- **Angles**: Always 90 degrees (no diagonal lines)

### Arrow Heads
- **Default length**: 8 pixels
- **Default angle**: 30 degrees (Math.PI / 6)
- **Direction**: Calculated from previous point to end point

## Examples

### Example 1: Game Renderer (visualPrototype.js)

```javascript
// In visualPrototype.js
drawConnection(fromNode, toNode) {
    // Get path
    const path = ConnectionUtils.calculateConnectionPath(
        this.nodePositions.get(fromNode.id),
        this.nodePositions.get(toNode.id)
    );

    // Draw lines
    this.ctx.beginPath();
    path.forEach((point, i) => {
        if (i === 0) this.ctx.moveTo(point.x, point.y);
        else this.ctx.lineTo(point.x, point.y);
    });
    this.ctx.stroke();

    // Draw arrow
    const arrowPoints = ConnectionUtils.calculateArrowHead(
        path[path.length - 1],
        path[path.length - 2]
    );
    if (arrowPoints) {
        this.ctx.beginPath();
        this.ctx.moveTo(path[path.length - 1].x, path[path.length - 1].y);
        this.ctx.lineTo(arrowPoints.point1.x, arrowPoints.point1.y);
        this.ctx.moveTo(path[path.length - 1].x, path[path.length - 1].y);
        this.ctx.lineTo(arrowPoints.point2.x, arrowPoints.point2.y);
        this.ctx.stroke();
    }
}
```

### Example 2: Editor (connectionManager.js)

```javascript
// In connectionManager.js
drawConnection(fromNode, toNode, ctx) {
    const path = ConnectionUtils.calculateConnectionPath(fromNode, toNode);

    ctx.beginPath();
    path.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
}
```

### Example 3: Custom Tool

```javascript
// Any custom tool can now use ConnectionUtils
class CustomRenderer {
    drawCustomConnection(node1, node2) {
        // Use the same routing as game and editor
        const path = ConnectionUtils.calculateConnectionPath(node1, node2);

        // Custom rendering
        this.customRender(path);
    }
}
```

## Migration from Old Code

### Before (visualPrototype.js)
```javascript
calculateEnhancedConnectionPath(fromPos, toPos) {
    const anchorPoints = this.findBestAnchorPoints(fromPos, toPos);
    return this.generateRightAnglePath(anchorPoints.start, anchorPoints.end);
}
```

### After
```javascript
calculateEnhancedConnectionPath(fromPos, toPos) {
    return ConnectionUtils.calculateConnectionPath(fromPos, toPos);
}
```

### Before (connectionManager.js)
```javascript
calculateConnectionPath(fromNode, toNode) {
    if (!fromNode || !toNode) return [];
    const anchorPoints = this.findBestAnchorPoints(fromNode, toNode);
    return this.calculateRightAnglePath(anchorPoints.start, anchorPoints.end);
}
```

### After
```javascript
calculateConnectionPath(fromNode, toNode) {
    if (!fromNode || !toNode) return [];
    return ConnectionUtils.calculateConnectionPath(fromNode, toNode);
}
```

## Common Patterns

### Pattern 1: Calculate and Draw
```javascript
const path = ConnectionUtils.calculateConnectionPath(from, to);
this.drawPath(path);
```

### Pattern 2: Custom Midpoint
```javascript
// Get anchors
const anchors = ConnectionUtils.findBestAnchorPoints(from, to);

// Custom path calculation
const customPath = this.myCustomRouting(anchors.start, anchors.end);
```

### Pattern 3: Reuse Anchor Points
```javascript
// Calculate once
const anchors = ConnectionUtils.findBestAnchorPoints(from, to);

// Use for multiple paths
const path1 = ConnectionUtils.generateRightAnglePath(anchors.start, anchors.end);
const path2 = this.generateCustomPath(anchors.start, anchors.end);
```

## Testing Checklist

- [ ] Load contract in game - connections render correctly
- [ ] Load same contract in editor - connections identical to game
- [ ] Pan/zoom in game - connections update correctly
- [ ] Move nodes in editor - connections recalculate
- [ ] Arrow heads point in correct direction
- [ ] No JavaScript errors in console

## Troubleshooting

### Connections not appearing
- Check browser console for errors
- Verify connectionUtils.js is loaded before visualPrototype.js and connectionManager.js
- Check node objects have {x, y, width, height} properties

### Different appearance in game vs editor
- Both should use ConnectionUtils.calculateConnectionPath()
- Verify no custom path calculation remains
- Check line styles (color, width) - those are separate from path calculation

### Arrow heads missing/wrong direction
- Verify using ConnectionUtils.calculateArrowHead()
- Check previous point is valid (not null, not same as end point)
- Verify path has at least 2 points

## Performance Notes

- **Caching**: Path calculation is fast, but can cache results if needed
- **Reuse**: Anchor points can be calculated once and reused
- **Optimization**: All calculations use simple math (no expensive operations)

## Future Enhancements

Possible improvements to ConnectionUtils:
- A* pathfinding for obstacle avoidance
- Bezier curve support for curved connections
- Connection bundling for parallel paths
- Custom routing strategies (vertical-first, horizontal-first, etc.)
- Connection labels and annotations

All enhancements would automatically benefit both game and editor.

## Documentation

- **Full details**: See PHASE4_SUMMARY.md
- **Testing plan**: See PHASE4_TESTING.md
- **Code comparison**: See PHASE4_CODE_COMPARISON.md

## Support

If you encounter issues with ConnectionUtils:
1. Check browser console for errors
2. Review PHASE4_TESTING.md test plan
3. Compare with code examples in PHASE4_CODE_COMPARISON.md
4. Verify script load order in HTML files
