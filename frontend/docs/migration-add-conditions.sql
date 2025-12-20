-- Migration: Add weather conditions support to scenes
-- Adds conditions property (array) and project-level conditions configuration

-- Add conditions column to scenes (array of condition IDs)
ALTER TABLE scenes 
ADD COLUMN conditions TEXT[] DEFAULT '{}';

-- Add conditions configuration to projects (JSON array of condition objects)
-- Each condition object: { id: string, label: string, icon: string (SVG path), enabled: boolean }
ALTER TABLE projects
ADD COLUMN conditions JSONB DEFAULT '[
  {"id": "sunny", "label": "Sunny", "icon": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/>", "enabled": true},
  {"id": "rainy", "label": "Rainy", "icon": "<path d=\"M16 13v8\"/><path d=\"M8 13v8\"/><path d=\"M12 15v8\"/><path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"/>", "enabled": true},
  {"id": "stormy", "label": "Stormy", "icon": "<path d=\"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2\"/><path d=\"M9.6 4.6A2 2 0 1 1 11 8H2\"/><path d=\"M12.6 19.4A2 2 0 1 0 14 16H2\"/>", "enabled": true},
  {"id": "cold", "label": "Cold", "icon": "<path d=\"M2 12h20\"/><path d=\"M12 2v20\"/><path d=\"m4.93 4.93 14.14 14.14\"/><path d=\"m4.93 19.07 14.14-14.14\"/>", "enabled": true},
  {"id": "hot", "label": "Hot", "icon": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/>", "enabled": true},
  {"id": "chilly", "label": "Chilly", "icon": "<path d=\"M2 12h20\"/><path d=\"M12 2v20\"/><path d=\"m4.93 4.93 14.14 14.14\"/><path d=\"m4.93 19.07 14.14-14.14\"/>", "enabled": true}
]'::jsonb;

-- Create index for conditions queries
CREATE INDEX idx_scenes_conditions ON scenes USING GIN(conditions);

-- Function to get scenes by condition
CREATE OR REPLACE FUNCTION get_scenes_by_condition(p_project_id UUID, p_condition TEXT)
RETURNS SETOF scenes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM scenes 
    WHERE project_id = p_project_id 
    AND p_condition = ANY(conditions)
    ORDER BY story_order;
END;
$$ LANGUAGE plpgsql;
