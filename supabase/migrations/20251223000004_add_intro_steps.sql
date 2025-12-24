-- ============================================================================
-- INTRO.JS ONBOARDING STEPS MANAGEMENT
-- ============================================================================

-- Table for storing intro.js onboarding steps
CREATE TABLE IF NOT EXISTS intro_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Which page is this step for?
    page TEXT NOT NULL, -- 'timeline', 'actors', 'calendar', etc.
    
    -- Step configuration
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    intro TEXT NOT NULL,
    element TEXT, -- CSS selector (null for floating/centered steps)
    position TEXT DEFAULT 'bottom', -- 'top', 'bottom', 'left', 'right', 'floating'
    
    -- Visibility
    is_visible BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ordering per page
    UNIQUE(page, step_order)
);

-- Index for fast lookup by page
CREATE INDEX IF NOT EXISTS idx_intro_steps_page ON intro_steps(page);
CREATE INDEX IF NOT EXISTS idx_intro_steps_order ON intro_steps(page, step_order);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_intro_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_intro_steps_timestamp ON intro_steps;
CREATE TRIGGER update_intro_steps_timestamp
    BEFORE UPDATE ON intro_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_intro_steps_updated_at();

-- Enable RLS
ALTER TABLE intro_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policy (allow all for development)
DROP POLICY IF EXISTS "Allow public access to intro_steps" ON intro_steps;
CREATE POLICY "Allow public access to intro_steps" ON intro_steps
    FOR ALL USING (true) WITH CHECK (true);

-- Insert default timeline steps
INSERT INTO intro_steps (page, step_order, title, intro, element, position, is_visible) VALUES
('timeline', 1, '👋 Welcome to Your Timeline', 
 '<div class="text-left"><p class="mb-3">This is where your story comes to life. Let me show you around real quick.</p><p class="text-sm opacity-70">Don''t worry, this''ll take less than a minute.</p></div>', 
 NULL, 'floating', true),

('timeline', 2, '📖 Story vs Shooting Order', 
 '<div class="text-left"><p class="mb-2">You can view your scenes in two ways:</p><ul class="list-disc ml-4 mb-2"><li><strong>Story Order</strong> - How the story unfolds</li><li><strong>Shooting Order</strong> - How you''ll actually film</li></ul><p class="text-sm opacity-70">Switch between them with the buttons above.</p></div>', 
 '#timelineTitle', 'bottom', true),

('timeline', 3, '🎬 Your Scenes', 
 '<div class="text-left"><p class="mb-2">Each scene is a card you can click to edit. You''ll track:</p><ul class="list-disc ml-4 mb-2"><li>Scene number & description</li><li>Location (INT/EXT)</li><li>Time of day</li><li>Which actors appear</li></ul><p class="text-sm opacity-70">Drag scenes to reorder them. Easy.</p></div>', 
 '#sceneContainer', 'top', true),

('timeline', 4, '➕ Add Scenes', 
 '<div class="text-left"><p class="mb-2">Click here to add a new scene. That''s pretty much it.</p><p class="text-sm opacity-70">See? Told you I was lazy. You got this.</p></div>', 
 '#addSceneBtn', 'top', true),

('timeline', 5, '🧭 Navigation', 
 '<div class="text-left"><p class="mb-2">Use the navigation to jump between:</p><ul class="list-disc ml-4 mb-2"><li><strong>Timeline</strong> - Manage your scenes</li><li><strong>Calendar</strong> - Schedule shooting days</li><li><strong>Actors</strong> - Track your cast</li></ul><p class="text-sm opacity-70">Everything stays in sync automatically.</p></div>', 
 '#topNavigation', 'bottom', true)

ON CONFLICT (page, step_order) DO NOTHING;
