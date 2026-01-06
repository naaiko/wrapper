-- =====================================================
-- Migration: Add role column to actors table
-- Version: v0.2.0
-- Created: 2025-12-26
-- Purpose: Add role classification for actors (hoofdrol, bijrol, figurant)
-- =====================================================

-- Add role column to actors table
ALTER TABLE actors 
ADD COLUMN IF NOT EXISTS role TEXT 
CHECK (role IS NULL OR role IN ('hoofdrol', 'bijrol', 'figurant', 'extra'));

-- Add index for filtering by role
CREATE INDEX IF NOT EXISTS idx_actors_role ON actors(role);

-- Verification query
SELECT 
    'Migration complete' as status,
    COUNT(*) as total_actors,
    COUNT(role) as actors_with_role
FROM actors;
