// =================================================================
// SVG UTILITIES - Helper functions for SVG manipulation
// =================================================================

/**
 * CRITICAL: SVG elements MUST be created with createElementNS
 * 
 * Using innerHTML or createElement on SVG breaks the namespace,
 * resulting in elements with width: 0, height: 0 that don't render.
 * 
 * ALWAYS use:
 *   document.createElementNS('http://www.w3.org/2000/svg', 'g')
 *   cloneNode(true) to copy existing SVG elements
 * 
 * NEVER use:
 *   element.innerHTML = '<path .../>'  // Breaks namespace!
 *   document.createElement('g')        // Wrong namespace!
 */

export class SVGProcessor {
    /**
     * Load and parse SVG file
     * @param {string} url - Path to SVG file
     * @returns {Promise<SVGElement>} - Parsed SVG element
     */
    static async loadSVG(url) {
        try {
            const response = await fetch(url);
            const svgText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            return doc.querySelector('svg');
        } catch (error) {
            console.error('Failed to load SVG:', url, error);
            throw error;
        }
    }

    /**
     * Remove inline style attributes that override CSS
     * Use this before cloning SVG elements to allow CSS styling
     * 
     * @param {Element} element - SVG element to clean
     */
    static removeInlineStyles(element) {
        const styleAttrs = ['fill', 'stroke', 'stroke-width', 'stroke-miterlimit', 'class'];
        styleAttrs.forEach(attr => element.removeAttribute(attr));
        
        // Recursively clean children
        Array.from(element.children).forEach(child => {
            this.removeInlineStyles(child);
        });
    }
}
