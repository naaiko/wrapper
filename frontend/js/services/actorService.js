// =================================================================
// ACTOR SERVICE - Business Logic Layer
// =================================================================
// Handles all actor-related business logic
// Independent of database implementation

import { supabaseClient } from '../api/supabaseClient.js';

export class ActorService {
    static async getAll(projectId) {
        try {
            const { data, error } = await supabaseClient.db
                .from('actors')
                .select('*')
                .eq('project_id', projectId)
                .order('actor_name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching actors:', error);
            throw error;
        }
    }

    static async getById(actorId) {
        try {
            const { data, error } = await supabaseClient.db
                .from('actors')
                .select('*')
                .eq('id', actorId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching actor:', error);
            throw error;
        }
    }

    static async create(projectId, actorData) {
        try {
            const actor = {
                project_id: projectId,
                actor_name: actorData.actor_name,
                character_name: actorData.character_name,
                email: actorData.email || null,
                phone: actorData.phone || null,
                height: actorData.height || null,
                hair_color: actorData.hair_color || null,
                hair_style: actorData.hair_style || null,
                eye_color: actorData.eye_color || null,
                skin_tone: actorData.skin_tone || null,
                body_type: actorData.body_type || null,
                distinguishing_features: actorData.distinguishing_features || [],
                profile_image_url: actorData.profile_image_url || null,
                reference_images: actorData.reference_images || [],
                notes: actorData.notes || null
            };

            const { data, error } = await supabaseClient.db
                .from('actors')
                .insert([actor])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating actor:', error);
            throw error;
        }
    }

    static async update(actorId, actorData) {
        try {
            const updates = {
                actor_name: actorData.actor_name,
                character_name: actorData.character_name,
                email: actorData.email || null,
                phone: actorData.phone || null,
                height: actorData.height || null,
                hair_color: actorData.hair_color || null,
                hair_style: actorData.hair_style || null,
                eye_color: actorData.eye_color || null,
                skin_tone: actorData.skin_tone || null,
                body_type: actorData.body_type || null,
                distinguishing_features: actorData.distinguishing_features || [],
                profile_image_url: actorData.profile_image_url || null,
                reference_images: actorData.reference_images || [],
                notes: actorData.notes || null
            };

            const { data, error } = await supabaseClient.db
                .from('actors')
                .update(updates)
                .eq('id', actorId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating actor:', error);
            throw error;
        }
    }

    static async delete(actorId) {
        try {
            const { error } = await supabaseClient.db
                .from('actors')
                .delete()
                .eq('id', actorId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting actor:', error);
            throw error;
        }
    }

    static async search(projectId, searchTerm) {
        try {
            const allActors = await this.getAll(projectId);
            
            if (!searchTerm || searchTerm.trim() === '') {
                return allActors;
            }

            const term = searchTerm.toLowerCase();
            return allActors.filter(actor => 
                actor.actor_name.toLowerCase().includes(term) ||
                actor.character_name.toLowerCase().includes(term) ||
                (actor.notes && actor.notes.toLowerCase().includes(term))
            );
        } catch (error) {
            console.error('Error searching actors:', error);
            throw error;
        }
    }

    static sortActors(actors, sortBy) {
        const sorted = [...actors];
        
        switch (sortBy) {
            case 'actor-az':
                return sorted.sort((a, b) => 
                    a.actor_name.localeCompare(b.actor_name)
                );
            case 'character-az':
                return sorted.sort((a, b) => 
                    a.character_name.localeCompare(b.character_name)
                );
            case 'recent':
                return sorted.sort((a, b) => 
                    new Date(b.last_modified) - new Date(a.last_modified)
                );
            default:
                return sorted;
        }
    }

    // Get continuity entries for an actor
    static async getContinuity(actorId) {
        try {
            const { data, error } = await supabaseClient.db
                .from('actor_continuity')
                .select(`
                    *,
                    scene:scenes(
                        scene_number,
                        description,
                        story_order
                    )
                `)
                .eq('actor_id', actorId)
                .order('continuity_date');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching actor continuity:', error);
            throw error;
        }
    }

    // Create continuity entry
    static async createContinuity(continuityData) {
        try {
            const entry = {
                actor_id: continuityData.actor_id,
                scene_id: continuityData.scene_id || null,
                continuity_date: continuityData.continuity_date || null,
                wardrobe_description: continuityData.wardrobe_description || null,
                wardrobe_photos: continuityData.wardrobe_photos || [],
                makeup_description: continuityData.makeup_description || null,
                makeup_photos: continuityData.makeup_photos || [],
                hair_description: continuityData.hair_description || null,
                hair_photos: continuityData.hair_photos || [],
                facial_hair_description: continuityData.facial_hair_description || null,
                facial_hair_photos: continuityData.facial_hair_photos || [],
                accessories_description: continuityData.accessories_description || null,
                accessories_photos: continuityData.accessories_photos || [],
                props_description: continuityData.props_description || null,
                props_photos: continuityData.props_photos || [],
                notes: continuityData.notes || null
            };

            const { data, error } = await supabaseClient.db
                .from('actor_continuity')
                .insert([entry])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating continuity entry:', error);
            throw error;
        }
    }

    // Demo data - Create sample actors
    static async createDemoActors(projectId) {
        const demoActors = [
            {
                actor_name: 'Emma De Caluwe',
                character_name: 'Sophie Maes',
                email: 'emma.decaluwe@example.be',
                phone: '+32 475 12 34 56',
                height: '168 cm',
                hair_color: 'Brown',
                hair_style: 'Long, wavy',
                eye_color: 'Green',
                skin_tone: 'Fair',
                body_type: 'Slim',
                distinguishing_features: ['Small scar above right eyebrow'],
                notes: 'Lead actress. Requires minimal makeup time.'
            },
            {
                actor_name: 'Thomas Vandenberghe',
                character_name: 'Marc Dubois',
                email: 'thomas.v@example.be',
                phone: '+32 476 98 76 54',
                height: '182 cm',
                hair_color: 'Black',
                hair_style: 'Short, professional cut',
                eye_color: 'Brown',
                skin_tone: 'Medium',
                body_type: 'Athletic',
                distinguishing_features: ['Tattoo on left forearm', 'Beard'],
                notes: 'Supporting role. Beard continuity critical.'
            },
            {
                actor_name: 'Marie Dubois',
                character_name: 'Claire Laurent',
                email: 'marie.dubois@example.be',
                phone: '+32 477 55 44 33',
                height: '162 cm',
                hair_color: 'Blonde',
                hair_style: 'Bob cut',
                eye_color: 'Blue',
                skin_tone: 'Very Fair',
                body_type: 'Average',
                distinguishing_features: ['Pierced ears', 'Freckles'],
                notes: 'Character ages throughout film - requires aging makeup.'
            },
            {
                actor_name: 'Lucas Peeters',
                character_name: 'Jonas Willems',
                email: 'lucas.p@example.be',
                height: '175 cm',
                hair_color: 'Red',
                hair_style: 'Messy, medium length',
                eye_color: 'Hazel',
                skin_tone: 'Light',
                body_type: 'Slim',
                distinguishing_features: ['Glasses'],
                notes: 'Young actor. Multiple costume changes per scene.'
            }
        ];

        const createdActors = [];
        for (const actorData of demoActors) {
            try {
                const actor = await this.create(projectId, actorData);
                createdActors.push(actor);
            } catch (error) {
                console.error('Error creating demo actor:', error);
            }
        }

        return createdActors;
    }
}
