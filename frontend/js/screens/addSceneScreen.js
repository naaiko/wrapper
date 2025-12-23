// =================================================================
// ADD SCENE SCREEN - Add new scenes with EditScreen styling
// =================================================================

import { EditScreen } from '../components/editScreen.js';
import { CustomDropdown } from '../components/customDropdown.js';
import { SceneService } from '../services/sceneService.js';
import { LocationService } from '../services/locationService.js';
import settingsService from '../services/settingsService.js';
import { renderTimeSelector, renderConditionsSelector } from '../utils/formFieldTemplates.js';

export class AddSceneScreen {
    constructor(options = {}) {
        this.projectId = options.projectId;
        this.locations = options.locations || [];
        this.times = options.times || [];
        this.conditions = options.conditions || [];
        this.continuityOptions = options.continuityOptions || [];
        this.onSceneAdded = options.onSceneAdded || null;
        this.onSceneScheduled = options.onSceneScheduled || null;
        
        // Form data
        this.formData = this.getEmptyFormData();
        
        // Custom dropdown instances
        this.intExtDropdown = null;
        this.locationDropdown = null;
        this.continuityDropdown = null;
        
        // Create the edit screen
        this.editScreen = new EditScreen({   
            id: 'addSceneScreen',
            title: 'Add New Scene',
            mode: 'modal',
            renderFormContent: () => this.renderForm(),
            renderContextContent: () => this.renderContext(),
            onChange: (field, value) => this.handleChange(field, value),
            onAfterRender: () => this.initializeDropdowns()
        }).init();
        
        // Add primary action
        this.addPrimaryAction();
    }
    
    getEmptyFormData() {
        return {
            scene_number: '',
            int_ext: '',
            location_id: '',
            description: '',
            time: null,
            conditions: [],
            continuity: '',
            start_date: '',
            shooting_days_count: 1
        };
    }
    
    addPrimaryAction() {
        this.editScreen.addPrimaryAction(
            'Voeg toe',
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>`,
            'primary',
            () => this.handleAdd()
        );
    }
    
    renderContext() {
        return `
            <div class="edit-screen__context-preview">
                <div class="text-sm font-semibold mb-3">Scene preview</div>
                <div id="addScenePreviewCard"></div>
            </div>
        `;
    }
    
    renderForm() {
        const features = settingsService.getAllFeatures();
        const hasContinuity = features.show_continuity;
        
        // Dynamic column widths
        const sceneNumCols = 2;
        const intExtCols = 2;
        const locationCols = 5;
        const continuityCols = 3;
        
        return `
            <div class="px-8 space-y-4">
                <!-- Scene Number, INT/EXT, Location, Continuity -->
                <div class="edit-screen__form-row edit-screen__form-row--grid">
                    <!-- Scene Number -->
                    <div class="form-control edit-screen__col-span-${sceneNumCols}">
                        <label class="label">
                            <span class="label-text font-semibold">Scene #</span>
                        </label>
                        <input 
                            type="text" 
                            name="scene_number"
                            value="${this.formData.scene_number}"
                            class="input input-bordered" 
                            placeholder="e.g., 1, 2A"
                            required 
                        />
                    </div>
                    
                    ${features.show_int_ext ? this.renderIntExtSection(intExtCols) : `<div class="edit-screen__col-span-${intExtCols}"></div>`}
                    ${features.show_location ? this.renderLocationSection(locationCols) : `<div class="edit-screen__col-span-${locationCols}"></div>`}
                    ${hasContinuity ? this.renderContinuitySection(continuityCols) : ''}
                </div>
                
                <!-- Time of Day and Conditions -->
                ${features.show_time || features.show_conditions ? `
                    <div class="edit-screen__form-row edit-screen__form-row--grid">
                        ${features.show_time ? this.renderTimeSection() : '<div class="edit-screen__col-span-6"></div>'}
                        ${features.show_conditions ? this.renderConditionsSection() : '<div class="edit-screen__col-span-6"></div>'}
                    </div>
                ` : ''}
                
                <!-- Start Date and Days Count -->
                <div class="edit-screen__form-row edit-screen__form-row--grid">
                    <div class="form-control edit-screen__col-span-6">
                        <label class="label">
                            <span class="label-text font-semibold">Start Date (Optional)</span>
                        </label>
                        <div class="dropdown w-full">
                            <div tabindex="0" role="button" class="input input-bordered w-full flex items-center gap-2 cursor-pointer" id="datePickerTrigger">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span id="selectedDateDisplay" class="flex-1">${this.formData.start_date ? new Date(this.formData.start_date).toLocaleDateString() : 'Select date...'}</span>
                            </div>
                            <div class="hidden bg-base-100 rounded-box border border-base-300 shadow-lg p-4" id="datePickerMenu" style="position: fixed; z-index: 9999; min-width: 300px;" onmousedown="event.preventDefault();">
                                <div id="calendarViewContainer">
                                    <calendar-date id="callyDatePicker" value="${this.formData.start_date || new Date().toISOString().split('T')[0]}">
                                        <svg slot="previous" aria-label="Previous" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <button type="button" slot="heading" id="callyHeadingBtn" class="font-semibold hover:underline cursor-pointer" onclick="event.stopPropagation(); window.addSceneScreen?.showMonthView()"></button>
                                        <svg slot="next" aria-label="Next" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <calendar-month id="callyMonth"></calendar-month>
                                    </calendar-date>
                                    <div id="monthGridView" class="hidden">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" onclick="event.stopPropagation(); window.addSceneScreen?.showDayView()" class="btn btn-ghost btn-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <span id="yearDisplay" class="font-semibold cursor-pointer hover:underline" onclick="event.stopPropagation(); window.addSceneScreen?.showYearView()"></span>
                                            <div class="w-8"></div>
                                        </div>
                                        <div class="grid grid-cols-3 gap-2" id="monthGrid"></div>
                                    </div>
                                    <div id="yearGridView" class="hidden">
                                        <div class="flex items-center justify-between mb-4">
                                            <button type="button" onclick="event.stopPropagation(); window.addSceneScreen?.showMonthView()" class="btn btn-ghost btn-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <span class="font-semibold">Select Year</span>
                                            <div class="w-8"></div>
                                        </div>
                                        <div class="grid grid-cols-3 gap-2" id="yearGrid"></div>
                                    </div>
                                </div>
                                <div class="divider my-2"></div>
                                <div class="flex gap-2">
                                    <button type="button" class="btn btn-sm btn-ghost flex-1" onclick="event.stopPropagation(); window.addSceneScreen?.setToday()">Today</button>
                                    <button type="button" class="btn btn-sm btn-ghost flex-1" onclick="event.stopPropagation(); window.addSceneScreen?.clearDate()">Clear</button>
                                </div>
                            </div>
                        </div>
                        <label class="label">
                            <span class="label-text-alt">Leave empty to add unscheduled</span>
                        </label>
                    </div>
                    <div class="form-control edit-screen__col-span-6">
                        <label class="label">
                            <span class="label-text font-semibold">Number of Days</span>
                        </label>
                        <input 
                            type="number" 
                            name="shooting_days_count"
                            value="${this.formData.shooting_days_count}"
                            min="1"
                            class="input input-bordered" 
                        />
                    </div>
                </div>
            </div>
        `;
    }
    
    renderIntExtSection(cols = 2) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">INT./EXT.</span>
                </label>
                <div id="intExtDropdownContainer"></div>
            </div>
        `;
    }
    
    renderLocationSection(cols = 5) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">Location</span>
                </label>
                <div id="locationDropdownContainer"></div>
            </div>
        `;
    }
    
    renderContinuitySection(cols = 3) {
        return `
            <div class="form-control edit-screen__col-span-${cols}">
                <label class="label">
                    <span class="label-text font-semibold">Continuity</span>
                </label>
                <div id="continuityDropdownContainer"></div>
            </div>
        `;
    }
    
    renderTimeSection() {
        return renderTimeSelector({
            times: this.times,
            selectedTime: this.formData.time,
            onSelectHandler: "window.addSceneScreen?.selectTime('${timeId}')",
            onClearHandler: "window.addSceneScreen?.clearTime()"
        });
    }
    
    renderConditionsSection() {
        return renderConditionsSelector({
            conditions: this.conditions,
            selectedConditions: this.formData.conditions || [],
            onToggleHandler: "window.addSceneScreen?.toggleCondition('${conditionId}')",
            onClearHandler: "window.addSceneScreen?.clearConditions()"
        });
    }
    
    initializeDropdowns() {
        // Initialize Cally calendar
        this.initializeCalendar();
        
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
                value: this.formData.int_ext,
                placeholder: 'Select...',
                size: 'md',
                onChange: (value) => this.handleChange('int_ext', value)
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
                value: this.formData.location_id,
                placeholder: 'Select...',
                size: 'md',
                searchable: true,
                allowCreate: true,
                createLabel: '+ Create new location...',
                dropdownWidth: 'auto',
                onChange: (value) => this.handleChange('location_id', value),
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
                value: this.formData.continuity,
                placeholder: 'Select...',
                size: 'md',
                dropdownWidth: 'auto',
                escapeOverflow: true,
                onChange: (value) => this.handleChange('continuity', value)
            });
            this.continuityDropdown.render();
        }
        
        // Attach form field listeners
        this.attachFormListeners();
        
        // Load initial preview
        this.updatePreview();
    }
    
    attachFormListeners() {
        // Scene number input
        const sceneNumberInput = document.querySelector('input[name="scene_number"]');
        if (sceneNumberInput) {
            sceneNumberInput.addEventListener('input', (e) => {
                this.handleChange('scene_number', e.target.value);
            });
        }
        
        // Shooting days count input
        const daysInput = document.querySelector('input[name="shooting_days_count"]');
        if (daysInput) {
            daysInput.addEventListener('input', (e) => {
                this.handleChange('shooting_days_count', e.target.value);
            });
        }
    }
    
    handleChange(field, value) {
        this.formData[field] = value;
        this.updatePreview();
    }

    async handleCreateLocation() {
        const name = prompt('Enter location name:');
        if (!name || !name.trim()) return;

        try {
            const newLocation = await LocationService.create(this.projectId, {
                name: name.trim()
            });

            // Add to local array and sort
            this.locations.push(newLocation);
            this.locations.sort((a, b) => a.name.localeCompare(b.name));

            // Update dropdown options
            const locationOptions = this.locations.map(loc => ({
                value: loc.id,
                label: loc.name
            }));
            this.locationDropdown.updateOptions(locationOptions);

            // Select the new location
            this.locationDropdown.setValue(newLocation.id);

            // Update form data
            this.handleChange('location_id', newLocation.id);
        } catch (error) {
            console.error('Failed to create location:', error);
            alert('Failed to create location. Please try again.');
        }
    }
    
    handleDateChange(dateValue) {
        this.formData.start_date = dateValue;
        
        // Update display
        const display = document.getElementById('selectedDateDisplay');
        if (display) {
            display.textContent = dateValue ? new Date(dateValue).toLocaleDateString() : 'Select date...';
        }
        
        // Update preview
        this.updatePreview();
        
        // Close dropdown
        this.closeDatePicker();
    }
    
    initializeCalendar() {
        const callyPicker = document.getElementById('callyDatePicker');
        if (!callyPicker) return;
        
        // Initialize current date
        this.currentCalendarDate = callyPicker.value ? new Date(callyPicker.value) : new Date();
        
        // Update heading text
        this.updateHeadingText();
        
        // Setup dropdown positioning like CustomDropdown
        const trigger = document.getElementById('datePickerTrigger');
        const menu = document.getElementById('datePickerMenu');
        
        if (trigger && menu) {
            // Toggle dropdown on trigger click
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                if (menu.classList.contains('hidden')) {
                    this.openDatePicker();
                } else {
                    this.closeDatePicker();
                }
            });
            
            // Prevent clicks inside menu from closing dropdown
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!menu.classList.contains('hidden') && !trigger.contains(e.target) && !menu.contains(e.target)) {
                    this.closeDatePicker();
                }
            });
        }
        
        // Listen to date changes
        callyPicker.addEventListener('change', (e) => {
            this.handleDateChange(e.target.value);
        });
        
        // Listen to month navigation (when user clicks prev/next)
        callyPicker.addEventListener('focusday', (e) => {
            this.currentCalendarDate = e.detail;
            this.updateHeadingText();
        });
    }
    
    openDatePicker() {
        const trigger = document.getElementById('datePickerTrigger');
        const menu = document.getElementById('datePickerMenu');
        
        if (!trigger || !menu) return;
        
        // Move menu to body (portal out of form) to escape overflow constraints
        if (!menu.hasAttribute('data-portaled')) {
            document.body.appendChild(menu);
            menu.setAttribute('data-portaled', 'true');
        }
        
        menu.classList.remove('hidden');
        
        // Position menu relative to button (like CustomDropdown does)
        requestAnimationFrame(() => {
            const buttonRect = trigger.getBoundingClientRect();
            
            // Position above the trigger
            const top = buttonRect.top - menu.offsetHeight - 4;
            const left = buttonRect.left;
            
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
            // Let menu use its natural width (defined in HTML: min-width: 300px)
        });
    }
    
    closeDatePicker() {
        const menu = document.getElementById('datePickerMenu');
        if (menu) {
            menu.classList.add('hidden');
            // Note: We keep menu in body (don't move back) for performance
        }
    }
    
    updateHeadingText() {
        const headingBtn = document.getElementById('callyHeadingBtn');
        if (!headingBtn) return;
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[this.currentCalendarDate.getMonth()];
        const year = this.currentCalendarDate.getFullYear();
        
        headingBtn.textContent = `${month} ${year}`;
    }
    
    showDayView() {
        document.getElementById('callyDatePicker').classList.remove('hidden');
        document.getElementById('monthGridView').classList.add('hidden');
        document.getElementById('yearGridView').classList.add('hidden');
    }
    
    showMonthView() {
        document.getElementById('callyDatePicker').classList.add('hidden');
        document.getElementById('monthGridView').classList.remove('hidden');
        document.getElementById('yearGridView').classList.add('hidden');
        
        // Update year display
        const yearDisplay = document.getElementById('yearDisplay');
        if (yearDisplay) {
            yearDisplay.textContent = this.currentCalendarDate.getFullYear();
        }
        
        // Render month grid
        this.renderMonthGrid();
    }
    
    showYearView() {
        document.getElementById('callyDatePicker').classList.add('hidden');
        document.getElementById('monthGridView').classList.add('hidden');
        document.getElementById('yearGridView').classList.remove('hidden');
        
        // Render year grid
        this.renderYearGrid();
    }
    
    renderMonthGrid() {
        const monthGrid = document.getElementById('monthGrid');
        if (!monthGrid) return;
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = this.currentCalendarDate.getMonth();
        
        monthGrid.innerHTML = monthNames.map((name, index) => {
            const isSelected = index === currentMonth;
            return `<button type="button" 
                class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}" 
                onclick="event.stopPropagation(); window.addSceneScreen?.selectMonth(${index})">
                ${name}
            </button>`;
        }).join('');
    }
    
    renderYearGrid() {
        const yearGrid = document.getElementById('yearGrid');
        if (!yearGrid) return;
        
        const currentYear = this.currentCalendarDate.getFullYear();
        const years = [];
        
        // Show current year ± 5 years (11 years total)
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            years.push(i);
        }
        
        yearGrid.innerHTML = years.map(year => {
            const isSelected = year === currentYear;
            return `<button type="button" 
                class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}" 
                onclick="event.stopPropagation(); window.addSceneScreen?.selectYear(${year})">
                ${year}
            </button>`;
        }).join('');
    }
    
    selectMonth(monthIndex) {
        // Update current date to selected month
        this.currentCalendarDate.setMonth(monthIndex);
        
        // Update Cally calendar
        const callyPicker = document.getElementById('callyDatePicker');
        if (callyPicker) {
            const dateStr = this.currentCalendarDate.toISOString().split('T')[0];
            callyPicker.focusedDate = dateStr;
        }
        
        // Update heading and show day view
        this.updateHeadingText();
        this.showDayView();
    }
    
    selectYear(year) {
        // Update current date to selected year
        this.currentCalendarDate.setFullYear(year);
        
        // Show month view to select month
        this.showMonthView();
    }
    
    setToday() {
        const today = new Date().toISOString().split('T')[0];
        this.handleDateChange(today);
        
        // Update Cally calendar
        const callyPicker = document.getElementById('callyDatePicker');
        if (callyPicker) {
            callyPicker.value = today;
        }
    }
    
    clearDate() {
        this.formData.start_date = '';
        
        // Clear Cally calendar
        const callyPicker = document.getElementById('callyDatePicker');
        if (callyPicker) {
            callyPicker.value = '';
        }
        
        // Update display
        const display = document.getElementById('selectedDateDisplay');
        if (display) {
            display.textContent = 'Select date...';
        }
        
        // Update preview
        this.updatePreview();
        
        // Close dropdown
        this.closeDatePicker();
    }
    
    selectTime(timeId) {
        this.formData.time = timeId;
        this.updateTimeClearButton();
        this.updatePreview();
        
        // Update button styles
        const timeButtons = document.querySelectorAll('[data-time-id]');
        timeButtons.forEach(btn => {
            if (btn.dataset.timeId === timeId) {
                btn.className = 'btn btn-sm btn-primary';
            } else {
                btn.className = 'btn btn-sm border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200';
            }
        });
    }
    
    clearTime() {
        this.formData.time = null;
        this.updateTimeClearButton();
        this.updatePreview();
        
        const timeButtons = document.querySelectorAll('[data-time-id]');
        timeButtons.forEach(btn => {
            btn.className = 'btn btn-sm border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200';
        });
    }
    
    updateTimeClearButton() {
        const clearBtn = document.getElementById('clearTimeBtn');
        if (!clearBtn) return;
        
        if (this.formData.time) {
            clearBtn.classList.remove('invisible', 'pointer-events-none');
        } else {
            clearBtn.classList.add('invisible', 'pointer-events-none');
        }
    }
    
    toggleCondition(conditionId) {
        const conditions = this.formData.conditions || [];
        const index = conditions.indexOf(conditionId);
        
        if (index > -1) {
            conditions.splice(index, 1);
        } else {
            conditions.push(conditionId);
        }
        
        this.formData.conditions = conditions;
        this.updateConditionsClearButton();
        this.updatePreview();
        
        // Update button style
        const btn = document.querySelector(`[data-condition-id="${conditionId}"]`);
        if (btn) {
            if (conditions.includes(conditionId)) {
                btn.className = 'btn btn-sm btn-primary';
            } else {
                btn.className = 'btn btn-sm border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200';
            }
        }
    }
    
    clearConditions() {
        this.formData.conditions = [];
        this.updateConditionsClearButton();
        this.updatePreview();
        
        const conditionButtons = document.querySelectorAll('[data-condition-id]');
        conditionButtons.forEach(btn => {
            btn.className = 'btn btn-sm border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200';
        });
    }
    
    updateConditionsClearButton() {
        const clearBtn = document.getElementById('clearConditionsBtn');
        if (!clearBtn) return;
        
        if (this.formData.conditions && this.formData.conditions.length > 0) {
            clearBtn.classList.remove('invisible', 'pointer-events-none');
        } else {
            clearBtn.classList.add('invisible', 'pointer-events-none');
        }
    }
    
    updatePreview() {
        const previewContainer = document.getElementById('addScenePreviewCard');
        if (!previewContainer) return;
        
        // Import renderSceneCard dynamically
        import('../components/sceneCardRenderer.js').then(module => {
            const { renderSceneCard } = module;
            
            // Clear previous preview
            previewContainer.innerHTML = '';
            
            // Build temporary scene object from formData
            const previewScene = {
                scene_number: this.formData.scene_number || '?',
                int_ext: this.formData.int_ext,
                location_id: this.formData.location_id,
                time: this.formData.time,
                conditions: this.formData.conditions || [],
                continuity: this.formData.continuity,
                // Use first shooting date for preview if available
                shooting_dates: this.formData.start_date ? [this.formData.start_date] : null
            };
            
            // Render preview card
            const card = renderSceneCard(previewScene, {
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
    
    async handleAdd() {
        // Validation
        if (!this.formData.scene_number.trim()) {
            alert('Scene number is required');
            return;
        }
        
        try {
            let startDateStr = this.formData.start_date;
            
            // Check if start date is a non-shooting day
            if (startDateStr) {
                const nonShootingDays = await this.getNonShootingDays();
                
                if (nonShootingDays.includes(startDateStr)) {
                    const newStartDate = await this.promptAlternativeDate(startDateStr, nonShootingDays);
                    
                    if (newStartDate === null) {
                        // User chose "Terug" - stay in modal
                        return;
                    }
                    
                    // User chose alternative date - update form data
                    startDateStr = newStartDate;
                    this.formData.start_date = newStartDate;
                    
                    // Update display
                    const display = document.getElementById('selectedDateDisplay');
                    if (display) {
                        display.textContent = new Date(newStartDate).toLocaleDateString();
                    }
                }
            }
            
            // Prepare scene data - create UNSCHEDULED first
            const sceneData = {
                scene_number: this.formData.scene_number.trim(),
                int_ext: this.formData.int_ext || null,
                location_id: this.formData.location_id || null,
                description: this.formData.description?.trim() || '', // Empty string instead of null
                time: this.formData.time || null,
                conditions: this.formData.conditions || [],
                continuity: this.formData.continuity || null,
                shooting_dates: null, // Will be set by placeSceneWithSplitHandling if start date provided
                shooting_days_count: parseInt(this.formData.shooting_days_count) || 1
            };
            
            // Create scene (SceneService.create expects projectId and sceneData separately)
            const newScene = await SceneService.create(this.projectId, sceneData);
            
            // If start date was provided, schedule it (with automatic splitting)
            if (startDateStr) {
                const daysCount = parseInt(this.formData.shooting_days_count) || 1;
                
                // Call the callback to let calendar handle placement with split detection
                if (this.onSceneScheduled) {
                    await this.onSceneScheduled(newScene, startDateStr, daysCount);
                }
            }
            
            // Close and reset
            this.close();
            
            // Trigger callback
            if (this.onSceneAdded) {
                this.onSceneAdded(newScene);
            }
        } catch (error) {
            console.error('Error adding scene:', error);
            alert('Failed to add scene: ' + (error.message || 'Unknown error'));
        }
    }
    
    open() {
        // Reset form data
        this.formData = this.getEmptyFormData();
        
        // Make globally accessible for onclick handlers
        window.addSceneScreen = this;
        
        this.editScreen.open();
        
        // Always show day view when opening
        setTimeout(() => {
            if (this.showDayView) {
                this.showDayView();
            }
        }, 0);
    }
    
    close() {
        this.editScreen.close();
        
        // Clean up global reference
        window.addSceneScreen = null;
    }
    
    updateOptions(options) {
        if (options.locations) this.locations = options.locations;
        if (options.times) this.times = options.times;
        if (options.conditions) this.conditions = options.conditions;
        if (options.continuityOptions) this.continuityOptions = options.continuityOptions;
    }
    
    async getNonShootingDays() {
        // Get non-shooting days from project (via global calendar state)
        // We need to get this from the calendar-toastui's currentProject
        // For now, use the service to get project data
        const { data, error } = await window.supabase
            .from('projects')
            .select('non_shooting_days')
            .eq('id', this.projectId)
            .single();
        
        if (error) {
            console.error('Error fetching non-shooting days:', error);
            return [];
        }
        
        return data?.non_shooting_days || [];
    }
    
    async promptAlternativeDate(originalDate, nonShootingDays) {
        const original = new Date(originalDate);
        
        // Find next shooting day
        let nextDate = new Date(original);
        nextDate.setDate(nextDate.getDate() + 1);
        while (nonShootingDays.includes(nextDate.toISOString().split('T')[0])) {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        
        // Find previous shooting day
        let prevDate = new Date(original);
        prevDate.setDate(prevDate.getDate() - 1);
        while (nonShootingDays.includes(prevDate.toISOString().split('T')[0])) {
            prevDate.setDate(prevDate.getDate() - 1);
        }
        
        // Create modal
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal modal-open';
            modal.innerHTML = `
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Non-Shooting Day</h3>
                    <p class="mb-6">De geselecteerde startdatum (${original.toLocaleDateString()}) is een non-shooting day.</p>
                    
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-primary" data-date="${prevDate.toISOString().split('T')[0]}">
                            Laatste mogelijke dag (${prevDate.toLocaleDateString()})
                        </button>
                        <button class="btn btn-primary" data-date="${nextDate.toISOString().split('T')[0]}">
                            Eerstvolgende mogelijke dag (${nextDate.toLocaleDateString()})
                        </button>
                        <button class="btn btn-ghost" data-back="true">
                            Terug
                        </button>
                    </div>
                </div>
                <div class="modal-backdrop bg-black/50"></div>
            `;
            
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const newDate = btn.dataset.date;
                const goBack = btn.dataset.back;
                
                modal.remove();
                
                if (goBack) {
                    resolve(null); // Return null to stay in modal
                } else {
                    resolve(newDate);
                }
            });
        });
    }
}
