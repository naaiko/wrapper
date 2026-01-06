-- Migration: Update Actors Table Schema
-- Created: 2026-01-06
-- Version: 0.2.3
-- Purpose: Add first_name/last_name split and rename role to role_type with industry standards
--
-- IMPORTANT: This migration must be run BEFORE 20260106000003_rename_actors_to_cast_members.sql
-- This migration updates the 'actors' table structure.
-- The next migration will rename 'actors' to 'cast_members'.
--
-- Changes:
-- 1. Add first_name and last_name columns
-- 2. Rename 'role' to 'role_type'
-- 3. Update role_type values to industry standards

-- =================================================================
-- STEP 1: ADD NAME COLUMNS
-- =================================================================

-- Add first_name and last_name columns (nullable for existing records)
ALTER TABLE actors ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing actor_name data to first_name/last_name (only if actor_name exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'actors' 
        AND column_name = 'actor_name'
    ) THEN
        -- Simple split on first space
        UPDATE actors
        SET 
            first_name = split_part(actor_name, ' ', 1),
            last_name = CASE 
                WHEN position(' ' in actor_name) > 0 
                THEN substring(actor_name from position(' ' in actor_name) + 1)
                ELSE NULL
            END
        WHERE first_name IS NULL;
    END IF;
END $$;

-- =================================================================
-- STEP 2: RENAME ROLE TO ROLE_TYPE AND UPDATE CONSTRAINT
-- =================================================================

-- Drop ALL old CHECK constraints if they exist
ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_role_check;
ALTER TABLE actors DROP CONSTRAINT IF EXISTS actors_role_type_check;

-- Rename column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'actors' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE actors RENAME COLUMN role TO role_type;
    END IF;
END $$;

-- Add role_type column if it doesn't exist
ALTER TABLE actors ADD COLUMN IF NOT EXISTS role_type TEXT;

-- =================================================================
-- STEP 3: ADD NEW CHECK CONSTRAINT FIRST (before data migration)
-- =================================================================

-- Add new CHECK constraint with updated values (NULL allowed)
ALTER TABLE actors ADD CONSTRAINT actors_role_type_check 
    CHECK (
        role_type IS NULL OR 
        role_type IN (
            'speaking_actor', 
            'background', 
            'stunt', 
            'understudy', 
            'alternate', 
            'photo_double', 
            'voice',
            -- Temporarily allow old values for migration
            'hoofdrol',
            'bijrol', 
            'figurant',
            'lead',
            'supporting'
        )
    );

-- =================================================================
-- STEP 4: UPDATE ROLE_TYPE VALUES TO INDUSTRY STANDARDS
-- =================================================================

-- Migrate Dutch role names to English industry standards
UPDATE actors
SET role_type = CASE role_type
    WHEN 'hoofdrol' THEN 'speaking_actor'
    WHEN 'bijrol' THEN 'speaking_actor'
    WHEN 'lead' THEN 'speaking_actor'
    WHEN 'supporting' THEN 'speaking_actor'
    WHEN 'figurant' THEN 'background'
    ELSE role_type
END
WHERE role_type IN ('hoofdrol', 'bijrol', 'figurant', 'lead', 'supporting');

-- Set any invalid values to NULL (will be allowed by constraint)
UPDATE actors
SET role_type = NULL
WHERE role_type IS NOT NULL 
  AND role_type NOT IN ('speaking_actor', 'background', 'stunt', 'understudy', 'alternate', 'photo_double', 'voice');

-- =================================================================
-- STEP 5: UPDATE CONSTRAINT TO ONLY ALLOW NEW VALUES
-- =================================================================

-- Drop and recreate constraint without old values
ALTER TABLE actors DROP CONSTRAINT actors_role_type_check;
ALTER TABLE actors ADD CONSTRAINT actors_role_type_check 
    CHECK (
        role_type IS NULL OR 
        role_type IN (
            'speaking_actor', 
            'background', 
            'stunt', 
            'understudy', 
            'alternate', 
            'photo_double', 
            'voice'
        )
    );

-- =================================================================
-- STEP 6: ADD COLUMN COMMENTS
-- =================================================================

COMMENT ON COLUMN actors.first_name IS 'Cast member first name (given name)';
COMMENT ON COLUMN actors.last_name IS 'Cast member last name (surname/family name)';
COMMENT ON COLUMN actors.role_type IS 'Role type: speaking_actor, background, stunt, understudy, alternate, photo_double, voice';

-- =================================================================
-- STEP 7: REMOVE OLD ACTOR_NAME COLUMN
-- =================================================================

-- Drop actor_name column since we now use first_name/last_name
ALTER TABLE actors DROP COLUMN IF EXISTS actor_name;

-- Add generated 'name' column that auto-concatenates first_name and last_name
ALTER TABLE actors ADD COLUMN IF NOT EXISTS name TEXT GENERATED ALWAYS AS (
    TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
) STORED;

-- Create index on generated name column for better query performance
CREATE INDEX IF NOT EXISTS idx_actors_name ON actors(name);

COMMENT ON COLUMN actors.name IS 'Auto-generated full name from first_name and last_name (read-only)';

-- =================================================================
-- MIGRATION COMPLETE
-- =================================================================

-- Summary:
-- ✅ first_name and last_name columns added
-- ✅ Existing actor_name data migrated to first_name/last_name
-- ✅ actor_name column removed
-- ✅ Generated 'name' column added (auto-concatenates first_name + last_name)
-- ✅ 'role' renamed to 'role_type'
-- ✅ Dutch role names migrated to English standards
-- ✅ Column comments added

-- Role Type Options (industry standards):
-- - speaking_actor: Actor with speaking role (character-specific)
-- - background: Background actor/extra
-- - stunt: Stunt performer
-- - understudy: Backup actor for a role
-- - alternate: Alternate actor (shares role)
-- - photo_double: Photo double/stand-in
-- - voice: Voice actor/ADR
