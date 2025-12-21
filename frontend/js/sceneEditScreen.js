// =================================================================
// SCENE EDIT SCREEN - Implementatie met EditScreen Component
// =================================================================
// Dit is een voorbeeld van hoe de scene drawer gemigreerd kan worden
// naar het nieuwe EditScreen systeem
//
// MIGRATIE STAPPEN:
// 1. Importeer EditScreen component
// 2. Maak SceneEditScreen instance
// 3. Verplaats form HTML naar renderFormContent
// 4. Verplaats context HTML naar renderContextContent  
// 5. Verplaats save-logica naar onSave
// 6. Verwijder oude drawer HTML en JavaScript
// =================================================================

import { EditScreen } from './components/editScreen.js';
import { CustomDropdown } from './components/customDropdown.js';
import { SceneService } from './services/sceneService.js';
import { LocationService } from './services/locationService.js';
import settingsService from './services/settingsService.js';
import { buildSceneHeading } from './components/sceneCardRenderer.js';

export class SceneEditScreen {
    constructor(options = {}) {
        this.locations = options.locations || [];
        this.times = options.times || [];
        this.conditions = options.conditions || [];
        this.continuityOptions = options.continuityOptions || [];
        this.onSceneUpdated = options.onSceneUpdated || null;
        this.onSceneDeleted = options.onSceneDeleted || null;
        this.onSceneUnscheduled = options.onSceneUnscheduled || null;
        
        // Custom dropdown instances
        this.intExtDropdown = null;
        this.locationDropdown = null;
        this.continuityDropdown = null;
        
        // Create the edit screen
        this.editScreen = new EditScreen({   
            id: 'sceneEditScreen',
            title: 'Edit Scene',
            renderFormContent: (scene) => this.renderForm(scene),
            renderContextContent: (scene) => this.renderContext(scene),
            onChange: (field, value, scene) => this.handleChange(field, value, scene),
            onAfterRender: (scene) => this.initializeDropdowns(scene)
        }).init();
        
        // Add secondary actions
        this.addSecondaryActions();
    }
    
    /**
     * Render the form content
     */
    renderForm(scene) {
        const features = settingsService.getAllFeatures();
        const hasContinuity = features.show_continuity;
        
        // Dynamic column widths based on continuity visibility
        const sceneNumCols = 2;
        const intExtCols = 2;
        const locationCols = 5;
        const continuityCols = 3;
        
        return `
            ${this.renderShootingDatesSection(scene)}
            
            <!-- First Row: Scene Number, INT/EXT, Location, Continuity -->
            <div class="edit-screen__form-row edit-screen__form-row--grid">
                <!-- Scene Number -->
                <div class="form-control edit-screen__col-span-${sceneNumCols}">
                    <label class="label">
                        <span class="label-text font-semibold">Scene #</span>
                    </label>
                    <input 
                        type="text" 
                        name="scene_number"
                        value="${scene?.scene_number || ''}"
                        class="input input-bordered" 
                        placeholder="e.g., 1, 2A"
                        required 
                    />
                </div>
                
                ${features.show_int_ext ? this.renderIntExtSection(scene, intExtCols) : `<div class="edit-screen__col-span-${intExtCols}"></div>`}
                ${features.show_location ? this.renderLocationSection(scene, locationCols) : `<div class="edit-screen__col-span-${locationCols}"></div>`}
                ${hasContinuity ? this.renderContinuitySection(scene, continuityCols) : ''}
            </div>
            
            ${features.show_time ? this.renderTimeSection(scene) : ''}
            ${features.show_conditions ? this.renderConditionsSection(scene) : ''}
        `;
    }
    
    /**
     * Render INT/EXT section (as custom dropdown)
     */
    renderIntExtSection(scene, cols = 2) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">INT/EXT</span>
                </label>
                <div id="intExtDropdownContainer"></div>
            </div>
        `;
    }
    
    /**
     * Render location section
     */
    renderLocationSection(scene, cols = 6) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">Location</span>
                </label>
                <div id="locationDropdownContainer"></div>
            </div>
        `;
    }
    
    /**
     * Render time of day section
     */
    renderTimeSection(scene) {
        const enabledTimes = this.times.filter(t => t.enabled);
        
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Time of Day</span>
                </label>
                <div class="flex flex-wrap gap-2" id="timeSelector">
                    ${enabledTimes.map(time => `
                        <button 
                            type="button"
                            class="btn btn-sm ${scene?.time === time.id ? 'btn-primary' : 'btn-outline'}"
                            data-time-id="${time.id}"
                        >
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${time.icon}
                            </svg>
                            ${time.label}
                        </button>
                    `).join('')}
                </div>

            </div>
        `;
    }
    
    /**
     * Render conditions section
     */
    renderConditionsSection(scene) {
        const enabledConditions = this.conditions.filter(c => c.enabled);
        const sceneConditions = scene?.conditions || [];
        
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Conditions</span>
                </label>
                <div class="flex flex-wrap gap-2" id="conditionsSelector">
                    ${enabledConditions.map(condition => `
                        <button 
                            type="button"
                            class="btn btn-sm ${sceneConditions.includes(condition.id) ? 'btn-primary' : 'btn-outline'}"
                            data-condition-id="${condition.id}"
                        >
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${condition.icon}
                            </svg>
                            ${condition.label}
                        </button>
                    `).join('')}
                </div>

            </div>
        `;
    }
    
    /**
     * Render continuity section
     */
    renderContinuitySection(scene, cols = 3) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">Continuity</span>
                </label>
                <div id="continuityDropdownContainer"></div>
            </div>
        `;
    }
    
    /**
     * Render shooting dates section (read-only info)
     */
    renderShootingDatesSection(scene) {
        const dates = scene?.shooting_dates || [];
        let datesText = 'Not scheduled';
        
        if (dates.length === 1) {
            datesText = this.formatDateReadable(dates[0]);
        } else if (dates.length > 1) {
            const sortedDates = [...dates].sort();
            datesText = `${this.formatDateReadable(sortedDates[0])} - ${this.formatDateReadable(sortedDates[sortedDates.length - 1])} (${dates.length} days)`;
        }
        
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Shooting Dates</span>
                </label>
                <div class="bg-base-200 rounded-lg p-3">
                    <p class="text-sm">${datesText}</p>
                    <p class="text-xs text-base-content/60 mt-1">Drag scene in calendar to change dates</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render context content (preview)
     */
    renderContext(scene) {
        if (!scene) return '';
        
        return `
            <div class="edit-screen__context-preview">
                <div class="text-sm font-semibold mb-3">Scene preview</div>
                <div id="scenePreviewCard"></div>
            </div>
        `;
    }
    
    /**
     * Initialize custom dropdowns after form is rendered
     */
    initializeDropdowns(scene) {
        const features = settingsService.getAllFeatures();
        
        // INT/EXT Dropdown
        if (features.show_int_ext) {
            const intExtOptions = ['INT', 'EXT', 'INT/EXT', 'EXT/INT'].map(opt => ({
                value: opt,
                label: opt
            }));
            
            this.intExtDropdown = new CustomDropdown({
                containerId: 'intExtDropdownContainer',
                name: 'int_ext',
                options: intExtOptions,
                value: scene?.int_ext || '',
                placeholder: 'Select...',
                size: 'md',
                onChange: (value) => this.handleChange('int_ext', value, scene)
            });
            this.intExtDropdown.render();
        }
        
        // Location Dropdown
        if (features.show_location) {
            const locationOptions = this.locations.map(loc => ({
                value: loc.id,
                label: loc.name
            }));
            
            this.locationDropdown = new CustomDropdown({
                containerId: 'locationDropdownContainer',
                name: 'location_id',
                options: locationOptions,
                value: scene?.location_id || '',
                placeholder: 'Select location...',
                searchable: true,
                allowCreate: true,
                createLabel: '+ Create new location...',
                required: true,
                size: 'md',
                onChange: (value) => this.handleChange('location_id', value, scene),
                onCreate: () => this.handleCreateLocation()
            });
            this.locationDropdown.render();
        }
        
        // Continuity Dropdown
        if (features.show_continuity) {
            const continuityOptions = this.continuityOptions.map(opt => ({
                value: opt.id,
                label: opt.label
            }));
            
            // Add "None" option at the start
            continuityOptions.unshift({ value: '', label: 'None' });
            
            this.continuityDropdown = new CustomDropdown({
                containerId: 'continuityDropdownContainer',
                name: 'continuity',
                options: continuityOptions,
                value: scene?.continuity || '',
                placeholder: 'None',
                size: 'md',
                align: 'left',
                dropdownWidth: 'auto', // Allow dropdown to be wider than button
                onChange: (value) => this.handleChange('continuity', value, scene)
            });
            this.continuityDropdown.render();
        }
        
        // Initialize preview after dropdowns are ready
        this.updatePreview(scene);
    }
    
    /**
     * Update the preview card with current scene data
     */
    updatePreview(scene) {
        const previewContainer = document.getElementById('scenePreviewCard');
        if (!previewContainer || !scene) return;
        
        // Import renderSceneCard dynamically
        import('./components/sceneCardRenderer.js').then(module => {
            const { renderSceneCard } = module;
            
            // Clear previous preview
            previewContainer.innerHTML = '';
            
            // Render new preview card
            const card = renderSceneCard(scene, {
                locations: this.locations,
                times: this.times,
                conditions: this.conditions,
                settings: settingsService.getAllFeatures(),
                continuityOptions: this.continuityOptions,
                hideSplitIndicator: true
            });
            
            previewContainer.appendChild(card);
        });
    }
    
    /**
     * Handle field change (auto-save)
     */
    async handleChange(field, value, scene) {
        if (!scene || !scene.id) return;
        
        // Build update object
        const updates = { [field]: value };
        
        // Update scene in database
        await SceneService.update(scene.id, updates);
        
        // Update current scene data
        scene[field] = value;
        
        // If this scene is part of a split group, update all scenes in the group
        if (scene.split_group_id) {
            // This would need access to all scenes - will be handled by callback
        }
        
        // Trigger callback to refresh UI
        if (this.onSceneUpdated) {
            this.onSceneUpdated(scene.id);
        }
        
        // Update context preview
        this.updateContextPreview(scene);
    }
    
    /**
     * Handle create new location
     */
    async handleCreateLocation(prefilledName = '') {
        const name = prompt('Enter new location name:', prefilledName);
        if (!name) return;
        
        try {
            const newLocation = await LocationService.create({ name });
            
            // Add to locations list
            this.locations.push(newLocation);
            
            // Update dropdown options
            const locationOptions = this.locations.map(loc => ({
                value: loc.id,
                label: loc.name
            }));
            this.locationDropdown.updateOptions(locationOptions);
            
            // Select the new location
            this.locationDropdown.setValue(newLocation.id);
            
            // Trigger onChange to save
            await this.handleChange('location_id', newLocation.id, this.editScreen.currentData);
        } catch (error) {
            console.error('Failed to create location:', error);
            alert('Failed to create location. Please try again.');
        }
    }
    
    /**
     * Add secondary actions (delete, unschedule)
     */
    addSecondaryActions() {
        // Unschedule button
        this.editScreen.addSecondaryAction(
            'Unschedule',
            `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-off"><path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18"/><path d="M21 15.5V6a2 2 0 0 0-2-2H9.5"/><path d="M16 2v4"/><path d="M3 10h7"/><path d="M21 10h-5.5"/><path d="m2 2 20 20"/></svg>`,
            'warning',
            async (scene) => {
                if (confirm(`Unschedule scene ${scene.scene_number}?`)) {
                    await SceneService.update(scene.id, {
                        shooting_dates: [],
                        shooting_days_count: null
                    });
                    
                    if (this.onSceneUnscheduled) {
                        this.onSceneUnscheduled(scene.id);
                    }
                    
                    this.editScreen.close();
                }
            }
        );
        
        // Delete button
        this.editScreen.addSecondaryAction(
            'Delete Scene',
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>`,
            'error',
            async (scene) => {
                if (confirm(`Delete scene ${scene.scene_number}? This cannot be undone.`)) {
                    await SceneService.delete(scene.id);
                    
                    if (this.onSceneDeleted) {
                        this.onSceneDeleted(scene.id);
                    }
                    
                    this.editScreen.close();
                }
            }
        );
    }
    
    /**
     * Open the edit screen
     */
    open(scene) {
        this.editScreen.open(scene);
        
        // Add event listeners for interactive buttons after render
        this.attachInteractiveListeners();
        
        // Initialize preview card
        this.updatePreview(scene);
    }
    
    /**
     * Close the edit screen
     */
    close() {
        this.editScreen.close();
    }
    
    /**
     * Update available options (call when data changes)
     */
    updateOptions(options) {
        if (options.locations) this.locations = options.locations;
        if (options.times) this.times = options.times;
        if (options.conditions) this.conditions = options.conditions;
        if (options.continuityOptions) this.continuityOptions = options.continuityOptions;
    }
    
    /**
     * Update context preview when scene changes
     */
    updateContextPreview(scene) {
        const contextZone = this.editScreen.container.querySelector('.edit-screen__context-zone');
        if (contextZone) {
            contextZone.innerHTML = this.renderContext(scene);
            // Update the preview card
            this.updatePreview(scene);
        }
    }
    
    /**
     * Attach listeners for interactive elements
     */
    attachInteractiveListeners() {
        const scene = this.editScreen.currentData;
        if (!scene) return;
        
        // Scene number input
        const sceneNumberInput = document.querySelector('input[name="scene_number"]');
        if (sceneNumberInput) {
            sceneNumberInput.addEventListener('change', (e) => {
                this.handleChange('scene_number', e.target.value, scene);
            });
        }
        
        // Location select
        const locationSelect = document.querySelector('select[name="location_id"]');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                this.handleChange('location_id', e.target.value || null, scene);
            });
        }
        
        // Continuity select
        const continuitySelect = document.querySelector('select[name="continuity"]');
        if (continuitySelect) {
            continuitySelect.addEventListener('change', (e) => {
                this.handleChange('continuity', e.target.value || null, scene);
            });
        }
        
        // Time selector buttons
        const timeButtons = document.querySelectorAll('#timeSelector button[data-time-id]');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const timeId = btn.dataset.timeId;
                this.selectTime(timeId, scene);
            });
        });
        
        // Condition selector buttons
        const conditionButtons = document.querySelectorAll('#conditionsSelector button[data-condition-id]');
        conditionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const conditionId = btn.dataset.conditionId;
                this.toggleCondition(conditionId, scene);
            });
        });
        
        // INT/EXT select dropdown
        const intExtSelect = document.querySelector('select[name="int_ext"]');
        if (intExtSelect) {
            intExtSelect.addEventListener('change', (e) => {
                this.handleChange('int_ext', e.target.value || null, scene);
            });
        }
    }
    
    /**
     * Select time (single choice)
     */
    selectTime(timeId, scene) {
        // Update button states
        const buttons = document.querySelectorAll('#timeSelector button[data-time-id]');
        buttons.forEach(btn => {
            if (btn.dataset.timeId === timeId) {
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline');
            }
        });
        
        // Auto-save
        this.handleChange('time', timeId, scene);
    }
    
    /**
     * Toggle condition (multi-choice)
     */
    toggleCondition(conditionId, scene) {
        let conditions = scene.conditions || [];
        
        // Toggle
        const index = conditions.indexOf(conditionId);
        if (index > -1) {
            conditions.splice(index, 1);
        } else {
            conditions.push(conditionId);
        }
        
        // Update button state
        const btn = document.querySelector(`#conditionsSelector button[data-condition-id="${conditionId}"]`);
        if (btn) {
            if (conditions.includes(conditionId)) {
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline');
            }
        }
        
        // Auto-save
        this.handleChange('conditions', conditions, scene);
    }
    
    /**
     * Format date for display
     */
    formatDateReadable(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

// =================================================================
// USAGE IN MAIN APP
// =================================================================
/*
// In calendar-toastui.js, initialize once:

import { SceneEditScreen } from './sceneEditScreen.js';

let sceneEditScreen;

// After loading data:
sceneEditScreen = new SceneEditScreen({
    locations: locations,
    times: getProjectTimes(),
    conditions: getProjectConditions(),
    continuityOptions: settingsService.getContinuityOptions(),
    
    onSceneUpdated: (sceneId) => {
        // Refresh calendar and unscheduled scenes
        scenes = await SceneService.getAll(currentProject.id);
        renderCalendarEvents();
        renderUnscheduledScenes();
    },
    
    onSceneDeleted: (sceneId) => {
        // Remove from local array and refresh
        scenes = scenes.filter(s => s.id !== sceneId);
        renderCalendarEvents();
        renderUnscheduledScenes();
    },
    
    onSceneUnscheduled: (sceneId) => {
        // Refresh calendar and unscheduled scenes
        const scene = scenes.find(s => s.id === sceneId);
        if (scene) {
            scene.shooting_dates = [];
            scene.shooting_days_count = null;
        }
        renderCalendarEvents();
        renderUnscheduledScenes();
    }
});

// When user clicks on a scene (replace openSceneDrawer function):
function openSceneDrawer(event) {
    const scene = scenes.find(s => s.id === event.id);
    if (!scene) return;
    
    sceneEditScreen.open(scene);
}

// Update options when data changes:
function updateSceneEditScreenOptions() {
    sceneEditScreen.updateOptions({
        locations: locations,
        times: getProjectTimes(),
        conditions: getProjectConditions(),
        continuityOptions: settingsService.getContinuityOptions()
    });
}
*/
