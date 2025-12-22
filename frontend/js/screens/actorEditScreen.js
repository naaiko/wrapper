// =================================================================
// ACTOR EDIT SCREEN - Implementation with EditScreen Component
// =================================================================
// Follows the same architecture as SceneEditScreen
// Uses the universal EditScreen component for consistency

import { EditScreen } from '../components/editScreen.js';
import { ActorService } from '../services/actorService.js';
import { renderSceneCard } from '../components/sceneCardRenderer.js';
import settingsService from '../services/settingsService.js';

export class ActorEditScreen {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.onActorUpdated = options.onActorUpdated || null;
        this.onActorDeleted = options.onActorDeleted || null;
        this.locations = options.locations || [];
        this.times = options.times || [];
        this.conditions = options.conditions || [];
        
        // Create the edit screen
        this.editScreen = new EditScreen({
            id: 'actorEditScreen',
            title: 'Edit Actor',
            height: '90vh',
            renderFormContent: (actor) => this.renderForm(actor),
            renderContextContent: (actor) => this.renderContext(actor),
            onChange: (field, value, actor) => this.handleChange(field, value, actor),
            onAfterRender: (actor) => this.initializeForm(actor)
        }).init();
        
        // Add secondary actions
        this.addSecondaryActions();
    }
    
    /**
     * Render the form content
     */
    renderForm(actor) {
        return `
            <!-- Tabs Container -->
            <div class="px-8">
                <div role="tablist" class="tabs tabs-boxed mb-2">
                    <button type="button" role="tab" class="tab tab-active" data-tab="basic-info">Basic Info</button>
                    <button type="button" role="tab" class="tab" data-tab="physical">Physical</button>
                    <button type="button" role="tab" class="tab" data-tab="scenes">Scenes</button>
                </div>
            </div>
            
            <!-- Tab Content Container -->
            <div class="px-8">
                <!-- Tab: Basic Info -->
                <div id="basicInfoTab" class="tab-panel">
                    ${this.renderBasicInfo(actor)}
                </div>
                
                <!-- Tab: Physical Characteristics -->
                <div id="physicalTab" class="tab-panel hidden">
                    ${this.renderPhysicalInfo(actor)}
                </div>
                
                <!-- Tab: Scenes -->
                <div id="scenesTab" class="tab-panel hidden">
                    ${this.renderScenesInfo(actor)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render basic info tab
     */
    renderBasicInfo(actor) {
        return `
            <!-- Actor Name (required) -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Actor Name</span>
                    <span class="label-text-alt text-error">Required</span>
                </label>
                <input 
                    type="text" 
                    name="actor_name"
                    value="${actor?.actor_name || ''}"
                    class="input input-bordered" 
                    placeholder="e.g., Emma Watson"
                    required 
                />
            </div>
            
            <!-- Character Name (required) -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Character Name</span>
                    <span class="label-text-alt text-error">Required</span>
                </label>
                <input 
                    type="text" 
                    name="character_name"
                    value="${actor?.character_name || ''}"
                    class="input input-bordered" 
                    placeholder="e.g., Sophie Maes"
                    required 
                />
            </div>
            
            <!-- First & Last Name (2 columns) -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">First Name</span>
                    </label>
                    <input 
                        type="text" 
                        name="first_name"
                        value="${actor?.first_name || ''}"
                        class="input input-bordered" 
                        placeholder="Emma"
                    />
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Last Name</span>
                    </label>
                    <input 
                        type="text" 
                        name="last_name"
                        value="${actor?.last_name || ''}"
                        class="input input-bordered" 
                        placeholder="Watson"
                    />
                </div>
            </div>
            
            <!-- Contact Info (2 columns) -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Email</span>
                    </label>
                    <input 
                        type="email" 
                        name="email"
                        value="${actor?.email || ''}"
                        class="input input-bordered" 
                        placeholder="emma@example.com"
                    />
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Phone</span>
                    </label>
                    <input 
                        type="tel" 
                        name="phone"
                        value="${actor?.phone || ''}"
                        class="input input-bordered" 
                        placeholder="+32 123 45 67 89"
                    />
                </div>
            </div>
            
            <!-- Profile Image URL -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Profile Image URL</span>
                </label>
                <input 
                    type="url" 
                    name="profile_image_url"
                    value="${actor?.profile_image_url || ''}"
                    class="input input-bordered" 
                    placeholder="https://..."
                />
                <label class="label">
                    <span class="label-text-alt">Paste a URL to an image</span>
                </label>
            </div>
            
            <!-- Notes -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Notes</span>
                </label>
                <textarea 
                    name="notes"
                    class="textarea textarea-bordered" 
                    rows="4"
                    placeholder="General notes about this actor..."
                >${actor?.notes || ''}</textarea>
            </div>
        `;
    }
    
    /**
     * Render physical characteristics tab
     */
    renderPhysicalInfo(actor) {
        return `
            <!-- Height & Body Type -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Height</span>
                    </label>
                    <input 
                        type="text" 
                        name="height"
                        value="${actor?.height || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., 170cm or 5'7\""
                    />
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Body Type</span>
                    </label>
                    <input 
                        type="text" 
                        name="body_type"
                        value="${actor?.body_type || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., Athletic, Slim"
                    />
                </div>
            </div>
            
            <!-- Hair Color & Style -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Hair Color</span>
                    </label>
                    <input 
                        type="text" 
                        name="hair_color"
                        value="${actor?.hair_color || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., Brown, Blonde"
                    />
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Hair Style</span>
                    </label>
                    <input 
                        type="text" 
                        name="hair_style"
                        value="${actor?.hair_style || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., Long, Curly"
                    />
                </div>
            </div>
            
            <!-- Eye Color & Skin Tone -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Eye Color</span>
                    </label>
                    <input 
                        type="text" 
                        name="eye_color"
                        value="${actor?.eye_color || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., Blue, Brown"
                    />
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Skin Tone</span>
                    </label>
                    <input 
                        type="text" 
                        name="skin_tone"
                        value="${actor?.skin_tone || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., Fair, Medium"
                    />
                </div>
            </div>
            
            <!-- Distinguishing Features -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Distinguishing Features</span>
                </label>
                <input 
                    type="text" 
                    name="distinguishing_features"
                    value="${actor?.distinguishing_features ? actor.distinguishing_features.join(', ') : ''}"
                    class="input input-bordered" 
                    placeholder="e.g., Scar on left cheek, Tattoo on right arm"
                />
                <label class="label">
                    <span class="label-text-alt">Separate multiple features with commas</span>
                </label>
            </div>
        `;
    }
    
    /**
     * Render scenes tab
     */
    renderScenesInfo(actor) {
        const sceneActors = actor?.scene_actors || [];
        
        if (sceneActors.length === 0) {
            return `
                <div class="text-sm text-base-content/60 p-8 text-center border border-dashed border-base-300 rounded-lg">
                    This actor is not assigned to any scenes yet.
                    <br>
                    <span class="text-xs mt-2 inline-block">Assign actors to scenes from the Scene Edit Screen.</span>
                </div>
            `;
        }
        
        return `
            <div class="space-y-2" id="actorScenesListInEdit">
                ${sceneActors.map(sa => {
                    const scene = sa.scene;
                    if (!scene) return '';
                    
                    return `
                        <div class="scene-actor-card-readonly">
                            <!-- Scene card will be rendered here by JS -->
                            <div data-scene-id="${scene.id}" data-scene-actor-id="${sa.id}"></div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    /**
     * Render context content (preview)
     */
    renderContext(actor) {
        if (!actor) return '';
        
        return `
            <div class="text-sm font-semibold mb-2">Preview</div>
            
            <!-- Compact Preview -->
            <div class="text-center p-3 bg-base-200 rounded-lg">
                <div class="text-4xl font-bold text-base-content/20 mb-2">
                    ${(actor.actor_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div class="font-semibold text-sm">${actor.actor_name || 'Actor'}</div>
                <div class="text-xs text-base-content/60">as ${actor.character_name || 'Character'}</div>
                <div class="text-xs text-base-content/40 mt-1">
                    ${actor.scene_actors?.length || 0} scene${(actor.scene_actors?.length || 0) !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Initialize form after render
     */
    async initializeForm(actor) {
        // Initialize tab switching
        this.initializeTabs();
        
        // Attach input listeners
        this.attachInputListeners(actor);
        
        // Render scene cards in Scenes tab
        await this.renderSceneCards(actor);
        
        // Update preview
        this.updatePreview(actor);
    }
    
    /**
     * Initialize tab switching
     */
    initializeTabs() {
        const editScreenElement = document.getElementById('actorEditScreen');
        if (!editScreenElement) return;
        
        const tabButtons = editScreenElement.querySelectorAll('.tabs button[role="tab"]');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('tab-active'));
                button.classList.add('tab-active');
                
                // Show/hide tab panels
                editScreenElement.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.add('hidden');
                });
                
                const panelMap = {
                    'basic-info': 'basicInfoTab',
                    'physical': 'physicalTab',
                    'scenes': 'scenesTab'
                };
                
                const targetPanel = document.getElementById(panelMap[tabId]);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                }
            });
        });
    }
    
    /**
     * Attach input change listeners
     */
    attachInputListeners(actor) {
        const inputs = document.querySelectorAll('#actorEditScreen input, #actorEditScreen textarea');
        
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleChange(input.name, input.value, actor);
            });
        });
    }
    
    /**
     * Render scene cards in Scenes tab
     */
    async renderSceneCards(actor) {
        const container = document.getElementById('actorScenesListInEdit');
        if (!container || !actor.scene_actors) return;
        
        const settings = settingsService.getAllFeatures();
        
        actor.scene_actors.forEach(sa => {
            const scene = sa.scene;
            if (!scene) return;
            
            const cardContainer = container.querySelector(`[data-scene-id="${scene.id}"]`);
            if (!cardContainer) return;
            
            const card = renderSceneCard(scene, {
                locations: this.locations,
                times: this.times,
                conditions: this.conditions,
                settings: settings,
                hideSplitIndicator: false
            });
            
            cardContainer.appendChild(card);
        });
    }
    
    /**
     * Handle field changes
     */
    async handleChange(field, value, actor) {
        if (!actor || !actor.id) return;
        
        try {
            // Special handling for distinguishing_features (comma-separated)
            let updateValue = value;
            if (field === 'distinguishing_features') {
                updateValue = value.split(',').map(f => f.trim()).filter(f => f.length > 0);
            }
            
            // Update via service
            const updates = { [field]: updateValue || null };
            await ActorService.update(actor.id, updates);
            
            // Update local data
            actor[field] = updateValue;
            
            // Update preview
            this.updatePreview(actor);
            
            // Callback
            if (this.onActorUpdated) {
                this.onActorUpdated(actor.id);
            }
            
        } catch (error) {
            console.error('Error updating actor:', error);
            alert('Failed to save changes. Please try again.');
        }
    }
    
    /**
     * Update preview
     */
    updatePreview(actor) {
        const contextZone = this.editScreen.container?.querySelector('.edit-screen__context-zone');
        if (contextZone) {
            contextZone.innerHTML = this.renderContext(actor);
        }
    }
    
    /**
     * Add secondary actions (delete)
     */
    addSecondaryActions() {
        this.editScreen.addSecondaryAction(
            'Delete Actor',
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>`,
            'error',
            async (actor) => {
                if (confirm(`Delete ${actor.actor_name}? This cannot be undone.`)) {
                    await ActorService.delete(actor.id);
                    
                    if (this.onActorDeleted) {
                        this.onActorDeleted(actor.id);
                    }
                    
                    this.editScreen.close();
                }
            }
        );
    }
    
    /**
     * Open the edit screen
     */
    async open(actorId) {
        try {
            // Load actor with scene_actors
            const actor = await ActorService.getById(actorId);
            
            if (!actor) {
                console.error('Actor not found for id:', actorId);
                return;
            }
            
            this.editScreen.open(actor);
        } catch (error) {
            console.error('Error in ActorEditScreen.open():', error);
        }
    }
    
    /**
     * Close the edit screen
     */
    close() {
        this.editScreen.close();
    }
    
    /**
     * Update available options
     */
    updateOptions(options) {
        if (options.locations) this.locations = options.locations;
        if (options.times) this.times = options.times;
        if (options.conditions) this.conditions = options.conditions;
    }
}
