// =================================================================
// ACTOR DETAIL VIEW - With Grid Navigation
// =================================================================

import { ActorService } from './services/actorService.js';
import { CustomDropdown } from './components/customDropdown.js';
import { SVGProcessor } from './utils/svgProcessor.js';
import { ActorEditScreen } from './screens/actorEditScreen.js';
import { LocationService } from './services/locationService.js';
import settingsService from './services/settingsService.js';
import { version } from './version.js';

// Note: Most logic extracted from actors-old.js
// This is a streamlined version with grid navigation support

class ActorDetailApp {
    constructor() {
        this.projectId = null;
        this.actorId = null;
        this.actors = []; // Filtered list from grid
        this.currentActor = null;
        this.currentIndex = 0;
        this.actorEditScreen = null;
        this.actorCalendar = null;
        
        // URL params from grid
        this.gridFilter = 'all';
        this.gridSort = 'name';
        this.gridSearch = '';
        
        // DOM elements
        this.backToGridBtn = document.getElementById('backToGridBtn');
        this.btnPrevActor = document.getElementById('btnPrevActor');
        this.btnNextActor = document.getElementById('btnNextActor');
        this.actorNameTitle = document.getElementById('actorNameTitle');
        this.actorDetailsPanel = document.getElementById('actorDetailsPanel');
        
        this.init();
    }
    
    async init() {
        // Get URL params
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project');
        this.actorId = urlParams.get('actor');
        this.gridFilter = urlParams.get('filter') || 'all';
        this.gridSort = urlParams.get('sort') || 'name';
        this.gridSearch = urlParams.get('search') || '';
        
        if (!this.projectId || !this.actorId) {
            window.location.href = `actors.html?project=${this.projectId}`;
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load silhouette SVG
        await this.loadSilhouetteSVG();
        
        // Load actors list (respecting grid filter)
        await this.loadActors();
        
        // Find current actor and show detail
        const actor = this.actors.find(a => a.id == this.actorId);
        if (actor) {
            this.currentActor = actor;
            this.currentIndex = this.actors.indexOf(actor);
            await this.showActorDetail(actor);
        } else {
            // Actor not found or filtered out - go back to grid
            this.backToGrid();
        }
        
        // Initialize edit screen
        await this.initializeActorEditScreen();
    }
    
    setupEventListeners() {
        // Back to grid
        this.backToGridBtn.addEventListener('click', () => {
            this.backToGrid();
        });
        
        // Prev/Next navigation
        this.btnPrevActor.addEventListener('click', () => this.navigatePrev());
        this.btnNextActor.addEventListener('click', () => this.navigateNext());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigatePrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateNext();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.backToGrid();
            }
        });
        
        // Touch swipe navigation for mobile
        this.setupTouchSwipe();
        
        // Layer mode toggle
        document.querySelectorAll('.layer-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchSilhouetteMode(mode);
                
                // Update active tab
                document.querySelectorAll('.layer-mode-btn').forEach(b => b.classList.remove('tab-active'));
                btn.classList.add('tab-active');
            });
        });
    }
    
    async loadActors() {
        try {
            // Load all actors
            let actors = await ActorService.getAll(this.projectId);
            
            // Apply same filter as grid
            if (this.gridFilter !== 'all') {
                actors = actors.filter(a => a.role?.toLowerCase() === this.gridFilter.toLowerCase());
            }
            
            // Apply search
            if (this.gridSearch) {
                actors = actors.filter(a => a.name.toLowerCase().includes(this.gridSearch.toLowerCase()));
            }
            
            // Apply same sort as grid
            actors.sort((a, b) => {
                switch (this.gridSort) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'scenes':
                        return (b.scene_count || 0) - (a.scene_count || 0);
                    case 'recent':
                        return new Date(b.created_at) - new Date(a.created_at);
                    default:
                        return 0;
                }
            });
            
            this.actors = actors;
            
            // Update prev/next button states
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error('[ACTOR DETAIL] Error loading actors:', error);
            this.actors = [];
        }
    }
    
    updateNavigationButtons() {
        // Disable prev if at start
        this.btnPrevActor.disabled = this.currentIndex <= 0;
        this.btnPrevActor.classList.toggle('btn-disabled', this.currentIndex <= 0);
        
        // Disable next if at end
        this.btnNextActor.disabled = this.currentIndex >= this.actors.length - 1;
        this.btnNextActor.classList.toggle('btn-disabled', this.currentIndex >= this.actors.length - 1);
    }
    
    navigatePrev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.navigateToActor(this.actors[this.currentIndex].id);
        }
    }
    
    navigateNext() {
        if (this.currentIndex < this.actors.length - 1) {
            this.currentIndex++;
            this.navigateToActor(this.actors[this.currentIndex].id);
        }
    }
    
    navigateToActor(actorId) {
        // Update URL with new actor ID
        const params = new URLSearchParams({
            project: this.projectId,
            actor: actorId,
            filter: this.gridFilter,
            sort: this.gridSort,
            search: this.gridSearch
        });
        
        window.location.href = `actors-detail.html?${params.toString()}`;
    }
    
    backToGrid() {
        const params = new URLSearchParams({
            project: this.projectId,
            filter: this.gridFilter,
            sort: this.gridSort,
            search: this.gridSearch
        });
        
        window.location.href = `actors.html?${params.toString()}`;
    }
    
    async showActorDetail(actor) {
        // Update title
        this.actorNameTitle.textContent = actor.name;
        
        // Render actor details panel (left column)
        this.renderActorDetails(actor);
        
        // Update silhouette zones (middle column)
        await this.updateSilhouetteZones(actor);
        
        // Load calendar (right column)
        await this.loadActorCalendar(actor);
        
        // Update navigation
        this.updateNavigationButtons();
    }
    
    renderActorDetails(actor) {
        const panel = this.actorDetailsPanel;
        
        panel.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold">${actor.name}</h2>
                        ${actor.role ? `<span class="badge badge-primary mt-2">${actor.role.charAt(0).toUpperCase() + actor.role.slice(1)}</span>` : ''}
                    </div>
                    <button id="editActorBtn" class="btn btn-ghost btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </button>
                </div>
                
                ${actor.description ? `
                    <div>
                        <h3 class="font-semibold text-sm text-base-content/60 mb-1">Description</h3>
                        <p class="text-sm">${actor.description}</p>
                    </div>
                ` : ''}
                
                <div>
                    <h3 class="font-semibold text-sm text-base-content/60 mb-2">Photo Reference</h3>
                    ${actor.photo_url ? `
                        <img src="${actor.photo_url}" alt="${actor.name}" class="w-full rounded-lg shadow-md">
                    ` : `
                        <div class="w-full aspect-[3/4] bg-base-300 rounded-lg flex items-center justify-center text-base-content/30">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // Add edit button handler
        const editBtn = panel.querySelector('#editActorBtn');
        if (editBtn && this.actorEditScreen) {
            editBtn.addEventListener('click', () => {
                this.actorEditScreen.open(actor.id);
            });
        }
    }
    
    async updateSilhouetteZones(actor) {
        // TODO: Load actor-specific zone data and update silhouette
        // For now, just show the base silhouette
        console.log('[ACTOR DETAIL] TODO: Update silhouette zones for actor:', actor.id);
    }
    
    async loadActorCalendar(actor) {
        // TODO: Load calendar with actor's scenes
        console.log('[ACTOR DETAIL] TODO: Load calendar for actor:', actor.id);
    }
    
    switchSilhouetteMode(mode) {
        const silhouette = document.querySelector('.actor-silhouette');
        silhouette.className = `actor-silhouette mode-${mode}`;
    }
    
    async loadSilhouetteSVG() {
        try {
            const response = await fetch('images/silhouette.svg');
            const svgText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            
            // Extract symbols
            const baseSymbol = doc.getElementById('silhouette');
            const bodyshotsSymbol = doc.getElementById('bodyshots');
            const accessoriesSymbol = doc.getElementById('accessories');
            const outfitSymbol = doc.getElementById('outfit');
            
            if (!baseSymbol) {
                console.error('[ACTOR DETAIL] Silhouette base layer not found');
                return;
            }
            
            // Inject into page silhouette
            const silhouette = document.querySelector('.actor-silhouette');
            silhouette.innerHTML = '';
            
            // Clone base
            const base = baseSymbol.cloneNode(true);
            base.removeAttribute('id');
            silhouette.appendChild(base);
            
            // Add layers as groups
            if (bodyshotsSymbol) {
                const bodyshots = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                bodyshots.className = 'layer-bodyshots';
                bodyshots.innerHTML = bodyshotsSymbol.innerHTML;
                silhouette.appendChild(bodyshots);
            }
            
            if (accessoriesSymbol) {
                const accessories = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                accessories.className = 'layer-accessories';
                accessories.innerHTML = accessoriesSymbol.innerHTML;
                silhouette.appendChild(accessories);
            }
            
            if (outfitSymbol) {
                const outfit = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                outfit.className = 'layer-outfit';
                outfit.innerHTML = outfitSymbol.innerHTML;
                silhouette.appendChild(outfit);
            }
            
        } catch (error) {
            console.error('[ACTOR DETAIL] Error loading silhouette:', error);
        }
    }
    
    async initializeActorEditScreen() {
        try {
            const locations = await LocationService.getAll(this.projectId);
            
            this.actorEditScreen = new ActorEditScreen({
                projectId: this.projectId,
                locations: locations,
                times: [], // Use defaults
                conditions: [], // Use defaults
                onActorUpdated: async (actorId) => {
                    // Reload current actor
                    const updated = await ActorService.getById(actorId);
                    if (updated) {
                        this.currentActor = updated;
                        // Update in local list
                        const index = this.actors.findIndex(a => a.id === actorId);
                        if (index !== -1) {
                            this.actors[index] = updated;
                        }
                        await this.showActorDetail(updated);
                    }
                },
                onActorDeleted: async (actorId) => {
                    // Navigate to next actor or back to grid
                    if (this.actors.length > 1) {
                        const newIndex = Math.min(this.currentIndex, this.actors.length - 2);
                        this.navigateToActor(this.actors[newIndex].id);
                    } else {
                        this.backToGrid();
                    }
                }
            });
            
        } catch (error) {
            console.error('[ACTOR DETAIL] Error initializing edit screen:', error);
        }
    }
    
    setupTouchSwipe() {
        let touchStartX = 0;
        let touchEndX = 0;
        const threshold = 100; // Minimum swipe distance in pixels
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
        
        const handleSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            
            // Swipe left = next actor
            if (swipeDistance < -threshold) {
                this.navigateNext();
            }
            // Swipe right = previous actor
            else if (swipeDistance > threshold) {
                this.navigatePrev();
            }
        };
        
        this.handleSwipe = handleSwipe;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ActorDetailApp();
});
