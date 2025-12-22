-- Migration: Add first_name and last_name columns to actors table
-- Created: 2025-12-22
-- Purpose: Separate first and last names for better display and sorting

-- Add first_name and last_name columns
ALTER TABLE actors
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing actors to split actor_name into first_name and last_name
-- This assumes actor_name is in "FirstName LastName" format
UPDATE actors
SET 
    first_name = SPLIT_PART(actor_name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN actor_name) > 0 THEN SUBSTRING(actor_name FROM POSITION(' ' IN actor_name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL;
