/**
 * Johnson Contract Editor - Connection Management System
 * Handles connection line drawing, routing, and validation between nodes
 */

class ConnectionManager {
    constructor(nodeManager, canvas) {
        this.nodeManager = nodeManager;
        this.canvas = canvas;
        this.connections = [];
        this.hoveredConnection = null;

        // Connection visual settings
        this.lineColor = "#FFFFFF";
        this.lineWidth = 2;
        this.arrowSize = 8;
        this.hoverLineWidth = 3;
        this.hoverColor = "#FFDF20";

        console.log('ConnectionManager initialized');
    }

    /**
     * Build all connections from node data
     */
    buildAllConnections() {
        this.connections = [];
        const nodes = this.nodeManager.getAllNodes();

        // Process each node's connections
        nodes.forEach(node => {
            if (node.connections && Array.isArray(node.connections)) {
                node.connections.forEach(targetId => {
                    const targetNode = this.nodeManager.getNodeById(targetId);
                    if (targetNode) {
                        this.connections.push({
                            fromNode: node,
                            toNode: targetNode,
                            path: this.calculateConnectionPath(node, targetNode)
                        });
                    } else {
                        console.warn(`Connection target not found: ${targetId} from ${node.id}`);
                    }
                });
            }
        });

        console.log(`Built ${this.connections.length} connections`);

        // Trigger canvas re-render to show connections
        this.canvas.render();
    }

    /**
     * Draw a connection between two nodes
     */
    drawConnection(fromNode, toNode, ctx, isHovered = false) {
        const path = this.calculateConnectionPath(fromNode, toNode);
        if (!path || path.length < 2) return;

        ctx.save();

        // Set line style
        ctx.strokeStyle = isHovered ? this.hoverColor : this.lineColor;
        ctx.lineWidth = isHovered ? this.hoverLineWidth : this.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw the connection path
        this.drawConnectionLine(path, ctx);

        // Draw arrow at the end
        this.drawConnectionArrow(path[path.length - 1], path[path.length - 2], ctx);

        ctx.restore();
    }

    /**
     * Calculate connection path between two nodes using shared ConnectionUtils
     */
    calculateConnectionPath(fromNode, toNode) {
        if (!fromNode || !toNode) return [];
        return ConnectionUtils.calculateConnectionPath(fromNode, toNode);
    }

    /**
     * Calculate straight path (direct line)
     */
    calculateStraightPath(start, end) {
        return [start, end];
    }

    /**
     * Draw connection line following the path
     */
    drawConnectionLine(path, ctx) {
        if (path.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);

        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }

        ctx.stroke();
    }

    /**
     * Draw arrow head at connection endpoint
     */
    drawConnectionArrow(endPoint, previousPoint, ctx) {
        if (!endPoint || !previousPoint) return;

        const dx = endPoint.x - previousPoint.x;
        const dy = endPoint.y - previousPoint.y;
        const angle = Math.atan2(dy, dx);

        // Calculate arrow points
        const arrowLength = this.arrowSize;
        const arrowAngle = Math.PI / 6; // 30 degrees

        const x1 = endPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = endPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = endPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = endPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(x1, y1);
        ctx.moveTo(endPoint.x, endPoint.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    /**
     * Render all connections on the canvas
     */
    renderAllConnections() {
        if (!this.canvas || !this.canvas.ctx) return;

        const ctx = this.canvas.ctx;
        ctx.save();

        // Don't apply transformations here - they're already applied by nodeManager
        // ctx.scale(this.canvas.zoom, this.canvas.zoom);
        // ctx.translate(this.canvas.panX / this.canvas.zoom, this.canvas.panY / this.canvas.zoom);

        // Draw all connections
        this.connections.forEach(connection => {
            const isHovered = this.hoveredConnection === connection;
            this.drawConnection(connection.fromNode, connection.toNode, ctx, isHovered);
        });

        ctx.restore();
    }

    /**
     * Validate all connections and remove invalid ones
     */
    validateConnections(nodes) {
        const validConnections = [];
        const nodeIds = new Set(nodes.map(node => node.id));

        this.connections.forEach(connection => {
            if (nodeIds.has(connection.fromNode.id) && nodeIds.has(connection.toNode.id)) {
                validConnections.push(connection);
            } else {
                console.log('Removing invalid connection:', connection.fromNode.id, '->', connection.toNode.id);
            }
        });

        this.connections = validConnections;
        return this.connections.length;
    }

    /**
     * Remove invalid connections from node data
     */
    removeInvalidConnections() {
        const nodes = this.nodeManager.getAllNodes();
        const nodeIds = new Set(nodes.map(node => node.id));

        nodes.forEach(node => {
            if (node.connections) {
                const validConnections = node.connections.filter(targetId => {
                    const isValid = nodeIds.has(targetId) && targetId !== node.id;
                    if (!isValid) {
                        console.log(`Removing invalid connection from ${node.id} to ${targetId}`);
                    }
                    return isValid;
                });
                node.connections = validConnections;
            }
        });

        // Rebuild connections after cleanup
        this.buildAllConnections();
    }

    /**
     * Handle mouse move for connection hover effects
     */
    handleMouseMove(x, y) {
        let foundHover = null;

        // Check if mouse is over any connection line
        this.connections.forEach(connection => {
            if (this.isPointNearConnection(x, y, connection)) {
                foundHover = connection;
            }
        });

        // Update hover state if changed
        if (this.hoveredConnection !== foundHover) {
            this.hoveredConnection = foundHover;
            this.canvas.render(); // Re-render to show/hide hover effect
        }
    }

    /**
     * Check if a point is near a connection line
     */
    isPointNearConnection(x, y, connection) {
        const threshold = 5; // Pixels
        const path = connection.path;

        if (!path || path.length < 2) return false;

        // Check distance to each line segment in the path
        for (let i = 0; i < path.length - 1; i++) {
            const distance = this.distanceToLineSegment(
                x, y,
                path[i].x, path[i].y,
                path[i + 1].x, path[i + 1].y
            );

            if (distance <= threshold) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate distance from point to line segment
     */
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            // Line segment is a point
            return Math.sqrt(A * A + B * B);
        }

        let param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get all current connections
     */
    getAllConnections() {
        return [...this.connections];
    }

    /**
     * Clear all connections
     */
    clearConnections() {
        this.connections = [];
        this.hoveredConnection = null;
        this.canvas.render();
    }

    /**
     * Update connections when nodes move
     */
    updateConnectionPaths() {
        this.connections.forEach(connection => {
            connection.path = this.calculateConnectionPath(connection.fromNode, connection.toNode);
        });
    }

    /**
     * Export connection data for debugging
     */
    exportConnectionData() {
        return this.connections.map(conn => ({
            from: conn.fromNode.id,
            to: conn.toNode.id,
            pathLength: conn.path.length
        }));
    }
}

// Export for use in other modules
window.ConnectionManager = ConnectionManager;