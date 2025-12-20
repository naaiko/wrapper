-- Migration: Add time of day support to scenes
-- Adds time property and project-level time configuration

-- Add time column to scenes
ALTER TABLE scenes 
ADD COLUMN time TEXT;

-- Add times configuration to projects (JSON array of time objects)
-- Each time object: { id: string, label: string, icon: string (SVG path), enabled: boolean }
ALTER TABLE projects
ADD COLUMN times JSONB DEFAULT '[
  {"id": "morning", "label": "Morning", "icon": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z\" />", "enabled": true},
  {"id": "day", "label": "Day", "icon": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z\" />", "enabled": true},
  {"id": "evening", "label": "Evening", "icon": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z\" />", "enabled": true},
  {"id": "night", "label": "Night", "icon": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z\" />", "enabled": true}
]'::jsonb;

-- Create index for time queries
CREATE INDEX idx_scenes_time ON scenes(time);

-- Function to get scenes by time
CREATE OR REPLACE FUNCTION get_scenes_by_time(p_project_id UUID, p_time TEXT)
RETURNS SETOF scenes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM scenes 
    WHERE project_id = p_project_id 
    AND time = p_time
    ORDER BY story_order;
END;
$$ LANGUAGE plpgsql;
