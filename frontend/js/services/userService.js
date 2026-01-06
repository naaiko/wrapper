/**
 * User Service
 * Handles user management (CRUD operations for superadmin)
 */

import authService from './authService.js';

// Access global supabase instance
const supabase = window.supabase;

class UserService {
    /**
     * Get all users (superadmin only)
     * @returns {Promise<Array>}
     */
    async getAllUsers() {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can view all users');
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, is_active, created_at, last_login')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get user by ID
     * @param {string} userId - User UUID
     * @returns {Promise<Object>}
     */
    async getUserById(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, is_active, created_at, last_login')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            throw error;
        }

        return data;
    }

    /**
     * Create a new user (superadmin only)
     * @param {Object} userData - User data
     * @param {string} userData.email - User email
     * @param {string} userData.name - User name
     * @param {string} userData.password - User password (will be hashed)
     * @param {string} userData.role - User role ('superadmin' or 'manager')
     * @returns {Promise<Object>}
     */
    async createUser(userData) {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can create users');
        }

        // Validate required fields
        if (!userData.email || !userData.name || !userData.password || !userData.role) {
            throw new Error('Missing required fields: email, name, password, role');
        }

        // Validate role
        if (!['superadmin', 'manager'].includes(userData.role)) {
            throw new Error('Invalid role. Must be "superadmin" or "manager"');
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', userData.email)
            .single();

        if (existing) {
            throw new Error('Email already exists');
        }

        // TODO: Hash password with bcrypt on backend
        // For now, store plain text (TEMPORARY - NOT FOR PRODUCTION)
        const passwordHash = userData.password; // Should be: await bcrypt.hash(password, 10)

        const { data, error } = await supabase
            .from('users')
            .insert({
                email: userData.email,
                name: userData.name,
                password_hash: passwordHash,
                role: userData.role,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            throw error;
        }

        return data;
    }

    /**
     * Update user
     * @param {string} userId - User UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>}
     */
    async updateUser(userId, updates) {
        // Superadmin can update anyone, managers can only update themselves
        const currentUser = authService.getCurrentUser();
        if (!authService.isSuperAdmin() && currentUser.id !== userId) {
            throw new Error('Unauthorized: You can only update your own account');
        }

        // Don't allow role changes unless superadmin
        if (updates.role && !authService.isSuperAdmin()) {
            delete updates.role;
        }

        // Don't allow password changes through this method
        delete updates.password_hash;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            throw error;
        }

        return data;
    }

    /**
     * Delete user (superadmin only)
     * Cannot delete yourself
     * @param {string} userId - User UUID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        if (!authService.isSuperAdmin()) {
            throw new Error('Unauthorized: Only superadmins can delete users');
        }

        const currentUser = authService.getCurrentUser();
        if (currentUser.id === userId) {
            throw new Error('Cannot delete your own account');
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Change password
     * @param {string} userId - User UUID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<void>}
     */
    async changePassword(userId, oldPassword, newPassword) {
        const currentUser = authService.getCurrentUser();
        
        // Users can only change their own password
        if (currentUser.id !== userId) {
            throw new Error('Unauthorized: You can only change your own password');
        }

        // TODO: Implement proper password verification and hashing
        // For now, just update directly (TEMPORARY)
        const { error } = await supabase
            .from('users')
            .update({ password_hash: newPassword })
            .eq('id', userId);

        if (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    /**
     * Get all managers (for assigning to projects)
     * @returns {Promise<Array>}
     */
    async getManagers() {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'manager')
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching managers:', error);
            throw error;
        }

        return data || [];
    }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
