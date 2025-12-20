-- Add split_group_id and shooting_days_count columns to scenes table
-- This allows split scenes to remain linked and share properties

-- Add the columns

-- Add columns only if they do not exist
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS split_group_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shooting_days_count INTEGER DEFAULT NULL;

-- Add indexes for performance

-- Add index only if it does not exist
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE c.relname = 'idx_scenes_split_group_id' AND n.nspname = 'public'
	) THEN
		CREATE INDEX idx_scenes_split_group_id ON scenes(split_group_id);
	END IF;
END$$;

-- Add comments for documentation
COMMENT ON COLUMN scenes.split_group_id IS 'UUID linking scenes that were split from the same original scene. All scenes with the same split_group_id share properties and should be updated together.';
COMMENT ON COLUMN scenes.shooting_days_count IS 'Total number of shooting days required for this scene. For split scenes, this is the combined total across all linked scenes. Used to recalculate placement when moving/resizing.';

-- Populate shooting_days_count for existing scenes based on their current shooting_dates
-- Only update if shooting_days_count is NULL to make this idempotent
UPDATE scenes
SET shooting_days_count = COALESCE(array_length(shooting_dates, 1), 0)
WHERE shooting_dates IS NOT NULL AND shooting_days_count IS NULL;
