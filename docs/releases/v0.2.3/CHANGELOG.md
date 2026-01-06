# Changelog - v0.2.3

**Release Date**: 2026-01-06  
**Type**: Major Feature - Breaking Change

---

## 🎯 Character-Cast Member Architecture Separation

### Added

#### Database Schema
- ✅ New table `characters` - Story roles with normalized_name deduplication
- ✅ New table `character_cast_assignments` - Many-to-many with assignment types (Cast Member, understudy, stunt, voice, alternate)
- ✅ New table `scene_characters` - Which characters appear in which scenes (replaces `scene_cast_members`)
- ✅ Unique constraints on `(project_id, normalized_name)` for character deduplication
- ✅ RLS policies for all new tables
- ✅ Database triggers for updated_at timestamps

#### Services
- ✅ `characterService.js` (440 lines) - Complete CRUD for characters
  - `normalizeCharacterName()` - Deduplication logic (UPPERCASE, no punctuation)
  - `getOrCreate()` - Idempotent character creation for imports
  - `assignActor()` - Link Cast Member with assignment type
  - `removeActorAssignment()` - Unlink Cast Member from character
  - `addToScene()` - Link character to scene via scene_characters
  - `removeFromScene()` - Unlink character from scene
  - `getSceneCharacters()` - Load all characters for scene
  - `getUsageCounts()` - Track scene count per character
  - `cleanUnused()` - Batch delete characters with zero scenes

#### UI Components
- ✅ `charactersConfigModal.js` (480 lines) - Character CRUD modal
  - Search/filter characters by name
  - Sort by name or usage (scene count)
  - Inline Cast Member assignment dropdowns
  - Multiple assignment types per character (Cast Member, understudy, etc.)
  - Usage badges showing scene count
  - Warning badges for characters without Cast
  - "Clean Unused" batch delete button
  - Custom DaisyUI confirm/alert dialogs
  - Follows `LocationsConfigModal` design pattern

#### Script Import Integration
- ✅ Auto-extract character names from dialogue
- ✅ Auto-create character records during import (via `getOrCreate()`)
- ✅ Auto-link characters to scenes via `scene_characters`
- ✅ Character deduplication during import (e.g., "JOHN DOE" = "John Doe" = "JOHN (V.O.)")

#### Timeline Integration
- ✅ Character badges on scene cards (👥 JOHN DOE, MARY, +2 more)
- ✅ Blue badge = Cast Member assigned, gray badge = no Cast Member
- ✅ Show up to 3 characters + overflow count
- ✅ Load characters with nested `actor_assignments` (Supabase join)
- ✅ Characters button in timeline dock (opens CharactersConfigModal)

### Changed

#### Breaking Changes
- 🚨 **Migration Required**: `20260106000001_add_characters_architecture.sql`
- 🚨 Removed `Cast.character_name` column (data migrated to `characters` table)
- 🚨 Dropped `scene_cast_members` table (replaced by `scene_characters`)
- 🚨 ActorsConfigModal replaced by CharactersConfigModal

#### Data Migration
- ✅ All existing character names migrated from `Cast.character_name` → `characters.name`
- ✅ All existing Cast Member assignments converted to `character_cast_assignments` (type: 'Cast Member')
- ✅ All scene linkages migrated from `scene_cast_members` → `scene_characters`
- ✅ All continuity notes (costume, makeup) preserved in `scene_characters`

#### Script Import Service
- ✅ `scriptImportService.js` now creates characters instead of Cast
- ✅ Cast Member assignment is now optional (happens after import in Characters Settings)
- ✅ Characters linked to scenes via `CharacterService.addToScene()`

#### Timeline
- ✅ `timeline.js` replaced ActorsConfigModal import → CharactersConfigModal
- ✅ `getProjectScenes()` loads characters with nested Cast Member assignments
- ✅ Scene cards render character badges instead of Cast Member badges

#### Scene Card Renderer
- ✅ `sceneCardRenderer.js` added `characters` parameter
- ✅ Renders character badges with Cast Member status indicator

### Fixed
- ✅ Fixed 1:1 Character-Cast Member limitation (now supports multiple Cast per character)
- ✅ Fixed forced Cast Member creation during script import (now optional)
- ✅ Fixed duplicate character imports (normalized_name deduplication)
- ✅ Fixed no support for understudies/stunt doubles (assignment_type enum)

### Technical

#### Migrations
- **Migration**: `20260106000001_add_characters_architecture.sql` (350 lines)
  - Creates `characters`, `character_cast_assignments`, `scene_characters` tables
  - Migrates data from `Cast.character_name` and `scene_cast_members`
  - Drops old schema elements
  - Adds RLS policies and triggers

#### Architecture Decisions
1. Characters are project-scoped (UNIQUE on project_id + normalized_name)
2. Characters can exist without scenes (orphaned allowed)
3. Cast Member assignment is optional (NULL-able in assignments)
4. Deduplication via `normalizeCharacterName()`:
   - UPPERCASE conversion
   - Remove punctuation and parentheticals
   - Trim whitespace
5. Many-to-many relationships:
   - Character ←→ Cast Member (via character_cast_assignments)
   - Character ←→ Scene (via scene_characters)

#### Performance
- Indexed foreign keys on all junction tables
- RLS policies scoped to project_id for fast filtering
- Nested Supabase joins for loading characters with assignments
- ~15 KB additional storage for typical project (50 characters, 100 scenes)

### Documentation
- ✅ Added `CHARACTER_ACTOR_ARCHITECTURE.md` - Complete architecture guide
  - Problem statement & solution
  - Database schema details
  - Code implementation details
  - Migration strategy
  - Testing scenarios
  - API reference
  - Future enhancements roadmap
- ✅ Updated `README.md` - Release overview with breaking changes warning
- ✅ Updated `CHANGELOG.md` - This file

---

## 📋 Migration Checklist

**Pre-Migration:**
- [ ] Backup database
- [ ] Review current Cast table data
- [ ] Test migration on dev/staging database

**Migration:**
- [ ] Run `supabase db push` or apply SQL via Dashboard
- [ ] Verify character creation count
- [ ] Verify assignment creation
- [ ] Verify scene linkage preservation

**Post-Migration:**
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Test Characters Settings modal
- [ ] Test script import with new architecture
- [ ] Test timeline character display

---

## 🎬 Script Import Feature (Previous v0.2.3 Work)

### Added
- ✅ Fountain (.fountain) script parsing with fountain.js library
- ✅ Plain text screenplay parsing with pattern matching
- ✅ Auto-detection of script format
- ✅ Scene heading parsing (INT/EXT, location, time, continuity)
- ✅ Character detection from dialogue
- ✅ Preview grid with confidence scoring
- ✅ Bulk import with single transaction
- ✅ Timeline integration via Import button

### Technical
- New files: `ImportedScene.js`, `sceneNormalizer.js`, `fountainAdapter.js`, `plainTextParser.js`, `scriptImportService.js`, `ScriptImportScreen.js`
- Modified: `sceneService.js` (added `createBulk()`), `timeline.html` (import button + Fountain.js CDN)

---

**Total LOC This Release:**
- Character Architecture: ~1,380 lines (code + SQL + docs)
- Script Import: ~950 lines (code + docs)
- **Combined**: ~2,330 lines

**Status**: ✅ Implementation Complete - Ready for Testing
