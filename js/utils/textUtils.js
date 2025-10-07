/**
 * Text Utilities for Johnson Prototype
 *
 * Shared text processing utilities for both game and editor.
 * Provides consistent text wrapping, line breaking, and node dimension calculation.
 *
 * Created: 2025-10-07
 * Purpose: Eliminate duplicate code between visualPrototype.js and nodeManager.js
 */

class TextUtils {
    /**
     * Process text with linebreak support and word wrapping
     *
     * Handles explicit linebreaks (\n) and wraps long lines to fit within maxWidth.
     * Preserves empty lines for formatting.
     *
     * @param {string} text - Text to process
     * @param {number} maxWidth - Maximum width in pixels
     * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
     * @param {number} fontSize - Font size for measurement
     * @returns {Array<string>} Array of text lines
     */
    static processTextWithLinebreaks(text, maxWidth, ctx, fontSize) {
        if (!text) return [''];

        // Set font on context for accurate measurement
        ctx.font = `${fontSize}px Arial`;

        // Split by explicit linebreaks first
        const paragraphs = text.split(/\r?\n/);
        const result = [];

        paragraphs.forEach(paragraph => {
            if (paragraph.trim() === '') {
                result.push(''); // Preserve empty lines
            } else {
                // Word wrap each paragraph
                const wrappedLines = TextUtils.wrapText(ctx, paragraph, maxWidth);
                result.push(...wrappedLines);
            }
        });

        return result.length > 0 ? result : [''];
    }

    /**
     * Wrap text to fit within specified width
     *
     * Splits text into words and combines them into lines that fit within maxWidth.
     * If a single word exceeds maxWidth, it will be placed on its own line.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
     * @param {string} text - Text to wrap
     * @param {number} maxWidth - Maximum width in pixels
     * @returns {Array<string>} Array of wrapped text lines
     */
    static wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text];
    }

    /**
     * Calculate node dimensions based on text content
     *
     * Determines optimal width and height for a node based on its description
     * and effect description text. Gate nodes only use effectDescription.
     *
     * Uses editor-compatible constants:
     * - padding: 6px
     * - maxWidth: 200px
     * - lineHeight: 16px
     * - separatorHeight: 4px (between description and effect)
     * - minWidth: 80px
     * - minHeight: 60px
     *
     * @param {Object} node - Node object with description, effectDescription, and type
     * @param {number} minWidth - Minimum node width (default: 80)
     * @param {number} minHeight - Minimum node height (default: 60)
     * @returns {Object} Object with width and height properties
     */
    static calculateNodeDimensions(node, minWidth = 80, minHeight = 60) {
        // Constants matching editor values
        const padding = 6;
        const maxWidth = 200;
        const lineHeight = 16;
        const separatorHeight = 4;

        // Create temporary canvas for clean measurements
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // Calculate available width for text (accounting for padding)
        const availableWidth = maxWidth - padding * 2;

        // Handle Gate nodes (only effectDescription)
        if (node.type === 'Gate') {
            ctx.font = '12px Arial';
            const effectDescription = node.effectDescription || node.effectDesc || '';
            const effectLines = TextUtils.processTextWithLinebreaks(effectDescription, availableWidth, ctx, 12);
            const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

            const totalTextHeight = effectLines.length * lineHeight;

            const finalWidth = Math.max(minWidth, effectWidth + padding * 2);
            const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2);

            return { width: finalWidth, height: finalHeight };
        }

        // Handle regular nodes (description + effectDescription)

        // Process description text
        ctx.font = 'bold 14px Arial';
        const description = node.description || '';
        const descLines = TextUtils.processTextWithLinebreaks(description, availableWidth, ctx, 14);
        const descWidth = Math.max(...descLines.map(line => ctx.measureText(line).width));

        // Process effect description text
        ctx.font = '12px Arial';
        const effectDescription = node.effectDescription || node.effectDesc || '';
        const effectLines = TextUtils.processTextWithLinebreaks(effectDescription, availableWidth, ctx, 12);
        const effectWidth = Math.max(...effectLines.map(line => ctx.measureText(line).width));

        // Calculate dimensions with precise height calculation
        const maxTextWidth = Math.max(descWidth, effectWidth);
        const hasEffect = effectLines.length > 0 && effectLines[0].trim() !== '';

        // Calculate text height
        const totalTextHeight = (descLines.length * lineHeight) +
                               (hasEffect ? separatorHeight + (effectLines.length * lineHeight) : 0);

        // Calculate final dimensions
        const finalWidth = Math.max(minWidth, maxTextWidth + padding * 2);
        const finalHeight = Math.max(minHeight, totalTextHeight + padding * 2);

        return { width: finalWidth, height: finalHeight };
    }
}

// Export for use in both browser and potential future module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextUtils;
}
