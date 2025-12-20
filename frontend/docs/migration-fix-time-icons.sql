-- Fix time icons: replace emoji with proper SVG paths
-- This migration updates the time icons to use Lucide SVG paths instead of emoji

-- Since times are stored as JSONB array in projects table, we need to update each element

-- Update all projects to fix time icons
UPDATE projects
SET times = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        times,
        '{0,icon}', 
        '"<path d=\"M12 2v8\"/><path d=\"m4.93 10.93 1.41 1.41\"/><path d=\"M2 18h2\"/><path d=\"M20 18h2\"/><path d=\"m19.07 10.93-1.41 1.41\"/><path d=\"M22 22H2\"/><path d=\"m8 6 4-4 4 4\"/><circle cx=\"12\" cy=\"18\" r=\"4\"/>"'
      ),
      '{1,icon}',
      '"<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/>"'
    ),
    '{2,icon}',
    '"<path d=\"M12 10V2\"/><path d=\"m4.93 10.93 1.41 1.41\"/><path d=\"M2 18h2\"/><path d=\"M20 18h2\"/><path d=\"m19.07 10.93-1.41 1.41\"/><path d=\"M22 22H2\"/><path d=\"m16 6-4 4-4-4\"/><circle cx=\"12\" cy=\"18\" r=\"4\"/>"'
  ),
  '{3,icon}',
  '"<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/>"'
)
WHERE times IS NOT NULL;
