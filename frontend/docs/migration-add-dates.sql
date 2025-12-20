-- Migration: Add shooting dates support
-- This migration adds support for actual calendar dates instead of just day numbers

-- Add new column for shooting dates (array of DATE values)
ALTER TABLE scenes 
ADD COLUMN shooting_dates DATE[] DEFAULT '{}';

-- Optional: Keep shooting_days for backward compatibility during transition
-- You can remove this later once fully migrated

-- Create index for shooting dates
CREATE INDEX idx_scenes_shooting_dates ON scenes USING GIN (shooting_dates);

-- Add production start date to projects (optional - helps with relative day calculations)
ALTER TABLE projects
ADD COLUMN production_start_date DATE;

-- Function to get scenes by shooting date
CREATE OR REPLACE FUNCTION get_scenes_by_date(p_project_id UUID, p_date DATE)
RETURNS SETOF scenes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM scenes 
    WHERE project_id = p_project_id 
    AND p_date = ANY(shooting_dates)
    ORDER BY story_order;
END;
$$ LANGUAGE plpgsql;

-- Function to get scenes for date range (useful for calendar month view)
CREATE OR REPLACE FUNCTION get_scenes_by_date_range(p_project_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    scene_id UUID,
    scene_number TEXT,
    description TEXT,
    story_order INTEGER,
    shooting_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.scene_number,
        s.description,
        s.story_order,
        unnest(s.shooting_dates) as shooting_date
    FROM scenes s
    WHERE s.project_id = p_project_id
    AND EXISTS (
        SELECT 1 FROM unnest(s.shooting_dates) d
        WHERE d >= p_start_date AND d <= p_end_date
    )
    ORDER BY shooting_date, s.story_order;
END;
$$ LANGUAGE plpgsql;
