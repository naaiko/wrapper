// =================================================================
// CAST GRID - Main Application Logic
// =================================================================

import { ActorService } from './services/actorService.js';
import { ActorCard } from './components/actorCard.js';
import Toast from './utils/toast.js';
import { version } from './version.js';

class CastGridApp {
    constructor() {
        this.projectId = null;
        this.actors = [];
        this.filteredActors = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchTerm = '';
        
        // DOM elements
        this.gridContainer = document.getElementById('castGrid');
        this.searchInput = document.getElementById('searchInput');
        this.filterOptions = document.querySelectorAll('.filter-option');
        this.sortOptions = document.querySelectorAll('.sort-option');
        this.filterLabel = document.getElementById('filterLabel');
        this.sortLabel = document.getElementById('sortLabel');
        this.emptyState = document.getElementById('emptyState');
        this.noResultsState = document.getElementById('noResultsState');
        this.addActorBtn = document.getElementById('addActorBtn');
        this.quickAddModal = document.getElementById('quickAddModal');
        this.quickAddForm = document.getElementById('quickAddForm');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        
        this.init();
    }
    
    async init() {
        // Get project ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project') || localStorage.getItem('continuityManager_currentProject');
        
        if (!this.projectId) {
            window.location.href = 'projects.html';
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load actors
        await this.loadActors();
        
        // Render grid
        this.renderGrid();
    }
    
    setupEventListeners() {
        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndRender();
        });
        
        // Filter options
        this.filterOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentFilter = option.dataset.filter;
                this.filterLabel.textContent = option.textContent;
                
                // Update active state
                this.filterOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Close dropdown (remove focus)
                option.blur();
                document.activeElement?.blur();
                
                this.filterAndRender();
            });
        });
        
        // Sort options
        this.sortOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentSort = option.dataset.sort;
                this.sortLabel.textContent = option.textContent;
                
                // Update active state
                this.sortOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Close dropdown
                option.blur();
                document.activeElement?.blur();
                
                this.filterAndRender();
            });
        });
        
        // Add actor button
        if (!this.addActorBtn) {
            console.error('[CAST GRID] Add actor button not found!');
        } else {
            console.log('[CAST GRID] Add actor button found, adding click listener');
            this.addActorBtn.addEventListener('click', () => {
                console.log('[CAST GRID] Add actor button clicked');
                this.quickAddModal.showModal();
            });
        }
        
        // Quick add form
        this.quickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleQuickAdd();
        });
        
        // Photo preview handling
        const photoUrlInput = document.getElementById('actorPhotoInput');
        const photoFileInput = document.getElementById('actorPhotoFile');
        const photoPreview = document.getElementById('photoPreview');
        const photoPreviewImg = photoPreview.querySelector('img');
        
        photoUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                photoPreviewImg.src = url;
                photoPreview.classList.remove('hidden');
                photoFileInput.value = ''; // Clear file if URL is used
            } else {
                photoPreview.classList.add('hidden');
            }
        });
        
        photoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreviewImg.src = event.target.result;
                    photoPreview.classList.remove('hidden');
                    photoUrlInput.value = event.target.result; // Store data URL
                };
                reader.readAsDataURL(file);
            } else {
                photoPreview.classList.add('hidden');
            }
        });
        
        // Clear filters button
        this.clearFiltersBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.currentFilter = 'all';
            this.currentSort = 'name';
            
            // Reset UI
            this.filterLabel.textContent = 'All Actors';
            this.sortLabel.textContent = 'Name';
            this.filterOptions[0].classList.add('active');
            this.sortOptions[0].classList.add('active');
            
            this.filterAndRender();
        });
        
        // Handle actor detail navigation
        const actorIdParam = new URLSearchParams(window.location.search).get('actor');
        if (actorIdParam) {
            // Redirect to detail screen
            window.location.href = `actors-detail.html?project=${this.projectId}&actor=${actorIdParam}`;
        }
    }
    
    async loadActors() {
        try {
            // Show skeletons while loading
            this.renderSkeletons();
            
            // Load actors with scene count
            const actors = await ActorService.getAll(this.projectId);
            
            // Load scene counts for each actor and normalize data structure
            const actorsWithCounts = await Promise.all(
                actors.map(async (actor) => {
                    const sceneCount = await this.getActorSceneCount(actor.id);
                    
                    // Normalize data structure for ActorCard component
                    return {
                        ...actor,
                        scene_count: sceneCount,
                        // Map database fields to expected component fields
                        name: actor.first_name && actor.last_name 
                            ? `${actor.first_name} ${actor.last_name}`
                            : actor.actor_name || 'Unnamed Actor',
                        photo_url: actor.profile_image_url,
                        role: actor.role || null // Will be null until migration adds role column
                    };
                })
            );
            
            this.actors = actorsWithCounts;
            this.filteredActors = [...this.actors];
            
        } catch (error) {
            console.error('[CAST GRID] Error loading actors:', error);
            this.actors = [];
            this.filteredActors = [];
        }
    }
    
    async getActorSceneCount(actorId) {
        try {
            const { count } = await window.supabase
                .from('scene_actors')
                .select('*', { count: 'exact', head: true })
                .eq('actor_id', actorId);
            return count || 0;
        } catch (error) {
            console.error(`[CAST GRID] Error getting scene count for actor ${actorId}:`, error);
            return 0;
        }
    }
    
    filterAndRender() {
        // Start with all actors
        let filtered = [...this.actors];
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(actor => 
                actor.role?.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(actor =>
                actor.name.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply sort
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'scenes':
                    return (b.scene_count || 0) - (a.scene_count || 0);
                case 'recent':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });
        
        this.filteredActors = filtered;
        this.renderGrid();
    }
    
    renderGrid() {
        // Clear grid
        this.gridContainer.innerHTML = '';
        
        // Show appropriate state
        if (this.actors.length === 0) {
            // No actors at all - show empty state
            this.emptyState.classList.remove('hidden');
            this.noResultsState.classList.add('hidden');
            return;
        }
        
        if (this.filteredActors.length === 0) {
            // No results for current filter/search - show no results state
            this.emptyState.classList.add('hidden');
            this.noResultsState.classList.remove('hidden');
            return;
        }
        
        // Hide empty states
        this.emptyState.classList.add('hidden');
        this.noResultsState.classList.add('hidden');
        
        // Add "add actor" placeholder card first
        const addPlaceholder = this.createAddActorPlaceholder();
        this.gridContainer.appendChild(addPlaceholder);
        
        // Render actors
        this.filteredActors.forEach(actor => {
            const card = ActorCard.render(actor, (clickedActor) => {
                this.openActorDetail(clickedActor.id);
            });
            this.gridContainer.appendChild(card);
        });
    }
    
    createAddActorPlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'add-actor-placeholder';
        placeholder.innerHTML = `
            <div class="add-actor-placeholder__fill"></div>
            <div class="add-actor-placeholder__icon">+</div>
        `;
        
        // Add click listener to open quick add modal
        placeholder.addEventListener('click', () => {
            this.quickAddModal.showModal();
        });
        
        return placeholder;
    }
    
    renderSkeletons() {
        this.gridContainer.innerHTML = '';
        this.emptyState.classList.add('hidden');
        this.noResultsState.classList.add('hidden');
        
        const skeletons = ActorCard.renderSkeletons(8);
        skeletons.forEach(skeleton => {
            this.gridContainer.appendChild(skeleton);
        });
    }
    
    openActorDetail(actorId) {
        // Navigate to detail screen with current filter/sort in URL for back navigation
        const params = new URLSearchParams({
            project: this.projectId,
            actor: actorId,
            filter: this.currentFilter,
            sort: this.currentSort,
            search: this.searchTerm
        });
        
        window.location.href = `actors-detail.html?${params.toString()}`;
    }
    
    async handleQuickAdd() {
        const name = document.getElementById('actorNameInput').value.trim();
        const role = document.getElementById('actorRoleSelect').value;
        const photoUrl = document.getElementById('actorPhotoInput').value.trim();
        
        if (!name) {
            alert('Please enter an actor name');
            return;
        }
        
        try {
            // Split name into first and last name (simple split on space)
            const nameParts = name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Create actor with proper field names
            const newActor = await ActorService.create(this.projectId, {
                actor_name: name,
                character_name: name, // Default to same as actor name
                first_name: firstName,
                last_name: lastName || null,
                role: role || null,
                profile_image_url: photoUrl || null
            });
            
            // Normalize data structure for display
            const actorWithCount = {
                ...newActor,
                scene_count: 0,
                name: newActor.first_name && newActor.last_name 
                    ? `${newActor.first_name} ${newActor.last_name}`
                    : newActor.actor_name,
                photo_url: newActor.profile_image_url,
                role: newActor.role
            };
            
            this.actors.push(actorWithCount);
            
            // Close modal and reset form
            this.quickAddModal.close();
            this.quickAddForm.reset();
            document.getElementById('photoPreview').classList.add('hidden');
            
            // Re-filter and render
            this.filterAndRender();
            
            // Show success toast
            Toast.success(`Actor "${actorWithCount.name}" created successfully!`);
            
        } catch (error) {
            console.error('[CAST GRID] Error creating actor:', error);
            Toast.error('Failed to create actor. Please try again.');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CastGridApp();
});
