# v0.2.5.01 Changelog

## [0.2.5.01] - 2026-01-06

### Fixed
- Cast grid filter now correctly checks `assignment_type` on character assignments
- Filter functionality restored for actor/stunt/voice-over/stand-in role types
- Script Day (SD) badge color changed to secondary for better visual distinction
- Cast member badges now consistently use primary color on timeline cards

### Technical
- Added `.env` file support for Supabase credentials
- Updated `upload-assets.ps1` to auto-load from `.env`
- Filter logic simplified to use `character_assignments.some()` pattern
