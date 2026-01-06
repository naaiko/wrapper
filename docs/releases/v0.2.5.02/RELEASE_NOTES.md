# Version 0.2.5.02 - Configurable Assignment Types
**Release Date:** January 8, 2026  
**Type:** Hotfix  
**Branch:** main

## Overview
This hotfix introduces configurable assignment types for cast members, fixing the mismatch between hardcoded filter values and database values, and providing a flexible settings system similar to the calendar view.

## ✨ Features
- **Settings Modal for Cast Grid**: Added gear icon to cast grid dock opening a settings modal (matching calendar UI pattern)
- **Configurable Assignment Types**: Users can now add/remove assignment types per project
- **Dynamic Filter Dropdown**: Filter options automatically update based on configured assignment types
- **Default Types**: Pre-configured with Actor, Stunt, Voice-over, Stand-in

## 🐛 Bug Fixes
- Fixed cast grid filter showing Dutch role types (hoofdrol/bijrol/figurant) instead of actual database values
- Filter dropdown now correctly displays assignment types that match the database schema
- JavaScript filter logic now properly checks `character_assignments.assignment_type`

## 🔧 Technical Changes
- Added `assignment_types` JSONB column to `project_settings` table
- Extended `settingsService` with:
  - `getAssignmentTypes()` - Get assignment types for current project
  - `updateAssignmentTypes(projectId, types)` - Save assignment types configuration
  - `getDefaultAssignmentTypes()` - Default assignment types fallback
- Cast grid now loads assignment types from settings on initialization
- Dynamic filter dropdown generation based on project configuration
- New migration: `20250108000001_add_assignment_types.sql`

## 📝 Database Schema Changes
```sql
ALTER TABLE project_settings 
ADD COLUMN IF NOT EXISTS assignment_types JSONB DEFAULT '[
    {"id": "actor", "label": "Actor"},
    {"id": "stunt", "label": "Stunt"},
    {"id": "voice-over", "label": "Voice-over"},
    {"id": "stand-in", "label": "Stand-in"}
]'::jsonb;
```

## 📋 Files Changed
- `frontend/cast.html` - Added settings button and modal, updated filter dropdown with correct values
- `frontend/js/cast-grid.js` - Added settings modal logic, dynamic filter generation
- `frontend/js/services/settingsService.js` - Added assignment types methods
- `frontend/docs/migration-add-assignment-types.sql` - Documentation migration
- `supabase/migrations/20250108000001_add_assignment_types.sql` - Database migration
- `frontend/js/version.js` - Updated to v0.2.5.02
- `VERSION` - Updated to 0.2.5.02
- `releases.json` - Added release entry

## 🚀 Installation
1. Run the SQL migration in Supabase SQL Editor (see migration file)
2. Refresh the application
3. Open cast grid and click the gear icon to configure assignment types

## 🎯 Usage
1. Navigate to cast grid view
2. Click the gear icon (⚙️) in the bottom dock
3. In the "Assignment Types" tab:
   - View current assignment types
   - Add new types using the input field
   - Remove types by clicking the X button
4. Filter dropdown automatically updates with your configured types

## 🔗 Related Issues
- Cast grid filter not working (showed wrong types)
- Hardcoded Dutch labels in filter dropdown
- Assignment types should be configurable per project

---

**Previous Version:** [v0.2.5.01](v0.2.5.01/RELEASE_NOTES.md)  
**Next Version:** v0.2.6 (planned)
