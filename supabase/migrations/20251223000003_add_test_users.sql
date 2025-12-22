-- Migration: Add Test Users for Development
-- Created: 2025-12-23
-- Purpose: Create test users for quick development and testing

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
    
    -- Insert test project if manager exists
    IF v_manager_id IS NOT NULL THEN
        INSERT INTO projects (name, description, manager_id)
        VALUES ('Manager Test Project', 'A test project for the manager account', v_manager_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE users IS 'Test users added: admin@continuity.local (superadmin) and manager@continuity.local (manager). Both use plain text passwords for dev (NOT for production!).';
