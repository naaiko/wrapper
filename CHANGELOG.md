# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
 

### Technical


---

## [0.2.3] - 2026-01-06

### Added
- **Character-Cast Member Architecture** - Separate Characters (story roles) from Cast Members (real people)
  - Character management modal with assignment workflow
  - Many-to-many assignments (understudy, stunt, voice, alternate, etc.)
  - Timeline character badges and character-aware scene loading
- **Script Import & Parsing** - Import Fountain and plain text screenplays with automatic scene extraction
  - Scene heading parsing: INT/EXT, location, time of day, continuity
  - Character detection from dialogue and automatic character creation

### Changed
- Terminology: Actor → Cast Member across UI and database schema

### Fixed
- Dropdown menus inside modals: option lists no longer clipped by modal boundaries

### Technical
- Migrations:
  - `20260106000001_add_characters_architecture.sql`
  - `20260106000002_update_actors_schema.sql`
  - `20260106000003_rename_actors_to_cast_members.sql`

---

## [0.2.2] - 2026-01-06

### Added
- square cards, compact dock, placeholder card
- Replace calendar with metro line timeline visualization
- Switch calendar to week view and improve styling

### Fixed
- Import navigation as ES6 module
- Add missing Supabase config script to actors.html
- Add required database migration for Cast Grid v0.2.0
- Calendar container height and tui availability check

---

## 0.2.1 - Release Browser

### 🚧 v0.2.2 - In Progress (feature/v0.2.2-design-system)

#### Added
- Square actor cards with aspect-ratio 1:1 for better screen density
- Dashed "add actor" placeholder card with primary color
- Universal navigation pattern (top-right nav + bottom dock)
- Design system documentation (DESIGN_SYSTEM.md)
- Versioning system with automated changelog generation
- Release preparation automation script
- Template files for new releases

#### Changed
- Actor cards from 3:4 to 1:1 aspect ratio (square)
- Migration file naming to YYYYMMDDNNNNNN convention
- All migration references to use supabase/migrations/ paths

#### Technical
- Created VERSION and NEXT_VERSION tracking files
- Created scripts/prepare-release.ps1 for automation
- Created docs/releases/.template/ for consistency
- Renamed migrations with proper naming convention
- Established universal button styling patterns

### Planning (Future)
- Advanced search in release notes
- Release comparison view

---

## [0.2.1] - 2026-01-06

### Added
- **Release Browser**: Browse all previous releases with search functionality
- **Release Viewer UI**: Interactive modal to view any release notes
- **Documentation Organization**: Structured docs folder with release-specific documentation
- **Release Search**: Search through all releases by features, fixes, or keywords
- **Documentation Index**: Easy access to all release documentation

### Changed
- Reorganized documentation into `/docs` folder structure
- Release-specific docs now in `/docs/releases/vX.Y.Z/`
- General guides moved to `/docs/guides/`
- Improved release notes modal with navigation controls

### Technical
- Created release browser component
- Added search indexing for releases
- Structured documentation by semantic version
- Enhanced ReleaseNotes utility with search methods

### Documentation
- Created `/docs/releases/` structure for version-specific docs
- Moved CAST_GRID_*.md to v0.2.0 folder
- Moved implementation docs to v0.1.0 folder
- Created `/docs/guides/` for general documentation

---

## [Unreleased archive moved above]
- Silhouette zone data integration
- Bulk actor operations (select multiple, delete/edit)
- Drag & drop grid reordering
- Advanced filters (scene count range, date range)
- Actor tags system
- Export cast list (PDF/CSV)

---

## [0.2.0] - 2026-01-06

### Added - Cast Grid Feature
- **Polaroid-style grid view** for cast members with responsive layout (4→3→2→1 columns)
- **ActorCard component** with photo, name, role badge, and scene count
- **Filter system**: Filter actors by role (All/Hoofdrol/Bijrol/Figurant)
- **Sort options**: Sort by name (A-Z), scene count, or recently added
- **Real-time search**: Filter actors by name with instant results
- **Quick Add modal**: Create actors with name, role, and photo (URL or file upload)
- **Photo upload**: Support for both URL input and local file picker with live preview
- **Cast member detail screen** with prev/next navigation through filtered list
- **Keyboard shortcuts**: ← → for navigation, ESC to return to grid
- **Touch swipe navigation**: Swipe left/right to navigate actors on mobile/iPad
- **Toast notification system**: Success/error feedback for user actions
- **Loading skeletons**: Smooth loading states during data fetching
- **Empty states**: User-friendly messages for no actors or no search results
- **FAB button**: Fixed action button for quick actor creation
- **URL state preservation**: Filter/sort/search state maintained in URL for back navigation

### Changed
- Transformed cast screen from list view to modern grid layout
- Enhanced mobile responsiveness with touch-friendly tap targets (min 44x44px)
- Improved hover animations with lift effect and shadow
- Updated to responsive breakpoints for optimal viewing on all devices

### Technical
- Created `actors-grid.js` module with CastGridApp class
- Created `ActorCard` component for reusable actor cards
- Created `actors-grid.css` for grid-specific styling
- Created `Toast` utility for notifications
- Enhanced `ActorService` with scene count queries
- Implemented URL state management for filters
- Added keyboard and touch event handlers
- **Database migrations required**: 
  - `supabase/migrations/20251226000001_add_actor_first_last_name.sql` - Adds first_name and last_name columns
  - `supabase/migrations/20251226000002_add_actor_role.sql` - Adds role column for classification
- Created `ActorCard` component for reusable polaroid cards
- Implemented `CastGridApp` controller for grid management
- Built `ActorDetailApp` controller with navigation logic
- Added `Toast` utility for user notifications
- Backed up original files: `actors-old.html`, `actors-old.js`
- Comprehensive mobile-first CSS with smooth scroll and transitions

### Fixed
- Viewport meta tag typo in actors.html
- Input zoom prevention on iOS (font-size 16px)
- Photo preview not clearing on modal close

### Documentation
- Created CAST_GRID_COMPLETE.md with full feature documentation
- Updated VERSION_GUIDE.md with release process
- Comprehensive testing checklist for all devices

---

## [0.1.0] - 2026-01-05

### Added - Version System
- **Semantic versioning system** (MAJOR.MINOR.PATCH)
- version.js module with centralized version control
- Version badge display on all pages
- VERSION_GUIDE.md documentation

### Initial Release
- Base continuity management system
- Project management
- Scene management with drag-and-drop timeline
- Actor management (original list view)
- Location management
- Settings and conditions
- Calendar integration with Toast UI
- SVG-based silhouette system with multi-layer support
- User authentication with Supabase
- Role-based permissions (admin/user)

### Technical
- Vanilla JavaScript ES6 modules
- DaisyUI + Tailwind CSS
- Supabase backend (PostgreSQL + Auth)
- SortableJS for drag-and-drop
- Toast UI Calendar

---

## Version History Legend

### Types of Changes
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes
- **Technical** - Internal improvements, refactoring, dependencies
- **Documentation** - Documentation updates

### Semantic Versioning
- **MAJOR** (X.0.0) - Incompatible API changes, major features
- **MINOR** (0.X.0) - New functionality, backwards compatible
- **PATCH** (0.0.X) - Bug fixes, small improvements

[Unreleased]: https://github.com/naaiko/wrapper/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/naaiko/wrapper/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/naaiko/wrapper/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/naaiko/wrapper/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/naaiko/wrapper/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/naaiko/wrapper/releases/tag/v0.1.0
