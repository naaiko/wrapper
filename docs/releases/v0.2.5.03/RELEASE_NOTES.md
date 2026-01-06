# Version 0.2.5.03 - Sync Assignment Types Across UI
**Release Date:** January 8, 2026  
**Type:** Hotfix  
**Branch:** main

## Overview
This hotfix fixes the inconsistency between the "Add Actor" form and the cast grid filter. Both now use the same configurable assignment types from project settings, ensuring perfect synchronization.

## 🐛 Bug Fixes
- **Fixed Assignment Type Mismatch**: "Add Actor" form previously used hardcoded `role_type` values (speaking_actor, background, stunt, etc.) while the filter checked `assignment_type` in character_assignments
- **Synchronized Dropdowns**: Add Actor form now shows identical assignment types as filter dropdown
- **Dynamic Updates**: Assignment type dropdown in Add Actor modal automatically updates when types are added/removed in settings

## ✨ Features
- Add Actor modal now uses configurable assignment types from project settings
- Selected assignment type is used when creating character assignments
- Real-time synchronization between settings and Add Actor form

## 🔧 Technical Changes
- Replaced `castMemberRoleTypeSelect` with `castMemberAssignmentTypeSelect`
- Removed hardcoded role type options (speaking_actor, background, stunt, understudy, alternate, photo_double, voice)
- Added `updateAssignmentTypeDropdown()` method to dynamically populate Add Actor dropdown
- Character assignments now use selected assignment type instead of hardcoded 'actor'
- `role_type` field set to null (deprecated, kept for backwards compatibility)
- Settings modal now updates both filter dropdown AND Add Actor dropdown when types change

## 📋 Files Changed
- `frontend/cast.html` - Changed Role Type dropdown to Assignment Type with dynamic population
- `frontend/js/cast-grid.js` - Added updateAssignmentTypeDropdown(), syncs with settings changes

## 🔄 Migration Notes
- Existing `role_type` values on cast_members are no longer used
- Assignment types are now stored on `character_assignments.assignment_type`
- Filter now correctly matches assignment types from character assignments

## 🎯 Usage Flow
1. Open Cast Settings (gear icon)
2. Configure assignment types (e.g., "Lead", "Supporting", "Extra")
3. Close settings
4. Click "Add Actor"
5. See the same assignment types in the dropdown
6. Select assignment type when assigning character
7. Filter works correctly with the assignment type

## 📊 Before vs After

**Before:**
- Add Actor: role_type = "speaking_actor", "background", "stunt" (hardcoded)
- Filter: assignment_type = "actor", "stunt", "voice-over", "stand-in" (configurable)
- ❌ No match = Filter doesn't work

**After:**
- Add Actor: assignment_type = configurable from settings
- Filter: assignment_type = configurable from settings
- ✅ Perfect sync = Filter works correctly

---

**Previous Version:** [v0.2.5.02](../v0.2.5.02/RELEASE_NOTES.md)  
**Next Version:** v0.2.6 (planned)
