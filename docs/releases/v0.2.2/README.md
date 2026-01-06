# Release v0.2.2 Documentation

**Release Date**: TBD  
**Type**: Patch  
**Branch**: feature/v0.2.2-design-system

## Overview

Cast Grid refinements and universal design system implementation.

## Features

- [x] Square Cast Member cards (aspect-ratio 1:1) for better density
- [x] Dashed "add Cast Member" placeholder card with primary color
- [x] Universal navigation pattern (top-right nav + bottom dock)
- [x] Uniform button styling system
- [x] Design system documentation
- [x] Versioning system implementation
- [ ] Additional Cast Grid enhancements

## Database Migrations

**✅ NO NEW MIGRATIONS**: This release uses existing v0.2.0 migrations.

**Required v0.2.0 Migrations**:
1. [20251226000001_add_actor_first_last_name.sql](../../../supabase/migrations/20251226000001_add_actor_first_last_name.sql) - Adds first_name and last_name columns
2. [20251226000002_add_actor_role.sql](../../../supabase/migrations/20251226000002_add_actor_role.sql) - Adds role column for classification

**Note**: If you already ran v0.2.0 migrations, no database changes needed for v0.2.2.

## Documentation

- **[DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md)** - Complete design system documentation with universal patterns
- **[VERSIONING.md](../../../VERSIONING.md)** - Automated versioning and changelog system

## Technical Details

### New Files
- `DESIGN_SYSTEM.md` - Universal navigation and component patterns
- `VERSIONING.md` - Versioning workflow documentation
- `VERSION` - Current production version (0.2.1)
- `NEXT_VERSION` - Upcoming version being developed (0.2.2)
- `scripts/prepare-release.ps1` - Automated release preparation script
- `docs/releases/.template/` - Template files for new releases
- `docs/releases/v0.2.2/` - This release folder

### Modified Files
- `frontend/css/Cast-grid.css` - Square cards, add placeholder styling with primary color
- `frontend/js/components/actorCard.js` - Changed to aspect-square (1:1)
- `frontend/js/Cast-grid.js` - Added createAddActorPlaceholder() method
- `frontend/Cast.html` - Navbar removed, dock implemented, uniform button styling
- `CHANGELOG.md` - Migration file references updated
- `docs/releases/v0.2.0/README.md` - Migration file references updated

### Design System Patterns

**Universal Navigation**:
- Top-right: `fixed top-4 right-4 z-50` (circular buttons)
- Bottom dock: `fixed bottom-4 left-1/2 -translate-x-1/2 z-40`
- NO full-width navbars

**Button Styling**:
- Primary: `btn-primary btn-circle` (icon only)
- Secondary: `bg-base-300/50 hover:bg-base-300 border-none`
- Ghost: `btn-circle btn-ghost` (navigation)

**Add Placeholder Cards**:
- Dashed border: `3px dashed oklch(var(--p) / 0.3)`
- Primary color (`--p`) for consistency
- Hover: darker border, glow, scale effects

### Dependencies
- DaisyUI 4.12.14 (OKLCH color system)
- Tailwind CSS (utility classes)

## Breaking Changes

None

## Known Issues

None

## Future Work

- Implement reusable Dock component class
- Add keyboard shortcuts documentation
- Create component library catalog
- Add animation system documentation

---

**Status**: ✅ Complete  
**Branch**: feature/v0.2.2-design-system  
**Next Version**: 0.2.3
