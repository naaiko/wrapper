-- Add locations table and update scenes to use location_id
-- Locations are project-specific and can be reused across scenes

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_locations_project_id ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_display_order ON locations(project_id, display_order);

-- Add location_id to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add index for location_id
CREATE INDEX IF NOT EXISTS idx_scenes_location_id ON scenes(location_id);

-- Add comments
COMMENT ON TABLE locations IS 'Locations/settings for scenes within a project. Can be reused across multiple scenes.';
COMMENT ON COLUMN locations.name IS 'Name of the location, e.g., "COFFEE SHOP", "CITY STREET", "PARK"';
COMMENT ON COLUMN scenes.location_id IS 'Reference to the location where this scene takes place';
