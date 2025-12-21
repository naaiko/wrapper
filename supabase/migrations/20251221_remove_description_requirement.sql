-- Migration: Remove NOT NULL constraint from description column
-- The description field is no longer required for scenes

-- Remove NOT NULL constraint from description column
ALTER TABLE scenes 
ALTER COLUMN description DROP NOT NULL;

-- Update comment to reflect optional status
COMMENT ON COLUMN scenes.description IS 'Optional scene description or heading text';
