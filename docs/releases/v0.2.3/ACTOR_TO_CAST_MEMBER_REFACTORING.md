# Actor → Cast Member Refactoring Summary

**Date**: 2026-01-06
**Version**: 0.2.3

## Rationale

The term **"Actor"** was too narrow and didn't properly represent all types of on-screen talent:
- Speaking actors
- Background performers  
- Stunt performers
- Photo doubles
- Stand-ins
- Voice actors
- Understudies

**"Cast Member"** is the industry-standard inclusive term that encompasses all these roles.

---

## Changes Made

### 1. Database Migrations

#### Created: `20260106000003_rename_actors_to_cast_members.sql`
Comprehensive database refactoring:
- ✅ `actors` table → `cast_members` table
- ✅ `character_actor_assignments` → `character_cast_assignments`
- ✅ `actor_id` column → `cast_member_id` in all tables
- ✅ `scene_actors` → `scene_cast_members`  
- ✅ `actor_continuity` → `cast_member_continuity`
- ✅ All foreign keys updated
- ✅ All indexes renamed
- ✅ All RLS policies updated with new names

**IMPORTANT**: Must run `20260106000002_update_actors_schema.sql` FIRST, then this migration.

---

### 2. Service Layer

**Renamed Files:**
- ❌ `actorService.js` → ✅ `castMemberService.js`
- ❌ `sceneActorService.js` → ✅ `sceneCastMemberService.js`

**Class Names:**
- `ActorService` → `CastMemberService`
- `SceneActorService` → `SceneCastMemberService`

**Method Changes:**
- All methods updated to use `castMember` instead of `actor` parameters
- `getDisplayName(castMember)` - Display cast member full name
- Database queries updated to use `cast_members` table
- Comments and error messages updated

---

### 3. Components

**Renamed Files:**
- ❌ `actorFormModal.js` → ✅ `castMemberFormModal.js`
- ❌ `actorCard.js` → ✅ `castMemberCard.js`
- ❌ `actorCardRenderer.js` → ✅ `castMemberCardRenderer.js`
- ❌ `actorsConfigModal.js` → ✅ `castMembersConfigModal.js`

**Class Names:**
- `ActorFormModal` → `CastMemberFormModal`

**All component logic updated:**
- Variable names (`actor` → `castMember`, `actorId` → `castMemberId`)
- HTML IDs and classes updated
- User-facing text updated
- Database queries updated

---

### 4. Screens

**Renamed Files:**
- ❌ `actorEditScreen.js` → ✅ `castMemberEditScreen.js`

**Updated:**
- ❌ `actors-grid.js` → ✅ `cast-grid.js`
- ❌ `actors-detail.js` → ✅ `cast-detail.js`
- ❌ `actors-old.js` → ✅ `cast-old.js`

All screen logic updated with new terminology and service references.

---

### 5. HTML Files

**Renamed:**
- ❌ `actors.html` → ✅ `cast.html`
- ❌ `actors-detail.html` → ✅ `cast-detail.html`
- ❌ `actors-old.html` → ✅ `cast-old.html`

**Updated:**
- All `<script>` imports updated to new file names
- All `<link>` stylesheet references updated
- All HTML IDs updated (`actor*` → `castMember*`)
- All navigation links updated (`actors.html` → `cast.html`)
- User-facing text updated ("Actor" → "Cast Member")

---

### 6. CSS Files

**Renamed:**
- ❌ `actors.css` → ✅ `cast.css`
- ❌ `actors-detail.css` → ✅ `cast-detail.css`
- ❌ `actors-grid.css` → ✅ `cast-grid.css`

**Updated:**
- Class names updated (`.actor-*` → `.cast-member-*`)
- Comments updated

---

### 7. Navigation

**Updated:** `frontend/js/components/navigation.js`
- Tab label: "Actors" → "Cast"
- Tab ID: `navActors` → `navCast`
- Link: `actors.html` → `cast.html`
- Active page parameter: `'actors'` → `'cast'`
- Documentation comments updated

---

### 8. Documentation

**Updated 26 Documentation Files:**
- `/docs/INDEX.md`
- `/docs/guides/*.md` (8 files)
- `/docs/releases/v0.1.0/*.md` (3 files)
- `/docs/releases/v0.2.0/*.md` (4 files)
- `/docs/releases/v0.2.3/*.md` (8 files)
- `/README.md`
- `/CHANGELOG.md`

**Changes:**
- "Actor" → "Cast Member" in all user-facing text
- `actor_id` → `cast_member_id` in technical references
- Table names updated in schema documentation
- Code examples updated
- Architecture diagrams references updated

---

### 9. Migration Files

**Updated 4 Migration Files:**
- `20251221000001_add_actors.sql` (comments only)
- `20251222000002_add_scene_actors.sql` (comments only)
- `20251223000002_add_project_deletion.sql` (comments only)
- `20260106000001_add_characters_architecture.sql` (comments only)

**Note:** The actual table/column names in these old migrations remain as `actors` to preserve migration history. Only comments were updated for clarity.

---

## Testing Checklist

Before deploying, verify:

### Database
- [ ] Run migration `20260106000002_update_actors_schema.sql`
- [ ] Run migration `20260106000003_rename_actors_to_cast_members.sql`
- [ ] Verify table `cast_members` exists
- [ ] Verify table `character_cast_assignments` exists
- [ ] Verify old tables (`actors`, `character_actor_assignments`) are gone
- [ ] Test RLS policies work correctly

### Frontend
- [ ] `cast.html` loads correctly
- [ ] Cast member grid displays
- [ ] Search and filtering work
- [ ] Creating new cast member works
- [ ] Editing cast member works
- [ ] Deleting cast member works
- [ ] Navigation between Timeline/Cast/Calendar works
- [ ] Character assignment dropdown works
- [ ] Scene-cast member relationships work

### Services
- [ ] `CastMemberService.getAll()` works
- [ ] `CastMemberService.create()` works
- [ ] `CastMemberService.update()` works
- [ ] `CastMemberService.delete()` works
- [ ] `SceneCastMemberService` works correctly

---

## Files Changed

**Total Files Modified:** 69+ files

**Categories:**
- JavaScript: 19 files
- HTML: 3 files (renamed + updated)
- CSS: 3 files (renamed)
- SQL Migrations: 5 files (1 new + 4 updated comments)
- Documentation: 26 files
- Root files: 2 files (README.md, CHANGELOG.md)

---

## Breaking Changes

⚠️ **This is a BREAKING CHANGE for existing databases**

### Migration Required
All existing databases MUST run both migrations:
1. `20260106000002_update_actors_schema.sql` (first)
2. `20260106000003_rename_actors_to_cast_members.sql` (second)

### Frontend URLs Changed
- Old: `/actors.html` → New: `/cast.html`
- Old: `/actors-detail.html` → New: `/cast-detail.html`

Any bookmarks or direct links need updating.

---

## Rollback Plan

If issues occur:

### Database Rollback
Create reverse migration:
```sql
ALTER TABLE cast_members RENAME TO actors;
ALTER TABLE character_cast_assignments RENAME TO character_actor_assignments;
ALTER TABLE character_cast_assignments RENAME COLUMN cast_member_id TO actor_id;
-- (reverse all other changes)
```
