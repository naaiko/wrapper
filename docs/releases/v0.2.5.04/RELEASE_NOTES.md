# Version 0.2.5.04 - Filter Dropdown Selector Fix
**Release Date:** January 8, 2026  
**Type:** Hotfix  
**Branch:** main

## Overview
This hotfix resolves the issue where the filter dropdown wasn't updating when assignment types were added or removed in the settings modal.

## 🐛 Bug Fixes
- **Filter Dropdown Not Updating**: Fixed issue where adding/removing assignment types in settings didn't update the filter dropdown
- **Wrong Dropdown Targeted**: Corrected selector to target filter dropdown specifically instead of accidentally selecting the sort dropdown
- **Settings Synchronization**: Added proper settings reload after changes to ensure all components stay in sync

## 🔧 Technical Changes

### Selector Specificity
**Problem**: `querySelector('.dropdown-content.menu')` was finding the first matching element, which could be either the filter OR sort dropdown.

**Solution**: Changed to `querySelector('.filter-option')?.closest('ul.dropdown-content.menu')` which:
1. First finds a filter-option element (unique to filter dropdown)
2. Then navigates up to the parent ul element
3. Guarantees we're targeting the correct dropdown

### Settings Reload
**Problem**: After updating assignment types in the database, the local `this.assignmentTypes` array wasn't properly synced.

**Solution**: Added `await settingsService.loadSettings()` after `updateAssignmentTypes()` to reload fresh data from the database.

### Debug Logging
Added console logging to help diagnose issues:
```javascript
console.log(`[CAST GRID] Updated filter dropdown with ${this.assignmentTypes.length} types:`, this.assignmentTypes);
```

## 📋 Files Changed
- `frontend/js/cast-grid.js` - Improved selector and added settings reload

## 🎯 Testing
1. Open Cast Grid
2. Click Settings (⚙️)
3. Add new assignment type (e.g., "Lead" or "Extra")
4. Check browser console for: `Updated filter dropdown with X types`
5. Click filter dropdown - new type should appear
6. Remove an assignment type
7. Filter dropdown should update immediately

## 🔗 Related Commits
- 6f4bd7f - Reload settings after updating assignment types
- a78d683 - Use specific selector for filter dropdown

---

**Previous Version:** [v0.2.5.03](../v0.2.5.03/RELEASE_NOTES.md)  
**Next Version:** v0.2.6 (planned)
