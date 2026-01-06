// =================================================================
// CHARACTER SERVICE - Character CRUD & Business Logic
// =================================================================
// Version: 0.2.3
// Purpose: Manage story characters (roles), separate from actors (people)
//
// Character vs Actor:
//   Character = Role in the story (e.g., "JOHN DOE", "DETECTIVE SMITH")
//   Actor = Real person who performs the role (e.g., "Tom Hanks")
//
// Relationships:
//   Character ←→ Actor (many-to-many via character_cast_assignments)
//   Character ←→ Scene (many-to-many via scene_characters)

import { supabaseClient } from '../api/supabaseClient.js';

export class CharacterService {
    
    /**
     * Normalize character name for deduplication
     * Removes punctuation, extra whitespace, converts to uppercase
     * 
     * Examples:
     *   "JOHN DOE" → "JOHNDOE"
     *   "Mary (V.O.)" → "MARY"
     *   "  Bob  " → "BOB"
     */
    static normalizeCharacterName(name) {
        if (!name) return '';
        
        return name
            .toUpperCase()
            .replace(/\s*\([^)]*\)/g, '')  // Remove (V.O.), (O.S.), etc.
            .replace(/[^\w\s]/g, '')        // Remove punctuation
            .replace(/\s+/g, '')            // Remove all whitespace
            .trim();
    }
    
    /**
     * Get all characters for a project
     * @param {string} projectId
     * @returns {Promise<Array>} Array of character objects
     */
    static async getAll(projectId) {
        const { data, error } = await supabaseClient.db
            .from('characters')
            .select('*')
            .eq('project_id', projectId)
            .order('display_order', { ascending: true, nullsLast: true })
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error fetching characters:', error);
            throw error;
        }
        
        return data || [];
    }
    
    /**
     * Get character by ID with actor assignments
     * @param {string} characterId
     * @returns {Promise<Object>} Character with actors array
     */
    static async getById(characterId) {
        // Get character
        const { data: character, error: charError } = await supabaseClient.db
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();
        
        if (charError) {
            console.error('Error fetching character:', charError);
            throw charError;
        }
        
        // Get actor assignments
        const { data: assignments, error: assignError } = await supabaseClient.db
            .from('character_cast_assignments')
            .select(`
                *,
                cast_member:cast_members(*)
            `)
            .eq('character_id', characterId);
        
        if (assignError) {
            console.error('Error fetching cast member assignments:', assignError);
            throw assignError;
        }
        
        return {
            ...character,
            actorAssignments: assignments || []
        };
    }
    
    /**
     * Create a new character
     * @param {string} projectId
     * @param {string} name - Display name
     * @param {Object} options - Additional fields
     * @returns {Promise<Object>} Created character
     */
    static async create(projectId, name, options = {}) {
        const normalizedName = this.normalizeCharacterName(name);
        
        // Check for duplicates
        const existing = await this.findByNormalizedName(projectId, normalizedName);
        if (existing) {
            console.warn(`Character "${name}" already exists as "${existing.name}"`);
            return existing;
        }
        
        // Get max display_order
        const { data: maxOrderData } = await supabaseClient.db
            .from('characters')
            .select('display_order')
            .eq('project_id', projectId)
            .order('display_order', { ascending: false })
            .limit(1);
        
        const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;
        
        // Create character
        const { data, error } = await supabaseClient.db
            .from('characters')
            .insert({
                project_id: projectId,
                name: name.trim(),
                normalized_name: normalizedName,
                display_order: nextOrder,
                role_type: options.role_type || null,
                description: options.description || null,
                notes: options.notes || null
            })
            .select()
            .single();
        
        if (error) {
            console.error('Error creating character:', error);
            throw error;
        }
        
        return data;
    }
    
    /**
     * Create multiple characters in batch
     * @param {string} projectId
     * @param {Array<string>} names - Array of character names
     * @returns {Promise<Array>} Created/matched characters
     */
    static async createBulk(projectId, names) {
        const results = [];
        
        for (const name of names) {
            const character = await this.create(projectId, name);
            results.push(character);
        }
        
        return results;
    }
    
    /**
     * OPTIMIZED: Create multiple characters in batch with single query
     * Much faster than createBulk() for large imports
     * @param {string} projectId
     * @param {Array<string>} names - Array of character names
     * @returns {Promise<Array>} Created/existing characters
     */
    static async createBulkOptimized(projectId, names) {
        if (!names || names.length === 0) {
            return [];
        }
        
        // Build unique normalized name map
        const uniqueMap = new Map();
        names.forEach(name => {
            const normalized = this.normalizeCharacterName(name);
            if (!uniqueMap.has(normalized)) {
                uniqueMap.set(normalized, name.trim());
            }
        });
        
        // Get max display_order
        const { data: maxOrderData } = await supabaseClient.db
            .from('characters')
            .select('display_order')
            .eq('project_id', projectId)
            .order('display_order', { ascending: false })
            .limit(1);
        
        let nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;
        
        // Prepare bulk insert data
        const insertData = Array.from(uniqueMap.entries()).map(([normalized, displayName]) => ({
            project_id: projectId,
            name: displayName,
            normalized_name: normalized,
            display_order: nextOrder++
        }));
        
        // Bulk insert with ON CONFLICT DO NOTHING (skip existing)
        const { data, error } = await supabaseClient.db
            .from('characters')
            .upsert(insertData, { 
                onConflict: 'project_id,normalized_name',
                ignoreDuplicates: true 
            })
            .select();
        
        if (error) {
            console.error('Error bulk creating characters:', error);
            throw error;
        }
        
        // Fetch all characters (including ones that already existed)
        const normalizedNames = Array.from(uniqueMap.keys());
        const { data: allCharacters, error: fetchError } = await supabaseClient.db
            .from('characters')
            .select('*')
            .eq('project_id', projectId)
            .in('normalized_name', normalizedNames);
        
        if (fetchError) {
            console.error('Error fetching created characters:', fetchError);
            throw fetchError;
        }
        
        return allCharacters || [];
    }
    
    /**
     * Find character by normalized name (for deduplication)
     * @param {string} projectId
     * @param {string} normalizedName
     * @returns {Promise<Object|null>}
     */
    static async findByNormalizedName(projectId, normalizedName) {
        const { data, error } = await supabaseClient.db
            .from('characters')
            .select('*')
            .eq('project_id', projectId)
            .eq('normalized_name', normalizedName)
            .maybeSingle();
        
        if (error) {
            console.error('Error finding character:', error);
            throw error;
        }
        
        return data;
    }
    
    /**
     * Get or create character (idempotent)
     * @param {string} projectId
     * @param {string} name
     * @returns {Promise<Object>} Existing or newly created character
     */
    static async getOrCreate(projectId, name) {
        const normalizedName = this.normalizeCharacterName(name);
        
        // Try to find existing
        const existing = await this.findByNormalizedName(projectId, normalizedName);
        if (existing) {
            return existing;
        }
        
        // Create new
        return await this.create(projectId, name);
    }
    
    /**
     * Update character
     * @param {string} characterId
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    static async update(characterId, updates) {
        // If name is being updated, update normalized_name too
        if (updates.name) {
            updates.normalized_name = this.normalizeCharacterName(updates.name);
        }
        
        const { data, error } = await supabaseClient.db
            .from('characters')
            .update(updates)
            .eq('id', characterId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating character:', error);
            throw error;
        }
        
        return data;
    }
    
    /**
     * Delete character
     * @param {string} characterId
     * @returns {Promise<void>}
     */
    static async delete(characterId) {
        const { error } = await supabaseClient.db
            .from('characters')
            .delete()
            .eq('id', characterId);
        
        if (error) {
            console.error('Error deleting character:', error);
            throw error;
        }
    }
    
    /**
     * Assign Cast Member to character
     * @param {string} characterId
     * @param {string} castMemberId
     * @param {string} assignmentType - 'actor', 'understudy', 'stunt_double', etc.
     * @returns {Promise<Object>}
     */
    static async assignActor(characterId, castMemberId, assignmentType = 'actor') {
        const { data, error } = await supabaseClient.db
            .from('character_cast_assignments')
            .insert({
                character_id: characterId,
                cast_member_id: castMemberId,
                assignment_type: assignmentType
            })
            .select()
            .single();
        
        if (error) {
            console.error('Error assigning actor:', error);
            throw error;
        }
        
        return data;
    }
    
    /**
     * Remove actor assignment
     * @param {string} assignmentId
     * @returns {Promise<void>}
     */
    static async removeActorAssignment(assignmentId) {
        const { error } = await supabaseClient.db
            .from('character_cast_assignments')
            .delete()
            .eq('id', assignmentId);
        
        if (error) {
            console.error('Error removing actor assignment:', error);
            throw error;
        }
    }
    
    /**
     * Get all actor assignments for a character
     * @param {string} characterId
     * @returns {Promise<Array>}
     */
    static async getActorAssignments(characterId) {
        const { data, error } = await supabaseClient.db
            .from('character_cast_assignments')
            .select(`
                *,
                cast_member:cast_members(*)
            `)
            .eq('character_id', characterId)
            .order('assignment_type');
        
        if (error) {
            console.error('Error fetching cast member assignments:', error);
            throw error;
        }
        
        return data || [];
    }
    
    /**
     * Add character to scene
     * @param {string} sceneId
     * @param {string} characterId
     * @returns {Promise<Object>}
     */
    static async addToScene(sceneId, characterId) {
        const { data, error } = await supabaseClient.db
            .from('scene_characters')
            .insert({
                scene_id: sceneId,
                character_id: characterId
            })
            .select()
            .single();
        
        if (error) {
            // If already exists, just ignore (unique constraint violation)
            if (error.code === '23505') {
                console.log('Character already in scene');
                return null;
            }
            console.error('Error adding character to scene:', error);
            throw error;
        }
        
        return data;
    }
    
    /**
     * OPTIMIZED: Bulk link characters to scenes in single query
     * @param {Array<{sceneId: string, characterId: string}>} links
     * @returns {Promise<Array>}
     */
    static async addToScenesBulk(links) {
        if (!links || links.length === 0) {
            return [];
        }
        
        const insertData = links.map(link => ({
            scene_id: link.sceneId,
            character_id: link.characterId
        }));
        
        const { data, error } = await supabaseClient.db
            .from('scene_characters')
            .upsert(insertData, { 
                onConflict: 'scene_id,character_id',
                ignoreDuplicates: true 
            })
            .select();
        
        if (error) {
            console.error('Error bulk linking characters to scenes:', error);
            throw error;
        }
        
        return data || [];
    }
    
    /**
     * Remove character from scene
     * @param {string} sceneId
     * @param {string} characterId
     * @returns {Promise<void>}
     */
    static async removeFromScene(sceneId, characterId) {
        const { error } = await supabaseClient.db
            .from('scene_characters')
            .delete()
            .eq('scene_id', sceneId)
            .eq('character_id', characterId);
        
        if (error) {
            console.error('Error removing character from scene:', error);
            throw error;
        }
    }
    
    /**
     * Get all characters in a scene
     * @param {string} sceneId
     * @returns {Promise<Array>} Characters with actor info
     */
    static async getSceneCharacters(sceneId) {
        const { data, error } = await supabaseClient.db
            .from('scene_characters')
            .select(`
                *,
                character:characters(
                    *,
                    actor_assignments:character_cast_assignments(
                        *,
                        cast_member:cast_members(*)
                    )
                )
            `)
            .eq('scene_id', sceneId);
        
        if (error) {
            console.error('Error fetching scene characters:', error);
            throw error;
        }
        
        return data || [];
    }
    
    /**
     * Get usage count per character (how many scenes)
     * @param {string} projectId
     * @returns {Promise<Object>} Map of character_id → scene count
     */
    static async getUsageCounts(projectId) {
        // Get all characters for project
        const characters = await this.getAll(projectId);
        
        // Get scene counts
        const { data: sceneCounts, error } = await supabaseClient.db
            .from('scene_characters')
            .select('character_id, scene_id')
            .in('character_id', characters.map(c => c.id));
        
        if (error) {
            console.error('Error fetching usage counts:', error);
            throw error;
        }
        
        // Build count map
        const counts = {};
        sceneCounts?.forEach(sc => {
            counts[sc.character_id] = (counts[sc.character_id] || 0) + 1;
        });
        
        return counts;
    }
}
