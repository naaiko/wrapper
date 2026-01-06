// =================================================================
// DOCK TEMPLATE - Reusable action dock for edit screens
// =================================================================

/**
 * Render action dock with primary and secondary actions
 * @param {Object} options
 * @param {Array} options.secondaryActions - Array of {label, icon, variant, handler}
 * @param {Object} options.primaryAction - {label, variant, handler}
 * @returns {string} HTML string
 */
export function renderActionDock(options = {}) {
    const { secondaryActions = [], primaryAction = null } = options;
    
    const secondaryHTML = secondaryActions.map(action => `
        <button type="button" class="btn btn-${action.variant || 'ghost'} btn-sm">
            ${action.icon || ''}
            ${action.label}
        </button>
    `).join('');
    
    const primaryHTML = primaryAction ? `
        <button type="button" class="btn btn-${primaryAction.variant || 'primary'} flex-1">
            ${primaryAction.label}
        </button>
    ` : '';
    
    return `
        <div class="edit-screen__action-dock">
            <div class="edit-screen__actions">
                <!-- Secondary actions (left) -->
                <div class="edit-screen__actions-secondary">
                    ${secondaryHTML}
                </div>
                <!-- Primary action (right) -->
                <div class="edit-screen__actions-primary">
                    ${primaryHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach event handlers to dock buttons
 * @param {HTMLElement} dockElement - The dock container element
 * @param {Object} options
 * @param {Array} options.secondaryActions - Array of {label, icon, variant, handler}
 * @param {Object} options.primaryAction - {label, variant, handler}
 * @param {Object} currentData - Current scene/data being edited
 */
export function attachDockHandlers(dockElement, options = {}, currentData = null) {
    const { secondaryActions = [], primaryAction = null } = options;
    
    // Attach secondary action handlers
    const secondaryButtons = dockElement.querySelectorAll('.edit-screen__actions-secondary .btn');
    secondaryButtons.forEach((button, index) => {
        const action = secondaryActions[index];
        if (action && action.handler) {
            button.addEventListener('click', () => action.handler(currentData));
        }
    });
    
    // Attach primary action handler
    if (primaryAction && primaryAction.handler) {
        const primaryButton = dockElement.querySelector('.edit-screen__actions-primary .btn');
        if (primaryButton) {
            primaryButton.addEventListener('click', () => primaryAction.handler(currentData));
        }
    }
}
