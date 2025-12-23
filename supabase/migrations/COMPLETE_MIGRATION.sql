-- ============================================================================
-- COMPLETE MIGRATION: User & Project Management System
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================
-- This will:
-- 1. Create users and user_sessions tables
-- 2. Add manager_id to projects table
-- 3. Create deletion and permission functions
-- 4. Add test users for development
-- ============================================================================

-- ============================================================================
-- PART 1: USERS & ROLES
-- ============================================================================

-- Users table - Core authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Role Management
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'manager')),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookup during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add manager_id to projects table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_projects_manager_id ON projects(manager_id);
    END IF;
END $$;

-- User Sessions table - Track active sessions for security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Auto-update last_modified trigger for users (if not exists)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users (development - allow all)
DROP POLICY IF EXISTS "Allow public access to users" ON users;
CREATE POLICY "Allow public access to users" ON users
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to sessions" ON user_sessions;
CREATE POLICY "Allow public access to sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Update projects RLS policy
DROP POLICY IF EXISTS "Allow public access to projects" ON projects;
CREATE POLICY "Allow public access to projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 2: PROJECT DELETION FUNCTIONS
-- ============================================================================

-- Add soft-delete option for future use (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
        CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;
END $$;

-- Function to delete a project and all its related data
CREATE OR REPLACE FUNCTION delete_project_cascade(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_scenes INTEGER;
    v_deleted_actors INTEGER;
    v_result JSON;
BEGIN
    -- Count what will be deleted (for audit trail)
    SELECT COUNT(*) INTO v_deleted_scenes FROM scenes WHERE project_id = p_project_id;
    SELECT COUNT(*) INTO v_deleted_actors FROM actors WHERE project_id = p_project_id;
    
    -- Check if project exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Project with id % does not exist', p_project_id;
    END IF;
    
    -- Delete the project (CASCADE will handle all references)
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

-- ============================================================================
-- PART 3: TEST USERS & DATA
-- ============================================================================

-- Insert test superadmin (if not exists)
INSERT INTO users (email, name, password_hash, role) 
VALUES ('admin@continuity.local', 'Super Admin', 'admin123', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Insert test manager user
INSERT INTO users (email, name, password_hash, role) 
VALUES ('manager@continuity.local', 'Test Manager', 'manager123', 'manager')
ON CONFLICT (email) DO NOTHING;

-- Create a test project for the manager
DO $$
DECLARE
    v_manager_id UUID;
BEGIN
    -- Get the manager's ID
    SELECT id INTO v_manager_id FROM users WHERE email = 'manager@continuity.local';
    
    -- Insert test project if manager exists and project doesn't exist
    IF v_manager_id IS NOT NULL THEN
        INSERT INTO projects (name, description, manager_id)
        SELECT 'Manager Test Project', 'A test project for the manager account', v_manager_id
        WHERE NOT EXISTS (
            SELECT 1 FROM projects WHERE name = 'Manager Test Project' AND manager_id = v_manager_id
        );
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Check that everything worked)
-- ============================================================================

-- Show created users
SELECT 'Users created:' as info, email, name, role FROM users ORDER BY role, name;

-- Show projects with managers
SELECT 'Projects:' as info, p.name, p.description, u.name as manager_name, u.email as manager_email
FROM projects p
LEFT JOIN users u ON p.manager_id = u.id
ORDER BY p.created_at DESC;

-- ============================================================================
-- DONE!
-- ============================================================================
-- You should see:
-- - 2 users (admin@continuity.local and manager@continuity.local)
-- - At least 1 project (Manager Test Project)
-- 
-- Test accounts:
-- Superadmin: admin@continuity.local (any password in dev mode)
-- Manager: manager@continuity.local (any password in dev mode)
-- ============================================================================
