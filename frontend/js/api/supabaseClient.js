// =================================================================
// SUPABASE CLIENT - Database API Layer
// =================================================================
// All database operations go through this layer
// Makes it easy to switch database providers later

export class SupabaseClient {
    constructor(supabaseInstance) {
        this.db = supabaseInstance;
    }

    // =================================================================
    // PROJECTS
    // =================================================================

    async getProjects() {
        const { data, error } = await this.db
            .from('projects')
            .select('*')
            .order('last_modified', { ascending: false });
        
        if (error) throw error;
        return data || [];
    }

    async getProject(projectId) {
        const { data, error } = await this.db
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async createProject(project) {
        const { data, error } = await this.db
            .from('projects')
            .insert([project])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async updateProject(projectId, updates) {
        const { data, error } = await this.db
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async deleteProject(projectId) {
        const { error } = await this.db
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
    }

    // =================================================================
    // SCENES
    // =================================================================

    async getScenes(projectId) {
        const { data, error } = await this.db
            .from('scenes')
            .select('*')
            .eq('project_id', projectId)
            .order('story_order');
        
        if (error) throw error;
        return data || [];
    }

    async getScene(sceneId) {
        const { data, error } = await this.db
            .from('scenes')
            .select(`
                *,
                scene_actors (
                    *,
                    actor:actors (*)
                )
            `)
            .eq('id', sceneId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async createScene(scene) {
        const { data, error } = await this.db
            .from('scenes')
            .insert([scene])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async createScenes(scenes) {
        const { data, error } = await this.db
            .from('scenes')
            .insert(scenes)
            .select();
        
        if (error) throw error;
        return data;
    }

    async updateScene(sceneId, updates) {
        const { data, error } = await this.db
            .from('scenes')
            .update(updates)
            .eq('id', sceneId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async updateScenes(sceneUpdates) {
        const promises = sceneUpdates.map(update => 
            this.db
                .from('scenes')
                .update({ story_order: update.story_order })
                .eq('id', update.id)
        );
        
        await Promise.all(promises);
    }

    async deleteScene(sceneId) {
        const { error } = await this.db
            .from('scenes')
            .delete()
            .eq('id', sceneId);
        
        if (error) throw error;
    }

    // =================================================================
    // CALENDAR QUERIES
    // =================================================================

    async getScenesByDate(projectId, date) {
        const { data, error } = await this.db
            .rpc('get_scenes_by_date', {
                p_project_id: projectId,
                p_date: date
            });
        
        if (error) throw error;
        return data || [];
    }

    async getScenesByDateRange(projectId, startDate, endDate) {
        const { data, error } = await this.db
            .rpc('get_scenes_by_date_range', {
                p_project_id: projectId,
                p_start_date: startDate,
                p_end_date: endDate
            });
        
        if (error) throw error;
        return data || [];
    }
}

// Singleton instance
export const supabaseClient = new SupabaseClient(window.supabase);
