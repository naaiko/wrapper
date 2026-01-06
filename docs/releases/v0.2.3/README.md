# Release v0.2.3 Documentation

**Release Date**: January 6, 2026  
**Type**: Major Feature - Breaking Change  
**Branch**: main

---

## 🚨 Breaking Changes

### Character-Cast Member Architecture Separation

This release includes a **breaking database migration** that restructures the Character-Cast Member relationship model. **Backup your database before upgrading!**

**What's Breaking:**
- `Cast.character_name` column **REMOVED**
- `scene_cast_members` table **DROPPED** (replaced by `scene_characters`)
- Frontend code references to `ActorsConfigModal` replaced by `CharactersConfigModal`

**Data Safety:**
- ✅ All existing data is migrated automatically
- ✅ No data loss if migration runs successfully
- ❌ No automatic rollback - manual restore required if issues occur

**Migrations Required (run in order):**
1. `20260106000001_add_characters_architecture.sql`
2. `20260106000002_update_actors_schema.sql`
3. `20260106000003_rename_actors_to_cast_members.sql`

---

## Overview

Version 0.2.3 introduces **two major features**:

1. **Character-Cast Member Architecture Separation** (Breaking Change)
   - Complete separation of Characters (story roles) from Cast (real people)
   - Many-to-many relationship supporting understudies, stunt doubles, alternates
   - Auto-character extraction during script import
   - New Characters Settings modal with Cast Member assignment workflow

2. **Script Import & Parsing** (Non-Breaking)
   - Automatic scene extraction from Fountain and plain text screenplays
   - Library-based Fountain parsing with heuristic plain text fallback
   - Timeline integration with Import button

---

## 🎯 Character-Cast Member Architecture

### Problem Statement

**Before v0.2.3:**
```sql
Cast {
  actor_name TEXT        -- Real person (e.g., "Tom Hanks")
  character_name TEXT    -- Story role (e.g., "JOHN DOE")
}
```

**Issues:**
- ❌ One Cast Member could only play one character
- ❌ No support for understudies or stunt doubles
- ❌ Script imports forced Cast Member creation with incomplete data
- ❌ Character names mixed with Cast Member data

**After v0.2.3:**
```
Character (story role) ←→ Cast Member (real person)
           ↓
    Many-to-Many via character_cast_assignments

Assignment Types: Cast Member, understudy, stunt_double, voice, alternate, etc.
```

### Features

#### 1. Character Management System
- ✅ Separate Characters Settings modal (replaces Cast Config)
- ✅ Search/filter characters by name
- ✅ Sort by name or usage (scene count)
- ✅ Batch delete unused characters ("Clean Unused" button)
- ✅ Usage badges showing scene count per character
- ✅ Warning badges for characters without assigned Cast

#### 2. Multi-Cast Support
- ✅ Assign multiple Cast to one character (Cast Member, understudy, stunt, voice, etc.)
- ✅ Track assignment types in UI
- ✅ Display all assignments per character

**Example:**
```
JOHN DOE [5 scenes]
  Cast Member: Tom Hanks
  understudy: Mike Smith
  stunt_double: James Doe
```

#### 3. Auto-Character Extraction
- ✅ Character names auto-detected during script import
- ✅ Characters auto-created with deduplication
- ✅ Characters linked to scenes automatically
- ✅ Cast Member assignment now **optional** (happens after import)

**Deduplication Logic:**
```
"JOHN DOE" → JOHNDOE
"John Doe" → JOHNDOE  (same character)
"JOHN (V.O.)" → JOHNDOE  (same character)
"  john  " → JOHNDOE  (same character)
```

#### 4. Timeline Character Display
- ✅ Character badges on scene cards (👥 JOHN DOE, MARY, +2)
- ✅ Blue badge = Cast Member assigned
- ✅ Gray badge = no Cast Member assigned
- ✅ Shows up to 3 characters + overflow count

### Database Schema

**New Tables:**

1. **`characters`** - Story roles
   ```sql
   - id UUID PRIMARY KEY
   - project_id UUID
   - name TEXT (display name)
   - normalized_name TEXT (deduplication key)
   - role_type TEXT ('lead', 'supporting', 'background')
   - UNIQUE (project_id, normalized_name)
   ```

2. **`character_cast_assignments`** - Many-to-many with types
   ```sql
   - id UUID PRIMARY KEY
   - character_id UUID
   - cast_member_id UUID
   - assignment_type TEXT ('Cast Member', 'understudy', 'stunt_double', etc.)
   - UNIQUE (character_id, cast_member_id, assignment_type)
   ```

3. **`scene_characters`** - Which characters appear in which scenes
   ```sql
   - id UUID PRIMARY KEY
   - scene_id UUID
   - character_id UUID
   - costume_notes TEXT
   - makeup_notes TEXT
   - UNIQUE (scene_id, character_id)
   ```

**Dropped:**
- ❌ `Cast.character_name` column
- ❌ `scene_cast_members` table

### New Code Files

- **`characterService.js`** (440 lines) - Character CRUD service
  - `normalizeCharacterName()` - Deduplication logic
  - `getOrCreate()` - Idempotent character creation
  - `assignActor()` - Link Cast Member with assignment type
  - `addToScene()` - Link character to scene
  - `getUsageCounts()` - Track scene count

- **`charactersConfigModal.js`** (480 lines) - Character CRUD UI
  - Search, sort, clean unused
  - Cast Member assignment dropdowns
  - Usage badges, warning badges
  - Follows `LocationsConfigModal` pattern

### Modified Files

- **`scriptImportService.js`** - Now creates characters instead of Cast
- **`timeline.js`** - Replaced ActorsConfigModal → CharactersConfigModal
- **`sceneCardRenderer.js`** - Renders character badges with Cast Member status

### Migration Guide

**Step 1: Backup Database**
```bash
# Critical: No automatic rollback!
pg_dump your_database > backup_pre_v0.2.3.sql
```

**Step 2: Run Migration**
```bash
supabase db push
# Or via Supabase Dashboard: SQL Editor → Paste migration → Run
```

**Step 3: Verify Data**
```sql
-- Check character creation
SELECT COUNT(*) FROM characters;

-- Check assignments
SELECT c.name, a.actor_name, caa.assignment_type
FROM character_cast_assignments caa
JOIN characters c ON c.id = caa.character_id
JOIN Cast a ON a.id = caa.cast_member_id;

-- Check scene linkage
SELECT s.scene_number, c.name
FROM scene_characters sc
JOIN scenes s ON s.id = sc.scene_id
JOIN characters c ON c.id = sc.character_id;
```

**Step 4: Clear Browser Cache**
```
Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

**Step 5: Test Workflows**
- Open Timeline → Characters button
- Import a script with characters
- Assign Cast to characters
- Verify scene cards show character badges

### Documentation

- **[CHARACTER_ACTOR_ARCHITECTURE.md](CHARACTER_ACTOR_ARCHITECTURE.md)** - Complete architecture guide
  - Problem statement & solution
  - Database schema details
  - Code implementation
  - Migration strategy
  - Testing scenarios
  - API reference
  - Future enhancements

---

## 📜 Script Import & Parsing

### Features

- ✅ Fountain (.fountain) script parsing with fountain.js library
- ✅ Plain text screenplay parsing with pattern matching
- ✅ Auto-detection of script format
- ✅ Scene heading parsing (INT/EXT, location, time, continuity)
- ✅ Character detection from dialogue (now creates character records!)
- ✅ Preview grid with confidence scoring
- ✅ Bulk import with single transaction
- ✅ Timeline integration via Import button

### Database Migrations

**✅ None Required** - Feature uses existing scenes table schema. Fully backwards compatible.

### New Files
- `frontend/js/models/ImportedScene.js` - Data model for imported scenes
- `frontend/js/utils/sceneNormalizer.js` - Scene heading parsing & normalization
- `frontend/js/parsers/fountainAdapter.js` - Fountain.js wrapper & adapter
- `frontend/js/parsers/plainTextParser.js` - Plain text heuristic parser
- `frontend/js/services/scriptImportService.js` - Orchestration & validation
- `frontend/js/screens/ScriptImportScreen.js` - UI component (EditScreen-based)
- `test-script.fountain` - Example test script

### Modified Files
- `frontend/js/services/sceneService.js` - Added `createBulk()` method
- `frontend/timeline.html` - Added import button + Fountain.js CDN script
- `frontend/js/timeline.js` - Added ScriptImportScreen integration + exposed switchMode to window

### Dependencies
- **Fountain.js** v0.1.10 (CDN) - Industry-standard Fountain parser
- No npm packages required

### Documentation

- **[SCRIPT_IMPORT_DESIGN.md](SCRIPT_IMPORT_DESIGN.md)** - Complete architecture & library choices
- **[SCRIPT_IMPORT_IMPLEMENTATION.md](SCRIPT_IMPORT_IMPLEMENTATION.md)** - Technical implementation details
- **[User Guide](../../guides/SCRIPT_IMPORT_USER_GUIDE.md)** - User manual (in guides/)

---

## 📋 Complete File Inventory

### Database
- **Migration**: `supabase/migrations/20260106000001_add_characters_architecture.sql` (350 lines)

### Services
- **New**: `frontend/js/services/characterService.js` (440 lines)
- **Modified**: `frontend/js/services/scriptImportService.js` (+40 lines - now creates characters)

### Components
- **New**: `frontend/js/components/charactersConfigModal.js` (480 lines)
- **Modified**: `frontend/js/components/sceneCardRenderer.js` (+25 lines - character badges)

### Screens
- **Modified**: `frontend/js/timeline.js` (+45 lines - CharactersConfigModal integration)

### Documentation
- **New**: `docs/releases/v0.2.3/CHARACTER_ACTOR_ARCHITECTURE.md` (1000+ lines)
- **Updated**: `docs/releases/v0.2.3/CHANGELOG.md`
- **Updated**: `docs/releases/v0.2.3/README.md` (this file)

**Total LOC This Release:**
- Character Architecture: ~1,380 lines (code + SQL + docs)
- Script Import: ~950 lines (code + docs)
- **Combined**: ~2,330 lines

---

## 🧪 Testing Checklist

### Character-Cast Member Architecture

- [ ] **Migration:**
  - [ ] Database backup created
  - [ ] Migration runs without errors
  - [ ] All characters created from old Cast table
  - [ ] All assignments created correctly
  - [ ] All scene linkages preserved

- [ ] **Character Management:**
  - [ ] Characters Settings modal opens
  - [ ] Search/filter works
  - [ ] Sort by name/usage works
  - [ ] Clean Unused deletes characters with 0 scenes
  - [ ] Usage badges show correct counts

- [ ] **Cast Member Assignment:**
  - [ ] Can assign Cast Member to character
  - [ ] Can assign multiple Cast (understudy, stunt, etc.)
  - [ ] Assignments display correctly
  - [ ] Can remove assignment

- [ ] **Script Import:**
  - [ ] Import script with characters
  - [ ] Characters auto-created
  - [ ] Characters linked to scenes
  - [ ] No Cast assigned yet (optional)

- [ ] **Timeline Display:**
  - [ ] Scene cards show character badges
  - [ ] Blue badge = Cast Member assigned
  - [ ] Gray badge = no Cast Member
  - [ ] "+X more" shows overflow count

### Script Import & Parsing

- [ ] Fountain script imports correctly
- [ ] Plain text script imports correctly
- [ ] Scene headings parsed (INT/EXT, location, time)
- [ ] Characters detected from dialogue
- [ ] Preview grid shows confidence scores
- [ ] Bulk import creates all scenes

---

## Known Issues

### Character Architecture
- **Issue**: Some character name variations might not deduplicate perfectly (e.g., "MARY ANNE" vs "MARYANNE")
  - **Workaround**: Manually merge duplicates via Characters Settings (delete one, reassign)
  - **Fix planned**: Enhanced normalization in v0.2.4

- **Issue**: Cast Member dropdown might be slow for projects with 100+ Cast
  - **Workaround**: Use search bar to filter Cast
  - **Fix planned**: Virtualized dropdown list in v0.2.4

### Script Import
- None currently reported

---

## Future Enhancements

### Character-Cast Member Architecture (v0.2.4+)
- [ ] Enhanced character name normalization
- [ ] Virtualized Cast Member dropdown (performance)
- [ ] Bulk Cast Member assignment (assign same Cast Member to multiple characters)
- [ ] Character merge tool (fix import duplicates)

### Long-Term (v0.3.0+)
- [ ] Casting approval workflow
- [ ] Cast Member availability calendar
- [ ] Conflict detection (Cast Member in 2 scenes on same day)
- [ ] Call sheets with Character-Cast Member mapping
- [ ] Budget tracking per Cast Member

### Script Import (v0.2.4+)
- [ ] FDX (Final Draft XML) parser support
- [ ] Character-to-cast member auto-matching
- [ ] Scene editing in preview
- [ ] Script revision tracking

---

## 📞 Support

**Issues?**
1. Check `CHARACTER_ACTOR_ARCHITECTURE.md` for detailed explanations
2. Review migration verification queries
3. Check browser console for errors
4. Report bugs with:
   - Database state (before/after migration)
   - Browser console errors
   - Steps to reproduce

---

**Status**: ✅ Implementation Complete - Ready for Testing  
**Breaking Change**: Yes - Database migration required  
**Data Loss Risk**: None (if backup created before migration)
