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
        
        // Create the edit screen
        this.editScreen = new EditScreen({
            id: 'sceneEditScreen',
            title: 'Edit Scene',
            height: '75vh',
            renderFormContent: (scene) => this.renderForm(scene),
            renderContextContent: (scene) => this.renderContext(scene),
            onSave: (formData, scene) => this.handleSave(formData, scene)
        }).init();
        
        // Add secondary actions
        this.addSecondaryActions();
    }
    
    /**
     * Render the form content
     */
    renderForm(scene) {
        const features = settingsService.getAllFeatures();
        
        return `
            <!-- Scene Number -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Scene Number</span>
                </label>
                <input 
                    type="text" 
                    name="scene_number"
                    value="${scene?.scene_number || ''}"
                    class="input input-bordered" 
                    placeholder="e.g., 1, 2A, 15B"
                    required 
                />
            </div>
            
            ${features.show_int_ext ? this.renderIntExtSection(scene) : ''}
            ${features.show_location ? this.renderLocationSection(scene) : ''}
            ${features.show_time ? this.renderTimeSection(scene) : ''}
            ${features.show_conditions ? this.renderConditionsSection(scene) : ''}
            ${features.show_continuity ? this.renderContinuitySection(scene) : ''}
            ${this.renderShootingDatesSection(scene)}
        `;
    }
    
    /**
     * Render INT/EXT section
     */
    renderIntExtSection(scene) {
        const options = ['INT', 'EXT', 'INT/EXT', 'EXT/INT'];
        
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Interior / Exterior</span>
                </label>
                <div class="edit-screen__toggle-group" style="grid-template-columns: repeat(4, 1fr);">
                    ${options.map(opt => `
                        <label class="btn ${scene?.int_ext === opt ? 'btn-primary' : 'btn-outline'}">
                            <input 
                                type="radio" 
                                name="int_ext" 
                                value="${opt}" 
                                class="hidden"
                                ${scene?.int_ext === opt ? 'checked' : ''}
                            />
                            <span>${opt}.</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render location section
     */
    renderLocationSection(scene) {
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Location</span>
                </label>
                <select name="location_id" class="select select-bordered" required>
                    <option value="">Select location...</option>
                    ${this.locations.map(loc => `
                        <option value="${loc.id}" ${scene?.location_id === loc.id ? 'selected' : ''}>
                            ${loc.name}
                        </option>
                    `).join('')}
                    <option value="CREATE_NEW">+ Create new location...</option>
                </select>
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
                            onclick="selectTime('${time.id}')"
                        >
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${time.icon}
                            </svg>
                            ${time.label}
                        </button>
                    `).join('')}
                </div>
                <input type="hidden" name="time" value="${scene?.time || ''}" id="timeInput" />
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
                            onclick="toggleCondition('${condition.id}')"
                        >
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                ${condition.icon}
                            </svg>
                            ${condition.label}
                        </button>
                    `).join('')}
                </div>
                <input type="hidden" name="conditions" value="${JSON.stringify(sceneConditions)}" id="conditionsInput" />
            </div>
        `;
    }
    
    /**
     * Render continuity section
     */
    renderContinuitySection(scene) {
        return `
            <div class="form-control">
                <label class="label">
                    <span class="label-text font-semibold">Continuity</span>
                </label>
                <select name="continuity" class="select select-bordered">
                    <option value="">None</option>
                    ${this.continuityOptions.map(opt => `
                        <option 
                            value="${opt.id}" 
                            ${scene?.continuity === opt.id ? 'selected' : ''}
                            title="${opt.description || ''}"
                        >
                            ${opt.label}
                        </option>
                    `).join('')}
                </select>
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
        
        // Build preview of scene heading
        const heading = buildSceneHeading(scene, {
            locations: this.locations,
            times: this.times,
            settings: settingsService.getAllFeatures(),
            continuityOptions: this.continuityOptions
        });
        
        return `
            <div class="edit-screen__context-preview">
                <div class="text-xs text-base-content/60 mb-1">Scene Heading Preview:</div>
                <div class="font-mono font-semibold text-sm">${heading}</div>
            </div>
        `;
    }
    
    /**
     * Handle save
     */
    async handleSave(formData, scene) {
        // Check for CREATE_NEW location
        if (formData.location_id === 'CREATE_NEW') {
            // TODO: Show location creation modal
            alert('Location creation modal would open here');
            throw new Error('Location creation not yet implemented');
        }
        
        // Parse conditions from JSON string
        if (formData.conditions) {
            try {
                formData.conditions = JSON.parse(formData.conditions);
            } catch (e) {
                formData.conditions = [];
            }
        }
        
        // Convert empty strings to null
        if (formData.time === '') formData.time = null;
        if (formData.continuity === '') formData.continuity = null;
        
        // Update scene
        await SceneService.update(scene.id, formData);
        
        // Callback
        if (this.onSceneUpdated) {
            this.onSceneUpdated(scene.id);
        }
    }
    
    /**
     * Add secondary actions (delete, unschedule)
     */
    addSecondaryActions() {
        // Unschedule button
        this.editScreen.addSecondaryAction(
            'Unschedule',
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>`,
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
     * Attach listeners for interactive elements
     */
    attachInteractiveListeners() {
        // Time selector buttons
        const timeButtons = document.querySelectorAll('#timeSelector button[data-time-id]');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const timeId = btn.dataset.timeId;
                this.selectTime(timeId);
            });
        });
        
        // Condition selector buttons
        const conditionButtons = document.querySelectorAll('#conditionsSelector button[data-condition-id]');
        conditionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const conditionId = btn.dataset.conditionId;
                this.toggleCondition(conditionId);
            });
        });
        
        // INT/EXT radio buttons
        const intExtRadios = document.querySelectorAll('input[name="int_ext"]');
        intExtRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateIntExtUI();
            });
        });
    }
    
    /**
     * Select time (single choice)
     */
    selectTime(timeId) {
        // Update hidden input
        document.getElementById('timeInput').value = timeId;
        
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
    }
    
    /**
     * Toggle condition (multi-choice)
     */
    toggleCondition(conditionId) {
        const input = document.getElementById('conditionsInput');
        let conditions = [];
        
        try {
            conditions = JSON.parse(input.value);
        } catch (e) {
            conditions = [];
        }
        
        // Toggle
        const index = conditions.indexOf(conditionId);
        if (index > -1) {
            conditions.splice(index, 1);
        } else {
            conditions.push(conditionId);
        }
        
        // Update hidden input
        input.value = JSON.stringify(conditions);
        
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
    }
    
    /**
     * Update INT/EXT UI when radio changes
     */
    updateIntExtUI() {
        const labels = document.querySelectorAll('label:has(input[name="int_ext"])');
        const radios = document.querySelectorAll('input[name="int_ext"]');
        
        radios.forEach((radio, index) => {
            if (radio.checked) {
                labels[index].classList.remove('btn-outline');
                labels[index].classList.add('btn-primary');
            } else {
                labels[index].classList.remove('btn-primary');
                labels[index].classList.add('btn-outline');
            }
        });
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
