// =================================================================
// SCENE ACTOR SERVICE - Business Logic Layer
// =================================================================
// Manages the many-to-many relationship between scenes and actors
// Handles continuity data (costume, makeup, hair, props photos)

export class SceneActorService {
    
    /**
     * Get all scene_actors for a scene (with actor data)
     * @param {string} sceneId - Scene UUID
     * @returns {Promise<Array>} Array of scene_actor records with nested actor data
     */
    static async getByScene(sceneId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_actors')
                .select(`
                    *,
                    actor:actors (*)
                `)
                .eq('scene_id', sceneId)
                .order('created_at');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching scene actors:', error);
            throw error;
        }
    }
    
    /**
     * Get all scene_actors for an actor (with scene data)
     * @param {string} actorId - Actor UUID
     * @returns {Promise<Array>} Array of scene_actor records with nested scene data
     */
    static async getByActor(actorId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_actors')
                .select(`
                    *,
                    scene:scenes (*)
                `)
                .eq('actor_id', actorId)
                .order('created_at');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching actor scenes:', error);
            throw error;
        }
    }
    
    /**
     * Get a single scene_actor record by ID
     * @param {string} sceneActorId - SceneActor UUID
     * @returns {Promise<Object>} SceneActor record with nested actor and scene data
     */
    static async getById(sceneActorId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_actors')
                .select(`
                    *,
                    actor:actors (*),
                    scene:scenes (*)
                `)
                .eq('id', sceneActorId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching scene actor:', error);
            throw error;
        }
    }
    
    /**
     * Create a scene_actor link
     * @param {Object} sceneActorData - Scene actor data
     * @param {string} sceneActorData.scene_id - Scene UUID (required)
     * @param {string} sceneActorData.actor_id - Actor UUID (required)
     * @param {string} sceneActorData.costume_notes - Optional costume notes
     * @param {Array} sceneActorData.costume_images - Optional array of costume image URLs
     * @param {string} sceneActorData.makeup_notes - Optional makeup notes
     * @param {Array} sceneActorData.makeup_images - Optional array of makeup image URLs
     * @param {string} sceneActorData.hair_notes - Optional hair notes
     * @param {Array} sceneActorData.hair_images - Optional array of hair image URLs
     * @param {string} sceneActorData.props_notes - Optional props notes
     * @param {Array} sceneActorData.props_images - Optional array of props image URLs
     * @param {string} sceneActorData.continuity_notes - Optional general continuity notes
     * @returns {Promise<Object>} Created scene_actor record
     */
    static async create(sceneActorData) {
        try {
            // Check if scene_actor already exists to prevent 409 conflicts
            const { data: existing } = await window.supabase
                .from('scene_actors')
                .select('id')
                .eq('scene_id', sceneActorData.scene_id)
                .eq('actor_id', sceneActorData.actor_id)
                .maybeSingle();
            
            if (existing) {
                console.warn('Scene actor already exists, returning existing record');
                // Return the existing record with full details
                const { data } = await window.supabase
                    .from('scene_actors')
                    .select(`
                        *,
                        actor:actors (*),
                        scene:scenes (*)
                    `)
                    .eq('id', existing.id)
                    .single();
                return data;
            }
            
            const sceneActor = {
                scene_id: sceneActorData.scene_id,
                actor_id: sceneActorData.actor_id,
                costume_notes: sceneActorData.costume_notes || null,
                costume_images: sceneActorData.costume_images || [],
                makeup_notes: sceneActorData.makeup_notes || null,
                makeup_images: sceneActorData.makeup_images || [],
                hair_notes: sceneActorData.hair_notes || null,
                hair_images: sceneActorData.hair_images || [],
                props_notes: sceneActorData.props_notes || null,
                props_images: sceneActorData.props_images || [],
                continuity_notes: sceneActorData.continuity_notes || null
            };

            const { data, error } = await window.supabase
                .from('scene_actors')
                .insert([sceneActor])
                .select(`
                    *,
                    actor:actors (*),
                    scene:scenes (*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating scene actor:', error);
            throw error;
        }
    }
    
    /**
     * Create multiple scene_actor links at once (bulk add)
     * @param {string} sceneId - Scene UUID
     * @param {Array<string>} actorIds - Array of actor UUIDs
     * @returns {Promise<Array>} Array of created scene_actor records
     */
    static async createBulk(sceneId, actorIds) {
        try {
            const sceneActors = actorIds.map(actorId => ({
                scene_id: sceneId,
                actor_id: actorId
            }));
            
            const { data, error } = await window.supabase
                .from('scene_actors')
                .insert(sceneActors)
                .select(`
                    *,
                    actor:actors (*)
                `);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error creating scene actors in bulk:', error);
            throw error;
        }
    }
    
    /**
     * Update scene_actor continuity data
     * @param {string} sceneActorId - SceneActor UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated scene_actor record
     */
    static async update(sceneActorId, updates) {
        try {
            const { data, error } = await window.supabase
                .from('scene_actors')
                .update(updates)
                .eq('id', sceneActorId)
                .select(`
                    *,
                    actor:actors (*),
                    scene:scenes (*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating scene actor:', error);
            throw error;
        }
    }
    
    /**
     * Delete scene_actor link (remove actor from scene)
     * @param {string} sceneActorId - SceneActor UUID
     * @returns {Promise<void>}
     */
    static async delete(sceneActorId) {
        try {
            const { error } = await window.supabase
                .from('scene_actors')
                .delete()
                .eq('id', sceneActorId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting scene actor:', error);
            throw error;
        }
    }
    
    /**
     * Add image to scene_actor
     * @param {string} sceneActorId - SceneActor UUID
     * @param {string} category - Image category: 'costume', 'makeup', 'hair', or 'props'
     * @param {string} imageUrl - Image URL
     * @returns {Promise<Object>} Updated scene_actor record
     */
    static async addImage(sceneActorId, category, imageUrl) {
        try {
            // Validate category
            const validCategories = ['costume', 'makeup', 'hair', 'props'];
            if (!validCategories.includes(category)) {
                throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
            }
            
            // Fetch current images
            const imageField = `${category}_images`;
            const { data: current, error: fetchError } = await window.supabase
                .from('scene_actors')
                .select(imageField)
                .eq('id', sceneActorId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Append new image
            const currentImages = current[imageField] || [];
            const updatedImages = [...currentImages, imageUrl];
            
            // Update
            return await this.update(sceneActorId, {
                [imageField]: updatedImages
            });
        } catch (error) {
            console.error('Error adding image:', error);
            throw error;
        }
    }
    
    /**
     * Remove image from scene_actor
     * @param {string} sceneActorId - SceneActor UUID
     * @param {string} category - Image category: 'costume', 'makeup', 'hair', or 'props'
     * @param {number} imageIndex - Index of image to remove
     * @returns {Promise<Object>} Updated scene_actor record
     */
    static async removeImage(sceneActorId, category, imageIndex) {
        try {
            // Validate category
            const validCategories = ['costume', 'makeup', 'hair', 'props'];
            if (!validCategories.includes(category)) {
                throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
            }
            
            // Fetch current images
            const imageField = `${category}_images`;
            const { data: current, error: fetchError } = await window.supabase
                .from('scene_actors')
                .select(imageField)
                .eq('id', sceneActorId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Remove image at index
            const currentImages = current[imageField] || [];
            const updatedImages = currentImages.filter((_, i) => i !== imageIndex);
            
            // Update
            return await this.update(sceneActorId, {
                [imageField]: updatedImages
            });
        } catch (error) {
            console.error('Error removing image:', error);
            throw error;
        }
    }
    
    /**
     * Check if an actor is already in a scene
     * @param {string} sceneId - Scene UUID
     * @param {string} actorId - Actor UUID
     * @returns {Promise<boolean>} True if actor is in scene
     */
    static async exists(sceneId, actorId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_actors')
                .select('id')
                .eq('scene_id', sceneId)
                .eq('actor_id', actorId)
                .maybeSingle();
            
            if (error) throw error;
            return data !== null;
        } catch (error) {
            console.error('Error checking scene actor existence:', error);
            throw error;
        }
    }
    
    /**
     * Get count of scenes for an actor
     * @param {string} actorId - Actor UUID
     * @returns {Promise<number>} Number of scenes
     */
    static async getSceneCount(actorId) {
        try {
            const { count, error } = await window.supabase
                .from('scene_actors')
                .select('*', { count: 'exact', head: true })
                .eq('actor_id', actorId);
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting scene count:', error);
            throw error;
        }
    }
    
    /**
     * Get count of actors in a scene
     * @param {string} sceneId - Scene UUID
     * @returns {Promise<number>} Number of actors
     */
    static async getActorCount(sceneId) {
        try {
            const { count, error } = await window.supabase
                .from('scene_actors')
                .select('*', { count: 'exact', head: true })
                .eq('scene_id', sceneId);
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting actor count:', error);
            throw error;
        }
    }
}
