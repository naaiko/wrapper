// =================================================================
// EDIT SCREEN COMPONENT
// =================================================================
// Universal bottom sheet / slide-up panel architecture
// Provides consistent structure for all edit screens in the app
//
// ARCHITECTURAL PRINCIPLES:
// 1. Fixed zone structure with clear visual hierarchy
// 2. Scroll behavior: only form zone scrolls, all others fixed
// 3. DaisyUI-based forms with compact design
// 4. Mobile-first responsive behavior
// 5. Auto-save pattern (onChange callbacks, no save button)
//
// LAYOUT STRUCTURE (top to bottom):
// 1. Header (fixed) - Title
// 2. Separator - Visual divider
// 3. Form Zone (scrollable) - All editable fields, takes remaining space
// 4. Separator - Visual divider
// 5. Context Zone (fixed, variable height) - Preview/tips
// 6. Action Zone (fixed) - Action buttons
// 7. Bottom Padding - Spacing from screen edge
// 8. Close Button (top-right) - Dismiss affordance
//
// USAGE:
// Extend this class and implement:
// - renderFormContent(): Build form fields
// - renderContextContent(): Build preview/tips
// - onChange handler: Auto-save on field changes
// =================================================================

export class EditScreen {
    constructor(options = {}) {
        this.id = options.id || 'editScreen';
        this.title = options.title || 'Edit';
        this.height = options.height || '85vh'; // Default height
        this.onChange = options.onChange || null; // Auto-save on change
        this.onCancel = options.onCancel || null;
        this.onDelete = options.onDelete || null;
        this.onAfterRender = options.onAfterRender || null; // Called after form is rendered
        
        // Callbacks for content rendering
        this.renderFormContent = options.renderFormContent || null;
        this.renderContextContent = options.renderContextContent || null;
        
        // Internal state
        this.isOpen = false;
        this.currentData = null;
        
        // DOM references (created on init)
        this.container = null;
        this.backdrop = null;
        this.formZone = null;
        this.actionZone = null;
        this.contextZone = null;
        this.closeZone = null;
    }

    /**
     * Initialize the edit screen and inject into DOM
     */
    init() {
        this.createDOM();
        this.attachEventListeners();
        return this;
    }

    /**
     * Create the DOM structure for the edit screen
     */
    createDOM() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.id = `${this.id}Backdrop`;
        this.backdrop.className = 'fixed inset-0 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 z-[99]';
        document.body.appendChild(this.backdrop);

        // Create main container
        this.container = document.createElement('div');
        this.container.id = this.id;
        this.container.className = 'edit-screen';
        this.container.style.height = this.height;
        
        // Build internal structure
        this.container.innerHTML = `
            <!-- Drag Handle (visual affordance) -->
            <div class="edit-screen__handle">
                <div class="edit-screen__handle-bar"></div>
            </div>

            <!-- Close Zone (top-right) -->
            <div class="edit-screen__close-zone">
                <button class="btn btn-secondary btn-circle btn-sm edit-screen__close-btn" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Header (fixed) -->
            <div class="edit-screen__header">
                <h3 class="edit-screen__title">${this.title}</h3>
            </div>
            
            <!-- Separator -->
            <div class="edit-screen__separator"></div>

            <!-- Form Zone (scrollable, takes remaining space) -->
            <div class="edit-screen__form-zone">
                <form class="edit-screen__form" id="${this.id}Form">
                    <!-- Form content will be injected here -->
                </form>
            </div>
            
            <!-- Separator -->
            <div class="edit-screen__separator"></div>

            <!-- Context Zone (fixed, variable height) -->
            <div class="edit-screen__context-zone">
                <!-- Context content (preview, tips, links) will be injected here -->
            </div>

            <!-- Action Zone (fixed) -->
            <div class="edit-screen__action-zone">
                <div class="edit-screen__action-dock">
                    <div class="edit-screen__actions">
                        <!-- Secondary actions (left) -->
                        <div class="edit-screen__actions-secondary">
                            <!-- Optional delete/remove buttons will be added here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom padding -->
            <div class="edit-screen__bottom-padding"></div>
        `;

        document.body.appendChild(this.container);

        // Store zone references
        this.formZone = this.container.querySelector('.edit-screen__form');
        this.actionZone = this.container.querySelector('.edit-screen__action-zone');
        this.contextZone = this.container.querySelector('.edit-screen__context-zone');
        this.closeZone = this.container.querySelector('.edit-screen__close-zone');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.edit-screen__close-btn');
        closeBtn.addEventListener('click', () => this.close());

        // Handle click to close
        const handle = this.container.querySelector('.edit-screen__handle');
        handle.addEventListener('click', () => this.close());
        handle.style.cursor = 'pointer';

        // Backdrop click
        this.backdrop.addEventListener('click', () => this.close());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Open the edit screen with data
     */
    open(data = null) {
        this.currentData = data;
        this.isOpen = true;

        // Render content
        if (this.renderFormContent) {
            this.formZone.innerHTML = this.renderFormContent(data);
        }

        if (this.renderContextContent) {
            this.contextZone.innerHTML = this.renderContextContent(data);
        }

        // Call onAfterRender hook (for initializing custom components)
        if (this.onAfterRender) {
            setTimeout(() => {
                this.onAfterRender(data);
            }, 0);
        }

        // Show backdrop
        this.backdrop.classList.remove('pointer-events-none');
        setTimeout(() => {
            this.backdrop.classList.remove('opacity-0');
        }, 10);

        // Slide up panel
        setTimeout(() => {
            this.container.classList.add('edit-screen--open');
        }, 10);

        // Trigger custom event
        this.container.dispatchEvent(new CustomEvent('editscreen:opened', { 
            detail: { data: this.currentData } 
        }));
    }

    /**
     * Close the edit screen
     */
    close() {
        this.isOpen = false;

        // Slide down panel
        this.container.classList.remove('edit-screen--open');

        // Hide backdrop
        this.backdrop.classList.add('opacity-0');
        
        setTimeout(() => {
            this.backdrop.classList.add('pointer-events-none');
            this.currentData = null;
            
            // Trigger custom event
            this.container.dispatchEvent(new CustomEvent('editscreen:closed'));
        }, 300);
    }

    /**
     * Trigger onChange callback for auto-save
     */
    triggerChange(field, value) {
        if (this.onChange) {
            this.onChange(field, value, this.currentData);
        }
    }

    /**
     * Add a secondary action button (e.g., delete, unschedule)
     */
    addSecondaryAction(label, icon, variant, handler) {
        const secondaryZone = this.container.querySelector('.edit-screen__actions-secondary');
        
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-${variant} btn-sm`;
        button.innerHTML = `
            ${icon}
            ${label}
        `;
        button.addEventListener('click', () => handler(this.currentData));
        
        secondaryZone.appendChild(button);
        
        return button;
    }

    /**
     * Update title dynamically
     */
    setTitle(title) {
        this.title = title;
        const titleEl = this.container.querySelector('.edit-screen__title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Destroy the edit screen and remove from DOM
     */
    destroy() {
        if (this.container) {
            this.container.remove();
        }
        if (this.backdrop) {
            this.backdrop.remove();
        }
    }
}

// =================================================================
// USAGE EXAMPLE (for documentation purposes)
// =================================================================
/*
const sceneEditScreen = new EditScreen({
    id: 'sceneEditScreen',
    title: 'Edit Scene',
    height: '75vh',
    
    renderFormContent: (scene) => `
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">Scene Number</span>
            </label>
            <input 
                type="text" 
                name="sceneNumber" 
                class="input input-bordered" 
                value="${scene?.scene_number || ''}"
                required 
            />
        </div>
        <!-- More form fields... -->
    `,
    
    renderContextContent: (scene) => `
        <div class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Scene heading will update automatically</span>
        </div>
    `,
    
    onSave: async (formData, originalData) => {
        // Save logic here
        await SceneService.update(originalData.id, formData);
    },
    
    onCancel: (data) => {
        console.log('Cancelled editing', data);
    }
}).init();

// Add secondary actions
sceneEditScreen.addSecondaryAction(
    'Delete Scene',
    '<svg>...</svg>',
    'error',
    async (scene) => {
        if (confirm('Delete this scene?')) {
            await SceneService.delete(scene.id);
            sceneEditScreen.close();
        }
    }
);

// Open with data
sceneEditScreen.open(myScene);
*/
