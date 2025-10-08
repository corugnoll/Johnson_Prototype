/**
 * ConnectionUtils - Shared connection path calculation utilities
 *
 * Used by both the game renderer (visualPrototype.js) and the editor (connectionManager.js)
 * to ensure connections render identically in both contexts.
 *
 * This utility provides:
 * - Best anchor point calculation on node edges
 * - Right-angle (90-degree) path routing between nodes
 * - Arrow head point calculation for connection endpoints
 */
class ConnectionUtils {
    /**
     * Find best anchor points on node edges for connection
     *
     * Determines optimal connection points based on relative node positions:
     * - Horizontal connections for nodes primarily side-by-side
     * - Vertical connections for nodes primarily above/below
     *
     * @param {Object} fromNode - Source node with position {x, y, width, height}
     * @param {Object} toNode - Target node with position {x, y, width, height}
     * @returns {Object} {start: {x, y}, end: {x, y}} Anchor points on node edges
     */
    static findBestAnchorPoints(fromNode, toNode) {
        // Get center points of both nodes
        const center1 = {
            x: fromNode.x + fromNode.width / 2,
            y: fromNode.y + fromNode.height / 2
        };
        const center2 = {
            x: toNode.x + toNode.width / 2,
            y: toNode.y + toNode.height / 2
        };

        // Calculate direction from node1 to node2
        const dx = center2.x - center1.x;
        const dy = center2.y - center1.y;

        // Determine best anchor points based on relative positions
        let startAnchor, endAnchor;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection preferred
            if (dx > 0) {
                // Node2 is to the right of node1
                startAnchor = { x: fromNode.x + fromNode.width, y: center1.y };
                endAnchor = { x: toNode.x, y: center2.y };
            } else {
                // Node2 is to the left of node1
                startAnchor = { x: fromNode.x, y: center1.y };
                endAnchor = { x: toNode.x + toNode.width, y: center2.y };
            }
        } else {
            // Vertical connection preferred
            if (dy > 0) {
                // Node2 is below node1
                startAnchor = { x: center1.x, y: fromNode.y + fromNode.height };
                endAnchor = { x: center2.x, y: toNode.y };
            } else {
                // Node2 is above node1
                startAnchor = { x: center1.x, y: fromNode.y };
                endAnchor = { x: center2.x, y: toNode.y + toNode.height };
            }
        }

        return {
            start: startAnchor,
            end: endAnchor
        };
    }

    /**
     * Generate right-angle path between two points
     *
     * Creates L-shaped or Z-shaped routing with 90-degree angles.
     * Uses a midpoint-based approach for clean perpendicular entry/exit.
     * Handles special cases where points are already aligned (straight lines).
     *
     * @param {Object} startPoint - Starting anchor point {x, y}
     * @param {Object} endPoint - Ending anchor point {x, y}
     * @returns {Array<Object>} Array of points forming the path [{x, y}, ...]
     */
    static generateRightAnglePath(startPoint, endPoint) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;

        // If already aligned vertically (within 5px tolerance), use straight vertical line
        if (Math.abs(dx) < 5) {
            return [startPoint, { x: startPoint.x, y: endPoint.y }];
        }

        // If already aligned horizontally (within 5px tolerance), use straight horizontal line
        if (Math.abs(dy) < 5) {
            return [startPoint, { x: endPoint.x, y: startPoint.y }];
        }

        // Use L-shaped routing with midpoint for perpendicular routing
        // This creates a clean 90-degree path:
        // 1. Start point
        // 2. Horizontal midpoint (halfway between start.x and end.x, at start.y)
        // 3. Vertical turn point (at midpoint.x, moving to end.y)
        // 4. End point
        const midPoint = {
            x: startPoint.x + dx * 0.5,
            y: startPoint.y
        };

        return [
            startPoint,
            midPoint,
            { x: midPoint.x, y: endPoint.y },
            endPoint
        ];
    }

    /**
     * Calculate complete connection path from source to target node
     *
     * Convenience method that combines anchor point calculation and path generation.
     *
     * @param {Object} fromNode - Source node position data {x, y, width, height}
     * @param {Object} toNode - Target node position data {x, y, width, height}
     * @returns {Array<Object>} Array of points forming complete path
     */
    static calculateConnectionPath(fromNode, toNode) {
        const anchorPoints = ConnectionUtils.findBestAnchorPoints(fromNode, toNode);
        return ConnectionUtils.generateRightAnglePath(anchorPoints.start, anchorPoints.end);
    }

    /**
     * Calculate arrow head points for drawing
     *
     * Computes the two wing points of an arrow head based on the direction
     * from the previous point to the end point.
     *
     * @param {Object} endPoint - End point of connection {x, y}
     * @param {Object} previousPoint - Previous point for direction {x, y}
     * @param {number} arrowLength - Length of arrow head (default 8)
     * @param {number} arrowAngle - Angle of arrow head in radians (default Math.PI/6 = 30 degrees)
     * @returns {Object} {point1: {x, y}, point2: {x, y}} Two wing points of arrow
     */
    static calculateArrowHead(endPoint, previousPoint, arrowLength = 8, arrowAngle = Math.PI / 6) {
        if (!endPoint || !previousPoint) {
            return null;
        }

        // Calculate direction angle from previous point to end point
        const dx = endPoint.x - previousPoint.x;
        const dy = endPoint.y - previousPoint.y;
        const angle = Math.atan2(dy, dx);

        // Calculate two wing points of arrow head
        // Point 1: angle - arrowAngle (upper wing)
        const x1 = endPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = endPoint.y - arrowLength * Math.sin(angle - arrowAngle);

        // Point 2: angle + arrowAngle (lower wing)
        const x2 = endPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = endPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        return {
            point1: { x: x1, y: y1 },
            point2: { x: x2, y: y2 }
        };
    }
}
