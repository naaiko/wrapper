-- =====================================================
-- COMBINED MIGRATION: Scene Properties Enhancement
-- Run this in Supabase SQL Editor
-- =====================================================

-- 0. Update INT/EXT constraint to support all options
-- =====================================================

-- Drop the old constraint
ALTER TABLE scenes
DROP CONSTRAINT IF EXISTS check_int_ext_valid;

-- Add new constraint with all four options
ALTER TABLE scenes
ADD CONSTRAINT check_int_ext_valid 
CHECK (int_ext IS NULL OR int_ext IN ('INT', 'EXT', 'INT/EXT', 'EXT/INT'));

-- Update comment
COMMENT ON COLUMN scenes.int_ext IS 'Interior/Exterior designation: "INT", "EXT", "INT/EXT", or "EXT/INT". Displayed as prefix before scene description.';

-- 1. Add continuity column to scenes
-- =====================================================

ALTER TABLE scenes 
ADD COLUMN IF NOT EXISTS continuity TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_scenes_continuity ON scenes(continuity);

COMMENT ON COLUMN scenes.continuity IS 'Continuity designation like CONTINUOUS, LATER, SAME TIME, MOMENTS LATER, etc.';

-- 2. Create project_settings table
-- =====================================================

CREATE TABLE IF NOT EXISTS project_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Feature flags for scene heading components
    show_int_ext BOOLEAN DEFAULT TRUE,
    show_location BOOLEAN DEFAULT TRUE,
    show_time BOOLEAN DEFAULT TRUE,
    show_conditions BOOLEAN DEFAULT TRUE,
    show_continuity BOOLEAN DEFAULT TRUE,
    
    -- Default values for continuity options (JSON array)
    continuity_options JSONB DEFAULT '[
        {"id": "continuous", "label": "CONTINUOUS", "description": "Action continues from previous scene"},
        {"id": "later", "label": "LATER", "description": "Some time has passed"},
        {"id": "same-time", "label": "SAME TIME", "description": "Happening simultaneously"},
        {"id": "moments-later", "label": "MOMENTS LATER", "description": "A few moments later"},
        {"id": "flashback", "label": "FLASHBACK", "description": "Scene from the past"},
        {"id": "flash-forward", "label": "FLASH FORWARD", "description": "Scene from the future"},
        {"id": "dream-sequence", "label": "DREAM SEQUENCE", "description": "Dream or fantasy"},
        {"id": "montage", "label": "MONTAGE", "description": "Series of shots"}
    ]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_settings_project_id ON project_settings(project_id);

-- Add comments
COMMENT ON TABLE project_settings IS 'Per-project settings for scene heading components and feature flags';
COMMENT ON COLUMN project_settings.show_int_ext IS 'Enable INT./EXT. designation in scene headings';
COMMENT ON COLUMN project_settings.show_location IS 'Enable location in scene headings';
COMMENT ON COLUMN project_settings.show_time IS 'Enable time of day in scene headings';
COMMENT ON COLUMN project_settings.show_conditions IS 'Enable weather/conditions in scene headings';
COMMENT ON COLUMN project_settings.show_continuity IS 'Enable continuity designation in scene headings';
COMMENT ON COLUMN project_settings.continuity_options IS 'Available continuity options for this project';

-- Function to get or create settings for a project
CREATE OR REPLACE FUNCTION get_or_create_project_settings(p_project_id UUID)
RETURNS project_settings AS $$
DECLARE
    v_settings project_settings;
BEGIN
    -- Try to get existing settings
    SELECT * INTO v_settings FROM project_settings WHERE project_id = p_project_id;
    
    -- If not found, create default settings
    IF NOT FOUND THEN
        INSERT INTO project_settings (project_id)
        VALUES (p_project_id)
        RETURNING * INTO v_settings;
    END IF;
    
    RETURN v_settings;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Migration Complete
-- =====================================================

SELECT 'Migration completed successfully!' as status;
