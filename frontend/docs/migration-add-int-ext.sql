-- Add int_ext column to scenes table
-- Stores whether a scene is interior (INT) or exterior (EXT)

-- Add the column
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS int_ext TEXT DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_scenes_int_ext ON scenes(int_ext);

-- Add comment for documentation
COMMENT ON COLUMN scenes.int_ext IS 'Interior/Exterior designation: "INT" or "EXT". Displayed as prefix before scene description.';

-- Add check constraint to ensure only valid values (use DO block for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_int_ext_valid' 
        AND conrelid = 'scenes'::regclass
    ) THEN
        ALTER TABLE scenes
        ADD CONSTRAINT check_int_ext_valid 
        CHECK (int_ext IS NULL OR int_ext IN ('INT', 'EXT'));
    END IF;
END$$;
