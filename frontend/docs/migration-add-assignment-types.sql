-- =====================================================
-- Migration: Add Assignment Types to Project Settings
-- =====================================================
-- Description: Adds assignment_types JSONB column to project_settings
--              for configurable cast member assignment types
-- Author: System
-- Date: 2024
-- Version: 0.2.5.02
-- =====================================================

-- Add assignment_types column if it doesn't exist
ALTER TABLE project_settings 
ADD COLUMN IF NOT EXISTS assignment_types JSONB DEFAULT '[
    {"id": "actor", "label": "Actor"},
    {"id": "stunt", "label": "Stunt"},
    {"id": "voice-over", "label": "Voice-over"},
    {"id": "stand-in", "label": "Stand-in"}
]'::jsonb;

-- Add comment
COMMENT ON COLUMN project_settings.assignment_types IS 'Available assignment types for cast members in this project';

-- =====================================================
-- Migration Complete
-- =====================================================

SELECT 'Assignment types migration completed successfully!' as status;
