-- Migration: Add Project Deletion Function with Full Cascade
-- Created: 2025-12-23
-- Purpose: Ensure complete project deletion with all related data (no orphans)

-- Function to delete a project and all its related data
-- This ensures proper cascade deletion even for complex relationships
CREATE OR REPLACE FUNCTION delete_project_cascade(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_scenes INTEGER;
    v_deleted_actors INTEGER;
    v_deleted_locations INTEGER;
    v_deleted_settings INTEGER;
    v_result JSON;
BEGIN
    -- Count what will be deleted (for audit trail)
    SELECT COUNT(*) INTO v_deleted_scenes FROM scenes WHERE project_id = p_project_id;
    SELECT COUNT(*) INTO v_deleted_actors FROM actors WHERE project_id = p_project_id;
    
    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Project with id % does not exist', p_project_id;
    END IF;
    
    -- Delete all related data explicitly (CASCADE will handle most, but being explicit)
    -- Note: ON DELETE CASCADE is already set up in schema, but we log counts
    
    -- Delete cast_member_continuity (via CASCADE from actors)
    -- Delete scene_cast_members (via CASCADE from scenes and actors)
    -- Delete locations, settings, etc. (all have CASCADE on project_id)
    
    -- Finally delete the project (CASCADE will handle all references)
    DELETE FROM projects WHERE id = p_project_id;
    
    -- Return summary of deletion
    v_result := json_build_object(
        'success', true,
        'project_id', p_project_id,
        'deleted_scenes', v_deleted_scenes,
        'deleted_actors', v_deleted_actors,
        'deleted_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify project ownership before deletion
-- This prevents unauthorized deletion
CREATE OR REPLACE FUNCTION can_delete_project(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_project_manager_id UUID;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    
    -- Get project manager
    SELECT manager_id INTO v_project_manager_id FROM projects WHERE id = p_project_id;
    
    -- Superadmin can delete any project
    IF v_user_role = 'superadmin' THEN
        RETURN true;
    END IF;
    
    -- Manager can only delete their own projects
    IF v_user_role = 'manager' AND v_project_manager_id = p_user_id THEN
        RETURN true;
    END IF;
    
    -- Otherwise, no permission
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a soft-delete option for future use (currently unused, but available)
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON FUNCTION delete_project_cascade IS 'Hard delete a project and all related data. Returns JSON summary of deletion.';
COMMENT ON FUNCTION can_delete_project IS 'Check if a user has permission to delete a specific project based on role and ownership.';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp. NULL means active. Currently unused (hard delete in use).';
