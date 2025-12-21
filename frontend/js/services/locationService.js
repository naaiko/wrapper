// =================================================================
// LOCATION SERVICE
// =================================================================

import { supabaseClient } from '../api/supabaseClient.js';

export class LocationService {
    static async getAll(projectId) {
        const { data, error } = await supabaseClient.db
            .from('locations')
            .select('*')
            .eq('project_id', projectId)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
    }

    static async create(projectId, locationData) {
        // Get max display_order
        const existing = await this.getAll(projectId);
        const maxOrder = existing.length > 0 
            ? Math.max(...existing.map(l => l.display_order))
            : 0;

        const { data, error } = await supabaseClient.db
            .from('locations')
            .insert({
                project_id: projectId,
                name: locationData.name,
                display_order: maxOrder + 1
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async update(locationId, updates) {
        const { data, error } = await supabaseClient.db
            .from('locations')
            .update(updates)
            .eq('id', locationId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async delete(locationId) {
        const { error } = await supabaseClient.db
            .from('locations')
            .delete()
            .eq('id', locationId);
        
        if (error) throw error;
    }

    static async reorder(locations) {
        const updates = locations.map((location, index) => ({
            id: location.id,
            display_order: index
        }));

        for (const update of updates) {
            await this.update(update.id, { display_order: update.display_order });
        }
    }
}
