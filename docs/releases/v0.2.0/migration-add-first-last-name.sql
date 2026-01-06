-- ===================================================================
-- Migration: Add first_name and last_name to actors table
-- Version: v0.2.0
-- Feature: Cast Grid
-- Date: 2026-01-05
-- ===================================================================
-- This migration adds first_name and last_name columns to support
-- the Cast Grid feature introduced in v0.2.0
-- ===================================================================

-- Add first_name and last_name columns
ALTER TABLE actors
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data: split actor_name into first_name and last_name
UPDATE actors
SET 
    first_name = SPLIT_PART(actor_name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN actor_name) > 0 THEN SUBSTRING(actor_name FROM POSITION(' ' IN actor_name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL;

-- Verify migration
SELECT 
    id,
    actor_name,
    first_name,
    last_name,
    created_at
FROM actors
ORDER BY created_at DESC
LIMIT 10;
