/**
 * VERSION MANAGEMENT
 * 
 * Centralized version control for the application.
 * Follows Semantic Versioning (semver.org):
 * 
 * MAJOR.MINOR.PATCH
 * 
 * - MAJOR: Incompatible API changes, major features
 * - MINOR: New functionality, backwards compatible
 * - PATCH: Bug fixes, small improvements
 * 
 * Usage:
 *   import { version } from './version.js';
 *   console.log(`App version: ${version.full}`);
 */

export const version = {
    major: 0,
    minor: 2,
    patch: 0,
    
    get full() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    
    get short() {
        return `v${this.full}`;
    },
    
    /**
     * Create version badge HTML
     * @param {string} [customTitle] - Optional custom tooltip
     * @returns {string} HTML string for version badge
     */
    badge(customTitle = null) {
        const title = customTitle || `Version ${this.full}`;
        return `
            <div class="fixed bottom-2 left-2 badge badge-sm badge-neutral opacity-50 hover:opacity-100 transition-opacity cursor-help" title="${title}">
                ${this.short}
            </div>
        `.trim();
    }
};

// Log version on load
console.log(`[VERSION] Continuity Manager ${version.short}`);
