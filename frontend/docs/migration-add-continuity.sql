-- Migration: Add continuity property to scenes
-- Adds continuity designation for scene headings
-- Common values: CONTINUOUS, LATER, SAME TIME, MOMENTS LATER, FLASHBACK, etc.

-- Add continuity column to scenes
ALTER TABLE scenes 
ADD COLUMN IF NOT EXISTS continuity TEXT DEFAULT NULL;

-- Create index for continuity queries
CREATE INDEX IF NOT EXISTS idx_scenes_continuity ON scenes(continuity);

-- Add comment
COMMENT ON COLUMN scenes.continuity IS 'Continuity designation like CONTINUOUS, LATER, SAME TIME, MOMENTS LATER, etc.';
