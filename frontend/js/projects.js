// =================================================================
// PROJECT MANAGEMENT WITH SUPABASE
// =================================================================

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';

// =================================================================
// SUPABASE DATABASE FUNCTIONS
// =================================================================

/**
 * Get all projects from Supabase
 */
async function getAllProjects() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('last_modified', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        alert('Failed to load projects. Please check your connection.');
        return [];
    }
}

/**
 * Get current project ID from localStorage
 */
function getCurrentProjectId() {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
}

/**
 * Set current project ID in localStorage
 */
function setCurrentProjectId(projectId) {
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
}

// =================================================================
// PROJECT OPERATIONS
// =================================================================

/**
 * Create a new project in Supabase
 */
async function createNewProject(event) {
    event.preventDefault();
    
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    
    if (!name) {
        alert('Please enter a project name');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading loading-spinner"></span> Creating...';
        
        // Insert new project into Supabase
        const { data, error } = await supabase
            .from('projects')
            .insert([
                {
                    name: name,
                    description: description
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Set as current project
        setCurrentProjectId(data.id);
        
        // Redirect to timeline
        window.location.href = 'timeline.html';
    } catch (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project: ' + error.message);
        
        // Reset button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Project';
    }
}

/**
 * Load an existing project
 */
function loadProject(projectId) {
    setCurrentProjectId(projectId);
    window.location.href = 'timeline.html';
}

/**
 * Delete a project from Supabase
 */
async function deleteProject(projectId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
        
        // Refresh the display
        await renderProjectsList();
        await renderRecentProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project: ' + error.message);
    }
}

// =================================================================
// UI FUNCTIONS
// =================================================================

/**
 * Show new project modal
 */
function showNewProjectModal() {
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('newProjectModal').showModal();
}

/**
 * Show open project modal
 */
async function showOpenProjectModal() {
    await renderProjectsList();
    document.getElementById('openProjectModal').showModal();
}

/**
 * Render projects list in the modal
 */
async function renderProjectsList() {
    const projects = await getAllProjects();
    const container = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-base-content/50">
                <p>No projects found</p>
                <p class="text-sm mt-2">Create a new project to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = projects.map(project => {
        const lastModified = new Date(project.last_modified);
        const formattedDate = lastModified.toLocaleDateString() + ' ' + lastModified.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors" onclick="loadProject('${project.id}')">
                <div class="card-body p-4">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-bold">${project.name}</h4>
                            ${project.description ? `<p class="text-sm text-base-content/70 mt-1">${project.description}</p>` : ''}
                            <p class="text-xs text-base-content/50 mt-2">
                                Last modified: ${formattedDate}
                            </p>
                        </div>
                        <button class="btn btn-ghost btn-sm btn-square" onclick="deleteProject('${project.id}', event)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render recent projects on main screen
 */
async function renderRecentProjects() {
    const projects = await getAllProjects();
    const container = document.getElementById('recentProjectsList');
    const card = document.getElementById('recentProjectsCard');
    
    if (projects.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    
    // Show only the 3 most recent projects
    const recent = projects.slice(0, 3);
    
    container.innerHTML = recent.map(project => {
        const lastModified = new Date(project.last_modified);
        const formattedDate = lastModified.toLocaleDateString();
        
        return `
            <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 cursor-pointer transition-colors" onclick="loadProject('${project.id}')">
                <div>
                    <p class="font-semibold">${project.name}</p>
                    <p class="text-sm text-base-content/60">${formattedDate}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        `;
    }).join('');
}

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await renderRecentProjects();
});
