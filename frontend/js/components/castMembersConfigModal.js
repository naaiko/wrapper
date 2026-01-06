// =================================================================
// ACTORS CONFIG MODAL - Actor CRUD Management
// =================================================================

import { supabaseClient } from '../api/supabaseClient.js';

export class ActorsConfigModal {
    constructor(projectId) {
        this.projectId = projectId;
        this.actors = [];
        this.modal = null;
        this.onActorsChanged = null;
        
        this.createModal();
    }
    
    createModal() {
        this.modal = document.createElement('dialog');
        this.modal.id = 'actorsConfigModal';
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">Actors Settings</h3>
                
                <div class="space-y-4">
                    <!-- Existing Actors -->
                    <div>
                        <h4 class="font-semibold mb-2">Cast Members</h4>
                        <div id="castMembersList" class="space-y-2">
                            <!-- Actor items will be rendered here -->
                        </div>
                    </div>

                    <!-- Add New Cast Member -->
                    <div class="divider">Add New Cast Member</div>
                    <form id="addActorForm">
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                id="newActorName" 
                                class="input input-bordered flex-1" 
                                placeholder="e.g., John Smith, Sarah Johnson"
                                required
                            />
                            <button type="submit" class="btn btn-primary">Add</button>
                        </div>
                    </form>
                </div>
                
                <div class="modal-action">
                    <button type="button" class="btn" id="closeActorsConfigBtn">Close</button>
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
        // Add actor form
        const form = this.modal.querySelector('#addActorForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddActor();
        });
        
        // Close button
        const closeBtn = this.modal.querySelector('#closeActorsConfigBtn');
        closeBtn?.addEventListener('click', () => this.close());
    }
    
    async open() {
        await this.loadActors();
        this.renderActors();
        this.modal.showModal();
    }
    
    close() {
        this.modal.close();
    }
    
    async loadActors() {
        const { data, error } = await supabaseClient.db
            .from('cast_members')
            .select('*')
            .eq('project_id', this.projectId)
            .order('name');
        
        if (error) {
            console.error('Error loading actors:', error);
            this.actors = [];
        } else {
            this.actors = data || [];
        }
    }
    
    renderActors() {
        const container = this.modal.querySelector('#actorsList');
        if (!container) return;
        
        if (this.actors.length === 0) {
            container.innerHTML = '<p class="text-sm text-base-content/60">No cast members yet</p>';
            return;
        }
        
        container.innerHTML = this.actors.map(actor => `
            <div class="flex items-center gap-2 p-3 bg-base-200 rounded-lg" data-actor-id="${actor.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="flex-1 font-medium">${actor.name}</span>
                <button type="button" class="btn btn-ghost btn-xs text-error" data-delete-actor="${actor.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Attach delete handlers
        container.querySelectorAll('[data-delete-actor]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const castMemberId = btn.getAttribute('data-delete-actor');
                await this.handleDeleteActor(castMemberId);
            });
        });
    }
    
    async handleAddActor() {
        const input = this.modal.querySelector('#newActorName');
        const name = input?.value.trim();
        
        if (!name) return;
        
        try {
            const { error } = await supabaseClient.db
                .from('cast_members')
                .insert([{ project_id: this.projectId, name }]);
            
            if (error) throw error;
            
            input.value = '';
            await this.loadActors();
            this.renderActors();
            
            if (this.onActorsChanged) {
                this.onActorsChanged(this.actors);
            }
        } catch (error) {
            console.error('Error adding actor:', error);
            alert('Failed to add actor');
        }
    }
    
    async handleDeleteActor(castMemberId) {
        if (!confirm('Delete this actor? Scene assignments will be removed.')) {
            return;
        }
        
        try {
            await supabaseClient.db.from('cast_members').delete().eq('id', castMemberId);
            await this.loadActors();
            this.renderActors();
            
            if (this.onActorsChanged) {
                this.onActorsChanged(this.actors);
            }
        } catch (error) {
            console.error('Error Deleting cast member:', error);
            alert('Failed to Delete Cast Member');
        }
    }
}
