// =================================================================
// CUSTOM DROPDOWN - Herbruikbaar DaisyUI-Styled Dropdown Component
// =================================================================
// Dit component biedt een volledig custom dropdown met DaisyUI styling
// als alternatief voor native <select> elementen.
//
// FEATURES:
// - Volledig DaisyUI gestyled (geen OS native options)
// - Form-compatible (hidden input with name/value)
// - Keyboard navigatie (↑↓ Enter Escape Tab)
// - Search functionaliteit (optioneel)
// - "Create new" optie ondersteuning
// - Toegankelijk (ARIA attributes)
// - Event callbacks (onChange, onCreate)
//
// GEBRUIK:
// const dropdown = new CustomDropdown({
//     containerId: 'myDropdownContainer',
//     name: 'field_name',
//     options: [{value: '1', label: 'Option 1'}, ...],
//     value: 'current_value',
//     placeholder: 'Select...',
//     searchable: true,
//     allowCreate: true,
//     createLabel: '+ Create new...',
//     onChange: (value, option) => { ... },
//     onCreate: () => { ... }
// });
// dropdown.render();
// =================================================================

export class CustomDropdown {
    constructor(options = {}) {
        this.containerId = options.containerId;
        this.name = options.name || 'dropdown';
        this.options = options.options || [];
        this.value = options.value || '';
        this.placeholder = options.placeholder || 'Select...';
        this.searchable = options.searchable !== undefined ? options.searchable : false;
        this.allowCreate = options.allowCreate !== undefined ? options.allowCreate : false;
        this.createLabel = options.createLabel || '+ Create new...';
        this.createValue = options.createValue || 'CREATE_NEW';
        this.required = options.required !== undefined ? options.required : false;
        this.disabled = options.disabled !== undefined ? options.disabled : false;
        this.size = options.size || 'md'; // xs, sm, md, lg
        this.onChange = options.onChange || null;
        this.onCreate = options.onCreate || null;
        
        // State
        this.isOpen = false;
        this.filteredOptions = [...this.options];
        this.highlightedIndex = -1;
        this.searchQuery = '';
        
        // DOM references (set after render)
        this.container = null;
        this.button = null;
        this.menu = null;
        this.hiddenInput = null;
        this.searchInput = null;
    }
    
    /**
     * Render the dropdown in the container
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = this.getHTML();
        this.container = container.querySelector('.custom-dropdown');
        this.button = this.container.querySelector('.custom-dropdown__button');
        this.menu = this.container.querySelector('.custom-dropdown__menu');
        this.hiddenInput = this.container.querySelector('.custom-dropdown__hidden-input');
        this.searchInput = this.searchable ? this.container.querySelector('.custom-dropdown__search') : null;
        
        this.attachEventListeners();
    }
    
    /**
     * Generate HTML for the dropdown
     */
    getHTML() {
        const selectedOption = this.options.find(opt => opt.value === this.value);
        const displayText = selectedOption ? selectedOption.label : this.placeholder;
        const sizeClass = this.size !== 'md' ? `btn-${this.size}` : '';
        
        return `
            <div class="custom-dropdown relative">
                <!-- Hidden input for form submission -->
                <input 
                    type="hidden" 
                    name="${this.name}" 
                    value="${this.value}"
                    class="custom-dropdown__hidden-input"
                    ${this.required ? 'required' : ''}
                />
                
                <!-- Trigger Button -->
                <button
                    type="button"
                    class="custom-dropdown__button btn btn-outline w-full justify-between ${sizeClass}"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    ${this.disabled ? 'disabled' : ''}
                >
                    <span class="custom-dropdown__display truncate text-left flex-1">
                        ${displayText}
                    </span>
                    <svg class="custom-dropdown__chevron w-4 h-4 ml-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                
                <!-- Dropdown Menu -->
                <div class="custom-dropdown__menu hidden absolute z-50 w-full mt-1 shadow-lg bg-base-100 rounded-box border border-base-300" role="listbox">
                    ${this.searchable ? `
                        <div class="p-2 border-b border-base-300">
                            <input 
                                type="text" 
                                class="custom-dropdown__search input input-sm input-bordered w-full" 
                                placeholder="Search..."
                                autocomplete="off"
                            />
                        </div>
                    ` : ''}
                    
                    <ul class="custom-dropdown__options menu menu-sm max-h-60 overflow-y-auto">
                        ${this.getOptionsHTML()}
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate HTML for options list
     */
    getOptionsHTML() {
        let html = '';
        
        // Empty state
        if (this.filteredOptions.length === 0) {
            html += `
                <li class="custom-dropdown__empty text-base-content/50 px-4 py-2">
                    No options found
                </li>
            `;
            return html;
        }
        
        // Regular options
        this.filteredOptions.forEach((option, index) => {
            const isSelected = option.value === this.value;
            const isHighlighted = index === this.highlightedIndex;
            
            html += `
                <li>
                    <button
                        type="button"
                        class="custom-dropdown__option ${isHighlighted ? 'active' : ''}"
                        data-value="${option.value}"
                        data-index="${index}"
                        role="option"
                        aria-selected="${isSelected}"
                    >
                        ${option.label}
                        ${isSelected ? '<span class="ml-auto">✓</span>' : ''}
                    </button>
                </li>
            `;
        });
        
        // Create new option
        if (this.allowCreate) {
            html += `
                <li class="border-t border-base-300 mt-1">
                    <button
                        type="button"
                        class="custom-dropdown__create text-primary"
                        data-value="${this.createValue}"
                    >
                        ${this.createLabel}
                    </button>
                </li>
            `;
        }
        
        return html;
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle dropdown
        this.button.addEventListener('click', () => this.toggle());
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
        
        // Keyboard navigation on button
        this.button.addEventListener('keydown', (e) => this.handleButtonKeydown(e));
        
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        }
        
        // Option clicks (event delegation)
        this.menu.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.custom-dropdown__option');
            const createBtn = e.target.closest('.custom-dropdown__create');
            
            if (optionBtn) {
                const value = optionBtn.dataset.value;
                this.selectOption(value);
            } else if (createBtn) {
                this.handleCreate();
            }
        });
    }
    
    /**
     * Toggle dropdown open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Open dropdown
     */
    open() {
        if (this.disabled) return;
        
        this.isOpen = true;
        this.menu.classList.remove('hidden');
        this.button.setAttribute('aria-expanded', 'true');
        this.button.querySelector('.custom-dropdown__chevron').style.transform = 'rotate(180deg)';
        
        // Focus search input if available
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 50);
        }
        
        // Reset highlight
        this.highlightedIndex = this.filteredOptions.findIndex(opt => opt.value === this.value);
        this.updateHighlight();
    }
    
    /**
     * Close dropdown
     */
    close() {
        this.isOpen = false;
        this.menu.classList.add('hidden');
        this.button.setAttribute('aria-expanded', 'false');
        this.button.querySelector('.custom-dropdown__chevron').style.transform = 'rotate(0deg)';
        
        // Reset search
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.filteredOptions = [...this.options];
            this.refreshOptions();
        }
        
        this.highlightedIndex = -1;
    }
    
    /**
     * Select an option
     */
    selectOption(value) {
        const option = this.options.find(opt => opt.value === value);
        if (!option) return;
        
        this.value = value;
        this.hiddenInput.value = value;
        
        // Update button display
        this.button.querySelector('.custom-dropdown__display').textContent = option.label;
        
        // Update ARIA selected states
        this.container.querySelectorAll('.custom-dropdown__option').forEach(btn => {
            btn.setAttribute('aria-selected', btn.dataset.value === value);
        });
        
        this.close();
        
        // Fire onChange callback
        if (this.onChange) {
            this.onChange(value, option);
        }
    }
    
    /**
     * Handle create new
     */
    handleCreate() {
        this.close();
        
        if (this.onCreate) {
            this.onCreate();
        }
    }
    
    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (!this.searchQuery) {
            this.filteredOptions = [...this.options];
        } else {
            this.filteredOptions = this.options.filter(opt => 
                opt.label.toLowerCase().includes(this.searchQuery)
            );
        }
        
        this.highlightedIndex = 0;
        this.refreshOptions();
    }
    
    /**
     * Refresh options list
     */
    refreshOptions() {
        const optionsList = this.menu.querySelector('.custom-dropdown__options');
        optionsList.innerHTML = this.getOptionsHTML();
    }
    
    /**
     * Update highlighted option
     */
    updateHighlight() {
        const options = this.menu.querySelectorAll('.custom-dropdown__option');
        options.forEach((opt, index) => {
            if (index === this.highlightedIndex) {
                opt.classList.add('active');
                opt.scrollIntoView({ block: 'nearest' });
            } else {
                opt.classList.remove('active');
            }
        });
    }
    
    /**
     * Keyboard navigation on button
     */
    handleButtonKeydown(e) {
        switch (e.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                e.preventDefault();
                this.open();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.open();
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    }
    
    /**
     * Keyboard navigation in search/menu
     */
    handleSearchKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
                this.updateHighlight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
                this.updateHighlight();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
                    const option = this.filteredOptions[this.highlightedIndex];
                    this.selectOption(option.value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                this.button.focus();
                break;
        }
    }
    
    /**
     * Update options dynamically
     */
    updateOptions(newOptions) {
        this.options = newOptions;
        this.filteredOptions = [...newOptions];
        if (this.isOpen) {
            this.refreshOptions();
        }
    }
    
    /**
     * Set value programmatically
     */
    setValue(value) {
        this.value = value;
        this.hiddenInput.value = value;
        
        const option = this.options.find(opt => opt.value === value);
        const displayText = option ? option.label : this.placeholder;
        this.button.querySelector('.custom-dropdown__display').textContent = displayText;
    }
    
    /**
     * Get current value
     */
    getValue() {
        return this.value;
    }
    
    /**
     * Enable/disable dropdown
     */
    setDisabled(disabled) {
        this.disabled = disabled;
        if (disabled) {
            this.button.setAttribute('disabled', 'disabled');
            this.close();
        } else {
            this.button.removeAttribute('disabled');
        }
    }
    
    /**
     * Destroy dropdown (cleanup)
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
