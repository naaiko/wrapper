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
 *   
 * Release Notes:
 *   See CHANGELOG.md and releases.json for release history
 */

export const version = {
    major: 0,
    minor: 2,
    patch: 1,
    
    get full() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    
    get short() {
        return `v${this.full}`;
    },
    
    /**
     * Create interactive version badge HTML with release notes link
     * @param {string} [customTitle] - Optional custom tooltip
     * @returns {string} HTML string for version badge
     */
    badge(customTitle = null) {
        const title = customTitle || `Version ${this.full} - Click for release notes`;
        return `
            <button 
                id="versionBadge" 
                class="fixed bottom-2 left-2 badge badge-sm badge-neutral opacity-50 hover:opacity-100 transition-all cursor-pointer hover:badge-primary" 
                title="${title}"
                onclick="window.showReleaseNotes && window.showReleaseNotes()"
            >
                ${this.short}
            </button>
        `.trim();
    },
    
    /**
     * Setup release notes functionality
     * Call this after importing ReleaseNotes utility
     */
    async setupReleaseNotes() {
        try {
            const { default: ReleaseNotes } = await import('./utils/releaseNotes.js');
            const { default: ReleaseBrowser } = await import('./utils/releaseBrowser.js');
            
            // Make showReleaseNotes globally available (current version)
            window.showReleaseNotes = async () => {
                await ReleaseNotes.showModal();
            };
            
            // Make browsReleases globally available (all versions)
            window.browseReleases = async () => {
                const browser = new ReleaseBrowser();
                await browser.show();
            };
            
            // Check if current version has release notes
            const hasNotes = await ReleaseNotes.hasReleaseNotes(this.full);
            if (!hasNotes) {
                console.warn(`[VERSION] No release notes found for v${this.full}`);
            }
            
        } catch (error) {
            console.warn('[VERSION] Release notes not available:', error.message);
        }
    }
};

// Log version on load
console.log(`[VERSION] Continuity Manager ${version.short}`);

// Setup release notes if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        version.setupReleaseNotes();
    });
} else {
    version.setupReleaseNotes();
}
