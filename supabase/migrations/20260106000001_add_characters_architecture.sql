-- Migration: Character-Actor Architecture Separation
-- Created: 2026-01-06
-- Version: 0.2.3
-- Purpose: Separate Characters (roles in story) from Actors (real people)
--
-- BREAKING CHANGE: This migration restructures the actor/character relationship
-- 
-- Architecture:
--   Character (story role) ─┬─ many-to-many ─→ Actor (real person)
--                           │
--                           └─ many-to-many ─→ Scene
--
-- Rationale:
--   - One character can be played by multiple actors (understudy, stunt, alternate)
--   - One actor can play multiple characters (rare but possible)
--   - Script imports extract character names, not actor names
--   - Casting happens after script breakdown

-- =================================================================
-- STEP 1: CREATE CHARACTERS TABLE
-- =================================================================

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,  -- Uppercase, no punctuation, for deduplication
    
    -- Optional metadata
    role_type TEXT,  -- 'lead', 'supporting', 'background', 'stunt'
    description TEXT,
    notes TEXT,
    
    -- Display ordering
    display_order INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints: Character names must be unique within a project
    CONSTRAINT unique_character_per_project UNIQUE (project_id, normalized_name)
);

-- Indexes
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_normalized_name ON characters(normalized_name);

-- =================================================================
-- STEP 2: CREATE CHARACTER-ACTOR ASSIGNMENTS (many-to-many)
-- =================================================================

CREATE TABLE character_cast_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    cast_member_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    
    -- Assignment type (allows multiple actors per character)
    assignment_type TEXT DEFAULT 'actor',  
    -- Options: 'actor', 'understudy', 'stunt_double', 'photo_double', 'voice', 'alternate'
    
    -- Scheduling (optional, for future cast scheduling features)
    effective_from DATE,
    effective_until DATE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Same character-actor-type combo should be unique
    CONSTRAINT unique_character_actor_assignment UNIQUE (character_id, cast_member_id, assignment_type)
);

-- Indexes
CREATE INDEX idx_char_actor_character_id ON character_cast_assignments(character_id);
CREATE INDEX idx_char_actor_cast_member_id ON character_cast_assignments(cast_member_id);
CREATE INDEX idx_char_actor_assignment_type ON character_cast_assignments(assignment_type);

-- =================================================================
-- STEP 3: CREATE SCENE-CHARACTERS JUNCTION (replaces scene_cast_members)
-- =================================================================

CREATE TABLE scene_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    -- Scene-specific metadata (optional)
    lines_count INTEGER,
    screen_time_estimate INTEGER,  -- In seconds
    
    -- Continuity notes (references the actor assigned to this character)
    costume_notes TEXT,
    costume_images TEXT[],
    makeup_notes TEXT,
    makeup_images TEXT[],
    hair_notes TEXT,
    hair_images TEXT[],
    props_notes TEXT,
    props_images TEXT[],
    
    -- General continuity
    continuity_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One character can only appear once per scene
    CONSTRAINT unique_scene_character UNIQUE (scene_id, character_id)
);

-- Indexes
CREATE INDEX idx_scene_characters_scene_id ON scene_characters(scene_id);
CREATE INDEX idx_scene_characters_character_id ON scene_characters(character_id);

-- =================================================================
-- STEP 4: MIGRATE EXISTING DATA
-- =================================================================

-- Migrate actors.character_name → characters table
-- Each existing actor row creates a character
INSERT INTO characters (project_id, name, normalized_name, created_at)
SELECT 
    project_id,
    character_name AS name,
    UPPER(REGEXP_REPLACE(character_name, '[^\w\s]', '', 'g')) AS normalized_name,
    created_at
FROM actors
WHERE character_name IS NOT NULL AND character_name != '';

-- Create character-actor assignments (1:1 mapping from old schema)
-- Links each character to its original actor
INSERT INTO character_cast_assignments (character_id, cast_member_id, assignment_type, created_at)
SELECT 
    c.id AS character_id,
    a.id AS cast_member_id,
    'actor' AS assignment_type,
    a.created_at
FROM actors a
JOIN characters c ON (
    c.project_id = a.project_id 
    AND c.normalized_name = UPPER(REGEXP_REPLACE(a.character_name, '[^\w\s]', '', 'g'))
)
WHERE a.character_name IS NOT NULL AND a.character_name != '';

-- Migrate scene_cast_members → scene_characters
-- Links scenes to characters (via actor lookup)
INSERT INTO scene_characters (
    scene_id, 
    character_id, 
    costume_notes, 
    costume_images,
    makeup_notes,
    makeup_images,
    hair_notes,
    hair_images,
    props_notes,
    props_images,
    continuity_notes,
    created_at
)
SELECT 
    sa.scene_id,
    c.id AS character_id,
    sa.costume_notes,
    sa.costume_images,
    sa.makeup_notes,
    sa.makeup_images,
    sa.hair_notes,
    sa.hair_images,
    sa.props_notes,
    sa.props_images,
    sa.continuity_notes,
    sa.created_at
FROM scene_cast_members sa
JOIN actors a ON sa.cast_member_id = a.id
JOIN characters c ON (
    c.project_id = a.project_id 
    AND c.normalized_name = UPPER(REGEXP_REPLACE(a.character_name, '[^\w\s]', '', 'g'))
)
WHERE a.character_name IS NOT NULL AND a.character_name != '';

-- =================================================================
-- STEP 5: UPDATE ACTORS TABLE (remove character_name column)
-- =================================================================

-- Remove character_name column (now managed in characters table)
ALTER TABLE actors DROP COLUMN IF EXISTS character_name;

-- Update actors table comment
COMMENT ON TABLE actors IS 'Real people who perform in the production (not story characters)';

-- Update column comment
COMMENT ON COLUMN actors.actor_name IS 'Real name of the actor/performer (not character name)';

-- =================================================================
-- STEP 6: DROP OLD scene_cast_members TABLE
-- =================================================================

-- Drop the old junction table (replaced by scene_characters)
DROP TABLE IF EXISTS scene_cast_members;

-- =================================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =================================================================

-- Function to auto-update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- STEP 8: ROW LEVEL SECURITY
-- =================================================================

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_cast_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_characters ENABLE ROW LEVEL SECURITY;

-- Public access policies (MVP - replace with auth later)
CREATE POLICY "Allow public access to characters" ON characters
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to character_cast_assignments" ON character_cast_assignments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to scene_characters" ON scene_characters
    FOR ALL USING (true) WITH CHECK (true);

-- =================================================================
-- STEP 9: TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =================================================================

CREATE TRIGGER update_characters_last_modified
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_character_cast_assignments_last_modified
    BEFORE UPDATE ON character_cast_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

CREATE TRIGGER update_scene_characters_last_modified
    BEFORE UPDATE ON scene_characters
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified();

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================

-- Summary:
-- ✅ characters table created
-- ✅ character_cast_assignments table created (many-to-many)
-- ✅ scene_characters table created (replaces scene_cast_members)
-- ✅ Data migrated from actors.character_name → characters
-- ✅ Data migrated from scene_cast_members → scene_characters
-- ✅ actors.character_name column dropped
-- ✅ scene_cast_members table dropped
-- ✅ RLS policies applied
-- ✅ Triggers configured

-- Next steps in application code:
-- 1. Create CharacterService
-- 2. Update ScriptImportService to create characters
-- 3. Update ActorsConfigModal → CharactersConfigModal
-- 4. Update timeline scene cards to show characters
-- 5. Add character-actor assignment UI
