// =================================================================
// RELEASE BROWSER - Browse and Search All Releases
// =================================================================

import ReleaseNotes from './releaseNotes.js';

class ReleaseBrowser {
    constructor() {
        this.releases = [];
        this.filteredReleases = [];
        this.searchTerm = '';
        this.currentReleaseIndex = 0;
    }
    
    /**
     * Show the release browser modal
     */
    async show() {
        // Load all releases
        this.releases = await ReleaseNotes.getReleases();
        this.filteredReleases = [...this.releases];
        this.currentReleaseIndex = 0;
        
        if (this.releases.length === 0) {
            console.warn('[RELEASE BROWSER] No releases found');
            return;
        }
        
        // Create modal
        const modal = this.createModal();
        document.body.appendChild(modal);
        modal.showModal();
        
        // Setup event listeners
        this.setupEventListeners(modal);
        
        // Render first release
        this.renderCurrentRelease(modal);
        
        // Focus search input
        setTimeout(() => {
            modal.querySelector('#releaseBrowserSearch')?.focus();
        }, 100);
    }
    
    createModal() {
        const modal = document.createElement('dialog');
        modal.id = 'releaseBrowserModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-box max-w-4xl h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold">Release History</h2>
                    <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost">✕</button>
                    </form>
                </div>
                
                <!-- Search Bar -->
                <div class="form-control mb-4">
                    <div class="input-group">
                        <input 
                            type="text" 
                            id="releaseBrowserSearch" 
                            placeholder="Search releases, features, bug fixes..." 
                            class="input input-bordered flex-1"
                        />
                        <button id="clearSearch" class="btn btn-square" title="Clear search">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <label class="label">
                        <span id="searchResultCount" class="label-text-alt"></span>
                    </label>
                </div>
                
                <!-- Release Navigation -->
                <div class="flex items-center justify-between mb-4">
                    <button id="prevRelease" class="btn btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Newer
                    </button>
                    <div id="releaseCounter" class="badge badge-neutral"></div>
                    <button id="nextRelease" class="btn btn-sm btn-ghost">
                        Older
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                
                <!-- Release List (when searching) -->
                <div id="releaseList" class="hidden mb-4 flex-1 overflow-y-auto">
                    <div class="space-y-2">
                        <!-- Search results will be rendered here -->
                    </div>
                </div>
                
                <!-- Release Details -->
                <div id="releaseDetails" class="flex-1 overflow-y-auto">
                    <!-- Current release will be rendered here -->
                </div>
                
                <!-- Quick Stats -->
                <div class="stats stats-vertical sm:stats-horizontal shadow mt-4">
                    <div class="stat">
                        <div class="stat-title">Total Releases</div>
                        <div class="stat-value text-primary" id="totalReleases">0</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Latest Version</div>
                        <div class="stat-value text-secondary" id="latestVersion">-</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Total Features</div>
                        <div class="stat-value text-accent" id="totalFeatures">0</div>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;
        
        return modal;
    }
    
    setupEventListeners(modal) {
        const searchInput = modal.querySelector('#releaseBrowserSearch');
        const clearBtn = modal.querySelector('#clearSearch');
        const prevBtn = modal.querySelector('#prevRelease');
        const nextBtn = modal.querySelector('#nextRelease');
        const releaseList = modal.querySelector('#releaseList');
        
        // Search
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.handleSearch(modal);
        });
        
        // Clear search
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.searchTerm = '';
            this.handleSearch(modal);
            searchInput.focus();
        });
        
        // Navigation
        prevBtn.addEventListener('click', () => this.navigatePrev(modal));
        nextBtn.addEventListener('click', () => this.navigateNext(modal));
        
        // Keyboard shortcuts
        modal.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigatePrev(modal);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateNext(modal);
            } else if (e.key === '/') {
                e.preventDefault();
                searchInput.focus();
            }
        });
        
        // Cleanup on close
        modal.addEventListener('close', () => {
            modal.remove();
        });
        
        // Update stats
        this.updateStats(modal);
    }
    
    handleSearch(modal) {
        if (!this.searchTerm) {
            // No search - show single release view
            this.filteredReleases = [...this.releases];
            modal.querySelector('#releaseList').classList.add('hidden');
            modal.querySelector('#releaseDetails').classList.remove('hidden');
            modal.querySelector('#prevRelease').classList.remove('hidden');
            modal.querySelector('#nextRelease').classList.remove('hidden');
            modal.querySelector('#releaseCounter').classList.remove('hidden');
            modal.querySelector('#searchResultCount').textContent = '';
            this.renderCurrentRelease(modal);
        } else {
            // Search active - show list view
            this.filteredReleases = this.searchReleases(this.searchTerm);
            modal.querySelector('#releaseList').classList.remove('hidden');
            modal.querySelector('#releaseDetails').classList.add('hidden');
            modal.querySelector('#prevRelease').classList.add('hidden');
            modal.querySelector('#nextRelease').classList.add('hidden');
            modal.querySelector('#releaseCounter').classList.add('hidden');
            
            const count = this.filteredReleases.length;
            modal.querySelector('#searchResultCount').textContent = 
                count === 0 ? 'No results found' : 
                count === 1 ? '1 result' : 
                `${count} results`;
            
            this.renderSearchResults(modal);
        }
    }
    
    searchReleases(term) {
        return this.releases.filter(release => {
            // Search in version
            if (release.version.includes(term)) return true;
            
            // Search in name
            if (release.name?.toLowerCase().includes(term)) return true;
            
            // Search in features
            if (release.features?.some(f => f.toLowerCase().includes(term))) return true;
            
            // Search in bug fixes
            if (release.bugfixes?.some(f => f.toLowerCase().includes(term))) return true;
            
            // Search in technical
            if (release.technical?.some(f => f.toLowerCase().includes(term))) return true;
            
            // Search in breaking changes
            if (release.breaking?.some(f => f.toLowerCase().includes(term))) return true;
            
            return false;
        });
    }
    
    renderSearchResults(modal) {
        const listContainer = modal.querySelector('#releaseList > div');
        
        if (this.filteredReleases.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-8 text-base-content/50">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p>No releases found matching "${this.searchTerm}"</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = this.filteredReleases.map(release => {
            const featureCount = release.features?.length || 0;
            const bugfixCount = release.bugfixes?.length || 0;
            const breakingCount = release.breaking?.length || 0;
            
            return `
                <div class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors" 
                     data-version="${release.version}"
                     onclick="window.viewRelease('${release.version}')">
                    <div class="card-body p-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="badge badge-primary">v${release.version}</span>
                                    <span class="text-sm text-base-content/70">${release.date}</span>
                                    ${release.type ? `<span class="badge badge-outline badge-sm">${release.type}</span>` : ''}
                                </div>
                                <h3 class="font-semibold">${release.name || `Version ${release.version}`}</h3>
                            </div>
                            <div class="flex gap-2">
                                ${featureCount > 0 ? `<span class="badge badge-success badge-sm">${featureCount} features</span>` : ''}
                                ${bugfixCount > 0 ? `<span class="badge badge-warning badge-sm">${bugfixCount} fixes</span>` : ''}
                                ${breakingCount > 0 ? `<span class="badge badge-error badge-sm">${breakingCount} breaking</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Make viewRelease globally available
        window.viewRelease = (version) => {
            const index = this.releases.findIndex(r => r.version === version);
            if (index !== -1) {
                this.currentReleaseIndex = index;
                modal.querySelector('#releaseBrowserSearch').value = '';
                this.searchTerm = '';
                this.handleSearch(modal);
            }
        };
    }
    
    navigatePrev(modal) {
        if (this.currentReleaseIndex > 0) {
            this.currentReleaseIndex--;
            this.renderCurrentRelease(modal);
        }
    }
    
    navigateNext(modal) {
        if (this.currentReleaseIndex < this.filteredReleases.length - 1) {
            this.currentReleaseIndex++;
            this.renderCurrentRelease(modal);
        }
    }
    
    renderCurrentRelease(modal) {
        const release = this.filteredReleases[this.currentReleaseIndex];
        const detailsContainer = modal.querySelector('#releaseDetails');
        const counter = modal.querySelector('#releaseCounter');
        const prevBtn = modal.querySelector('#prevRelease');
        const nextBtn = modal.querySelector('#nextRelease');
        
        // Update counter
        counter.textContent = `${this.currentReleaseIndex + 1} / ${this.filteredReleases.length}`;
        
        // Update buttons
        prevBtn.disabled = this.currentReleaseIndex === 0;
        nextBtn.disabled = this.currentReleaseIndex === this.filteredReleases.length - 1;
        
        // Render release
        detailsContainer.innerHTML = ReleaseNotes.renderRelease(release);
    }
    
    updateStats(modal) {
        const totalFeatures = this.releases.reduce((sum, r) => sum + (r.features?.length || 0), 0);
        
        modal.querySelector('#totalReleases').textContent = this.releases.length;
        modal.querySelector('#latestVersion').textContent = `v${this.releases[0]?.version || '-'}`;
        modal.querySelector('#totalFeatures').textContent = totalFeatures;
    }
}

export default ReleaseBrowser;
