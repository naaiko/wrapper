// =================================================================
// ACTORS MANAGEMENT - Main Application Logic
// =================================================================

import { ActorService } from './services/actorService.js';
import { CustomDropdown } from './components/customDropdown.js';
import { SVGProcessor } from './utils/svgProcessor.js';
import { ActorEditScreen } from './actorEditScreen.js';
import { LocationService } from './services/locationService.js';
import settingsService from './services/settingsService.js';

// Helper function for confirmation dialogs
function confirmDialog(message, title = 'Bevestiging', okText = 'Verwijderen', cancelText = 'Annuleren') {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirmDialog');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        const backdrop = document.getElementById('confirmBackdrop');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        okBtn.textContent = okText;
        cancelBtn.textContent = cancelText;
        
        const handleOk = () => {
            cleanup();
            dialog.close();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            dialog.close();
            resolve(false);
        };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            backdrop.removeEventListener('click', handleCancel);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        backdrop.addEventListener('click', handleCancel);
        
        dialog.showModal();
    });
}

// Helper function to capitalize first letter of each word
function capitalizeName(name) {
    return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

class ActorsApp {
    constructor() {
        this.projectId = null;
        this.actors = [];
        this.currentActor = null;
        this.currentActorIndex = 0;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.actorDropdown = null;
        this.actorEditScreen = null;
        this.locations = [];
        this.times = [];
        this.conditions = [];
        
        this.init();
    }

    async init() {
        // Get project ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project');

        if (!this.projectId) {
            alert('No project selected');
            window.location.href = 'projects.html';
            return;
        }

        // Load and process silhouette SVG
        await this.loadSilhouetteSVG();

        // Load project info
        await this.loadProjectInfo();
        
        // Initialize ActorEditScreen
        await this.initializeActorEditScreen();

        // Set up event listeners
        this.setupEventListeners();

        // Load actors
        await this.loadActors();
    }
    
    /**
     * Initialize ActorEditScreen component
     */
    async initializeActorEditScreen() {
        // Load data needed for edit screen
        this.locations = await LocationService.getAll(this.projectId);
        
        // Get times and conditions from settings
        const times = settingsService.getProjectTimes();
        const conditions = settingsService.getProjectConditions();
        
        this.times = times || [];
        this.conditions = conditions || [];
        
        // Create edit screen instance
        this.actorEditScreen = new ActorEditScreen({
            projectId: this.projectId,
            locations: this.locations,
            times: this.times,
            conditions: this.conditions,
            onActorUpdated: async (actorId) => {
                // Reload actors and update UI
                await this.loadActors();
                // Reselect the updated actor
                const actor = this.actors.find(a => a.id === actorId);
                if (actor) {
                    this.currentActor = actor;
                    this.currentActorIndex = this.actors.indexOf(actor);
                    await this.showActorDetail(actor);
                }
            },
            onActorDeleted: async (actorId) => {
                // Remove from local array
                this.actors = this.actors.filter(a => a.id !== actorId);
                
                // Select next/previous actor or show empty state
                if (this.actors.length > 0) {
                    this.currentActorIndex = Math.min(this.currentActorIndex, this.actors.length - 1);
                    this.currentActor = this.actors[this.currentActorIndex];
                    this.renderActorDropdown();
                    await this.showActorDetail(this.currentActor);
                } else {
                    this.currentActor = null;
                    this.currentActorIndex = 0;
                    this.showEmptyState();
                }
            }
        });
    }
    
    /**
     * Load and process multi-layer silhouette SVG
     * 
     * NOTE: Runtime loading is fast (single fetch + DOM ops) and only happens once on page load.
     * Benefits: Source file stays pristine, automatic updates when source changes.
     * 
     * CRITICAL: Must use createElementNS and cloneNode to preserve SVG namespace.
     * 
     * Process:
     * 1. Fetch source SVG (images/silhouette.svg) - NEVER modify this file directly
     * 2. Parse with DOMParser (creates working copy in memory)
     * 3. Extract groups by ID (Silhouet, Bodyshots, Accesories, Outfit)
     * 4. Clone with createElementNS (preserves namespace - innerHTML breaks it!)
     * 5. Remove inline styles (fill, stroke, class) → allows CSS styling
     * 6. Append to container
     */
    async loadSilhouetteSVG() {
        try {
            const response = await fetch('images/silhouette.svg');
            const svgText = await response.text();
            
            // Parse SVG with proper namespace - creates working copy
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const sourceSVG = doc.querySelector('svg');
            
            const svgContainer = document.querySelector('.actor-silhouette');
            if (!svgContainer || !sourceSVG) {
                console.error('Missing container or source SVG');
                return;
            }
            
            // Set viewBox from source
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
            
            // Black plus (cutout area) - positioned at center with transform
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
                'Accesories': 'layer-accesories',
                'Outfit': 'layer-outfit'
            };
            
            // Process each layer - creates clean working copy
            Object.entries(layerMapping).forEach(([sourceId, className]) => {
                const sourceGroup = sourceSVG.querySelector(`g[id="${sourceId}"]`);
                if (sourceGroup) {
                    // Create group with SVG namespace (critical!)
                    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    g.setAttribute('class', className);
                    
                    // Special handling for bodyshots: order by size (largest first, smallest last)
                    // This ensures smaller zones are on top and receive pointer events first
                    let children = Array.from(sourceGroup.children);
                    if (sourceId === 'Bodyshots') {
                        const sizeOrder = ['fullbodyshot', 'shouldershot', 'headshot', 'handshot'];
                        children = sizeOrder.map(id => 
                            sourceGroup.querySelector(`[id="${id}"]`)
                        ).filter(Boolean);
                    }
                    
                    // Clone children with proper namespace - preserves source file integrity
                    children.forEach(child => {
                        const clonedChild = child.cloneNode(true);
                        
                        // Remove inline styles to allow CSS styling (working copy transformation)
                        clonedChild.removeAttribute('class');
                        clonedChild.removeAttribute('fill');
                        clonedChild.removeAttribute('stroke');
                        clonedChild.removeAttribute('stroke-width');
                        clonedChild.removeAttribute('stroke-miterlimit');
                        
                        // For bodyshots, add mask attribute and center the plus symbol
                        if (sourceId === 'Bodyshots') {
                            // Create overlay rect with mask for the plus cutout
                            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            overlay.setAttribute('class', 'bodyshot-overlay');
                            
                            // Copy position and size from original rect
                            ['x', 'y', 'width', 'height', 'rx', 'ry'].forEach(attr => {
                                const val = clonedChild.getAttribute(attr);
                                if (val) overlay.setAttribute(attr, val);
                            });
                            
                            // Apply mask and set it to be invisible initially
                            overlay.setAttribute('mask', 'url(#plus-cutout-mask)');
                            overlay.style.opacity = '0';
                            overlay.style.pointerEvents = 'none';
                            
                            // Position the mask's plus symbol at rect center
                            const x = parseFloat(clonedChild.getAttribute('x') || 0);
                            const y = parseFloat(clonedChild.getAttribute('y') || 0);
                            const width = parseFloat(clonedChild.getAttribute('width') || 0);
                            const height = parseFloat(clonedChild.getAttribute('height') || 0);
                            const centerX = x + width / 2;
                            const centerY = y + height / 2;
                            
                            // Store center position as data attribute
                            overlay.setAttribute('data-center-x', centerX);
                            overlay.setAttribute('data-center-y', centerY);
                            
                            g.appendChild(overlay);
                        }
                        
                        // For accessories, add circle overlay with mask
                        if (sourceId === 'Accesories') {
                            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            overlay.setAttribute('class', 'accessory-overlay');
                            
                            // Copy position and size from original circle
                            ['cx', 'cy', 'r'].forEach(attr => {
                                const val = clonedChild.getAttribute(attr);
                                if (val) overlay.setAttribute(attr, val);
                            });
                            
                            // Apply mask and set it to be invisible initially
                            overlay.setAttribute('mask', 'url(#plus-cutout-mask)');
                            overlay.style.opacity = '0';
                            overlay.style.pointerEvents = 'none';
                            
                            // Store center position as data attribute
                            const centerX = parseFloat(clonedChild.getAttribute('cx') || 0);
                            const centerY = parseFloat(clonedChild.getAttribute('cy') || 0);
                            
                            overlay.setAttribute('data-center-x', centerX);
                            overlay.setAttribute('data-center-y', centerY);
                            
                            g.appendChild(overlay);
                        }
                        
                        // For outfit, add path overlay with mask
                        if (sourceId === 'Outfit') {
                            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            overlay.setAttribute('class', 'outfit-overlay');
                            
                            // Copy path data from original
                            const d = clonedChild.getAttribute('d');
                            if (d) overlay.setAttribute('d', d);
                            
                            // Apply mask and set it to be invisible initially
                            overlay.setAttribute('mask', 'url(#plus-cutout-mask)');
                            overlay.style.opacity = '0';
                            overlay.style.pointerEvents = 'none';
                            
                            // Calculate center of path bounding box
                            g.appendChild(clonedChild); // Temporarily append to calculate bbox
                            svgContainer.appendChild(g);
                            const bbox = clonedChild.getBBox();
                            const centerX = bbox.x + bbox.width / 2;
                            const centerY = bbox.y + bbox.height / 2;
                            svgContainer.removeChild(g);
                            
                            overlay.setAttribute('data-center-x', centerX);
                            overlay.setAttribute('data-center-y', centerY);
                            
                            g.appendChild(overlay);
                        }
                        
                        g.appendChild(clonedChild);
                    });
                    
                    svgContainer.appendChild(g);
                }
            });
            
            console.log('Silhouette SVG loaded from source, working copy created');
            
            // Add hover event listeners for all zones
            this.setupBodyshotHoverEffects();
            this.setupAccessoryHoverEffects();
            this.setupOutfitHoverEffects();
        } catch (error) {
            console.error('Failed to load silhouette SVG:', error);
        }
    }

    /**
     * Setup hover effects for bodyshot zones
     * Dims other zones when hovering one zone
     */
    setupBodyshotHoverEffects() {
        const bodyshotsLayer = document.querySelector('.layer-bodyshots');
        if (!bodyshotsLayer) return;
        
        const rects = bodyshotsLayer.querySelectorAll('rect:not(.bodyshot-overlay)');
        const overlays = bodyshotsLayer.querySelectorAll('.bodyshot-overlay');
        const plusSymbol = document.querySelector('#plus-symbol');
        
        rects.forEach((rect, index) => {
            const overlay = overlays[index];
            if (!overlay) return;
            
            console.log(`Setting up bodyshot ${index}:`, {
                rect: rect.id || rect.getAttribute('id'),
                hasOverlay: !!overlay,
                rectPointerEvents: window.getComputedStyle(rect).pointerEvents,
                overlayPointerEvents: window.getComputedStyle(overlay).pointerEvents
            });
            
            rect.addEventListener('mouseenter', () => {
                console.log(`🟢 Bodyshot mouseenter ${index}:`, rect.id || 'no-id');
                bodyshotsLayer.classList.add('has-hover');
                
                // Show overlay with plus cutout
                overlay.style.opacity = '1';
                console.log(`  → Overlay opacity set to 1`);
                
                // Position plus symbol at center of this rect
                const centerX = overlay.getAttribute('data-center-x');
                const centerY = overlay.getAttribute('data-center-y');
                if (plusSymbol && centerX && centerY) {
                    plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
                    console.log(`  → Plus positioned at (${centerX}, ${centerY})`);
                }
            });
            
            rect.addEventListener('mouseleave', () => {
                console.log(`🔴 Bodyshot mouseleave ${index}:`, rect.id || 'no-id');
                // Hide overlay
                overlay.style.opacity = '0';
                
                // Small delay to prevent flicker when moving between zones
                setTimeout(() => {
                    const isAnyRectHovered = Array.from(rects).some(r => r.matches(':hover'));
                    if (!isAnyRectHovered) {
                        bodyshotsLayer.classList.remove('has-hover');
                    }
                }, 10);
            });
        });
    }

    /**
     * Setup hover effects for accessory zones
     * Dims other zones when hovering one zone
     */
    setupAccessoryHoverEffects() {
        const accessoriesLayer = document.querySelector('.layer-accesories');
        if (!accessoriesLayer) return;
        
        const circles = accessoriesLayer.querySelectorAll('circle:not(.accessory-overlay)');
        const overlays = accessoriesLayer.querySelectorAll('.accessory-overlay');
        const plusSymbol = document.querySelector('#plus-symbol');
        
        circles.forEach((circle, index) => {
            const overlay = overlays[index];
            if (!overlay) return;
            
            console.log(`Setting up accessory ${index}:`, {
                circle: circle.id || circle.getAttribute('id'),
                hasOverlay: !!overlay,
                circlePointerEvents: window.getComputedStyle(circle).pointerEvents,
                overlayPointerEvents: window.getComputedStyle(overlay).pointerEvents,
                cx: circle.getAttribute('cx'),
                cy: circle.getAttribute('cy')
            });
            
            circle.addEventListener('mouseenter', () => {
                console.log(`🟢 Accessory mouseenter ${index}:`, circle.id || 'no-id');
                accessoriesLayer.classList.add('has-hover');
                overlay.style.opacity = '1';
                console.log(`  → Overlay opacity set to 1`);
                
                // Position plus symbol at circle center
                const centerX = overlay.getAttribute('data-center-x');
                const centerY = overlay.getAttribute('data-center-y');
                if (plusSymbol && centerX && centerY) {
                    plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
                    console.log(`  → Plus positioned at (${centerX}, ${centerY})`);
                }
            });
            
            circle.addEventListener('mouseleave', () => {
                console.log(`🔴 Accessory mouseleave ${index}:`, circle.id || 'no-id');
                overlay.style.opacity = '0';
                
                setTimeout(() => {
                    const isAnyCircleHovered = Array.from(circles).some(c => c.matches(':hover'));
                    if (!isAnyCircleHovered) {
                        accessoriesLayer.classList.remove('has-hover');
                    }
                }, 10);
            });
        });
    }

    /**
     * Setup hover effects for outfit zones
     * Dims other zones when hovering one zone
     */
    setupOutfitHoverEffects() {
        const outfitLayer = document.querySelector('.layer-outfit');
        if (!outfitLayer) return;
        
        const paths = outfitLayer.querySelectorAll('path:not(.outfit-overlay)');
        const overlays = outfitLayer.querySelectorAll('.outfit-overlay');
        const plusSymbol = document.querySelector('#plus-symbol');
        
        paths.forEach((path, index) => {
            const overlay = overlays[index];
            if (!overlay) return;
            
            console.log(`Setting up outfit ${index}:`, {
                path: path.id || path.getAttribute('id'),
                hasOverlay: !!overlay,
                pathPointerEvents: window.getComputedStyle(path).pointerEvents,
                overlayPointerEvents: window.getComputedStyle(overlay).pointerEvents
            });
            
            path.addEventListener('mouseenter', () => {
                console.log(`🟢 Outfit mouseenter ${index}:`, path.id || 'no-id');
                outfitLayer.classList.add('has-hover');
                overlay.style.opacity = '1';
                console.log(`  → Overlay opacity set to 1`);
                
                // Position plus symbol at path center
                const centerX = overlay.getAttribute('data-center-x');
                const centerY = overlay.getAttribute('data-center-y');
                if (plusSymbol && centerX && centerY) {
                    plusSymbol.setAttribute('transform', `translate(${centerX}, ${centerY})`);
                    console.log(`  → Plus positioned at (${centerX}, ${centerY})`);
                }
            });
            
            path.addEventListener('mouseleave', () => {
                console.log(`🔴 Outfit mouseleave ${index}:`, path.id || 'no-id');
                overlay.style.opacity = '0';
                
                setTimeout(() => {
                    const isAnyPathHovered = Array.from(paths).some(p => p.matches(':hover'));
                    if (!isAnyPathHovered) {
                        outfitLayer.classList.remove('has-hover');
                    }
                }, 10);
            });
        });
    }

    async loadProjectInfo() {
        try {
            const { data, error } = await window.supabase
                .from('projects')
                .select('name')
                .eq('id', this.projectId)
                .single();

            if (error) throw error;

            // Update navigation links with project ID
            const navActors = document.getElementById('navActors');
            const navTimeline = document.getElementById('navTimeline');
            const navCalendar = document.getElementById('navCalendar');
            if (navActors) navActors.href = `actors.html?project=${this.projectId}`;
            if (navTimeline) navTimeline.href = `timeline.html?project=${this.projectId}`;
            if (navCalendar) navCalendar.href = `calendar.html?project=${this.projectId}`;
        } catch (error) {
            console.error('Error loading project:', error);
        }
    }

    setupEventListeners() {
        // Add actor buttons
        const btnAddActor = document.getElementById('btnAddActor');
        const btnAddActorEmpty = document.getElementById('btnAddActorEmpty');
        const addActorForm = document.getElementById('addActorForm');
        
        if (btnAddActor) btnAddActor.addEventListener('click', () => this.openAddActorDialog());
        if (btnAddActorEmpty) btnAddActorEmpty.addEventListener('click', () => this.openAddActorDialog());
        if (addActorForm) addActorForm.addEventListener('submit', (e) => this.handleAddActor(e));

        // Navigation buttons
        const btnPrevActor = document.getElementById('btnPrevActor');
        const btnNextActor = document.getElementById('btnNextActor');
        
        if (btnPrevActor) btnPrevActor.addEventListener('click', () => this.navigateToPreviousActor());
        if (btnNextActor) btnNextActor.addEventListener('click', () => this.navigateToNextActor());
        
        // Layer mode switcher
        const modeButtons = document.querySelectorAll('.layer-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchLayerMode(btn));
        });
    }

    async loadActors() {
        try {
            this.actors = await ActorService.getAll(this.projectId);
            this.renderActors();
        } catch (error) {
            console.error('Error loading actors:', error);
            this.showError('Failed to load actors');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        const filterButtons = document.querySelectorAll('.dropdown-content a');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', '')}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.renderActors();
    }

    renderActors() {
        const grid = document.getElementById('actorsGrid');
        const emptyState = document.getElementById('emptyState');

        // Filter actors by search term
        if (this.searchTerm) {
            ActorService.search(this.projectId, this.searchTerm).then(actors => {
                this.displayActors(actors);
            });
        } else {
            this.displayActors(this.actors);
        }
    }

    displayActors(actors) {
        const emptyState = document.getElementById('emptyState');

        // Apply sorting
        const sortedActors = ActorService.sortActors(actors, this.currentFilter);

        // Only show onboarding if there are truly no actors in the project
        if (this.actors.length === 0) {
            // Show onboarding state
            emptyState.classList.remove('hidden');
            return;
        }

        // Hide empty state
        emptyState.classList.add('hidden');
        
        // Render actor dropdown
        this.renderActorDropdown();
        
        // Show first actor in detail view if available
        if (sortedActors.length > 0) {
            this.currentActorIndex = 0;
            this.showActorDetail(sortedActors[0]);
        }
    }

    renderActorDropdown() {
        // Create options from actors
        const options = this.actors.map(actor => ({
            value: actor.id,
            label: `${actor.first_name} ${actor.last_name}`
        }));

        // Initialize or update dropdown
        if (this.actorDropdown) {
            this.actorDropdown.options = options;
            this.actorDropdown.value = this.currentActor?.id || '';
            this.actorDropdown.render();
        } else {
            this.actorDropdown = new CustomDropdown({
                containerId: 'actorDropdownContainer',
                name: 'actor_id',
                options: options,
                value: this.currentActor?.id || '',
                placeholder: 'Select actor...',
                searchable: true,
                allowCreate: true,
                createLabel: '+ Create new actor',
                allowDelete: true,
                size: 'md',
                onChange: (value, option) => this.onActorDropdownChange(value, option),
                onCreate: (searchTerm) => this.openAddActorDialog(searchTerm),
                onDelete: (value) => this.handleDeleteActorFromDropdown(value)
            });
            this.actorDropdown.render();
        }
    }

    onActorDropdownChange(value, option) {
        const actor = this.actors.find(a => a.id === value);
        if (actor) {
            this.currentActorIndex = this.actors.indexOf(actor);
            this.showActorDetail(actor);
        }
    }

    navigateToPreviousActor() {
        if (this.actors.length === 0) return;
        
        this.currentActorIndex = (this.currentActorIndex - 1 + this.actors.length) % this.actors.length;
        const actor = this.actors[this.currentActorIndex];
        
        // Update dropdown value
        if (this.actorDropdown) {
            this.actorDropdown.value = actor.id;
            this.actorDropdown.render();
        }
        
        this.showActorDetail(actor);
    }

    navigateToNextActor() {
        if (this.actors.length === 0) return;
        
        this.currentActorIndex = (this.currentActorIndex + 1) % this.actors.length;
        const actor = this.actors[this.currentActorIndex];
        
        // Update dropdown value
        if (this.actorDropdown) {
            this.actorDropdown.value = actor.id;
            this.actorDropdown.render();
        }
        
        this.showActorDetail(actor);
    }

    createActorCard(actor) {
        const imageHtml = actor.profile_image_url
            ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" class="actor-card-image" />`
            : `<img src="images/silhouette.svg" alt="Actor Silhouette" class="actor-card-silhouette" />`;

        const characteristics = [];
        if (actor.hair_color) characteristics.push(`Hair: ${actor.hair_color}`);
        if (actor.eye_color) characteristics.push(`Eyes: ${actor.eye_color}`);
        if (actor.height) characteristics.push(`Height: ${actor.height}`);

        return `
            <div id="actor-card-${actor.id}" class="actor-card">
                <div class="actor-card-image-container">
                    ${imageHtml}
                </div>
                <div class="actor-card-body">
                    <h3 class="actor-card-title">${this.escapeHtml(actor.actor_name)}</h3>
                    <p class="actor-card-subtitle">as ${this.escapeHtml(actor.character_name)}</p>
                    
                    ${characteristics.length > 0 ? `
                        <div class="characteristic-badges">
                            ${characteristics.map(char => `
                                <span class="characteristic-badge">${this.escapeHtml(char)}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${actor.notes ? `
                        <div class="actor-card-details">
                            <div class="actor-card-detail">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span class="line-clamp-2">${this.escapeHtml(actor.notes.substring(0, 100))}${actor.notes.length > 100 ? '...' : ''}</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="actor-card-actions">
                        <button class="btn btn-sm btn-ghost flex-1" onclick="actorsApp.openEditActorModal('${actor.id}'); event.stopPropagation();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-ghost btn-error" onclick="actorsApp.deleteActor('${actor.id}'); event.stopPropagation();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    openAddActorDialog(searchTerm = '') {
        const dialog = document.getElementById('addActorDialog');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        
        // Reset form first
        document.getElementById('addActorForm').reset();
        
        // Split search term into first and last name
        if (searchTerm && searchTerm.trim()) {
            const parts = searchTerm.trim().split(/\s+/);
            firstNameInput.value = parts[0] || '';
            lastNameInput.value = parts.slice(1).join(' ') || '';
        }
        
        dialog.showModal();
    }

    async handleAddActor(e) {
        e.preventDefault();
        
        const firstName = capitalizeName(document.getElementById('firstName').value.trim());
        const lastName = capitalizeName(document.getElementById('lastName').value.trim());
        
        const actorData = {
            actor_name: `${firstName} ${lastName}`,
            character_name: '',
            first_name: firstName,
            last_name: lastName
        };

        try {
            const newActor = await ActorService.create(this.projectId, actorData);
            
            // Add new actor to the local array immediately
            this.actors.push(newActor);
            
            // Find and select the newly created actor
            this.currentActorIndex = this.actors.findIndex(a => a.id === newActor.id);
            this.currentActor = newActor;
            
            // Update dropdown to show new actor and select it
            this.renderActorDropdown();
            if (this.actorDropdown) {
                this.actorDropdown.setValue(newActor.id);
            }
            
            // Show actor in 3-column layout
            this.showActorDetail(newActor);
            
            document.getElementById('addActorDialog').close();
        } catch (error) {
            console.error('Error creating actor:', error);
            this.showError('Kon acteur niet opslaan');
        }
    }

    async showActorDetail(actor) {
        // Hide empty state
        document.getElementById('emptyState').classList.add('hidden');
        
        // Render actor details in left panel
        this.renderActorDetails(actor);
        
        // Silhouette is now static - no update needed
        
        // Load and display scenes for this actor
        await this.loadActorScenes(actor);
    }
    
    /**
     * Render actor details in left panel
     */
    renderActorDetails(actor) {
        const panel = document.getElementById('actorDetailsPanel');
        if (!panel) return;
        
        // Build distinguishing features list
        const features = actor.distinguishing_features || [];
        const featuresHtml = features.length > 0 
            ? features.map(f => `<span class="badge badge-outline badge-sm">${f}</span>`).join(' ')
            : '<span class="text-base-content/40 text-xs">None specified</span>';
        
        panel.innerHTML = `
            <!-- Header with name -->
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-base-content mb-1">${actor.actor_name}</h2>
                <p class="text-lg text-base-content/70">as ${actor.character_name}</p>
            </div>
            
            <!-- Profile Image (if available) -->
            ${actor.profile_image_url ? `
                <div class="mb-6">
                    <img src="${actor.profile_image_url}" alt="${actor.actor_name}" class="w-full rounded-lg shadow-md" />
                </div>
            ` : ''}
            
            <!-- Contact Information -->
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">Contact</h3>
                <div class="space-y-2">
                    ${actor.email ? `
                        <div class="flex items-center gap-2 text-sm">
                            <svg class="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href="mailto:${actor.email}" class="text-primary hover:underline">${actor.email}</a>
                        </div>
                    ` : ''}
                    ${actor.phone ? `
                        <div class="flex items-center gap-2 text-sm">
                            <svg class="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href="tel:${actor.phone}" class="text-primary hover:underline">${actor.phone}</a>
                        </div>
                    ` : ''}
                    ${!actor.email && !actor.phone ? `
                        <p class="text-sm text-base-content/40">No contact information</p>
                    ` : ''}
                </div>
            </div>
            
            <!-- Physical Characteristics -->
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">Physical Characteristics</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    ${actor.height ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Height</div>
                            <div class="font-medium">${actor.height}</div>
                        </div>
                    ` : ''}
                    ${actor.body_type ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Body Type</div>
                            <div class="font-medium">${actor.body_type}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_color ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Hair Color</div>
                            <div class="font-medium">${actor.hair_color}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_style ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Hair Style</div>
                            <div class="font-medium">${actor.hair_style}</div>
                        </div>
                    ` : ''}
                    ${actor.eye_color ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Eye Color</div>
                            <div class="font-medium">${actor.eye_color}</div>
                        </div>
                    ` : ''}
                    ${actor.skin_tone ? `
                        <div>
                            <div class="text-base-content/50 text-xs mb-1">Skin Tone</div>
                            <div class="font-medium">${actor.skin_tone}</div>
                        </div>
                    ` : ''}
                </div>
                ${!actor.height && !actor.body_type && !actor.hair_color && !actor.hair_style && !actor.eye_color && !actor.skin_tone ? `
                    <p class="text-sm text-base-content/40">No physical characteristics recorded</p>
                ` : ''}
            </div>
            
            <!-- Distinguishing Features -->
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">Distinguishing Features</h3>
                <div class="flex flex-wrap gap-2">
                    ${featuresHtml}
                </div>
            </div>
            
            <!-- Notes -->
            ${actor.notes ? `
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">Notes</h3>
                    <div class="text-sm text-base-content/80 whitespace-pre-wrap bg-base-200 p-3 rounded-lg">
                        ${actor.notes}
                    </div>
                </div>
            ` : ''}
            
            <!-- Edit Button -->
            <div class="mt-6 pt-6 border-t border-base-300">
                <button 
                    class="btn btn-primary btn-block btn-sm"
                    onclick="actorsApp.editActor('${actor.id}')"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Actor
                </button>
            </div>
        `;
    }
    
    /**
     * Load and render scenes for an actor
     */
    async loadActorScenes(actor) {
        const scenesList = document.getElementById('actorScenesList');
        if (!scenesList) return;
        
        try {
            // Dynamic import to avoid loading scene modules until needed
            const { SceneActorService } = await import('./services/sceneActorService.js');
            const { renderSceneCard } = await import('./components/sceneCardRenderer.js');
            const { LocationService } = await import('./services/locationService.js');
            const settingsService = await import('./services/settingsService.js');
            
            // Show loading state
            scenesList.innerHTML = `
                <div class="flex justify-center items-center p-8">
                    <span class="loading loading-spinner loading-md"></span>
                </div>
            `;
            
            // Get scene_actors for this actor
            const sceneActors = await SceneActorService.getByActor(actor.id);
            
            if (sceneActors.length === 0) {
                scenesList.innerHTML = `
                    <div class="text-sm text-base-content/60 p-4 text-center border border-dashed border-base-300 rounded-lg">
                        This actor is not assigned to any scenes yet.
                    </div>
                `;
                return;
            }
            
            // Load locations for scene cards
            const locations = await LocationService.getAll(this.projectId);
            const settings = settingsService.default.getAllFeatures();
            
            // Render scene cards
            scenesList.innerHTML = '';
            sceneActors.forEach(sa => {
                const scene = sa.scene;
                if (!scene) return;
                
                // Create wrapper for scene card + continuity info
                const wrapper = document.createElement('div');
                wrapper.className = 'space-y-1';
                
                // Render scene card
                const card = renderSceneCard(scene, {
                    locations: locations,
                    times: [], // Not needed for basic display
                    conditions: [],
                    settings: settings,
                    hideSplitIndicator: false
                });
                wrapper.appendChild(card);
                
                // Add continuity badges if photos exist
                const badges = this.renderContinuityBadgesForScene(sa);
                if (badges) {
                    const badgesDiv = document.createElement('div');
                    badgesDiv.className = 'flex gap-1 px-2';
                    badgesDiv.innerHTML = badges;
                    wrapper.appendChild(badgesDiv);
                }
                
                scenesList.appendChild(wrapper);
            });
            
        } catch (error) {
            console.error('Error loading actor scenes:', error);
            scenesList.innerHTML = `
                <div class="alert alert-error">
                    <span>Failed to load scenes</span>
                </div>
            `;
        }
    }
    
    /**
     * Render continuity badges for a scene actor
     */
    renderContinuityBadgesForScene(sceneActor) {
        const badges = [];
        
        const categories = [
            { key: 'costume_images', icon: '👔', label: 'Costume' },
            { key: 'makeup_images', icon: '💄', label: 'Makeup' },
            { key: 'hair_images', icon: '💇', label: 'Hair' },
            { key: 'props_images', icon: '🎭', label: 'Props' }
        ];
        
        categories.forEach(cat => {
            const count = sceneActor[cat.key]?.length || 0;
            if (count > 0) {
                badges.push(`
                    <div class="tooltip tooltip-right" data-tip="${cat.label}: ${count} photo${count > 1 ? 's' : ''}">
                        <div class="badge badge-xs badge-ghost gap-1">
                            <span>${cat.icon}</span>
                            <span class="text-xs">${count}</span>
                        </div>
                    </div>
                `);
            }
        });
        
        return badges.length > 0 ? badges.join('') : null;
    }
    
    /**
     * Edit actor using new EditScreen component
     */
    async editActor(actorId) {
        if (this.actorEditScreen) {
            await this.actorEditScreen.open(actorId);
        }
    }
    
    /**
     * Switch silhouette layer visibility mode
     * Modes: bodyshots, accessories, outfit
     */
    switchLayerMode(button) {
        const mode = button.dataset.mode;
        const svg = document.querySelector('.actor-silhouette');
        
        // Update active tab
        document.querySelectorAll('.layer-mode-btn').forEach(btn => {
            btn.classList.remove('tab-active');
        });
        button.classList.add('tab-active');
        
        // Remove all mode classes
        svg.classList.remove('mode-bodyshots', 'mode-accessories', 'mode-outfit');
        
        // Add new mode class
        svg.classList.add(`mode-${mode}`);
    }

    async openEditActorModal(actorId) {
        try {
            this.currentActor = await ActorService.getById(actorId);
            document.getElementById('modalTitle').textContent = 'Edit Actor';

            // Populate form
            document.getElementById('actorName').value = this.currentActor.actor_name || '';
            document.getElementById('characterName').value = this.currentActor.character_name || '';
            document.getElementById('email').value = this.currentActor.email || '';
            document.getElementById('phone').value = this.currentActor.phone || '';
            document.getElementById('height').value = this.currentActor.height || '';
            document.getElementById('hairColor').value = this.currentActor.hair_color || '';
            document.getElementById('hairStyle').value = this.currentActor.hair_style || '';
            document.getElementById('eyeColor').value = this.currentActor.eye_color || '';
            document.getElementById('skinTone').value = this.currentActor.skin_tone || '';
            document.getElementById('bodyType').value = this.currentActor.body_type || '';
            document.getElementById('profileImageUrl').value = this.currentActor.profile_image_url || '';
            document.getElementById('notes').value = this.currentActor.notes || '';

            // Handle distinguishing features array
            if (this.currentActor.distinguishing_features && this.currentActor.distinguishing_features.length > 0) {
                document.getElementById('distinguishingFeatures').value = this.currentActor.distinguishing_features.join(', ');
            } else {
                document.getElementById('distinguishingFeatures').value = '';
            }

            // Update preview
            this.updateProfilePreview(this.currentActor.profile_image_url);

            actorModal.showModal();
        } catch (error) {
            console.error('Error loading actor:', error);
            this.showError('Failed to load actor details');
        }
    }

    updateProfilePreview(url) {
        const preview = document.getElementById('profileImagePreview');
        const image = document.getElementById('profileImage');
        const silhouette = document.querySelector('.actor-silhouette');

        if (url && url.trim() !== '') {
            image.src = url;
            preview.classList.remove('hidden');
            silhouette.style.opacity = '0';
        } else {
            preview.classList.add('hidden');
            silhouette.style.opacity = '1';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const distinguishingFeaturesStr = formData.get('distinguishingFeatures');
        const distinguishingFeatures = distinguishingFeaturesStr 
            ? distinguishingFeaturesStr.split(',').map(f => f.trim()).filter(f => f)
            : [];

        const actorData = {
            actor_name: formData.get('actorName'),
            character_name: formData.get('characterName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            height: formData.get('height'),
            hair_color: formData.get('hairColor'),
            hair_style: formData.get('hairStyle'),
            eye_color: formData.get('eyeColor'),
            skin_tone: formData.get('skinTone'),
            body_type: formData.get('bodyType'),
            distinguishing_features: distinguishingFeatures,
            profile_image_url: formData.get('profileImageUrl'),
            notes: formData.get('notes')
        };

        try {
            if (this.currentActor) {
                // Update existing actor
                await ActorService.update(this.currentActor.id, actorData);
                this.showSuccess('Actor updated successfully');
            } else {
                // Create new actor
                await ActorService.create(this.projectId, actorData);
                this.showSuccess('Actor created successfully');
            }

            actorModal.close();
            await this.loadActors();
        } catch (error) {
            console.error('Error saving actor:', error);
            this.showError('Failed to save actor');
        }
    }

    async handleDeleteActorFromDropdown(actorId) {
        const confirmed = await confirmDialog(
            'Weet je zeker dat je deze acteur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
            'Acteur verwijderen'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await ActorService.delete(actorId);
            
            // Remove from local array
            this.actors = this.actors.filter(a => a.id !== actorId);
            
            // Select another actor or show empty state
            if (this.actors.length > 0) {
                this.currentActorIndex = 0;
                this.currentActor = this.actors[0];
                this.renderActorDropdown();
                if (this.actorDropdown) {
                    this.actorDropdown.setValue(this.actors[0].id);
                }
                this.showActorDetail(this.actors[0]);
            } else {
                this.currentActor = null;
                this.currentActorIndex = 0;
                document.getElementById('emptyState').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error deleting actor:', error);
            this.showError('Kon acteur niet verwijderen');
        }
    }

    async deleteActor(actorId) {
        const confirmed = await confirmDialog(
            'Weet je zeker dat je deze acteur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
            'Acteur verwijderen'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await ActorService.delete(actorId);
            this.showSuccess('Actor deleted successfully');
            await this.loadActors();
        } catch (error) {
            console.error('Error deleting actor:', error);
            this.showError('Failed to delete actor');
        }
    }

    async openActorDetail(actor) {
        const modal = document.getElementById('actorDetailModal');
        const content = document.getElementById('actorDetailContent');

        // Get continuity data
        let continuityEntries = [];
        try {
            continuityEntries = await ActorService.getContinuity(actor.id);
        } catch (error) {
            console.error('Error loading continuity:', error);
        }

        const imageHtml = actor.profile_image_url
            ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" />`
            : `<img src="images/silhouette.svg" alt="Actor Silhouette" style="width: 200px; height: 400px; opacity: 0.4;" />`;

        content.innerHTML = `
            <div class="actor-detail-header">
                <div class="actor-detail-image">
                    <div class="actor-detail-image-container">
                        ${imageHtml}
                    </div>
                </div>
                <div class="actor-detail-info">
                    <h2 class="actor-detail-title">${this.escapeHtml(actor.actor_name)}</h2>
                    <h3 class="actor-detail-character">${this.escapeHtml(actor.character_name)}</h3>
                    
                    ${actor.email || actor.phone ? `
                        <div class="space-y-2">
                            ${actor.email ? `<p><strong>Email:</strong> ${this.escapeHtml(actor.email)}</p>` : ''}
                            ${actor.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(actor.phone)}</p>` : ''}
                        </div>
                    ` : ''}

                    ${actor.notes ? `
                        <div class="alert alert-info mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${this.escapeHtml(actor.notes)}</span>
                        </div>
                    ` : ''}

                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-primary" onclick="actorsApp.openEditActorModal('${actor.id}'); actorDetailModal.close();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Actor
                        </button>
                        <button class="btn" onclick="actorDetailModal.close();">Close</button>
                    </div>
                </div>
            </div>

            <div class="actor-detail-section">
                <h4 class="actor-detail-section-title">Physical Characteristics</h4>
                <div class="actor-detail-grid">
                    ${actor.height ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Height</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.height)}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_color ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Hair Color</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.hair_color)}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_style ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Hair Style</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.hair_style)}</div>
                        </div>
                    ` : ''}
                    ${actor.eye_color ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Eye Color</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.eye_color)}</div>
                        </div>
                    ` : ''}
                    ${actor.skin_tone ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Skin Tone</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.skin_tone)}</div>
                        </div>
                    ` : ''}
                    ${actor.body_type ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Body Type</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.body_type)}</div>
                        </div>
                    ` : ''}
                </div>

                ${actor.distinguishing_features && actor.distinguishing_features.length > 0 ? `
                    <div class="mt-4">
                        <div class="actor-detail-field-label mb-2">Distinguishing Features</div>
                        <div class="characteristic-badges">
                            ${actor.distinguishing_features.map(feature => `
                                <span class="badge badge-lg">${this.escapeHtml(feature)}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${continuityEntries.length > 0 ? `
                <div class="actor-detail-section">
                    <h4 class="actor-detail-section-title">Continuity Timeline</h4>
                    <div class="continuity-timeline">
                        ${continuityEntries.map(entry => `
                            <div class="continuity-entry">
                                <div class="continuity-entry-header">
                                    <div class="continuity-scene-info">
                                        ${entry.scene ? `Scene ${entry.scene.scene_number}` : 'General Continuity'}
                                    </div>
                                    ${entry.continuity_date ? `
                                        <div class="text-sm text-base-content/60">
                                            ${new Date(entry.continuity_date).toLocaleDateString()}
                                        </div>
                                    ` : ''}
                                </div>
                                ${entry.wardrobe_description || entry.makeup_description || entry.hair_description ? `
                                    <div class="space-y-2 text-sm">
                                        ${entry.wardrobe_description ? `<p><strong>Wardrobe:</strong> ${this.escapeHtml(entry.wardrobe_description)}</p>` : ''}
                                        ${entry.makeup_description ? `<p><strong>Makeup:</strong> ${this.escapeHtml(entry.makeup_description)}</p>` : ''}
                                        ${entry.hair_description ? `<p><strong>Hair:</strong> ${this.escapeHtml(entry.hair_description)}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="text-center py-10 text-base-content/50">
                    <p>No continuity entries yet. These will be added as you link actors to scenes.</p>
                </div>
            `}
        `;

        modal.showModal();
    }

    showSuccess(message) {
        // Simple success notification (you can enhance this)
        alert(message);
    }

    showError(message) {
        // Simple error notification (you can enhance this)
        alert(message);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
let actorsApp;
document.addEventListener('DOMContentLoaded', () => {
    actorsApp = new ActorsApp();
});

// Make actorsApp available globally for onclick handlers
window.actorsApp = actorsApp;
