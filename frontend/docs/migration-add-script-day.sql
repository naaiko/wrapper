-- Migration: Add script_day column to scenes table
-- Script Day (SD) represents the day in the screenplay timeline
-- Example: Scene 5 might happen on Script Day 2

ALTER TABLE scenes 
ADD COLUMN IF NOT EXISTS script_day TEXT;

-- Add comment for documentation
COMMENT ON COLUMN scenes.script_day IS 'Script day (SD) - the day in the screenplay timeline (e.g., "1", "2", "2A")';
