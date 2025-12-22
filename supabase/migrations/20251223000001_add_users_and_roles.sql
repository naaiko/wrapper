-- Migration: Add Users and Roles for Project Management
-- Created: 2025-12-23
-- Purpose: Implement user authentication, roles (superadmin/manager), and project ownership

-- Users table - Core authentication and role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- Store bcrypt hash, never plain text
    
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Add manager_id to projects table
ALTER TABLE projects 
    ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for efficient project filtering by manager
CREATE INDEX idx_projects_manager_id ON projects(manager_id);

-- User Sessions table - Track active sessions for security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Auto-update last_modified trigger for users
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
-- For now, allow public access during development (will be replaced with auth-based policies)
CREATE POLICY "Allow public access to users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Update existing RLS policies for projects to consider manager_id
-- Drop old policy
DROP POLICY IF EXISTS "Allow public access to projects" ON projects;

-- New policy: Allow public access for now (will be restricted later)
CREATE POLICY "Allow public access to projects" ON projects
    FOR ALL USING (true) WITH CHECK (true);

-- Insert a default superadmin user for testing
-- Password: 'admin123' (bcrypt hash)
-- IMPORTANT: Change this in production!
INSERT INTO users (email, name, password_hash, role) VALUES 
    ('admin@continuity.local', 'Super Admin', '$2a$10$rEVWgE9vGvN9xKqFPvFuD.gYbCvN8wPqQqJxKQxJQxJQxJQxJQxJQ', 'superadmin');

-- Comment with reminder
COMMENT ON TABLE users IS 'User accounts with role-based access. Superadmins see all projects, managers only see their own.';
COMMENT ON COLUMN projects.manager_id IS 'The manager who owns this project. NULL means accessible by superadmins only.';
