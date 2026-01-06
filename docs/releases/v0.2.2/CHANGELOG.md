# Changelog - v0.2.2

## [Unreleased]

### Added
- Square actor cards with aspect-ratio 1:1 for better screen density
- Dashed "add actor" placeholder card with primary color (green)
- Universal navigation pattern documentation
- Design system documentation (DESIGN_SYSTEM.md)
- Versioning system documentation (VERSIONING.md)
- Automated release preparation script
- Template files for new releases

### Changed
- Actor cards from 3:4 to 1:1 aspect ratio (square)
- Add placeholder card height to match regular cards (min-height: 350px)
- Add placeholder from accent color (yellow) to primary color (green)
- Migration file naming to follow YYYYMMDDNNNNNN convention
- Migration files moved to supabase/migrations/ folder
- All documentation references to use new migration paths

### Fixed
- Actor card aspect ratio for better visual consistency
- Add placeholder card height mismatch

### Technical
- Created `DESIGN_SYSTEM.md` - Universal patterns and components
- Created `VERSIONING.md` - Versioning workflow and automation
- Created `VERSION` and `NEXT_VERSION` files
- Created `scripts/prepare-release.ps1` - Release automation
- Created `docs/releases/.template/` - Release template files
- Renamed migrations:
  - `migration-add-first-last-name.sql` → `20251226000001_add_actor_first_last_name.sql`
  - `migration-add-actor-role.sql` → `20251226000002_add_actor_role.sql`
- Updated actorCard.js to use aspect-square
- Updated actors-grid.css with add-actor-placeholder styling
- Updated actors-grid.js with createAddActorPlaceholder() method

### Documentation
- Added comprehensive design system documentation
- Added versioning system documentation
- Created release template files
- Updated CHANGELOG.md references
- Updated v0.2.0 README.md references

---

**Note**: Auto-generated from commits and manual additions.
