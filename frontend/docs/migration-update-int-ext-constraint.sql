-- Migration: Update INT/EXT constraint to support INT/EXT and EXT/INT
-- Adds support for scenes that are both interior and exterior

-- Drop the old constraint
ALTER TABLE scenes
DROP CONSTRAINT IF EXISTS check_int_ext_valid;

-- Add new constraint with all four options
ALTER TABLE scenes
ADD CONSTRAINT check_int_ext_valid 
CHECK (int_ext IS NULL OR int_ext IN ('INT', 'EXT', 'INT/EXT', 'EXT/INT'));

-- Update comment
COMMENT ON COLUMN scenes.int_ext IS 'Interior/Exterior designation: "INT", "EXT", "INT/EXT", or "EXT/INT". Displayed as prefix before scene description.';
