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
        this.toggleViewBtn = document.getElementById('toggleViewBtn');
        this.btnPrevActor = document.getElementById('btnPrevActor');
        this.btnNextActor = document.getElementById('btnNextActor');
        this.actorNameTitle = document.getElementById('actorNameTitle');
        this.actorDetailsPanel = document.getElementById('actorDetailsPanel');
        
        this.init();
    }
    
    async init() {
        try {
            console.log('[ACTOR DETAIL] Initializing...');
            
            // Get URL params
            const urlParams = new URLSearchParams(window.location.search);
            this.projectId = urlParams.get('project');
            this.actorId = urlParams.get('actor');
            this.gridFilter = urlParams.get('filter') || 'all';
            this.gridSort = urlParams.get('sort') || 'name';
            this.gridSearch = urlParams.get('search') || '';
            
            console.log('[ACTOR DETAIL] Params:', { projectId: this.projectId, actorId: this.actorId, filter: this.gridFilter });
            
            if (!this.projectId || !this.actorId) {
                console.error('[ACTOR DETAIL] Missing required params - redirecting to grid');
                window.location.href = `actors.html?project=${this.projectId}`;
                return;
            }
            
            // Setup event listeners
            console.log('[ACTOR DETAIL] Setting up event listeners...');
            this.setupEventListeners();
            
            // Load silhouette SVG
            console.log('[ACTOR DETAIL] Loading silhouette SVG...');
            await this.loadSilhouetteSVG();
            
            // Load actors list (respecting grid filter)
            console.log('[ACTOR DETAIL] Loading actors...');
            await this.loadActors();
            console.log('[ACTOR DETAIL] Loaded actors:', this.actors.length);
            
            // Find current actor and show detail
            const actor = this.actors.find(a => a.id == this.actorId);
            console.log('[ACTOR DETAIL] Found actor:', actor ? actor.name || actor.actor_name : 'NOT FOUND');
            
            if (actor) {
                this.currentActor = actor;
                this.currentIndex = this.actors.indexOf(actor);
                console.log('[ACTOR DETAIL] Showing actor detail...');
                await this.showActorDetail(actor);
            } else {
                // Actor not found or filtered out - go back to grid
                console.error('[ACTOR DETAIL] Actor not found in filtered list - redirecting to grid');
                this.backToGrid();
                return;
            }
            
            // Initialize edit screen
            console.log('[ACTOR DETAIL] Initializing edit screen...');
            await this.initializeActorEditScreen();
            console.log('[ACTOR DETAIL] Initialization complete!');
            
        } catch (error) {
            console.error('[ACTOR DETAIL] ❌ ERROR during initialization:', error);
            console.error('[ACTOR DETAIL] Error stack:', error.stack);
            console.error('[ACTOR DETAIL] Current state:', {
                projectId: this.projectId,
                actorId: this.actorId,
                actorsLoaded: this.actors?.length || 0
            });
            // Don't redirect immediately - let user see the error
            alert('Error loading actor detail. Check console for details.');
        }
    }
    
    setupEventListeners() {
        // Toggle view (back to grid)
        this.toggleViewBtn.addEventListener('click', () => {
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
            console.log('[ACTOR DETAIL] Loading actors from service...');
            
            // Load all actors
            let actors = await ActorService.getAll(this.projectId);
            console.log('[ACTOR DETAIL] Raw actors from service:', actors.length, actors[0]);
            
            // Normalize data structure (same as actors-grid.js)
            actors = actors.map(actor => ({
                ...actor,
                name: actor.first_name && actor.last_name 
                    ? `${actor.first_name} ${actor.last_name}`
                    : actor.actor_name || 'Unnamed Actor',
                photo_url: actor.profile_image_url,
                role: actor.role || null
            }));
            console.log('[ACTOR DETAIL] Normalized actors:', actors.length, actors[0]);
            
            // Apply same filter as grid
            if (this.gridFilter !== 'all') {
                const beforeFilter = actors.length;
                actors = actors.filter(a => a.role?.toLowerCase() === this.gridFilter.toLowerCase());
                console.log('[ACTOR DETAIL] After filter:', beforeFilter, '→', actors.length);
            }
            
            // Apply search
            if (this.gridSearch) {
                const beforeSearch = actors.length;
                actors = actors.filter(a => a.name.toLowerCase().includes(this.gridSearch.toLowerCase()));
                console.log('[ACTOR DETAIL] After search:', beforeSearch, '→', actors.length);
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
            console.log('[ACTOR DETAIL] Final actors list:', this.actors.length);
            
            // Update prev/next button states
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error('[ACTOR DETAIL] ❌ Error loading actors:', error);
            console.error('[ACTOR DETAIL] Error stack:', error.stack);
            throw error;
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
        console.log('[ACTOR DETAIL] switchSilhouetteMode called with:', mode);
        const silhouette = document.querySelector('.actor-silhouette');
        console.log('[ACTOR DETAIL] Current class:', silhouette.getAttribute('class'));
        silhouette.setAttribute('class', `actor-silhouette mode-${mode}`);
        console.log('[ACTOR DETAIL] New class:', silhouette.getAttribute('class'));
    }
    
    async loadSilhouetteSVG() {
        try {
            console.log('[ACTOR DETAIL] Loading silhouette SVG...');
            const response = await fetch('images/silhouette.svg');
            const svgText = await response.text();
            const parser = new DOMParser();
            const sourceSVG = parser.parseFromString(svgText, 'image/svg+xml').querySelector('svg');
            
            if (!sourceSVG) {
                console.error('[ACTOR DETAIL] Failed to parse silhouette SVG');
                return;
            }
            
            // Get container
            const svgContainer = document.querySelector('.actor-silhouette');
            svgContainer.innerHTML = '';
            svgContainer.setAttribute('viewBox', sourceSVG.getAttribute('viewBox') || '0 0 373 852');
            
            // Add SVG defs for masks (plus cutout)
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            
            // Create mask with plus cutout
            const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
            mask.setAttribute('id', 'plus-cutout-mask');
            
            // White background (visible area)
            const maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            maskBg.setAttribute('x', '0');
            maskBg.setAttribute('y', '0');
            maskBg.setAttribute('width', '100%');
            maskBg.setAttribute('height', '100%');
            maskBg.setAttribute('fill', 'white');
            mask.appendChild(maskBg);
            
            // Black plus (cutout area)
            const plusVertical = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            plusVertical.setAttribute('x', '-3');
            plusVertical.setAttribute('y', '-20');
            plusVertical.setAttribute('width', '6');
            plusVertical.setAttribute('height', '40');
            plusVertical.setAttribute('fill', 'black');
            plusVertical.setAttribute('rx', '2');
            
            const plusHorizontal = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            plusHorizontal.setAttribute('x', '-20');
            plusHorizontal.setAttribute('y', '-3');
            plusHorizontal.setAttribute('width', '40');
            plusHorizontal.setAttribute('height', '6');
            plusHorizontal.setAttribute('fill', 'black');
            plusHorizontal.setAttribute('rx', '2');
            
            const plusGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            plusGroup.setAttribute('id', 'plus-symbol');
            plusGroup.appendChild(plusVertical);
            plusGroup.appendChild(plusHorizontal);
            
            mask.appendChild(plusGroup);
            defs.appendChild(mask);
            svgContainer.appendChild(defs);
            
            // Map source groups to CSS class names
            const layerMapping = {
                'Silhouet': 'layer-silhouet',
                'Bodyshots': 'layer-bodyshots',
                'Accesories': 'layer-accesories',  // Note: 'accesories' with single 's' to match CSS
                'Outfit': 'layer-outfit'
            };
            
            // Process each layer
            Object.entries(layerMapping).forEach(([sourceId, className]) => {
                const sourceGroup = sourceSVG.querySelector(`g[id="${sourceId}"]`);
                if (!sourceGroup) return;
                
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', className);
                
                // Order bodyshots by size (largest first)
                let children = Array.from(sourceGroup.children);
                if (sourceId === 'Bodyshots') {
                    const sizeOrder = ['fullbodyshot', 'shouldershot', 'headshot', 'handshot'];
                    children = sizeOrder.map(id => sourceGroup.querySelector(`[id="${id}"]`)).filter(Boolean);
                }
                
                // Clone children
                children.forEach(child => {
                    const clonedChild = child.cloneNode(true);
                    
                    // Remove inline styles
                    clonedChild.removeAttribute('class');
                    clonedChild.removeAttribute('fill');
                    clonedChild.removeAttribute('stroke');
                    clonedChild.removeAttribute('stroke-width');
                    clonedChild.removeAttribute('stroke-miterlimit');
                    
                    // Add overlays for bodyshots
                    if (sourceId === 'Bodyshots') {
                        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        overlay.setAttribute('class', 'bodyshot-overlay');
                        
                        ['x', 'y', 'width', 'height', 'rx', 'ry'].forEach(attr => {
                            const val = clonedChild.getAttribute(attr);
                            if (val) overlay.setAttribute(attr, val);
                        });
                        
                        overlay.setAttribute('mask', 'url(#plus-cutout-mask)');
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                        
                        const x = parseFloat(clonedChild.getAttribute('x') || 0);
                        const y = parseFloat(clonedChild.getAttribute('y') || 0);
                        const width = parseFloat(clonedChild.getAttribute('width') || 0);
                        const height = parseFloat(clonedChild.getAttribute('height') || 0);
                        const centerX = x + width / 2;
                        const centerY = y + height / 2;
                        
                        overlay.setAttribute('data-center-x', centerX);
                        overlay.setAttribute('data-center-y', centerY);
                        
                        g.appendChild(overlay);
                    }
                    
                    // Add overlays for accessories
                    if (sourceId === 'Accesories') {
                        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        overlay.setAttribute('class', 'accessory-overlay');
                        
                        ['cx', 'cy', 'r'].forEach(attr => {
                            const val = clonedChild.getAttribute(attr);
                            if (val) overlay.setAttribute(attr, val);
                        });
                        
                        overlay.setAttribute('mask', 'url(#plus-cutout-mask)');
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';
                        
                        const cx = parseFloat(clonedChild.getAttribute('cx') || 0);
                        const cy = parseFloat(clonedChild.getAttribute('cy') || 0);
                        overlay.setAttribute('data-center-x', cx);
                        overlay.setAttribute('data-center-y', cy);
                        
                        g.appendChild(overlay);
                    }
                    
                    g.appendChild(clonedChild);
                });
                
                svgContainer.appendChild(g);
            });
            
            // Setup hover effects after loading
            this.setupSilhouetteInteractions();
            
            console.log('[ACTOR DETAIL] Silhouette loaded successfully');
            
        } catch (error) {
            console.error('[ACTOR DETAIL] Error loading silhouette:', error);
        }
    }
    
    setupSilhouetteInteractions() {
        console.log('[ACTOR DETAIL] Setting up silhouette interactions...');
        
        // Setup layer mode toggle
        const layerModeBtns = document.querySelectorAll('.layer-mode-btn');
        console.log('[ACTOR DETAIL] Found layer mode buttons:', layerModeBtns.length);
        
        layerModeBtns.forEach((btn, index) => {
            console.log(`[ACTOR DETAIL] Button ${index}:`, btn.dataset.mode);
            btn.addEventListener('click', () => {
                console.log('[ACTOR DETAIL] Button clicked:', btn.dataset.mode);
                layerModeBtns.forEach(b => b.classList.remove('tab-active'));
                btn.classList.add('tab-active');
                const mode = btn.dataset.mode;
                console.log('[ACTOR DETAIL] Switching to mode:', mode);
                this.switchSilhouetteMode(mode);
            });
        });
        
        // Setup bodyshot hover effects
        const bodyshotsLayer = document.querySelector('.layer-bodyshots');
        if (bodyshotsLayer) {
            const rects = bodyshotsLayer.querySelectorAll('rect:not(.bodyshot-overlay)');
            const overlays = bodyshotsLayer.querySelectorAll('.bodyshot-overlay');
            const plusSymbol = document.querySelector('#plus-symbol');
            
            rects.forEach((rect, index) => {
                const overlay = overlays[index];
                if (!overlay) return;
                
                rect.addEventListener('mouseenter', () => {
                    bodyshotsLayer.classList.add('has-hover');
                    overlay.style.opacity = '1';
                    
                    const centerX = overlay.getAttribute('data-center-x');
                    const centerY = overlay.getAttribute('data-center-y');
                    if (plusSymbol && centerX && centerY) {
                        plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
                    }
                });
                
                rect.addEventListener('mouseleave', () => {
                    overlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        const isAnyHovered = Array.from(rects).some(r => r.matches(':hover'));
                        if (!isAnyHovered) {
                            bodyshotsLayer.classList.remove('has-hover');
                        }
                    }, 10);
                });
                
                // Click handler - open photo upload dialog
                rect.addEventListener('click', () => {
                    console.log('[ACTOR DETAIL] Bodyshot zone clicked:', rect.id);
                    // TODO: Implement photo upload for this zone
                });
            });
        }
        
        // Setup accessory hover effects
        const accessoriesLayer = document.querySelector('.layer-accesories');
        if (accessoriesLayer) {
            const circles = accessoriesLayer.querySelectorAll('circle:not(.accessory-overlay)');
            const overlays = accessoriesLayer.querySelectorAll('.accessory-overlay');
            const plusSymbol = document.querySelector('#plus-symbol');
            
            circles.forEach((circle, index) => {
                const overlay = overlays[index];
                if (!overlay) return;
                
                circle.addEventListener('mouseenter', () => {
                    accessoriesLayer.classList.add('has-hover');
                    overlay.style.opacity = '1';
                    
                    const centerX = overlay.getAttribute('data-center-x');
                    const centerY = overlay.getAttribute('data-center-y');
                    if (plusSymbol && centerX && centerY) {
                        plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
                    }
                });
                
                circle.addEventListener('mouseleave', () => {
                    overlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        const isAnyHovered = Array.from(circles).some(c => c.matches(':hover'));
                        if (!isAnyHovered) {
                            accessoriesLayer.classList.remove('has-hover');
                        }
                    }, 10);
                });
                
                // Click handler
                circle.addEventListener('click', () => {
                    console.log('[ACTOR DETAIL] Accessory zone clicked:', circle.id);
                    // TODO: Implement photo upload for this zone
                });
            });
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
