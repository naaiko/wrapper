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
        this.align = options.align || 'left'; // left, right
        this.dropdownPosition = options.dropdownPosition || 'bottom'; // 'bottom', 'top', 'auto'
        this.dropdownWidth = options.dropdownWidth || 'auto'; // 'match' (match button), 'auto' (fit content), or specific width like '300px'
        this.onChange = options.onChange || null;
        this.onCreate = options.onCreate || null;
        this.onDelete = options.onDelete || null;
        this.allowDelete = options.allowDelete !== undefined ? options.allowDelete : false;
        
        // State
        this.isOpen = false;
        this.filteredOptions = [...this.options];
        this.highlightedIndex = -1;
        this.searchQuery = '';
        this.searchQueryOriginal = ''; // Keep original case for prefilling
        
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
        this.hiddenInput = this.container.querySelector('.custom-dropdown__hidden-input');
        
        // Extract menu and append to body for proper positioning (portal pattern)
        this.menu = this.container.querySelector('.custom-dropdown__menu');
        document.body.appendChild(this.menu);
        
        this.searchInput = this.searchable ? this.menu.querySelector('.custom-dropdown__search') : null;
        
        this.attachEventListeners();
    }
    
    /**
     * Generate HTML for the dropdown
     */
    getHTML() {
        const selectedOption = this.options.find(opt => opt.value === this.value);
        const displayText = selectedOption ? selectedOption.label : this.placeholder;
        
        // Map sizes to input heights
        const sizeMap = {
            'xs': 'h-6 min-h-6 text-xs',
            'sm': 'h-8 min-h-8 text-sm',
            'md': 'h-12 min-h-12 text-sm',
            'lg': 'h-14 min-h-14 text-base'
        };
        const sizeClass = sizeMap[this.size] || sizeMap['md'];
        
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
                
                <!-- Trigger Button (styled like input) -->
                <button
                    type="button"
                    class="custom-dropdown__button input input-bordered w-full flex items-center justify-between gap-2 ${sizeClass} cursor-pointer"
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    ${this.disabled ? 'disabled' : ''}
                >
                    <span class="custom-dropdown__display truncate text-left flex-1">
                        ${displayText}
                    </span>
                    <svg class="custom-dropdown__chevron w-4 h-4 flex-shrink-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(${this.dropdownPosition === 'top' ? '180deg' : '0deg'})">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                
                <!-- Dropdown Menu (will be portaled to body) -->
                <div class="custom-dropdown__menu hidden bg-base-100 rounded-box border border-base-300 shadow-lg" role="listbox" style="position: fixed; z-index: 9999; width: fit-content; min-width: 200px; max-width: 450px;">
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
                    
                    <ul class="custom-dropdown__options menu menu-sm overflow-y-auto" style="max-height: 300px;">
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
            // Don't return yet - still show create button if available
        } else {
            // Regular options
            this.filteredOptions.forEach((option, index) => {
                const isSelected = option.value === this.value;
                const isHighlighted = index === this.highlightedIndex;
                
                html += `
                    <li class="px-1">
                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                class="custom-dropdown__option flex-1 text-left ${isHighlighted ? 'bg-base-200' : ''}"
                                data-value="${option.value}"
                                data-index="${index}"
                                role="option"
                                aria-selected="${isSelected}"
                            >
                                ${option.label}
                                ${isSelected ? '<span class="ml-auto">✓</span>' : ''}
                            </button>
                            ${this.allowDelete ? `
                                <button
                                    type="button"
                                    class="custom-dropdown__delete btn btn-ghost btn-xs btn-square text-error hover:bg-error hover:text-error-content"
                                    data-value="${option.value}"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </li>
                `;
            });
        }
        
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
            const deleteBtn = e.target.closest('.custom-dropdown__delete');
            const optionBtn = e.target.closest('.custom-dropdown__option');
            const createBtn = e.target.closest('.custom-dropdown__create');
            
            if (deleteBtn) {
                e.stopPropagation();
                const value = deleteBtn.dataset.value;
                this.handleDelete(value);
            } else if (optionBtn) {
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
        
        // Position menu relative to button
        requestAnimationFrame(() => {
            const buttonRect = this.button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Determine if menu should open upward or downward
            let openUpward = this.dropdownPosition === 'top';
            if (this.dropdownPosition === 'auto') {
                const spaceBelow = viewportHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                openUpward = spaceAbove > spaceBelow;
            }
            
            // Set chevron rotation - flip to opposite direction when open
            const chevron = this.button.querySelector('.custom-dropdown__chevron');
            if (openUpward) {
                chevron.style.transform = 'rotate(0deg)'; // Point down when open upward
            } else {
                chevron.style.transform = 'rotate(180deg)'; // Point up when open downward
            }
            
            // Calculate position
            let top, left;
            
            if (openUpward) {
                // Open above button - need to measure menu height first
                const menuHeight = this.menu.offsetHeight;
                top = buttonRect.top - menuHeight - 4;
            } else {
                // Open below button
                top = buttonRect.bottom + 4;
            }
            
            left = buttonRect.left;
            
            // Handle right alignment
            if (this.align === 'right') {
                // For auto width, we need to measure the menu first
                if (this.dropdownWidth === 'auto') {
                    const menuWidth = this.menu.offsetWidth;
                    left = buttonRect.right - menuWidth;
                } else if (this.dropdownWidth === 'match') {
                    left = buttonRect.left;
                } else {
                    // Custom width
                    const menuWidth = parseInt(this.dropdownWidth);
                    left = buttonRect.right - menuWidth;
                }
            }
            
            // Set width for 'match' mode
            if (this.dropdownWidth === 'match') {
                this.menu.style.width = `${buttonRect.width}px`;
            } else {
                this.menu.style.minWidth = `${buttonRect.width}px`;
            }
            
            // Calculate available space and set max-height
            let maxHeight;
            if (openUpward) {
                const spaceAbove = buttonRect.top - 16;
                maxHeight = Math.max(200, spaceAbove);
            } else {
                const spaceBelow = viewportHeight - buttonRect.bottom - 16;
                maxHeight = Math.max(200, spaceBelow);
            }
            
            // Apply styles
            this.menu.style.top = `${top}px`;
            this.menu.style.left = `${left}px`;
            this.menu.style.maxHeight = `${maxHeight}px`;
            this.menu.style.overflowY = 'auto';
        });
        
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
        
        // Reset chevron based on dropdown position
        const chevron = this.button.querySelector('.custom-dropdown__chevron');
        if (this.dropdownPosition === 'top') {
            chevron.style.transform = 'rotate(180deg)'; // Point up when closed for upward dropdown
        } else {
            chevron.style.transform = 'rotate(0deg)'; // Point down when closed for downward dropdown
        }
        
        // Reset search
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.searchQueryOriginal = '';
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
        const prefilledValue = this.searchQueryOriginal || '';
        this.close();
        
        if (this.onCreate) {
            this.onCreate(prefilledValue);
        }
    }
    
    /**
     * Handle delete option
     */
    handleDelete(value) {
        if (this.onDelete) {
            this.onDelete(value);
        }
    }
    
    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQueryOriginal = query.trim(); // Keep original case
        this.searchQuery = query.toLowerCase().trim(); // For filtering
        
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
                opt.classList.add('bg-base-200');
                opt.scrollIntoView({ block: 'nearest' });
            } else {
                opt.classList.remove('bg-base-200');
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
        // Always refresh the options HTML so it's up-to-date when dropdown opens
        this.refreshOptions();
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
        // Remove menu from body
        if (this.menu && this.menu.parentNode === document.body) {
            document.body.removeChild(this.menu);
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
