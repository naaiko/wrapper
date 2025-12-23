/**
 * Enhanced Project Service
 * Handles project CRUD with role-based access control and proper deletion
 */

import authService from './authService.js';

// Access global supabase instance
const supabase = window.supabase;

class ProjectService {
    /**
     * Get all projects based on user role
     * Superadmin sees all projects, managers see only their own
     * @returns {Promise<Array>}
     */
    async getAllProjects() {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('Not authenticated');
        }

        let query = supabase
            .from('projects')
            .select('*')
            .is('deleted_at', null) // Exclude soft-deleted
            .order('last_modified', { ascending: false });

        // Managers only see their own projects
        if (currentUser.role === 'manager') {
            query = query.eq('manager_id', currentUser.id);
        }
        // Superadmins see all projects (no filter needed)

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get a single project by ID
     * Verifies user has access to this project
     * @param {string} projectId - Project UUID
     * @returns {Promise<Object>}
     */
    async getProjectById(projectId) {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('Not authenticated');
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .is('deleted_at', null)
            .single();

        if (error) {
            console.error('Error fetching project:', error);
            throw error;
        }

        // Check access
        if (currentUser.role === 'manager' && data.manager_id !== currentUser.id) {
            throw new Error('Access denied: This project belongs to another manager');
        }

        return data;
    }

    /**
     * Create a new project
     * @param {Object} projectData - Project data
     * @param {string} projectData.name - Project name
     * @param {string} projectData.description - Project description (optional)
     * @param {string} projectData.manager_id - Manager ID (optional, defaults to current user)
     * @returns {Promise<Object>}
     */
    async createProject(projectData) {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('Not authenticated');
        }

        if (!projectData.name) {
            throw new Error('Project name is required');
        }

        // Determine manager_id
        let managerId = projectData.manager_id;
        
        if (currentUser.role === 'manager') {
            // Managers can only create projects for themselves
            managerId = currentUser.id;
        } else if (currentUser.role === 'superadmin') {
            // Superadmins can assign to any manager (or leave unassigned)
            managerId = projectData.manager_id || null;
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: projectData.name,
                description: projectData.description || null,
                manager_id: managerId
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating project:', error);
            throw error;
        }

        return data;
    }

    /**
     * Update a project
     * @param {string} projectId - Project UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>}
     */
    async updateProject(projectId, updates) {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('Not authenticated');
        }

        // Verify access to this project
        await this.getProjectById(projectId);

        // Managers cannot change the manager_id
        if (currentUser.role === 'manager') {
            delete updates.manager_id;
        }

        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating project:', error);
            throw error;
        }

        return data;
    }

    /**
     * Delete a project (hard delete with cascade)
     * Requires explicit confirmation from user
     * @param {string} projectId - Project UUID
     * @param {string} confirmationText - Must match project name or "DELETE"
     * @returns {Promise<Object>} Deletion summary
     */
    async deleteProject(projectId, confirmationText) {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('Not authenticated');
        }

        // Get project to verify access and name
        const project = await this.getProjectById(projectId);

        // Verify confirmation text
        if (confirmationText !== project.name && confirmationText !== 'DELETE') {
            throw new Error('Confirmation text does not match. Please type the project name or "DELETE" to confirm.');
        }

        // Check permission using database function
        const { data: canDelete, error: permError } = await supabase
            .rpc('can_delete_project', {
                p_project_id: projectId,
                p_user_id: currentUser.id
            });

        if (permError || !canDelete) {
            throw new Error('Access denied: You do not have permission to delete this project');
        }

        // Execute hard delete with cascade
        const { data, error } = await supabase
            .rpc('delete_project_cascade', {
                p_project_id: projectId
            });

        if (error) {
            console.error('Error deleting project:', error);
            throw error;
        }

        return data;
    }

    /**
     * Assign project to a manager (superadmin only)
     * @param {string} projectId - Project UUID
     * @param {string} managerId - Manager user UUID
     * @returns {Promise<Object>}
     */
    async assignProjectToManager(projectId, managerId) {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can assign projects');
        }

        // Verify manager exists and has correct role
        const { data: manager, error: userError } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', managerId)
            .single();

        if (userError || !manager) {
            throw new Error('Manager not found');
        }

        if (manager.role !== 'manager') {
            throw new Error('User must have manager role');
        }

        return await this.updateProject(projectId, { manager_id: managerId });
    }

    /**
     * Get projects for a specific manager (superadmin only)
     * @param {string} managerId - Manager user UUID
     * @returns {Promise<Array>}
     */
    async getProjectsByManager(managerId) {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can view other managers\' projects');
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('manager_id', managerId)
            .is('deleted_at', null)
            .order('last_modified', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get unassigned projects (superadmin only)
     * @returns {Promise<Array>}
     */
    async getUnassignedProjects() {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can view unassigned projects');
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .is('manager_id', null)
            .is('deleted_at', null)
            .order('last_modified', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }

        return data || [];
    }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;
