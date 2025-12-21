// Settings Service - Manages project settings and feature flags

/**
 * Settings service for managing project-level feature flags and configuration
 */
class SettingsService {
    constructor() {
        this.currentSettings = null;
        this.currentProjectId = null;
    }

    /**
     * Load settings for a project
     * @param {string} projectId - UUID of the project
     * @returns {Promise<Object>} Project settings
     */
    async loadSettings(projectId) {
        try {
            // Get or create settings using the database function
            const { data, error } = await window.supabase
                .rpc('get_or_create_project_settings', { p_project_id: projectId });

            if (error) throw error;

            this.currentSettings = data;
            this.currentProjectId = projectId;
            
            console.log('⚙️ Loaded project settings:', this.currentSettings);
            return this.currentSettings;
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            // Return default settings on error
            return this.getDefaultSettings();
        }
    }

    /**
     * Update project settings
     * @param {string} projectId - UUID of the project
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    async updateSettings(projectId, settings) {
        try {
            const { data, error } = await window.supabase
                .from('project_settings')
                .update({
                    ...settings,
                    updated_at: new Date().toISOString()
                })
                .eq('project_id', projectId)
                .select()
                .single();

            if (error) throw error;

            this.currentSettings = data;
            console.log('✅ Updated project settings:', this.currentSettings);
            
            // Dispatch custom event for settings change
            window.dispatchEvent(new CustomEvent('settingsChanged', { detail: data }));
            
            return data;
        } catch (error) {
            console.error('❌ Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Update continuity options for a project
     * @param {string} projectId - UUID of the project
     * @param {Array} options - Array of continuity option objects
     * @returns {Promise<Object>} Updated settings
     */
    async updateContinuityOptions(projectId, options) {
        return this.updateSettings(projectId, { continuity_options: options });
    }

    /**
     * Toggle a feature flag
     * @param {string} projectId - UUID of the project
     * @param {string} featureName - Name of the feature (e.g., 'show_int_ext')
     * @param {boolean} enabled - Whether to enable or disable
     * @returns {Promise<Object>} Updated settings
     */
    async toggleFeature(projectId, featureName, enabled) {
        const update = { [featureName]: enabled };
        return this.updateSettings(projectId, update);
    }

    /**
     * Check if a feature is enabled
     * @param {string} featureName - Name of the feature
     * @returns {boolean} Whether the feature is enabled
     */
    isFeatureEnabled(featureName) {
        if (!this.currentSettings) return true; // Default to enabled if no settings loaded
        return this.currentSettings[featureName] !== false;
    }

    /**
     * Get continuity options for current project
     * @returns {Array} Array of continuity option objects
     */
    getContinuityOptions() {
        if (!this.currentSettings || !this.currentSettings.continuity_options) {
            return this.getDefaultContinuityOptions();
        }
        return this.currentSettings.continuity_options;
    }

    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    getDefaultSettings() {
        return {
            show_int_ext: true,
            show_location: true,
            show_time: true,
            show_conditions: true,
            show_continuity: true,
            continuity_options: this.getDefaultContinuityOptions()
        };
    }

    /**
     * Get default continuity options
     * @returns {Array} Default continuity options
     */
    getDefaultContinuityOptions() {
        return [
            { id: 'continuous', label: 'CONTINUOUS', description: 'Action continues from previous scene' },
            { id: 'later', label: 'LATER', description: 'Some time has passed' },
            { id: 'same-time', label: 'SAME TIME', description: 'Happening simultaneously' },
            { id: 'moments-later', label: 'MOMENTS LATER', description: 'A few moments later' },
            { id: 'flashback', label: 'FLASHBACK', description: 'Scene from the past' },
            { id: 'flash-forward', label: 'FLASH FORWARD', description: 'Scene from the future' },
            { id: 'dream-sequence', label: 'DREAM SEQUENCE', description: 'Dream or fantasy' },
            { id: 'montage', label: 'MONTAGE', description: 'Series of shots' }
        ];
    }

    /**
     * Get all feature flags
     * @returns {Object} Object with all feature flags
     */
    getAllFeatures() {
        return {
            show_int_ext: this.isFeatureEnabled('show_int_ext'),
            show_location: this.isFeatureEnabled('show_location'),
            show_time: this.isFeatureEnabled('show_time'),
            show_conditions: this.isFeatureEnabled('show_conditions'),
            show_continuity: this.isFeatureEnabled('show_continuity')
        };
    }
}

// Create and export singleton instance
const settingsService = new SettingsService();
export default settingsService;
