# Release v0.2.0 Documentation

**Release Date**: 2026-01-06  
**Type**: Minor  
**Branch**: feature-cast-grid

## Overview

Cast Grid Feature - Complete redesign of actors screen with modern polaroid-style grid interface.

## Features

- ✅ Polaroid-style grid view
- ✅ Filter by role (Hoofdrol/Bijrol/Figurant)
- ✅ Sort by name, scene count, recently added
- ✅ Real-time search
- ✅ Quick add with photo upload
- ✅ Actor detail screen with prev/next navigation
- ✅ Keyboard shortcuts (← → ESC)
- ✅ Touch swipe navigation
- ✅ Toast notifications
- ✅ Loading states and skeletons
- ✅ Empty states

## Documentation

- **[CAST_GRID_COMPLETE.md](CAST_GRID_COMPLETE.md)** - Complete feature documentation with testing checklist
- **[CAST_GRID_IMPLEMENTATION_PLAN.md](CAST_GRID_IMPLEMENTATION_PLAN.md)** - 8-phase implementation plan

## Database Migration

**⚠️ REQUIRED**: This release requires a database migration to add `first_name` and `last_name` columns.

**Migration File**: [migration-add-first-last-name.sql](migration-add-first-last-name.sql)

**How to run**:
1. Go to your Supabase project: `https://supabase.com/dashboard/project/YOUR_PROJECT/editor`
2. Copy the contents of `migration-add-first-last-name.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify results show `first_name` and `last_name` columns populated

Without this migration, the Cast Grid will fail to create new actors.

## Technical Details

- Native CSS Grid (no external libraries)
- Vanilla JavaScript ES6 modules
- Responsive breakpoints: 4→3→2→1 columns
- Touch-friendly: min 44x44px tap targets
- Mobile-first approach

---

[← Back to Index](../../INDEX.md) | [View CHANGELOG](../../../CHANGELOG.md)
