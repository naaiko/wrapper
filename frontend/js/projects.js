// =================================================================
// PROJECT MANAGEMENT WITH SUPABASE & AUTHENTICATION
// =================================================================

import authService from './services/authService.js';
import projectService from './services/projectService.js';
import userService from './services/userService.js';

const CURRENT_PROJECT_KEY = 'continuityManager_currentProject';

// =================================================================
// AUTHENTICATION & INITIALIZATION
// =================================================================

/**
 * Check authentication and redirect if necessary
 */
function checkAuth() {
    if (!authService.requireAuth()) {
        return false;
    }
    return true;
}

// =================================================================
// SUPABASE DATABASE FUNCTIONS
// =================================================================

/**
 * Get all projects from Supabase (role-based filtering)
 */
async function getAllProjects() {
    try {
        return await projectService.getAllProjects();
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
        
        // Create project via service
        const project = await projectService.createProject({
            name: name,
            description: description
        });
        
        // Set as current project
        setCurrentProjectId(project.id);
        
        // Redirect to timeline
        window.location.href = `timeline.html?project=${project.id}`;
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
 * Shows confirmation modal with typed confirmation
 */
async function deleteProject(projectId, projectName, event) {
    event.stopPropagation();
    
    showDeleteConfirmationModal(projectId, projectName);
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmationModal(projectId, projectName) {
    const modal = document.getElementById('deleteProjectModal');
    const confirmInput = document.getElementById('deleteConfirmInput');
    const projectNameDisplay = document.getElementById('deleteProjectName');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    // Set project name in modal
    projectNameDisplay.textContent = projectName;
    
    // Clear input
    confirmInput.value = '';
    confirmBtn.disabled = true;
    
    // Store project info for later
    modal.dataset.projectId = projectId;
    modal.dataset.projectName = projectName;
    
    // Enable/disable confirm button based on input
    confirmInput.oninput = function() {
        const inputValue = this.value.trim();
        confirmBtn.disabled = inputValue !== projectName && inputValue !== 'DELETE';
    };
    
    modal.showModal();
}

/**
 * Execute project deletion after confirmation
 */
async function executeProjectDeletion() {
    const modal = document.getElementById('deleteProjectModal');
    const projectId = modal.dataset.projectId;
    const projectName = modal.dataset.projectName;
    const confirmInput = document.getElementById('deleteConfirmInput');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    const confirmationText = confirmInput.value.trim();
    
    try {
        // Show loading
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="loading loading-spinner"></span> Deleting...';
        
        // Delete via service
        const result = await projectService.deleteProject(projectId, confirmationText);
        
        console.log('Project deleted:', result);
        
        // Close modal
        modal.close();
        
        // Refresh lists
        await renderProjectsList();
        await renderRecentProjects();
        
        // Show success message
        showNotification('Project deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project: ' + error.message);
        
        // Reset button
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Project';
    }
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed bottom-4 right-4 w-auto z-50`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
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
    const currentUser = authService.getCurrentUser();
    
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
                        <button class="btn btn-ghost btn-sm btn-square" onclick="deleteProject('${project.id}', '${project.name.replace(/'/g, "\\'")}', event)">
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
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Display user info
    const currentUser = authService.getCurrentUser();
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && currentUser) {
        userDisplay.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <p class="font-semibold">${currentUser.name}</p>
                    <p class="text-xs text-base-content/60">${currentUser.role}</p>
                </div>
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
                        <div class="bg-primary text-primary-content rounded-full w-10">
                            <span class="text-lg">${currentUser.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </label>
                    <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                        ${currentUser.role === 'superadmin' ? '<li><a onclick="showUserManagement()">Manage Users</a></li>' : ''}
                        <li><a onclick="authService.logout()">Logout</a></li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    await renderRecentProjects();
});

// Make functions globally accessible
window.createNewProject = createNewProject;
window.loadProject = loadProject;
window.deleteProject = deleteProject;
window.executeProjectDeletion = executeProjectDeletion;
window.showNewProjectModal = showNewProjectModal;
window.showOpenProjectModal = showOpenProjectModal;
window.showUserManagement = function() {
    window.location.href = 'users.html';
};
window.authService = authService;
