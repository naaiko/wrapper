-- Add non-shooting days support to projects table
-- Non-shooting days are stored as an array of ISO date strings (YYYY-MM-DD)

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS non_shooting_days TEXT[] DEFAULT '{}';

COMMENT ON COLUMN projects.non_shooting_days IS 'Array of dates (YYYY-MM-DD) marked as non-shooting days';
