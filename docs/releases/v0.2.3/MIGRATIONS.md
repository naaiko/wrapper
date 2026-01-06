# Database Migrations - v0.2.3

## Overview

This release includes **3 required migrations**.

They are located in `supabase/migrations/` and must be run **in order**.

## Migration Files

### 1) `20260106000001_add_characters_architecture.sql` (Breaking)

**Purpose**: Introduces the new Character ↔ Cast Member architecture.

**Changes (high level)**:
- Creates `characters`, `character_cast_assignments`, `scene_characters`
- Migrates existing data from legacy structures
- Removes legacy fields/tables that can’t represent many-to-many relationships

**Impact**:
- ⚠️ **Breaking change** (schema and query shape changes)
- ✅ Existing data migrated automatically (assuming successful run)
- ⚠️ Rollback requires manual restore (database backup recommended)

**Verification**:
```sql
-- Tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('characters', 'character_cast_assignments', 'scene_characters');

-- Sanity counts
SELECT
    (SELECT COUNT(*) FROM characters) AS characters_count,
    (SELECT COUNT(*) FROM character_cast_assignments) AS assignments_count,
    (SELECT COUNT(*) FROM scene_characters) AS scene_characters_count;
```

### 2) `20260106000002_update_actors_schema.sql` (Pre-rename schema prep)

**Purpose**: Normalize person names and role types before the rename.

**Changes (high level)**:
- Adds `first_name`, `last_name`
- Removes `actor_name` (migrates content into first/last)
- Adds generated `name` (full name)
- Renames `role` → `role_type` and normalizes values

**Impact**:
- ✅ Backwards compatible in data intent (but changes column names)
- ✅ Existing data is migrated
- ⚠️ Rollback requires re-adding `actor_name` / old role values if needed

**Verification**:
```sql
-- Ensure columns exist (before rename to cast_members)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'actors'
    AND column_name IN ('first_name', 'last_name', 'name', 'role_type');

-- Ensure actor_name is removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'actors'
    AND column_name = 'actor_name';
```

### 3) `20260106000003_rename_actors_to_cast_members.sql` (Breaking rename)

**Purpose**: Rename “actor” terminology in the database to “cast member”.

**Changes (high level)**:
- `actors` → `cast_members`
- `character_actor_assignments` → `character_cast_assignments`
- `actor_id` → `cast_member_id`
- Updates FK constraints/indexes accordingly

**Impact**:
- ⚠️ **Breaking change** for any code/queries referencing old table names
- ✅ Data preserved (rename operations)
- ⚠️ Rollback requires manual reverse-rename

**Verification**:
```sql
-- Ensure new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('cast_members', 'character_cast_assignments');

-- Ensure old tables are gone
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('actors', 'character_actor_assignments');
```

## Execution Order

Run migrations in this exact order:

1. `20260106000001_add_characters_architecture.sql`
2. `20260106000002_update_actors_schema.sql`
3. `20260106000003_rename_actors_to_cast_members.sql`

## Rollback

⚠️ **Recommended rollback strategy**: restore a database backup taken before migration 1.

If you must rollback manually, do it in reverse order and expect additional cleanup:

1. Reverse-rename `cast_members` back to `actors`, `character_cast_assignments` back to `character_actor_assignments`, and rename columns back.
2. Reintroduce removed legacy fields/tables if needed.
3. Drop `characters`/`character_cast_assignments`/`scene_characters` after preserving data.

## Status

- **Total Migrations**: 3
- **Backwards Compatible**: No (breaking schema changes)
- **Data Loss Risk**: Medium without a backup (schema drops/removals)
