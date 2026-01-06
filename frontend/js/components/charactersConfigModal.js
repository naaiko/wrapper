// =================================================================
// CHARACTERS CONFIG MODAL - Character CRUD & Actor Assignment
// =================================================================
// Version: 0.2.3
// Purpose: Manage story characters and Assign Cast Members to roles
//
// Architecture:
//   Character (story role) ←→ Actor (real person) via assignments
//   One character can have multiple actors (understudy, stunt, etc.)

import { CharacterService } from '../services/characterService.js';
import { CastMemberService } from '../services/castMemberService.js';
import { supabaseClient } from '../api/supabaseClient.js';
import { CustomDropdown } from './customDropdown.js';
import { CastMemberFormModal } from './castMemberFormModal.js';

export class CharactersConfigModal {
    constructor(projectId) {
        this.projectId = projectId;
        this.characters = [];
        this.actors = [];
        this.modal = null;
        this.onCharactersChanged = null;
        this.searchQuery = '';
        this.sortBy = 'name'; // 'name' or 'usage'
        this.actorDropdowns = new Map(); // Store dropdown instances per character
        this.CastMemberFormModal = null; // Shared CAST MEMBER FORM MODAL
        
        this.createModal();
    }
    
    createModal() {
        this.modal = document.createElement('dialog');
        this.modal.id = 'charactersConfigModal';
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-box max-w-4xl" style="overflow: visible;">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 class="font-bold text-lg mb-4">Characters Settings</h3>
                
                <div class="space-y-4">
                    <!-- Search and Actions Bar -->
                    <div class="flex gap-2 items-center">
                        <div class="flex-1 relative">
                            <input 
                                type="text" 
                                id="characterSearchInput" 
                                class="input input-bordered input-sm w-full pl-9" 
                                placeholder="Search characters..."
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
                        <button id="removeUnusedBtn" class="btn btn-sm btn-error gap-1 whitespace-nowrap" title="Remove characters not used in any scenes">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clean Unused
                        </button>
                    </div>
                
                    <!-- Existing Characters -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold">Available Characters</h4>
                            <span class="text-xs text-base-content/60" id="characterCount"></span>
                        </div>
                        <div id="charactersList" class="space-y-2 max-h-96 overflow-y-auto pr-1">
                            <!-- Character items will be rendered here -->
                        </div>
                    </div>

                    <!-- Add New Character -->
                    <div class="divider">Add New Character</div>
                    <form id="addCharacterForm" class="flex gap-2">
                        <input 
                            type="text" 
                            id="newCharacterName" 
                            class="input input-bordered input-sm flex-1" 
                            placeholder="e.g., JOHN DOE, DETECTIVE SMITH, MARY"
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
        // Add character form
        const form = this.modal.querySelector('#addCharacterForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddCharacter();
        });
        
        // Search input
        const searchInput = this.modal.querySelector('#characterSearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderCharacters();
        });
        
        // Sort buttons
        this.modal.querySelector('#sortByName')?.addEventListener('click', () => {
            this.sortBy = 'name';
            this.renderCharacters();
            document.activeElement?.blur();
        });
        
        this.modal.querySelector('#sortByUsage')?.addEventListener('click', () => {
            this.sortBy = 'usage';
            this.renderCharacters();
            document.activeElement?.blur();
        });
        
        // Remove unused button
        this.modal.querySelector('#removeUnusedBtn')?.addEventListener('click', async () => {
            await this.handleRemoveUnused();
        });
    }
    
    async open() {
        // Show loading state immediately
        this.modal.showModal();
        const container = this.modal.querySelector('#charactersList');
        if (container) {
            container.innerHTML = '<div class="flex justify-center py-8"><span class="loading loading-spinner loading-lg"></span></div>';
        }
        
        // Load data in parallel
        await Promise.all([
            this.loadCharacters(),
            this.loadActors()
        ]);
        
        this.renderCharacters();
    }
    
    close() {
        this.modal.close();
    }
    
    async loadCharacters() {
        // OPTIMIZED: Load all characters with nested actor assignments in single query
        const { data: characters, error } = await supabaseClient.db
            .from('characters')
            .select(`
                *,
                actor_assignments:character_cast_assignments(
                    *,
                    cast_member:cast_members(*)
                )
            `)
            .eq('project_id', this.projectId)
            .order('display_order', { ascending: true, nullsLast: true })
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error loading characters:', error);
            this.characters = [];
            return;
        }
        
        // Load usage counts (single query for all characters)
        const usageCounts = await CharacterService.getUsageCounts(this.projectId);
        
        // Transform data: flatten actor_assignments to actorAssignments
        this.characters = (characters || []).map(char => ({
            ...char,
            usageCount: usageCounts[char.id] || 0,
            actorAssignments: (char.actor_assignments || []).map(assignment => ({
                ...assignment
                // actor.name is now auto-generated in database
            }))
        }));
        
        // Clean up temp property
        this.characters.forEach(char => delete char.actor_assignments);
    }
    
    async loadActors() {
        const { data, error } = await supabaseClient.db
            .from('cast_members')
            .select('*')
            .eq('project_id', this.projectId)
            .order('name'); // Sort by generated name column
        
        if (error) {
            console.error('Error loading actors:', error);
            this.actors = [];
        } else {
            this.actors = data || [];
        }
    }
    
    renderCharacters() {
        const container = this.modal.querySelector('#charactersList');
        const countEl = this.modal.querySelector('#characterCount');
        if (!container) return;
        
        // Filter characters by search query
        let filteredCharacters = this.characters.filter(char => 
            char.name.toLowerCase().includes(this.searchQuery)
        );
        
        // Sort characters
        if (this.sortBy === 'name') {
            filteredCharacters.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'usage') {
            filteredCharacters.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        }
        
        // Update count display
        if (countEl) {
            const totalCount = this.characters.length;
            const displayCount = filteredCharacters.length;
            if (this.searchQuery) {
                countEl.textContent = `${displayCount} of ${totalCount} characters`;
            } else {
                countEl.textContent = `${totalCount} ${totalCount === 1 ? 'character' : 'characters'}`;
            }
        }
        
        if (filteredCharacters.length === 0) {
            const message = this.searchQuery 
                ? `No characters match "${this.searchQuery}"`
                : 'No characters yet';
            container.innerHTML = `<p class="text-sm text-base-content/60 text-center py-8">${message}</p>`;
            return;
        }
        
        container.innerHTML = filteredCharacters.map(character => {
            const hasActor = character.actorAssignments && character.actorAssignments.length > 0;
            const primaryActor = character.actorAssignments?.find(a => a.assignment_type === 'actor');
            
            return `
                <div class="flex items-start gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors ${character.usageCount === 0 ? 'opacity-60' : ''}" data-character-id="${character.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/60 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium truncate">${character.name}</span>
                            <div class="badge badge-sm ${character.usageCount > 0 ? 'badge-primary' : 'badge-ghost'} flex-shrink-0">
                                ${character.usageCount} ${character.usageCount === 1 ? 'scene' : 'scenes'}
                            </div>
                            ${!hasActor ? '<div class="badge badge-sm badge-warning flex-shrink-0">No actor</div>' : ''}
                        </div>
                        ${hasActor ? `
                            <div class="text-xs text-base-content/70">
                                ${character.actorAssignments.map(assignment => `
                                    <div class="flex items-center gap-1 mt-1">
                                        <span class="badge badge-xs ${assignment.assignment_type === 'actor' ? 'badge-primary' : 'badge-ghost'}">${assignment.assignment_type}</span>
                                        <span>${assignment.cast_member.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div id="castMemberDropdown_${character.id}" class="mt-1"></div>
                        `}
                    </div>
                    <button type="button" class="btn btn-ghost btn-xs btn-square text-error flex-shrink-0" data-delete-character="${character.id}" title="Delete character">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
        
        // Attach delete handlers
        container.querySelectorAll('[data-delete-character]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const characterId = btn.getAttribute('data-delete-character');
                await this.handleDeleteCharacter(characterId);
            });
        });
        
        // Initialize actor assignment dropdowns for unassigned characters
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            filteredCharacters.forEach(character => {
                const hasActor = character.actorAssignments && character.actorAssignments.length > 0;
                if (!hasActor) {
                    this.createActorDropdown(character.id);
                }
            });
        }, 0);
    }
    
    createActorDropdown(characterId) {
        // Check if container exists first
        const container = document.getElementById(`castMemberDropdown_${characterId}`);
        if (!container) {
            console.warn(`Dropdown container castMemberDropdown_${characterId} not found`);
            return;
        }
        
        const actorOptions = this.actors.map(actor => ({
            value: actor.id,
            label: actor.name
        }));
        
        const dropdown = new CustomDropdown({
            containerId: `castMemberDropdown_${characterId}`,
            name: `actor_${characterId}`,
            options: actorOptions,
            value: '',
            placeholder: 'Assign Cast Member...',
            searchable: true,
            allowCreate: true,
            createLabel: '+ Add New Cast Member...',
            size: 'xs',
            dropdownPosition: 'auto',
            portal: 'dialog', // Portal to dialog top-layer to escape modal-box clipping
            onChange: (castMemberId) => this.handleAssignActor(characterId, castMemberId),
            onCreate: () => this.handleCreateActor(characterId)
        });
        
        try {
            dropdown.render();
            this.actorDropdowns.set(characterId, dropdown);
            console.log(`Created dropdown for character ${characterId}`);
        } catch (error) {
            console.error(`Failed to create dropdown for character ${characterId}:`, error);
        }
    }
    
    async handleCreateActor(characterId) {
        // Initialize CAST MEMBER FORM MODAL if needed
        if (!this.CastMemberFormModal) {
            this.CastMemberFormModal = new CastMemberFormModal(this.projectId);
            this.CastMemberFormModal.onActorCreated = async (actor, assignedCharacterId) => {
                // Assign Cast Member to character
                if (assignedCharacterId) {
                    await this.handleAssignActor(assignedCharacterId, actor.id);
                }
                
                // Reload actors and update dropdowns
                await this.loadActors();
                this.updateAllActorDropdowns();
            };
        }
        
        // Find character
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            console.error('Character not found:', characterId);
            return;
        }
        
        // Open actor form with character pre-filled and hidden
        this.CastMemberFormModal.openForCreate({
            characterId: characterId,
            hideCharacterField: true
        });
    }
    
    updateAllActorDropdowns() {
        // Update options in all existing dropdowns
        const actorOptions = this.actors.map(actor => ({
            value: actor.id,
            label: actor.name
        }));
        
        this.actorDropdowns.forEach(dropdown => {
            dropdown.updateOptions(actorOptions);
        });
    }
    
    async handleAddCharacter() {
        const input = this.modal.querySelector('#newCharacterName');
        const name = input?.value.trim();
        
        if (!name) return;
        
        try {
            await CharacterService.create(this.projectId, name);
            input.value = '';
            await this.loadCharacters();
            this.renderCharacters();
            
            if (this.onCharactersChanged) {
                this.onCharactersChanged(this.characters);
            }
        } catch (error) {
            console.error('Error adding character:', error);
            this.showAlert('Failed to add character');
        }
    }
    
    async handleDeleteCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;
        
        const confirmed = await this.showConfirmDialog(
            'Delete Character',
            `Delete "${character.name}"? Scenes with this character will not be affected.`,
            'Delete',
            'btn-error'
        );
        
        if (!confirmed) return;
        
        try {
            await CharacterService.delete(characterId);
            await this.loadCharacters();
            this.renderCharacters();
            
            if (this.onCharactersChanged) {
                this.onCharactersChanged(this.characters);
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            this.showAlert('Failed to delete character');
        }
    }
    
    async handleAssignActor(characterId, castMemberId) {
        try {
            await CharacterService.assignActor(characterId, castMemberId, 'actor');
            await this.loadCharacters();
            this.renderCharacters();
            
            if (this.onCharactersChanged) {
                this.onCharactersChanged(this.characters);
            }
        } catch (error) {
            console.error('Error assigning actor:', error);
            this.showAlert('Failed to Assign Cast Member');
        }
    }
    
    async handleRemoveUnused() {
        const unusedCharacters = this.characters.filter(char => char.usageCount === 0);
        
        if (unusedCharacters.length === 0) {
            this.showAlert('All characters are currently in use!');
            return;
        }
        
        const confirmed = await this.showConfirmDialog(
            'Remove Unused Characters',
            `Remove ${unusedCharacters.length} unused character${unusedCharacters.length === 1 ? '' : 's'}?`,
            'Remove',
            'btn-error'
        );
        
        if (!confirmed) return;
        
        try {
            for (const character of unusedCharacters) {
                await CharacterService.delete(character.id);
            }
            
            await this.loadCharacters();
            this.renderCharacters();
            
            if (this.onCharactersChanged) {
                this.onCharactersChanged(this.characters);
            }
        } catch (error) {
            console.error('Error removing unused characters:', error);
            this.showAlert('Failed to remove unused characters');
        }
    }
    
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
