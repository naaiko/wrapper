// =================================================================
// FORM FIELD TEMPLATES
// =================================================================
// Reusable templates for consistent form fields across add/edit screens

/**
 * Render time of day selector with icon buttons
 * @param {Object} options - Configuration options
 * @param {Array} options.times - Array of time objects with {id, label, icon, enabled}
 * @param {string|null} options.selectedTime - Currently selected time ID
 * @param {string} options.onSelectHandler - JavaScript onclick handler for selection
 * @param {string} options.onClearHandler - JavaScript onclick handler for clear
 * @param {string} options.selectorId - ID for the selector container (default: 'timeSelector')
 * @param {string} options.clearBtnId - ID for the clear button (default: 'clearTimeBtn')
 * @returns {string} HTML template
 */
export function renderTimeSelector(options) {
    const {
        times = [],
        selectedTime = null,
        onSelectHandler = '',
        onClearHandler = '',
        selectorId = 'timeSelector',
        clearBtnId = 'clearTimeBtn'
    } = options;
    
    const hasSelection = selectedTime !== null;
    const enabledTimes = times.filter(t => t.enabled !== false);
    
    return `
        <div class="form-control edit-screen__col-span-6">
            <label class="label">
                <span class="label-text font-semibold">Time of Day</span>
                <button 
                    type="button"
                    id="${clearBtnId}"
                    class="btn btn-ghost btn-xs text-base-content/70 hover:bg-secondary hover:text-secondary-content ${!hasSelection ? 'invisible pointer-events-none' : ''}"
                    onclick="${onClearHandler}"
                >
                    Clear
                </button>
            </label>
            <div class="flex flex-wrap gap-2 p-3 rounded-lg border border-base-300 bg-base-100 min-h-[3rem]" id="${selectorId}">
                ${enabledTimes.map(time => `
                    <button 
                        type="button"
                        class="btn btn-sm ${selectedTime === time.id ? 'btn-primary' : 'border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200'}"
                        data-time-id="${time.id}"
                        onclick="${onSelectHandler.replace('${timeId}', time.id)}"
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
 * Render conditions selector with icon buttons (multi-select)
 * @param {Object} options - Configuration options
 * @param {Array} options.conditions - Array of condition objects with {id, label, icon, enabled}
 * @param {Array} options.selectedConditions - Array of currently selected condition IDs
 * @param {string} options.onToggleHandler - JavaScript onclick handler for toggle
 * @param {string} options.onClearHandler - JavaScript onclick handler for clear all
 * @param {string} options.selectorId - ID for the selector container (default: 'conditionsSelector')
 * @param {string} options.clearBtnId - ID for the clear button (default: 'clearConditionsBtn')
 * @returns {string} HTML template
 */
export function renderConditionsSelector(options) {
    const {
        conditions = [],
        selectedConditions = [],
        onToggleHandler = '',
        onClearHandler = '',
        selectorId = 'conditionsSelector',
        clearBtnId = 'clearConditionsBtn'
    } = options;
    
    const hasSelection = selectedConditions.length > 0;
    const enabledConditions = conditions.filter(c => c.enabled !== false);
    
    return `
        <div class="form-control edit-screen__col-span-6">
            <label class="label">
                <span class="label-text font-semibold">Conditions</span>
                <button 
                    type="button"
                    id="${clearBtnId}"
                    class="btn btn-ghost btn-xs text-base-content/70 hover:bg-secondary hover:text-secondary-content ${!hasSelection ? 'invisible pointer-events-none' : ''}"
                    onclick="${onClearHandler}"
                >
                    Clear All
                </button>
            </label>
            <div class="flex flex-wrap gap-2 p-3 rounded-lg border border-base-300 bg-base-100 min-h-[3rem]" id="${selectorId}">
                ${enabledConditions.map(condition => `
                    <button 
                        type="button"
                        class="btn btn-sm ${selectedConditions.includes(condition.id) ? 'btn-primary' : 'border border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/20 hover:bg-base-200'}"
                        data-condition-id="${condition.id}"
                        onclick="${onToggleHandler.replace('${conditionId}', condition.id)}"
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
 * Render INT/EXT field section
 * @param {Object} options - Configuration options
 * @param {number} options.cols - Number of columns to span (default: 2)
 * @param {string} options.containerId - ID for the dropdown container
 * @returns {string} HTML template
 */
export function renderIntExtSection(options) {
    const {
        cols = 2,
        containerId = 'intExtDropdownContainer'
    } = options;
    
    return `
        <div class="form-control edit-screen__col-span-${cols}">
            <label class="label">
                <span class="label-text font-semibold">INT/EXT</span>
            </label>
            <div id="${containerId}"></div>
        </div>
    `;
}

/**
 * Render location selector section
 * @param {Object} options - Configuration options
 * @param {number} options.cols - Number of columns to span (default: 6)
 * @param {string} options.containerId - ID for the dropdown container
 * @returns {string} HTML template
 */
export function renderLocationSection(options) {
    const {
        cols = 6,
        containerId = 'locationDropdownContainer'
    } = options;
    
    return `
        <div class="form-control edit-screen__col-span-${cols}">
            <label class="label">
                <span class="label-text font-semibold">Location</span>
            </label>
            <div id="${containerId}"></div>
        </div>
    `;
}

/**
 * Render continuity selector section
 * @param {Object} options - Configuration options
 * @param {number} options.cols - Number of columns to span (default: 3)
 * @param {string} options.containerId - ID for the dropdown container
 * @returns {string} HTML template
 */
export function renderContinuitySection(options) {
    const {
        cols = 3,
        containerId = 'continuityDropdownContainer'
    } = options;
    
    return `
        <div class="form-control edit-screen__col-span-${cols}">
            <label class="label">
                <span class="label-text font-semibold">Continuity</span>
            </label>
            <div id="${containerId}"></div>
        </div>
    `;
}
