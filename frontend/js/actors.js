// =================================================================
// ACTORS MANAGEMENT - Main Application Logic
// =================================================================

import { ActorService } from './services/actorService.js';

class ActorsApp {
    constructor() {
        this.projectId = null;
        this.actors = [];
        this.currentActor = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.init();
    }

    async init() {
        // Get project ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project');

        if (!this.projectId) {
            alert('No project selected');
            window.location.href = 'projects.html';
            return;
        }

        // Load project info
        await this.loadProjectInfo();

        // Set up event listeners
        this.setupEventListeners();

        // Load actors
        await this.loadActors();
    }

    async loadProjectInfo() {
        try {
            const { data, error } = await window.supabase
                .from('projects')
                .select('name')
                .eq('id', this.projectId)
                .single();

            if (error) throw error;

            document.getElementById('projectTitle').textContent = data.name;
            
            // Update navigation links with project ID
            const navTimeline = document.getElementById('navTimeline');
            const navCalendar = document.getElementById('navCalendar');
            if (navTimeline) navTimeline.href = `timeline.html?project=${this.projectId}`;
            if (navCalendar) navCalendar.href = `calendar.html?project=${this.projectId}`;
        } catch (error) {
            console.error('Error loading project:', error);
            document.getElementById('projectTitle').textContent = 'Unknown Project';
        }
    }

    setupEventListeners() {
        // Add actor buttons
        document.getElementById('btnAddActor').addEventListener('click', () => this.openAddActorModal());
        document.getElementById('btnAddActorEmpty').addEventListener('click', () => this.openAddActorModal());

        // Form submission
        document.getElementById('actorForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderActors();
        });

        // Filters
        document.getElementById('filterAll').addEventListener('click', () => this.setFilter('all'));
        document.getElementById('filterRecent').addEventListener('click', () => this.setFilter('recent'));
        document.getElementById('filterAZ').addEventListener('click', () => this.setFilter('actor-az'));
        document.getElementById('filterCharacter').addEventListener('click', () => this.setFilter('character-az'));

        // Profile image URL input
        document.getElementById('profileImageUrl').addEventListener('input', (e) => {
            this.updateProfilePreview(e.target.value);
        });
    }

    async loadActors() {
        try {
            this.actors = await ActorService.getAll(this.projectId);
            this.renderActors();
        } catch (error) {
            console.error('Error loading actors:', error);
            this.showError('Failed to load actors');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        const filterButtons = document.querySelectorAll('.dropdown-content a');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', '')}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.renderActors();
    }

    renderActors() {
        const grid = document.getElementById('actorsGrid');
        const emptyState = document.getElementById('emptyState');

        // Filter actors by search term
        if (this.searchTerm) {
            ActorService.search(this.projectId, this.searchTerm).then(actors => {
                this.displayActors(actors);
            });
        } else {
            this.displayActors(this.actors);
        }
    }

    displayActors(actors) {
        const grid = document.getElementById('actorsGrid');
        const emptyState = document.getElementById('emptyState');

        // Apply sorting
        const sortedActors = ActorService.sortActors(actors, this.currentFilter);

        if (sortedActors.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        grid.innerHTML = sortedActors.map(actor => this.createActorCard(actor)).join('');

        // Add click listeners to cards
        sortedActors.forEach(actor => {
            const card = document.getElementById(`actor-card-${actor.id}`);
            if (card) {
                card.addEventListener('click', (e) => {
                    // Don't open detail if clicking action buttons
                    if (!e.target.closest('.actor-card-actions')) {
                        this.openActorDetail(actor);
                    }
                });
            }
        });
    }

    createActorCard(actor) {
        const imageHtml = actor.profile_image_url
            ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" class="actor-card-image" />`
            : `<svg class="actor-card-silhouette" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="50" rx="35" ry="40" fill="#cbd5e1"/>
                <ellipse cx="100" cy="35" rx="38" ry="25" fill="#94a3b8"/>
                <rect x="85" y="85" width="30" height="25" fill="#cbd5e1"/>
                <ellipse cx="100" cy="160" rx="50" ry="70" fill="#cbd5e1"/>
                <ellipse cx="60" cy="150" rx="15" ry="60" fill="#cbd5e1" transform="rotate(-10 60 150)"/>
                <ellipse cx="140" cy="150" rx="15" ry="60" fill="#cbd5e1" transform="rotate(10 140 150)"/>
                <ellipse cx="80" cy="300" rx="20" ry="90" fill="#cbd5e1"/>
                <ellipse cx="120" cy="300" rx="20" ry="90" fill="#cbd5e1"/>
            </svg>`;

        const characteristics = [];
        if (actor.hair_color) characteristics.push(`Hair: ${actor.hair_color}`);
        if (actor.eye_color) characteristics.push(`Eyes: ${actor.eye_color}`);
        if (actor.height) characteristics.push(`Height: ${actor.height}`);

        return `
            <div id="actor-card-${actor.id}" class="actor-card">
                <div class="actor-card-image-container">
                    ${imageHtml}
                </div>
                <div class="actor-card-body">
                    <h3 class="actor-card-title">${this.escapeHtml(actor.actor_name)}</h3>
                    <p class="actor-card-subtitle">as ${this.escapeHtml(actor.character_name)}</p>
                    
                    ${characteristics.length > 0 ? `
                        <div class="characteristic-badges">
                            ${characteristics.map(char => `
                                <span class="characteristic-badge">${this.escapeHtml(char)}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${actor.notes ? `
                        <div class="actor-card-details">
                            <div class="actor-card-detail">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span class="line-clamp-2">${this.escapeHtml(actor.notes.substring(0, 100))}${actor.notes.length > 100 ? '...' : ''}</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="actor-card-actions">
                        <button class="btn btn-sm btn-ghost flex-1" onclick="actorsApp.openEditActorModal('${actor.id}'); event.stopPropagation();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-ghost btn-error" onclick="actorsApp.deleteActor('${actor.id}'); event.stopPropagation();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    openAddActorModal() {
        this.currentActor = null;
        document.getElementById('modalTitle').textContent = 'Add Actor';
        document.getElementById('actorForm').reset();
        document.getElementById('profileImagePreview').classList.add('hidden');
        document.querySelector('.actor-silhouette').style.opacity = '1';
        actorModal.showModal();
    }

    async openEditActorModal(actorId) {
        try {
            this.currentActor = await ActorService.getById(actorId);
            document.getElementById('modalTitle').textContent = 'Edit Actor';

            // Populate form
            document.getElementById('actorName').value = this.currentActor.actor_name || '';
            document.getElementById('characterName').value = this.currentActor.character_name || '';
            document.getElementById('email').value = this.currentActor.email || '';
            document.getElementById('phone').value = this.currentActor.phone || '';
            document.getElementById('height').value = this.currentActor.height || '';
            document.getElementById('hairColor').value = this.currentActor.hair_color || '';
            document.getElementById('hairStyle').value = this.currentActor.hair_style || '';
            document.getElementById('eyeColor').value = this.currentActor.eye_color || '';
            document.getElementById('skinTone').value = this.currentActor.skin_tone || '';
            document.getElementById('bodyType').value = this.currentActor.body_type || '';
            document.getElementById('profileImageUrl').value = this.currentActor.profile_image_url || '';
            document.getElementById('notes').value = this.currentActor.notes || '';

            // Handle distinguishing features array
            if (this.currentActor.distinguishing_features && this.currentActor.distinguishing_features.length > 0) {
                document.getElementById('distinguishingFeatures').value = this.currentActor.distinguishing_features.join(', ');
            } else {
                document.getElementById('distinguishingFeatures').value = '';
            }

            // Update preview
            this.updateProfilePreview(this.currentActor.profile_image_url);

            actorModal.showModal();
        } catch (error) {
            console.error('Error loading actor:', error);
            this.showError('Failed to load actor details');
        }
    }

    updateProfilePreview(url) {
        const preview = document.getElementById('profileImagePreview');
        const image = document.getElementById('profileImage');
        const silhouette = document.querySelector('.actor-silhouette');

        if (url && url.trim() !== '') {
            image.src = url;
            preview.classList.remove('hidden');
            silhouette.style.opacity = '0';
        } else {
            preview.classList.add('hidden');
            silhouette.style.opacity = '1';
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const distinguishingFeaturesStr = formData.get('distinguishingFeatures');
        const distinguishingFeatures = distinguishingFeaturesStr 
            ? distinguishingFeaturesStr.split(',').map(f => f.trim()).filter(f => f)
            : [];

        const actorData = {
            actor_name: formData.get('actorName'),
            character_name: formData.get('characterName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            height: formData.get('height'),
            hair_color: formData.get('hairColor'),
            hair_style: formData.get('hairStyle'),
            eye_color: formData.get('eyeColor'),
            skin_tone: formData.get('skinTone'),
            body_type: formData.get('bodyType'),
            distinguishing_features: distinguishingFeatures,
            profile_image_url: formData.get('profileImageUrl'),
            notes: formData.get('notes')
        };

        try {
            if (this.currentActor) {
                // Update existing actor
                await ActorService.update(this.currentActor.id, actorData);
                this.showSuccess('Actor updated successfully');
            } else {
                // Create new actor
                await ActorService.create(this.projectId, actorData);
                this.showSuccess('Actor created successfully');
            }

            actorModal.close();
            await this.loadActors();
        } catch (error) {
            console.error('Error saving actor:', error);
            this.showError('Failed to save actor');
        }
    }

    async deleteActor(actorId) {
        if (!confirm('Are you sure you want to delete this actor? This action cannot be undone.')) {
            return;
        }

        try {
            await ActorService.delete(actorId);
            this.showSuccess('Actor deleted successfully');
            await this.loadActors();
        } catch (error) {
            console.error('Error deleting actor:', error);
            this.showError('Failed to delete actor');
        }
    }

    async openActorDetail(actor) {
        const modal = document.getElementById('actorDetailModal');
        const content = document.getElementById('actorDetailContent');

        // Get continuity data
        let continuityEntries = [];
        try {
            continuityEntries = await ActorService.getContinuity(actor.id);
        } catch (error) {
            console.error('Error loading continuity:', error);
        }

        const imageHtml = actor.profile_image_url
            ? `<img src="${actor.profile_image_url}" alt="${actor.actor_name}" />`
            : `<svg class="actor-silhouette" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 400px;">
                <ellipse cx="100" cy="50" rx="35" ry="40" fill="#cbd5e1"/>
                <ellipse cx="100" cy="35" rx="38" ry="25" fill="#94a3b8"/>
                <rect x="85" y="85" width="30" height="25" fill="#cbd5e1"/>
                <ellipse cx="100" cy="160" rx="50" ry="70" fill="#cbd5e1"/>
                <ellipse cx="60" cy="150" rx="15" ry="60" fill="#cbd5e1" transform="rotate(-10 60 150)"/>
                <ellipse cx="140" cy="150" rx="15" ry="60" fill="#cbd5e1" transform="rotate(10 140 150)"/>
                <ellipse cx="80" cy="300" rx="20" ry="90" fill="#cbd5e1"/>
                <ellipse cx="120" cy="300" rx="20" ry="90" fill="#cbd5e1"/>
            </svg>`;

        content.innerHTML = `
            <div class="actor-detail-header">
                <div class="actor-detail-image">
                    <div class="actor-detail-image-container">
                        ${imageHtml}
                    </div>
                </div>
                <div class="actor-detail-info">
                    <h2 class="actor-detail-title">${this.escapeHtml(actor.actor_name)}</h2>
                    <h3 class="actor-detail-character">${this.escapeHtml(actor.character_name)}</h3>
                    
                    ${actor.email || actor.phone ? `
                        <div class="space-y-2">
                            ${actor.email ? `<p><strong>Email:</strong> ${this.escapeHtml(actor.email)}</p>` : ''}
                            ${actor.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(actor.phone)}</p>` : ''}
                        </div>
                    ` : ''}

                    ${actor.notes ? `
                        <div class="alert alert-info mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${this.escapeHtml(actor.notes)}</span>
                        </div>
                    ` : ''}

                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-primary" onclick="actorsApp.openEditActorModal('${actor.id}'); actorDetailModal.close();">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Actor
                        </button>
                        <button class="btn" onclick="actorDetailModal.close();">Close</button>
                    </div>
                </div>
            </div>

            <div class="actor-detail-section">
                <h4 class="actor-detail-section-title">Physical Characteristics</h4>
                <div class="actor-detail-grid">
                    ${actor.height ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Height</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.height)}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_color ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Hair Color</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.hair_color)}</div>
                        </div>
                    ` : ''}
                    ${actor.hair_style ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Hair Style</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.hair_style)}</div>
                        </div>
                    ` : ''}
                    ${actor.eye_color ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Eye Color</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.eye_color)}</div>
                        </div>
                    ` : ''}
                    ${actor.skin_tone ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Skin Tone</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.skin_tone)}</div>
                        </div>
                    ` : ''}
                    ${actor.body_type ? `
                        <div class="actor-detail-field">
                            <div class="actor-detail-field-label">Body Type</div>
                            <div class="actor-detail-field-value">${this.escapeHtml(actor.body_type)}</div>
                        </div>
                    ` : ''}
                </div>

                ${actor.distinguishing_features && actor.distinguishing_features.length > 0 ? `
                    <div class="mt-4">
                        <div class="actor-detail-field-label mb-2">Distinguishing Features</div>
                        <div class="characteristic-badges">
                            ${actor.distinguishing_features.map(feature => `
                                <span class="badge badge-lg">${this.escapeHtml(feature)}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${continuityEntries.length > 0 ? `
                <div class="actor-detail-section">
                    <h4 class="actor-detail-section-title">Continuity Timeline</h4>
                    <div class="continuity-timeline">
                        ${continuityEntries.map(entry => `
                            <div class="continuity-entry">
                                <div class="continuity-entry-header">
                                    <div class="continuity-scene-info">
                                        ${entry.scene ? `Scene ${entry.scene.scene_number}` : 'General Continuity'}
                                    </div>
                                    ${entry.continuity_date ? `
                                        <div class="text-sm text-base-content/60">
                                            ${new Date(entry.continuity_date).toLocaleDateString()}
                                        </div>
                                    ` : ''}
                                </div>
                                ${entry.wardrobe_description || entry.makeup_description || entry.hair_description ? `
                                    <div class="space-y-2 text-sm">
                                        ${entry.wardrobe_description ? `<p><strong>Wardrobe:</strong> ${this.escapeHtml(entry.wardrobe_description)}</p>` : ''}
                                        ${entry.makeup_description ? `<p><strong>Makeup:</strong> ${this.escapeHtml(entry.makeup_description)}</p>` : ''}
                                        ${entry.hair_description ? `<p><strong>Hair:</strong> ${this.escapeHtml(entry.hair_description)}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="text-center py-10 text-base-content/50">
                    <p>No continuity entries yet. These will be added as you link actors to scenes.</p>
                </div>
            `}
        `;

        modal.showModal();
    }

    showSuccess(message) {
        // Simple success notification (you can enhance this)
        alert(message);
    }

    showError(message) {
        // Simple error notification (you can enhance this)
        alert(message);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
let actorsApp;
document.addEventListener('DOMContentLoaded', () => {
    actorsApp = new ActorsApp();
});

// Make actorsApp available globally for onclick handlers
window.actorsApp = actorsApp;
