-- Migration: Add Actors table for continuity tracking
-- Created: 2025-12-21
-- Purpose: Track actors/characters with their physical characteristics and continuity details

-- Cast Members table - Main actor/character information
CREATE TABLE actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Basic Information
    actor_name TEXT NOT NULL,
    character_name TEXT NOT NULL,
    
    -- Contact Information
    email TEXT,
    phone TEXT,
    
    -- Physical Characteristics (for continuity reference)
    height TEXT,
    hair_color TEXT,
    hair_style TEXT,
    eye_color TEXT,
    skin_tone TEXT,
    
    -- Build/Body Type
    body_type TEXT,
    
    -- Distinguishing Features
    distinguishing_features TEXT[], -- scars, tattoos, piercings, etc.
    
    -- Reference Images
    profile_image_url TEXT, -- Main profile photo
    reference_images TEXT[], -- Array of URLs to reference photos
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cast Member Continuity Photos - Links actors to scenes with specific continuity photos
-- This tracks how an actor should look for specific scenes or time periods
CREATE TABLE cast_member_continuity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cast_member_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    
    -- Continuity Details
    continuity_date DATE, -- Story timeline date (if known)
    
    -- Appearance Details
    wardrobe_description TEXT,
    wardrobe_photos TEXT[], -- Array of wardrobe reference photos
    
    makeup_description TEXT,
    makeup_photos TEXT[], -- Array of makeup reference photos
    
    hair_description TEXT,
    hair_photos TEXT[], -- Array of hair reference photos
    
    facial_hair_description TEXT,
    facial_hair_photos TEXT[], -- Array of facial hair reference photos
    
    accessories_description TEXT,
    accessories_photos TEXT[], -- Array of accessories reference photos
    
    props_description TEXT,
    props_photos TEXT[], -- Array of props reference photos
    
    -- General Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_actors_project_id ON actors(project_id);
CREATE INDEX idx_actors_actor_name ON actors(actor_name);
CREATE INDEX idx_actors_character_name ON actors(character_name);
CREATE INDEX idx_cast_member_continuity_cast_member_id ON cast_member_continuity(cast_member_id);
CREATE INDEX idx_cast_member_continuity_scene_id ON cast_member_continuity(scene_id);

-- Enable Row Level Security
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cast_member_continuity ENABLE ROW LEVEL SECURITY;

-- Public access policies (for MVP - allows anyone to read/write)
-- WARNING: This is for testing only. Add authentication later!
CREATE POLICY "Allow public access to actors" ON actors
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to cast_member_continuity" ON cast_member_continuity
    FOR ALL USING (true) WITH CHECK (true);

-- Triggers to auto-update last_modified
CREATE TRIGGER update_actors_last_modified
    BEFORE UPDATE ON actors
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cast_member_continuity_last_modified
    BEFORE UPDATE ON cast_member_continuity
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
