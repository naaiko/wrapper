# Release v0.2.0 Documentation

**Release Date**: 2026-01-06  
**Type**: Minor  
**Branch**: feature-cast-grid

## Overview

Cast Grid Feature - Complete redesign of Cast screen with modern polaroid-style grid interface.

## Features

- ✅ Polaroid-style grid view
- ✅ Filter by role (Hoofdrol/Bijrol/Figurant)
- ✅ Sort by name, scene count, recently added
- ✅ Real-time search
- ✅ Quick add with photo upload
- ✅ Cast Member detail screen with prev/next navigation
- ✅ Keyboard shortcuts (← → ESC)
- ✅ Touch swipe navigation
- ✅ Toast notifications
- ✅ Loading states and skeletons
- ✅ Empty states

## Documentation

- **[CAST_GRID_COMPLETE.md](CAST_GRID_COMPLETE.md)** - Complete feature documentation with testing checklist
- **[CAST_GRID_IMPLEMENTATION_PLAN.md](CAST_GRID_IMPLEMENTATION_PLAN.md)** - 8-phase implementation plan
- **[MIGRATIONS.md](MIGRATIONS.md)** - Complete database migrations documentation
- **[RUN_MIGRATIONS.md](RUN_MIGRATIONS.md)** - Step-by-step migration instructions

## Database Migration

**⚠️ REQUIRED**: This release requires database migrations to add `first_name`, `last_name`, and `role` columns.

**Migration Files**:
1. [20251226000001_add_actor_first_last_name.sql](../../../supabase/migrations/20251226000001_add_actor_first_last_name.sql) - Adds first_name and last_name columns
2. [20251226000002_add_actor_role.sql](../../../supabase/migrations/20251226000002_add_actor_role.sql) - Adds role column for classification

**How to run**:
1. Go to your Supabase project: `https://supabase.com/dashboard/project/YOUR_PROJECT/editor`
2. Copy the contents of `20251226000001_add_actor_first_last_name.sql`
3. Paste into SQL Editor and click "Run"
4. Copy the contents of `20251226000002_add_actor_role.sql`
5. Paste into SQL Editor and click "Run"
6. Verify results show all columns created

**Run migrations in order**: 20251226000001 → 20251226000002

Without these migrations, the Cast Grid will show empty data and fail to create new Cast.

## Technical Details

- Native CSS Grid (no external libraries)
- Vanilla JavaScript ES6 modules
- Responsive breakpoints: 4→3→2→1 columns
- Touch-friendly: min 44x44px tap targets
- Mobile-first approach

---

[← Back to Index](../../INDEX.md) | [View CHANGELOG](../../../CHANGELOG.md)
