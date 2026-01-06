// =================================================================
// CAST MEMBER SERVICE - Business Logic Layer
// =================================================================
// Handles all cast member-related business logic (actors, background, stunt performers, etc.)
// Uses window.supabase directly (same pattern as calendar/timeline)

export class CastMemberService {
    /**
     * Get display name for a cast member
     * @param {Object} castMember - Cast member object with name, first_name and last_name
     * @returns {string} Full name
     */
    static getDisplayName(castMember) {
        if (!castMember) return '';
        
        // Prefer database-generated name column
        if (castMember.name) return castMember.name;
        
        // Fallback: construct from first_name/last_name (for backwards compatibility)
        const firstName = castMember.first_name || '';
        const lastName = castMember.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown Cast Member';
    }
    
    static async getAll(projectId) {
        try {
            const { data, error } = await window.supabase
                .from('cast_members')
                .select('*')
                .eq('project_id', projectId)
                .order('name'); // Sort by generated name column

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching cast members:', error);
            throw error;
        }
    }

    static async getById(castMemberId) {
        try {
            const { data, error } = await window.supabase
                .from('cast_members')
                .select(`
                    *,
                    character_cast_assignments (
                        *,
                        character:characters (*)
                    )
                `)
                .eq('id', castMemberId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching cast member:', error);
            throw error;
        }
    }

    static async create(projectId, castMemberData) {
        try {
            const castMember = {
                project_id: projectId,
                first_name: castMemberData.first_name || null,
                last_name: castMemberData.last_name || null,
                role_type: castMemberData.role_type || null,
                email: castMemberData.email || null,
                phone: castMemberData.phone || null,
                height: castMemberData.height || null,
                hair_color: castMemberData.hair_color || null,
                hair_style: castMemberData.hair_style || null,
                eye_color: castMemberData.eye_color || null,
                skin_tone: castMemberData.skin_tone || null,
                body_type: castMemberData.body_type || null,
                distinguishing_features: castMemberData.distinguishing_features || [],
                profile_image_url: castMemberData.profile_image_url || null,
                reference_images: castMemberData.reference_images || [],
                notes: castMemberData.notes || null
            };

            const { data, error } = await window.supabase
                .from('cast_members')
                .insert([castMember])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating cast member:', error);
            throw error;
        }
    }

    static async update(castMemberId, castMemberData) {
        try {
            const updates = {
                first_name: castMemberData.first_name || null,
                last_name: castMemberData.last_name || null,
                role_type: castMemberData.role_type || null,
                email: castMemberData.email || null,
                phone: castMemberData.phone || null,
                height: castMemberData.height || null,
                hair_color: castMemberData.hair_color || null,
                hair_style: castMemberData.hair_style || null,
                eye_color: castMemberData.eye_color || null,
                skin_tone: castMemberData.skin_tone || null,
                body_type: castMemberData.body_type || null,
                distinguishing_features: castMemberData.distinguishing_features || [],
                profile_image_url: castMemberData.profile_image_url || null,
                reference_images: castMemberData.reference_images || [],
                notes: castMemberData.notes || null
            };

            const { data, error } = await window.supabase
                .from('cast_members')
                .update(updates)
                .eq('id', castMemberId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating cast member:', error);
            throw error;
        }
    }

    static async delete(castMemberId) {
        try {
            const { error } = await window.supabase
                .from('cast_members')
                .delete()
                .eq('id', castMemberId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting cast member:', error);
            throw error;
        }
    }

    static async search(projectId, searchTerm) {
        try {
            const allCastMembers = await this.getAll(projectId);
            
            if (!searchTerm || searchTerm.trim() === '') {
                return allCastMembers;
            }

            const term = searchTerm.toLowerCase();
            return allCastMembers.filter(castMember => 
                castMember.name.toLowerCase().includes(term) ||
                (castMember.notes && castMember.notes.toLowerCase().includes(term))
            );
        } catch (error) {
            console.error('Error searching cast members:', error);
            throw error;
        }
    }

    static sortCastMembers(castMembers, sortBy) {
        const sorted = [...castMembers];
        
        switch (sortBy) {
            case 'name-az':
                return sorted.sort((a, b) => 
                    a.name.localeCompare(b.name)
                );
            case 'recent':
                return sorted.sort((a, b) => 
                    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
                );
            default:
                return sorted;
        }
    }

    // Get continuity entries for a cast member
    static async getContinuity(castMemberId) {
        try {
            const { data, error } = await window.supabase
                .from('cast_member_continuity')
                .select(`
                    *,
                    scene:scenes(
                        scene_number,
                        description,
                        story_order
                    )
                `)
                .eq('cast_member_id', castMemberId)
                .order('continuity_date');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching cast member continuity:', error);
            throw error;
        }
    }

    // Create continuity entry
    static async createContinuity(continuityData) {
        try {
            const entry = {
                cast_member_id: continuityData.cast_member_id,
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

            const { data, error } = await window.supabase
                .from('cast_member_continuity')
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

    // Demo data - Create sample cast members
    static async createDemoCastMembers(projectId) {
        const demoCastMembers = [
            {
                first_name: 'Emma',
                last_name: 'De Caluwe',
                email: 'emma.decaluwe@example.be',
                phone: '+32 475 12 34 56',
                height: '168 cm',
                hair_color: 'Brown',
                hair_style: 'Long, wavy',
                eye_color: 'Green',
                skin_tone: 'Fair',
                body_type: 'Slim',
                distinguishing_features: ['Small scar above right eyebrow'],
                role_type: 'speaking_actor',
                notes: 'Lead actress. Requires minimal makeup time.'
            },
            {
                first_name: 'Thomas',
                last_name: 'Vandenberghe',
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
                first_name: 'Marie',
                last_name: 'Dubois',
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
                first_name: 'Lucas',
                last_name: 'Peeters',
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

        const createdCastMembers = [];
        for (const castMemberData of demoCastMembers) {
            try {
                const castMember = await this.create(projectId, castMemberData);
                createdCastMembers.push(castMember);
            } catch (error) {
                console.error('Error creating demo cast member:', error);
            }
        }

        return createdCastMembers;
    }
}
