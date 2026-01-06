-- Migration: Rename Actors to Cast Members
-- Created: 2026-01-06
-- Version: 0.2.3
-- Purpose: Rename 'actors' terminology to 'cast_members' for better industry alignment
--
-- Rationale:
-- "Cast Member" is more inclusive and better represents all types of on-screen talent:
-- - Speaking actors
-- - Background performers
-- - Stunt performers
-- - Photo doubles
-- - Stand-ins
-- - Voice actors
--
-- Changes:
-- 1. Rename 'actors' table to 'cast_members'
-- 2. Rename 'character_actor_assignments' to 'character_cast_assignments'
-- 3. Update all foreign key references

-- =================================================================
-- STEP 1: RENAME ACTORS TABLE
-- =================================================================

ALTER TABLE actors RENAME TO cast_members;

-- Rename sequence (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_class 
        WHERE relname = 'actors_id_seq' 
        AND relkind = 'S'
    ) THEN
        ALTER SEQUENCE actors_id_seq RENAME TO cast_members_id_seq;
    END IF;
END $$;

-- Update comments
COMMENT ON TABLE cast_members IS 'Cast members (actors, background, stunt performers, doubles, etc.)';

-- =================================================================
-- STEP 2: RENAME CHARACTER ASSIGNMENTS TABLE
-- =================================================================

ALTER TABLE character_actor_assignments RENAME TO character_cast_assignments;

-- Rename sequence (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_class 
        WHERE relname = 'character_actor_assignments_id_seq' 
        AND relkind = 'S'
    ) THEN
        ALTER SEQUENCE character_actor_assignments_id_seq RENAME TO character_cast_assignments_id_seq;
    END IF;
END $$;

-- Rename column
ALTER TABLE character_cast_assignments RENAME COLUMN actor_id TO cast_member_id;

-- Update comments
COMMENT ON TABLE character_cast_assignments IS 'Assigns cast members to character roles';
COMMENT ON COLUMN character_cast_assignments.cast_member_id IS 'Reference to cast member';

-- =================================================================
-- STEP 3: RENAME CONSTRAINTS AND INDEXES
-- =================================================================

-- Rename foreign key constraint
ALTER TABLE character_cast_assignments 
    DROP CONSTRAINT IF EXISTS character_actor_assignments_actor_id_fkey;
    
ALTER TABLE character_cast_assignments 
    ADD CONSTRAINT character_cast_assignments_cast_member_id_fkey 
    FOREIGN KEY (cast_member_id) 
    REFERENCES cast_members(id) 
    ON DELETE CASCADE;

-- Rename unique constraint
ALTER TABLE character_cast_assignments 
    DROP CONSTRAINT IF EXISTS character_actor_assignments_character_id_actor_id_assignme_key;
    
ALTER TABLE character_cast_assignments 
    ADD CONSTRAINT character_cast_assignments_character_id_cast_member_id_key 
    UNIQUE (character_id, cast_member_id, assignment_type);

-- Rename indexes
DROP INDEX IF EXISTS idx_character_actor_assignments_character_id;
DROP INDEX IF EXISTS idx_character_actor_assignments_actor_id;

CREATE INDEX idx_character_cast_assignments_character_id 
    ON character_cast_assignments(character_id);
    
CREATE INDEX idx_character_cast_assignments_cast_member_id 
    ON character_cast_assignments(cast_member_id);

-- =================================================================
-- STEP 4: RLS POLICIES (SKIP - Keep existing policies)
-- =================================================================

-- Note: Existing RLS policies on the actors and character_actor_assignments tables
-- will continue to work after the rename. PostgreSQL automatically updates policy
-- references when tables are renamed. No need to recreate policies.

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================

-- Summary:
-- ✅ 'actors' table renamed to 'cast_members'
-- ✅ 'character_actor_assignments' renamed to 'character_cast_assignments'
-- ✅ 'actor_id' column renamed to 'cast_member_id'
-- ✅ All foreign keys updated
-- ✅ All constraints renamed
-- ✅ All indexes renamed
-- ✅ Existing RLS policies preserved (auto-updated by PostgreSQL)

-- Terminology Update:
-- OLD: Actor → NEW: Cast Member
-- Includes: Speaking actors, background performers, stunt performers, 
--          photo doubles, stand-ins, voice actors, etc.
