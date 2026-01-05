// =================================================================
// SCENE SELECTOR MOBILE - Bottom sheet scene picker for mobile
// =================================================================

/**
 * Mobile scene selector component
 * Shows scrollable list of scenes sorted by shooting date
 * Replaces calendar view on mobile devices
 */
export class SceneSelectorMobile {
    constructor(container, options = {}) {
        this.container = container;
        this.onSceneSelect = options.onSceneSelect || (() => {});
        this.actorId = null;
        this.scenes = [];
        this.selectedSceneId = null;
        
        this.render();
    }
    
    /**
     * Update scenes list for current actor
     */
    async updateScenes(actorId, projectId) {
        this.actorId = actorId;
        
        if (!actorId || !projectId) {
            this.scenes = [];
            this.updateButton();
            return;
        }
        
        try {
            // Dynamic import
            const { SceneActorService } = await import('../services/sceneActorService.js');
            
            // Get all scene_actors for this actor
            const sceneActors = await SceneActorService.getByActor(actorId);
            
            console.log('Scene actors loaded:', sceneActors.length);
            
            // Extract scenes and add shooting dates
            this.scenes = sceneActors
                .map(sa => {
                    const scene = sa.scene;
                    if (!scene) return null;
                    
                    // Get shooting dates from scene.shoot_dates array
                    const shootDates = scene.shoot_dates || [];
                    
                    return {
                        id: scene.id,
                        number: scene.scene_number || '',
                        title: scene.title || 'Untitled Scene',
                        shootDates: shootDates,
                        firstShootDate: shootDates.length > 0 ? shootDates[0] : null
                    };
                })
                .filter(s => s !== null)
                .sort((a, b) => {
                    // Sort by first shooting date (earliest first)
                    if (!a.firstShootDate) return 1;
                    if (!b.firstShootDate) return -1;
                    return new Date(a.firstShootDate) - new Date(b.firstShootDate);
                });
            
            console.log('Scenes loaded for mobile selector:', this.scenes.length);
            
            // Auto-select next upcoming scene
            this.selectedSceneId = this.findUpcomingScene();
            
            this.updateButton();
            
            // Trigger selection callback if scene was auto-selected
            if (this.selectedSceneId) {
                this.onSceneSelect(this.selectedSceneId);
            }
            
        } catch (error) {
            console.error('Error loading scenes for actor:', error);
            this.scenes = [];
            this.updateButton();
        }
    }
    
    /**
     * Find the next upcoming scene (today or future)
     */
    findUpcomingScene() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find first scene that includes today or is in the future
        for (const scene of this.scenes) {
            if (!scene.firstShootDate) continue;
            
            const firstDate = new Date(scene.firstShootDate);
            firstDate.setHours(0, 0, 0, 0);
            
            // Check if any shoot date is today or in future
            for (const dateStr of scene.shootDates) {
                const shootDate = new Date(dateStr);
                shootDate.setHours(0, 0, 0, 0);
                
                if (shootDate >= today) {
                    return scene.id;
                }
            }
        }
        
        // If no upcoming scenes, return first scene
        return this.scenes.length > 0 ? this.scenes[0].id : null;
    }
    
    /**
     * Format shooting dates for display
     */
    formatShootDates(shootDates) {
        if (!shootDates || shootDates.length === 0) {
            return 'No date';
        }
        
        // Format dates as "Dec 24" or "Dec 24-26" for ranges
        const formatted = shootDates.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        if (formatted.length === 1) {
            return formatted[0];
        } else if (formatted.length === 2) {
            return `${formatted[0]}, ${formatted[1]}`;
        } else {
            return `${formatted[0]}-${formatted[formatted.length - 1]}`;
        }
    }
    
    /**
     * Update button text with selected scene
     */
    updateButton() {
        const btn = this.container.querySelector('.scene-selector-btn');
        if (!btn) return;
        
        const content = btn.querySelector('.scene-selector-content');
        const iconEl = btn.querySelector('.scene-selector-icon');
        
        if (this.scenes.length === 0) {
            // No scenes - show plus icon
            content.innerHTML = `
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            `;
            btn.title = 'Add scene';
            btn.disabled = false;
            iconEl.style.transform = 'rotate(0deg)';
            return;
        }
        
        const selected = this.scenes.find(s => s.id === this.selectedSceneId);
        if (selected) {
            // Show scene number
            content.textContent = selected.number;
            btn.title = `Scene ${selected.number}`;
        } else {
            // Fallback to camera icon
            content.innerHTML = `
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            `;
            btn.title = 'Select scene';
        }
        
        btn.disabled = false;
    }
    
    /**
     * Toggle dropdown open/close
     */
    toggleDropdown() {
        console.log('Toggle dropdown - scenes count:', this.scenes.length);
        
        // If no scenes, open add scene dialog instead
        if (this.scenes.length === 0) {
            console.log('No scenes, opening add scene dialog');
            this.openAddSceneDialog();
            return;
        }
        
        const dropdown = this.container.querySelector('.scene-selector-dropdown');
        const btn = this.container.querySelector('.scene-selector-btn');
        const iconEl = btn.querySelector('.scene-selector-icon');
        
        if (!dropdown) return;
        
        const isOpen = !dropdown.classList.contains('hidden');
        
        if (isOpen) {
            dropdown.classList.add('hidden');
            iconEl.style.transform = 'rotate(0deg)';
        } else {
            dropdown.classList.remove('hidden');
            iconEl.style.transform = 'rotate(180deg)';
            this.renderScenesList();
        }
    }
    
    /**
     * Open add scene dialog
     */
    openAddSceneDialog() {
        // Navigate to timeline or calendar page to add scene
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');
        if (projectId) {
            window.location.href = `timeline.html?project=${projectId}`;
        }
    }
    
    /**
     * Render scenes list in dropdown
     */
    renderScenesList() {
        const list = this.container.querySelector('.scenes-list');
        if (!list) return;
        
        if (this.scenes.length === 0) {
            list.innerHTML = `
                <div class="p-4 text-center text-sm text-base-content/60">
                    No scenes for this actor
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.scenes.map(scene => {
            const isSelected = scene.id === this.selectedSceneId;
            const shootDatesText = this.formatShootDates(scene.shootDates);
            
            return `
                <button 
                    class="scene-list-item w-full flex items-center justify-between px-4 py-3 hover:bg-base-200 transition-colors ${isSelected ? 'bg-primary/10' : ''}"
                    data-scene-id="${scene.id}"
                >
                    <div class="flex items-center gap-3">
                        <div class="text-xs font-medium text-base-content/60 min-w-[60px]">
                            ${shootDatesText}
                        </div>
                        <div class="text-sm font-medium">
                            Scene ${scene.number}
                        </div>
                    </div>
                    ${isSelected ? `
                        <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ` : ''}
                </button>
            `;
        }).join('');
        
        // Add click handlers
        list.querySelectorAll('.scene-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const sceneId = parseInt(item.dataset.sceneId);
                this.selectScene(sceneId);
            });
        });
    }
    
    /**
     * Select a scene
     */
    selectScene(sceneId) {
        this.selectedSceneId = sceneId;
        this.updateButton();
        this.toggleDropdown(); // Close dropdown
        this.onSceneSelect(sceneId);
    }
    
    /**
     * Initial render
     */
    render() {
        this.container.innerHTML = `
            <div class="relative">
                <!-- Primary Action Button with Scene Number or Plus Icon -->
                <button class="scene-selector-btn btn btn-primary btn-sm btn-circle" title="Select scene" aria-label="Select scene">
                    <span class="scene-selector-content font-semibold text-sm">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </span>
                    <svg class="scene-selector-icon w-3 h-3 transition-transform absolute -bottom-0.5 -right-0.5 bg-primary rounded-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="transform: rotate(0deg); display: none;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                <!-- Dropdown -->
                <div class="scene-selector-dropdown hidden absolute bottom-full right-0 mb-2 bg-base-100 rounded-lg shadow-2xl border border-base-300 min-w-[280px] max-h-[400px] overflow-hidden z-50">
                    <div class="p-2 border-b border-base-300 bg-base-200">
                        <div class="text-xs font-semibold text-base-content/70 px-2">Select Scene</div>
                    </div>
                    <div class="scenes-list overflow-y-auto max-h-[350px]">
                        <!-- Scenes will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler for button
        const btn = this.container.querySelector('.scene-selector-btn');
        btn.addEventListener('click', () => this.toggleDropdown());
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                const dropdown = this.container.querySelector('.scene-selector-dropdown');
                const iconEl = btn.querySelector('.scene-selector-icon');
                if (dropdown && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                    iconEl.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
    
    /**
     * Destroy component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}
