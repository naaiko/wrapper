// =================================================================
// RELEASE NOTES UTILITY
// =================================================================

/**
 * Release Notes Management System
 * 
 * This utility helps manage release notes programmatically.
 * It integrates with version.js to ensure every version bump
 * is accompanied by proper documentation.
 * 
 * Usage:
 *   import ReleaseNotes from './utils/releaseNotes.js';
 *   const notes = await ReleaseNotes.getLatest();
 *   const changelog = await ReleaseNotes.getChangelog();
 */

class ReleaseNotes {
    static getBaseUrl() {
        // If the site is served from /frontend/ or any subfolder, walk up to the repo root
        const { origin, pathname } = window.location;
        const idx = pathname.indexOf('/frontend/');
        if (idx !== -1) {
            return origin + pathname.substring(0, idx + 1); // include trailing slash
        }
        // Fallback to origin root
        return origin + '/';
    }

    static get RELEASES_URL() {
        return `${this.getBaseUrl()}releases.json`;
    }

    static get CHANGELOG_URL() {
        return `${this.getBaseUrl()}CHANGELOG.md`;
    }
    
    /**
     * Fetch all releases
     */
    static async getReleases() {
        try {
            console.log('[RELEASE NOTES] Fetching releases from', this.RELEASES_URL);
            const response = await fetch(this.RELEASES_URL);
            if (!response.ok) throw new Error('Failed to fetch releases');
            const data = await response.json();
            console.log('[RELEASE NOTES] Loaded releases count:', (data.releases || []).length);
            return data.releases || [];
        } catch (error) {
            console.error('[RELEASE NOTES] Error fetching releases:', error);
            return [];
        }
    }
    
    /**
     * Get the latest release
     */
    static async getLatest() {
        const releases = await this.getReleases();
        return releases[0] || null;
    }
    
    /**
     * Get a specific release by version
     */
    static async getByVersion(version) {
        const releases = await this.getReleases();
        return releases.find(r => r.version === version) || null;
    }
    
    /**
     * Get unreleased changes
     */
    static async getUnreleased() {
        try {
            const response = await fetch(this.RELEASES_URL);
            if (!response.ok) throw new Error('Failed to fetch releases');
            const data = await response.json();
            return data.unreleased || {};
        } catch (error) {
            console.error('[RELEASE NOTES] Error fetching unreleased:', error);
            return {};
        }
    }
    
    /**
     * Fetch raw changelog markdown
     */
    static async getChangelog() {
        try {
            console.log('[RELEASE NOTES] Fetching changelog from', this.CHANGELOG_URL);
            const response = await fetch(this.CHANGELOG_URL);
            if (!response.ok) throw new Error('Failed to fetch changelog');
            return await response.text();
        } catch (error) {
            console.error('[RELEASE NOTES] Error fetching changelog:', error);
            return '';
        }
    }
    
    /**
     * Render release notes as HTML
     */
    static renderRelease(release) {
        if (!release) return '<div class="text-base-content/50">No release notes available</div>';
        
        let html = `
            <div class="release-notes">
                <div class="flex items-center gap-3 mb-4">
                    <span class="badge badge-primary badge-lg">v${release.version}</span>
                    <span class="text-base-content/70">${release.date}</span>
                    ${release.type ? `<span class="badge badge-outline">${release.type}</span>` : ''}
                </div>
                <h2 class="text-2xl font-bold mb-4">${release.name || `Version ${release.version}`}</h2>
        `;
        
        // Features
        if (release.features && release.features.length > 0) {
            html += `
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Added
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${release.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Bug fixes
        if (release.bugfixes && release.bugfixes.length > 0) {
            html += `
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Fixed
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${release.bugfixes.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Breaking changes
        if (release.breaking && release.breaking.length > 0) {
            html += `
                <div class="mb-4">
                    <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Breaking Changes
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${release.breaking.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Technical
        if (release.technical && release.technical.length > 0) {
            html += `
                <details class="mb-4">
                    <summary class="cursor-pointer text-lg font-semibold mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                        </svg>
                        Technical Details
                    </summary>
                    <ul class="list-disc list-inside space-y-1 text-sm ml-7">
                        ${release.technical.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </details>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * Show release notes in a modal
     */
    static async showModal(version = null) {
        console.log('[RELEASE NOTES] Opening modal, version param:', version);
        const release = version ? await this.getByVersion(version) : await this.getLatest();
        
        if (!release) {
            console.warn('[RELEASE NOTES] No release found for version:', version);
            this.showError('Geen release notes gevonden');
            return;
        }
        
        // Create modal
        const modal = document.createElement('dialog');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-box max-w-3xl">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                ${this.renderRelease(release)}
                <div class="modal-action">
                    <button class="btn btn-outline" onclick="window.browseReleases && window.browseReleases(); this.closest('dialog').close()">
                        Browse All Releases
                    </button>
                    <form method="dialog">
                        <button class="btn">Close</button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;
        
        document.body.appendChild(modal);
        modal.showModal();
        
        // Remove modal on close
        modal.addEventListener('close', () => {
            modal.remove();
        });
    }
    
    /**
     * Check if version has release notes
     */
    static async hasReleaseNotes(version) {
        const release = await this.getByVersion(version);
        return release !== null;
    }

    static showError(message) {
        const existing = document.getElementById('releaseNotesErrorToast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'releaseNotesErrorToast';
        toast.className = 'toast toast-end z-[200]';
        toast.innerHTML = `
            <div class="alert alert-error shadow-lg">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

export default ReleaseNotes;
