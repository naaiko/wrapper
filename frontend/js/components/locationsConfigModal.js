// =================================================================
// LOCATIONS CONFIG MODAL - Location CRUD Management
// =================================================================

import { LocationService } from '../services/locationService.js';
import { supabaseClient } from '../api/supabaseClient.js';

export class LocationsConfigModal {
    constructor(projectId) {
        this.projectId = projectId;
        this.locations = [];
        this.modal = null;
        this.onLocationsChanged = null;
        this.searchQuery = '';
        this.sortBy = 'name'; // 'name' or 'usage'
        
        this.createModal();
    }
    
    createModal() {
        this.modal = document.createElement('dialog');
        this.modal.id = 'locationsConfigModal';
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 class="font-bold text-lg mb-4">Locations Settings</h3>
                
                <div class="space-y-4">
                    <!-- Search and Actions Bar -->
                    <div class="flex gap-2 items-center">
                        <div class="flex-1 relative">
                            <input 
                                type="text" 
                                id="locationSearchInput" 
                                class="input input-bordered input-sm w-full pl-9" 
                                placeholder="Search locations..."
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-2.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        
                        <!-- Sort Dropdown -->
                        <div class="dropdown dropdown-end">
                            <button tabindex="0" class="btn btn-sm gap-1 min-w-[90px]">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                Sort
                            </button>
                            <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 mt-2 z-[1]">
                                <li><a id="sortByName">By Name (A-Z)</a></li>
                                <li><a id="sortByUsage">By Usage</a></li>
                            </ul>
                        </div>
                        
                        <!-- Remove Unused Button -->
                        <button id="removeUnusedBtn" class="btn btn-sm btn-error gap-1 whitespace-nowrap" title="Remove locations not used in any scenes">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clean Unused
                        </button>
                    </div>
                
                    <!-- Existing Locations -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold">Available Locations</h4>
                            <span class="text-xs text-base-content/60" id="locationCount"></span>
                        </div>
                        <div id="locationsList" class="space-y-2 max-h-96 overflow-y-auto pr-1">
                            <!-- Location items will be rendered here -->
                        </div>
                    </div>

                    <!-- Add New Location -->
                    <div class="divider">Add New Location</div>
                    <form id="addLocationForm" class="flex gap-2">
                        <input 
                            type="text" 
                            id="newLocationName" 
                            class="input input-bordered input-sm flex-1" 
                            placeholder="e.g., COFFEE SHOP, CITY STREET, PARK"
                            required
                        />
                        <button type="submit" class="btn btn-primary btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                        </button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;
        
        document.body.appendChild(this.modal);
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Add location form
        const form = this.modal.querySelector('#addLocationForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddLocation();
        });
        
        // Search input
        const searchInput = this.modal.querySelector('#locationSearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderLocations();
        });
        
        // Sort buttons
        this.modal.querySelector('#sortByName')?.addEventListener('click', () => {
            this.sortBy = 'name';
            this.renderLocations();
            // Close dropdown
            document.activeElement?.blur();
        });
        
        this.modal.querySelector('#sortByUsage')?.addEventListener('click', () => {
            this.sortBy = 'usage';
            this.renderLocations();
            // Close dropdown
            document.activeElement?.blur();
        });
        
        // Remove unused button
        this.modal.querySelector('#removeUnusedBtn')?.addEventListener('click', async () => {
            await this.handleRemoveUnused();
        });
    }
    
    async open() {
        await this.loadLocations();
        this.renderLocations();
        this.modal.showModal();
    }
    
    close() {
        this.modal.close();
    }
    
    async loadLocations() {
        this.locations = await LocationService.getAll(this.projectId);
        
        // Load usage count for each location
        const { data: scenes } = await supabaseClient.db
            .from('scenes')
            .select('location_id')
            .eq('project_id', this.projectId);
        
        // Count usage
        const usageMap = {};
        scenes?.forEach(scene => {
            if (scene.location_id) {
                usageMap[scene.location_id] = (usageMap[scene.location_id] || 0) + 1;
            }
        });
        
        // Add usage count to locations
        this.locations = this.locations.map(loc => ({
            ...loc,
            usageCount: usageMap[loc.id] || 0
        }));
    }
    
    renderLocations() {
        const container = this.modal.querySelector('#locationsList');
        const countEl = this.modal.querySelector('#locationCount');
        if (!container) return;
        
        // Filter locations by search query
        let filteredLocations = this.locations.filter(loc => 
            loc.name.toLowerCase().includes(this.searchQuery)
        );
        
        // Sort locations
        if (this.sortBy === 'name') {
            filteredLocations.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'usage') {
            filteredLocations.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        }
        
        // Update count display
        if (countEl) {
            const totalCount = this.locations.length;
            const displayCount = filteredLocations.length;
            if (this.searchQuery) {
                countEl.textContent = `${displayCount} of ${totalCount} locations`;
            } else {
                countEl.textContent = `${totalCount} ${totalCount === 1 ? 'location' : 'locations'}`;
            }
        }
        
        if (filteredLocations.length === 0) {
            const message = this.searchQuery 
                ? `No locations match "${this.searchQuery}"`
                : 'No locations yet';
            container.innerHTML = `<p class="text-sm text-base-content/60 text-center py-8">${message}</p>`;
            return;
        }
        
        container.innerHTML = filteredLocations.map(location => `
            <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors ${location.usageCount === 0 ? 'opacity-60' : ''}" data-location-id="${location.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="flex-1 font-medium truncate">${location.name}</span>
                <div class="badge badge-sm ${location.usageCount > 0 ? 'badge-primary' : 'badge-ghost'} flex-shrink-0">
                    ${location.usageCount}
                </div>
                <button type="button" class="btn btn-ghost btn-xs btn-square text-error flex-shrink-0" data-delete-location="${location.id}" title="Delete location">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Attach delete handlers
        container.querySelectorAll('[data-delete-location]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const locationId = btn.getAttribute('data-delete-location');
                await this.handleDeleteLocation(locationId);
            });
        });
    }
    
    async handleAddLocation() {
        const input = this.modal.querySelector('#newLocationName');
        const name = input?.value.trim();
        
        if (!name) return;
        
        try {
            await LocationService.create(this.projectId, name);
            input.value = '';
            await this.loadLocations();
            this.renderLocations();
            
            if (this.onLocationsChanged) {
                this.onLocationsChanged(this.locations);
            }
        } catch (error) {
            console.error('Error adding location:', error);
            alert('Failed to add location');
        }
    }
    
    async handleDeleteLocation(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;
        
        const confirmed = await this.showConfirmDialog(
            'Delete Location',
            `Delete "${location.name}"? Scenes using this location will not be affected.`,
            'Delete',
            'btn-error'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            await supabaseClient.db.from('locations').delete().eq('id', locationId);
            await this.loadLocations();
            this.renderLocations();
            
            if (this.onLocationsChanged) {
                this.onLocationsChanged(this.locations);
            }
        } catch (error) {
            console.error('Error deleting location:', error);
            this.showAlert('Failed to delete location');
        }
    }
    
    async handleRemoveUnused() {
        const unusedLocations = this.locations.filter(loc => loc.usageCount === 0);
        
        if (unusedLocations.length === 0) {
            this.showAlert('All locations are currently in use!');
            return;
        }
        
        const confirmed = await this.showConfirmDialog(
            'Remove Unused Locations',
            `Remove ${unusedLocations.length} unused location${unusedLocations.length === 1 ? '' : 's'}?`,
            'Remove',
            'btn-error'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Delete all unused locations
            const unusedIds = unusedLocations.map(loc => loc.id);
            await supabaseClient.db
                .from('locations')
                .delete()
                .in('id', unusedIds);
            
            await this.loadLocations();
            this.renderLocations();
            
            if (this.onLocationsChanged) {
                this.onLocationsChanged(this.locations);
            }
        } catch (error) {
            console.error('Error removing unused locations:', error);
            this.showAlert('Failed to remove unused locations');
        }
    }
    
    /**
     * Show confirmation dialog
     * @returns {Promise<boolean>} true if confirmed, false if canceled
     */
    showConfirmDialog(title, message, confirmText = 'Confirm', confirmClass = 'btn-primary') {
        return new Promise((resolve) => {
            const dialog = document.createElement('dialog');
            dialog.className = 'modal';
            dialog.innerHTML = `
                <div class="modal-box">
                    <h3 class="font-bold text-lg">${title}</h3>
                    <p class="py-4">${message}</p>
                    <div class="modal-action">
                        <button class="btn btn-ghost" data-choice="cancel">Cancel</button>
                        <button class="btn ${confirmClass}" data-choice="confirm">${confirmText}</button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button data-choice="cancel">close</button>
                </form>
            `;
            
            const buttons = dialog.querySelectorAll('[data-choice]');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const choice = btn.getAttribute('data-choice');
                    dialog.close();
                    document.body.removeChild(dialog);
                    resolve(choice === 'confirm');
                });
            });
            
            document.body.appendChild(dialog);
            dialog.showModal();
        });
    }
    
    /**
     * Show alert dialog
     */
    showAlert(message) {
        const dialog = document.createElement('dialog');
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-box">
                <p class="py-4">${message}</p>
                <div class="modal-action">
                    <button class="btn" onclick="this.closest('dialog').close(); this.closest('dialog').remove();">OK</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button onclick="this.closest('dialog').remove();">close</button>
            </form>
        `;
        
        document.body.appendChild(dialog);
        dialog.showModal();
    }
}
