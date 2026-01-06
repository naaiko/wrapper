// =================================================================
// CAST MEMBER FORM MODAL - Reusable Cast Member Creation/Edit Form
// =================================================================
// Herbruikbare modal voor cast member creation en editing
// Kan gebruikt worden vanuit actors scherm, character assignment, etc.

import { CastMemberService } from '../services/castMemberService.js';
import { CustomDropdown } from './customDropdown.js';

export class CastMemberFormModal {
    constructor(projectId) {
        this.projectId = projectId;
        this.modal = null;
        this.mode = 'create'; // 'create' or 'edit'
        this.castMemberId = null;
        this.onActorCreated = null; // Callback when actor is created
        this.onActorUpdated = null; // Callback when actor is updated
        this.prefilledCharacterId = null; // Optional character to assign
        this.characterDropdown = null;
        this.roleTypeDropdown = null;
        
        this.createModal();
    }
    
    createModal() {
        this.modal = document.createElement('dialog');
        this.modal.id = 'CastMemberFormModal';
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-box" style="overflow: visible;">
                <h3 class="font-bold text-lg mb-4" id="castMemberFormTitle">Add New Cast Member</h3>
                <form id="castMemberForm" class="space-y-4">
                    <!-- Name Fields -->
                    <div class="grid grid-cols-2 gap-2">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">First Name *</span>
                            </label>
                            <input 
                                type="text" 
                                id="castMemberFirstName" 
                                placeholder="First name" 
                                class="input input-bordered input-sm" 
                                autocomplete="off"
                                data-1p-ignore
                                data-lpignore="true"
                                required
                                autofocus
                            />
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Last Name *</span>
                            </label>
                            <input 
                                type="text" 
                                id="castMemberLastName" 
                                placeholder="Last name" 
                                class="input input-bordered input-sm" 
                                autocomplete="off"
                                data-1p-ignore
                                data-lpignore="true"
                                required
                            />
                        </div>
                    </div>
                    
                    <!-- Character Assignment (optional) -->
                    <div class="form-control" id="characterFieldContainer">
                        <label class="label">
                            <span class="label-text">Character (optional)</span>
                        </label>
                        <div id="castMemberCharacterDropdownContainer"></div>
                    </div>
                    
                    <!-- Role Type -->
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Role Type</span>
                        </label>
                        <div id="castMemberRoleTypeDropdownContainer"></div>
                    </div>
                    
                    <!-- Photo -->
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Photo (optional)</span>
                        </label>
                        <div class="flex gap-2">
                            <input 
                                type="url" 
                                id="castMemberPhotoUrl" 
                                placeholder="Photo URL" 
                                class="input input-bordered input-sm flex-1"
                                autocomplete="off"
                                data-1p-ignore
                                data-lpignore="true"
                            />
                            <label for="castMemberPhotoFile" class="btn btn-outline btn-sm btn-square" title="Upload photo">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </label>
                            <input type="file" id="castMemberPhotoFile" class="hidden" accept="image/*" />
                        </div>
                        <div id="castMemberPhotoPreview" class="mt-2 hidden">
                            <img src="" alt="Preview" class="w-24 h-24 object-cover rounded-lg" />
                        </div>
                    </div>
                    
                    <div class="modal-action">
                        <button type="button" class="btn btn-sm" id="castMemberFormCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm" id="castMemberFormSubmit">Add Cast Member</button>
                    </div>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        `;
        
        document.body.appendChild(this.modal);
        this.attachEventListeners();
        this.initializeRoleTypeDropdown();
    }

    initializeRoleTypeDropdown() {
        const container = this.modal.querySelector('#castMemberRoleTypeDropdownContainer');
        if (!container) return;

        container.innerHTML = '<div id="castMemberRoleTypeDropdown"></div>';

        const roleTypeOptions = [
            { value: '', label: 'Select role type...' },
            { value: 'speaking_actor', label: 'Speaking Actor' },
            { value: 'background', label: 'Background' },
            { value: 'stunt', label: 'Stunt' },
            { value: 'understudy', label: 'Understudy' },
            { value: 'alternate', label: 'Alternate' },
            { value: 'photo_double', label: 'Photo Double' },
            { value: 'voice', label: 'Voice' }
        ];

        this.roleTypeDropdown = new CustomDropdown({
            containerId: 'castMemberRoleTypeDropdown',
            name: 'role_type',
            options: roleTypeOptions,
            value: '',
            placeholder: 'Select role type...',
            searchable: false,
            size: 'sm',
            portal: 'dialog',
            onChange: () => {}
        });

        this.roleTypeDropdown.render();
    }
    
    attachEventListeners() {
        // Form submit
        const form = this.modal.querySelector('#castMemberForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
        
        // Cancel button
        this.modal.querySelector('#castMemberFormCancel')?.addEventListener('click', () => {
            this.close();
        });
        
        // Photo file upload
        const photoFile = this.modal.querySelector('#castMemberPhotoFile');
        photoFile?.addEventListener('change', (e) => {
            this.handlePhotoUpload(e.target.files[0]);
        });
        
        // Photo URL input - show preview
        const photoUrl = this.modal.querySelector('#castMemberPhotoUrl');
        photoUrl?.addEventListener('blur', (e) => {
            this.updatePhotoPreview(e.target.value);
        });
    }
    
    handlePhotoUpload(file) {
        if (!file) return;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = this.modal.querySelector('#castMemberPhotoPreview');
            const img = preview.querySelector('img');
            img.src = e.target.result;
            preview.classList.remove('hidden');
            
            // Set URL input (in real implementation, upload to storage)
            this.modal.querySelector('#castMemberPhotoUrl').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    updatePhotoPreview(url) {
        if (!url) {
            this.modal.querySelector('#castMemberPhotoPreview').classList.add('hidden');
            return;
        }
        
        const preview = this.modal.querySelector('#castMemberPhotoPreview');
        const img = preview.querySelector('img');
        img.src = url;
        preview.classList.remove('hidden');
    }
    
    async initializeCharacterDropdown(characters = []) {
        const container = this.modal.querySelector('#castMemberCharacterDropdownContainer');
        if (!container) return;
        
        // Clear existing dropdown
        container.innerHTML = '<div id="castMemberCharacterDropdown"></div>';
        
        const options = characters.map(char => ({
            value: char.id,
            label: char.name
        }));
        
        this.characterDropdown = new CustomDropdown({
            containerId: 'castMemberCharacterDropdown',
            name: 'character_id',
            options: options,
            value: this.prefilledCharacterId || '',
            placeholder: 'Select character (optional)...',
            searchable: true,
            size: 'sm',
            portal: 'dialog' // Portal to dialog top-layer to escape modal overflow constraints
        });
        
        this.characterDropdown.render();
    }
    
    async openForCreate(options = {}) {
        this.mode = 'create';
        this.castMemberId = null;
        this.prefilledCharacterId = options.characterId || null;
        
        // Update title and button
        this.modal.querySelector('#castMemberFormTitle').textContent = 'Add New Cast Member';
        this.modal.querySelector('#castMemberFormSubmit').textContent = 'Add Cast Member';
        
        // Reset form
        this.modal.querySelector('#castMemberForm').reset();
        this.modal.querySelector('#castMemberPhotoPreview').classList.add('hidden');

        // Reset dropdown values
        this.roleTypeDropdown?.setValue('');
        
        // Show/hide character field based on context
        const characterField = this.modal.querySelector('#characterFieldContainer');
        if (options.hideCharacterField) {
            characterField.classList.add('hidden');
        } else {
            characterField.classList.remove('hidden');
            // Initialize character dropdown if characters provided
            if (options.characters) {
                await this.initializeCharacterDropdown(options.characters);
            }
        }
        
        this.modal.showModal();
    }
    
    async openForEdit(castMemberId, castMemberData) {
        this.mode = 'edit';
        this.castMemberId = castMemberId;
        
        // Update title and button
        this.modal.querySelector('#castMemberFormTitle').textContent = 'Edit Cast Member';
        this.modal.querySelector('#castMemberFormSubmit').textContent = 'Save Changes';
        
        // Fill form with actor data
        this.modal.querySelector('#castMemberFirstName').value = castMemberData.first_name || '';
        this.modal.querySelector('#castMemberLastName').value = castMemberData.last_name || '';
        this.roleTypeDropdown?.setValue(castMemberData.role_type || '');
        this.modal.querySelector('#castMemberPhotoUrl').value = castMemberData.photo_url || '';
        
        if (castMemberData.photo_url) {
            this.updatePhotoPreview(castMemberData.photo_url);
        }
        
        // Hide character field in edit mode
        this.modal.querySelector('#characterFieldContainer').classList.add('hidden');
        
        this.modal.showModal();
    }
    
    async handleSubmit() {
        const firstName = this.modal.querySelector('#castMemberFirstName').value.trim();
        const lastName = this.modal.querySelector('#castMemberLastName').value.trim();
        const roleType = this.roleTypeDropdown?.value || '';
        const photoUrl = this.modal.querySelector('#castMemberPhotoUrl').value.trim();
        
        if (!firstName || !lastName) {
            alert('Please provide both first and last name');
            return;
        }
        
        const castMemberData = {
            first_name: firstName,
            last_name: lastName,
            role_type: roleType || null,
            photo_url: photoUrl || null
        };
        
        try {
            let actor;
            
            if (this.mode === 'create') {
                // Create new actor
                actor = await CastMemberService.create(this.projectId, castMemberData);
                
                // Get selected character ID if dropdown exists
                const characterId = this.characterDropdown?.value || this.prefilledCharacterId;
                
                // Call callback with actor and optional character ID
                if (this.onActorCreated) {
                    await this.onActorCreated(actor, characterId);
                }
            } else {
                // Update existing actor
                actor = await CastMemberService.update(this.castMemberId, castMemberData);
                
                if (this.onActorUpdated) {
                    await this.onActorUpdated(actor);
                }
            }
            
            this.close();
            
        } catch (error) {
            console.error('Error saving actor:', error);
            alert('Failed to save actor. Please try again.');
        }
    }
    
    close() {
        this.modal.close();
        this.modal.querySelector('#castMemberForm').reset();
        this.modal.querySelector('#castMemberPhotoPreview').classList.add('hidden');
        this.prefilledCharacterId = null;
        this.characterDropdown = null;
    }
    
    destroy() {
        this.modal.remove();
    }
}
