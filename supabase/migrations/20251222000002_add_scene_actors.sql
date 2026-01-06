-- Migration: Add scene_cast_members junction table for many-to-many relationship
-- Created: 2025-12-22
-- Purpose: Link actors to scenes with continuity data (costume, makeup, hair, props photos)

-- Junction table for many-to-many relationship between scenes and actors
CREATE TABLE scene_cast_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys (many-to-many relationship)
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    cast_member_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    
    -- Costume/wardrobe continuity
    costume_notes TEXT,
    costume_images TEXT[], -- Array of URLs to costume photos for this scene
    
    -- Makeup continuity
    makeup_notes TEXT,
    makeup_images TEXT[], -- Array of URLs to makeup photos for this scene
    
    -- Hair continuity
    hair_notes TEXT,
    hair_images TEXT[], -- Array of URLs to hair photos for this scene
    
    -- Props & accessories continuity
    props_notes TEXT,
    props_images TEXT[], -- Array of URLs to props photos for this scene
    
    -- General continuity notes
    continuity_notes TEXT,
    
    -- Status tracking (future: approval workflow)
    approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'needs_revision'
    approved_by UUID, -- Reference to user (to be added later)
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- UNIQUE constraint: one actor can only appear once in the same scene
    CONSTRAINT unique_scene_actor UNIQUE (scene_id, cast_member_id)
);

-- Indexes for performance (queries from both directions)
CREATE INDEX idx_scene_cast_members_scene_id ON scene_cast_members(scene_id);
CREATE INDEX idx_scene_cast_members_cast_member_id ON scene_cast_members(cast_member_id);
CREATE INDEX idx_scene_cast_members_approval_status ON scene_cast_members(approval_status);

-- Enable Row Level Security
ALTER TABLE scene_cast_members ENABLE ROW LEVEL SECURITY;

-- Public access policy (for MVP - allows anyone to read/write)
-- WARNING: This is for testing only. Add authentication later!
CREATE POLICY "Allow public access to scene_cast_members" ON scene_cast_members
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger to auto-update last_modified
CREATE TRIGGER update_scene_cast_members_last_modified
    BEFORE UPDATE ON scene_cast_members
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Add migration to frontend/docs for backup
-- (Same content will be copied to frontend/docs/migration-add-scene-actors.sql)
