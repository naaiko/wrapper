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
    patch: 5,
    hotfix: 2,
    
    get full() {
        return this.hotfix > 0 
            ? `${this.major}.${this.minor}.${this.patch}.${String(this.hotfix).padStart(2, '0')}`
            : `${this.major}.${this.minor}.${this.patch}`;
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
        const badgeClass = this.hotfix > 0 
            ? 'fixed bottom-2 left-2 badge badge-sm badge-error opacity-70 hover:opacity-100 transition-all cursor-pointer'
            : 'fixed bottom-2 left-2 badge badge-sm badge-neutral opacity-50 hover:opacity-100 transition-all cursor-pointer hover:badge-primary';
        return `
            <button 
                id="versionBadge" 
                class="${badgeClass}" 
                title="${title}"
                onclick="window.showReleaseNotes && window.showReleaseNotes('${this.full}')"
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
        // Always register click handlers immediately (lazy-load modules on demand).
        // This avoids “nothing happens” if preloading fails for any reason.
        window.showReleaseNotes = async (requestedVersion = null) => {
            const { default: ReleaseNotes } = await import('./utils/releaseNotes.js');
            await ReleaseNotes.showModal(requestedVersion);
        };

        window.browseReleases = async () => {
            const { default: ReleaseBrowser } = await import('./utils/releaseBrowser.js');
            const browser = new ReleaseBrowser();
            await browser.show();
        };

        // Best-effort preflight check (non-fatal)
        try {
            const { default: ReleaseNotes } = await import('./utils/releaseNotes.js');
            const hasNotes = await ReleaseNotes.hasReleaseNotes(this.full);
            if (!hasNotes) {
                console.warn(`[VERSION] No release notes found for v${this.full}`);
            }
        } catch (error) {
            console.warn('[VERSION] Release notes preflight failed:', error);
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
