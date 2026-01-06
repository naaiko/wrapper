// =================================================================
// SCENE Cast Member Service - Business Logic Layer
// =================================================================
// Manages the many-to-many relationship between scenes and actors
// Handles continuity data (costume, makeup, hair, props photos)

export class SceneCastMemberService {
    
    /**
     * Get all scene_cast_members for a scene (with actor data)
     * @param {string} sceneId - Scene UUID
     * @returns {Promise<Array>} Array of scene_actor records with nested actor data
     */
    static async getByScene(sceneId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_cast_members')
                .select(`
                    *,
                    cast_member:cast_members (*)
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
     * Get all scene_cast_members for an actor (with scene data)
     * @param {string} castMemberId - Actor UUID
     * @returns {Promise<Array>} Array of scene_actor records with nested scene data
     */
    static async getByActor(castMemberId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_cast_members')
                .select(`
                    *,
                    scene:scenes (*)
                `)
                .eq('cast_member_id', castMemberId)
                .order('created_at');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching cast member scenes:', error);
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
                .from('scene_cast_members')
                .select(`
                    *,
                    cast_member:cast_members (*),
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
     * @param {string} sceneActorData.cast_member_id - Actor UUID (required)
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
            const sceneActor = {
                scene_id: sceneActorData.scene_id,
                cast_member_id: sceneActorData.cast_member_id,
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
                .from('scene_cast_members')
                .insert([sceneActor])
                .select(`
                    *,
                    cast_member:cast_members (*),
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
     * @param {Array<string>} castMemberIds - Array of actor UUIDs
     * @returns {Promise<Array>} Array of created scene_actor records
     */
    static async createBulk(sceneId, castMemberIds) {
        try {
            const sceneCastMembers = castMemberIds.map(castMemberId => ({
                scene_id: sceneId,
                cast_member_id: castMemberId
            }));
            
            const { data, error } = await window.supabase
                .from('scene_cast_members')
                .insert(sceneCastMembers)
                .select(`
                    *,
                    cast_member:cast_members (*)
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
                .from('scene_cast_members')
                .update(updates)
                .eq('id', sceneActorId)
                .select(`
                    *,
                    cast_member:cast_members (*),
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
                .from('scene_cast_members')
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
                .from('scene_cast_members')
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
                .from('scene_cast_members')
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
     * @param {string} castMemberId - Actor UUID
     * @returns {Promise<boolean>} True if actor is in scene
     */
    static async exists(sceneId, castMemberId) {
        try {
            const { data, error } = await window.supabase
                .from('scene_cast_members')
                .select('id')
                .eq('scene_id', sceneId)
                .eq('cast_member_id', castMemberId)
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
     * @param {string} castMemberId - Actor UUID
     * @returns {Promise<number>} Number of scenes
     */
    static async getSceneCount(castMemberId) {
        try {
            const { count, error } = await window.supabase
                .from('scene_cast_members')
                .select('*', { count: 'exact', head: true })
                .eq('cast_member_id', castMemberId);
            
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
                .from('scene_cast_members')
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
