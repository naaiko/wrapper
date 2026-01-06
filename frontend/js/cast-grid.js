// =================================================================
// CAST GRID - Main Application Logic
// =================================================================

import { CastMemberService } from './services/castMemberService.js';
import { CharacterService } from './services/characterService.js';
import { ActorCard } from './components/castMemberCard.js';
import { CustomDropdown } from './components/customDropdown.js';
import Toast from './utils/toast.js';
import { version } from './version.js';

class CastGridApp {
    constructor() {
        this.projectId = null;
        this.actors = [];
        this.characters = [];
        this.filteredActors = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchTerm = '';
        this.characterDropdown = null;
        
        // DOM elements
        this.gridContainer = document.getElementById('castGrid');
        this.searchInput = document.getElementById('searchInput');
        this.filterOptions = document.querySelectorAll('.filter-option');
        this.sortOptions = document.querySelectorAll('.sort-option');
        this.filterLabel = document.getElementById('filterLabel');
        this.sortLabel = document.getElementById('sortLabel');
        this.emptyState = document.getElementById('emptyState');
        this.noResultsState = document.getElementById('noResultsState');
        this.addActorBtn = document.getElementById('fabAddActor');
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
        
        // Load characters for dropdown
        await this.loadCharacters();
        
        // Load actors
        await this.loadActors();
        
        // Apply filters and render
        this.filterAndRender();
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
                this.initializeCharacterDropdown();
                this.quickAddModal.showModal();
            });
        }
        
        // Quick add form
        this.quickAddForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleQuickAdd();
        });
        
        // Photo preview handling
        const photoUrlInput = document.getElementById('castMemberPhotoInput');
        const photoFileInput = document.getElementById('castMemberPhotoFile');
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
            window.location.href = `cast-detail.html?project=${this.projectId}&actor=${actorIdParam}`;
        }
    }
    
    async loadActors() {
        try {
            // Show skeletons while loading
            this.renderSkeletons();
            
            // Load actors with character assignments
            const { data: actors, error } = await window.supabase
                .from('cast_members')
                .select(`
                    *,
                    character_assignments:character_cast_assignments(
                        assignment_type,
                        character:characters(name)
                    )
                `)
                .eq('project_id', this.projectId)
                .order('name');
            
            if (error) throw error;
            
            // Load scene counts for each actor and normalize data structure
            const actorsWithCounts = await Promise.all(
                (actors || []).map(async (actor) => {
                    const sceneCount = await this.getActorSceneCount(actor.id);
                    
                    // Get primary character (first 'actor' type assignment)
                    const primaryAssignment = actor.character_assignments?.find(a => a.assignment_type === 'actor');
                    const characterName = primaryAssignment?.character?.name || null;
                    
                    // Normalize data structure for ActorCard component
                    return {
                        ...actor,
                        scene_count: sceneCount,
                        character_name: characterName,
                        // Map database fields to expected component fields
                        // name is auto-generated in database
                        photo_url: actor.profile_image_url,
                        role: actor.role_type
                    };
                })
            );
            
            this.actors = actorsWithCounts;
            console.log('[CAST GRID] Loaded actors:', this.actors.length);
        } catch (error) {
            console.error('[CAST GRID] Error loading actors:', error);
            Toast.error('Failed to load actors');
        }
    }
    
    async loadCharacters() {
        try {
            this.characters = await CharacterService.getAll(this.projectId);
            console.log('[CAST GRID] Loaded characters:', this.characters.length);
        } catch (error) {
            console.error('[CAST GRID] Error loading characters:', error);
            this.characters = [];
        }
    }
    
    initializeCharacterDropdown() {
        if (this.characterDropdown) {
            // Update options if dropdown already exists
            const characterOptions = this.characters.map(char => ({
                value: char.id,
                label: char.name
            }));
            this.characterDropdown.updateOptions(characterOptions);
            return;
        }
        
        // Create new dropdown
        const characterOptions = this.characters.map(char => ({
            value: char.id,
            label: char.name
        }));
        
        this.characterDropdown = new CustomDropdown({
            containerId: 'characterDropdownContainer',
            name: 'character_id',
            options: characterOptions,
            value: '',
            placeholder: 'Select character (optional)...',
            searchable: true,
            size: 'sm',
            onChange: (value) => console.log('Character selected:', value)
        });
        
        this.characterDropdown.render();
    }
    
    async getActorSceneCount(castMemberId) {
        try {
            // Count scenes through character assignments
            // Actor -> character_cast_assignments -> character -> scene_characters -> scenes
            const { data, error } = await window.supabase
                .from('character_cast_assignments')
                .select(`
                    character:characters(
                        scene_characters(scene_id)
                    )
                `)
                .eq('cast_member_id', castMemberId);
            
            if (error) throw error;
            
            // Get unique scene IDs
            const sceneIds = new Set();
            (data || []).forEach(assignment => {
                assignment.character?.scene_characters?.forEach(sc => {
                    if (sc.scene_id) sceneIds.add(sc.scene_id);
                });
            });
            
            return sceneIds.size;
        } catch (error) {
            console.error(`[CAST GRID] Error getting scene count for actor ${castMemberId}:`, error);
            return 0;
        }
    }
    
    filterAndRender() {
        // Start with all actors
        let filtered = [...this.actors];
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(actor => 
                actor.role_type?.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(actor =>
                actor.name?.toLowerCase().includes(this.searchTerm)
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
            // No cast members at all - show empty state
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
    
    openActorDetail(castMemberId) {
        // Navigate to detail screen with current filter/sort in URL for back navigation
        const params = new URLSearchParams({
            project: this.projectId,
            actor: castMemberId,
            filter: this.currentFilter,
            sort: this.currentSort,
            search: this.searchTerm
        });
        
        window.location.href = `cast-detail.html?${params.toString()}`;
    }
    
    async handleQuickAdd() {
        const firstName = document.getElementById('castMemberFirstNameInput').value.trim();
        const lastName = document.getElementById('castMemberLastNameInput').value.trim();
        const characterId = this.characterDropdown?.value || null;
        const roleType = document.getElementById('castMemberRoleTypeSelect').value;
        const photoUrl = document.getElementById('castMemberPhotoInput').value.trim();
        
        if (!firstName || !lastName) {
            Toast.error('Please enter first and last name');
            return;
        }
        
        try {
            const fullName = `${firstName} ${lastName}`;
            
            // Create actor
            const newCastMember = await CastMemberService.create(this.projectId, {
                first_name: firstName,
                last_name: lastName,
                role_type: roleType || null,
                profile_image_url: photoUrl || null
            });
            
            // If character selected, create assignment
            if (characterId) {
                try {
                    await CharacterService.assignActor(characterId, newCastMember.id, 'actor');
                } catch (assignError) {
                    console.error('[CAST GRID] Error assigning character:', assignError);
                    Toast.warning(`Cast member created but character assignment failed`);
                }
            }
            
            // Normalize data structure for display
            const actorWithCount = {
                ...newCastMember,
                scene_count: 0,
                name: fullName,
                photo_url: newCastMember.profile_image_url,
                role: newCastMember.role_type
            };
            
            this.actors.push(actorWithCount);
            
            // Close modal and reset form
            this.quickAddModal.close();
            this.quickAddForm.reset();
            document.getElementById('photoPreview').classList.add('hidden');
            if (this.characterDropdown) {
                this.characterDropdown.setValue('');
            }
            
            // Re-filter and render
            this.filterAndRender();
            
            // Show success toast
            Toast.success(`Actor "${fullName}" created successfully!`);
            
        } catch (error) {
            console.error('[CAST GRID] Error Creating cast member:', error);
            Toast.error('Failed to create actor. Please try again.');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CastGridApp();
});
