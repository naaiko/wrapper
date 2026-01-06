# Run v0.2.3 Migrations

## Database Changes

This release includes **breaking database schema changes**.

⚠️ **Before you start**: take a database backup/snapshot.

## Migration Files

Located in `supabase/migrations/`:

1. **`20260106000001_add_characters_architecture.sql`** - New Character ↔ Cast Member architecture (breaking)
2. **`20260106000002_update_actors_schema.sql`** - Split names + normalize role_type (must run before rename)
3. **`20260106000003_rename_actors_to_cast_members.sql`** - Rename actors → cast_members (breaking)

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard → **SQL Editor**
2. Create a **new query**
3. Copy/paste the contents of migration **#1** and click **Run**
4. Repeat for migration **#2**
5. Repeat for migration **#3**

Run them in order. Don’t batch them into one file.

### Option 2: Supabase CLI (Local Development)

```powershell
# Apply all pending migrations
npx supabase db push
```

## Verification

Run these checks in Supabase SQL Editor:

```sql
-- New tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
	AND table_name IN ('characters', 'character_cast_assignments', 'scene_characters', 'cast_members');

-- Counts should be non-zero for existing projects
SELECT
	(SELECT COUNT(*) FROM characters) AS characters_count,
	(SELECT COUNT(*) FROM character_cast_assignments) AS assignments_count,
	(SELECT COUNT(*) FROM scene_characters) AS scene_characters_count,
	(SELECT COUNT(*) FROM cast_members) AS cast_members_count;

-- Spot-check a few
SELECT * FROM cast_members ORDER BY created_at DESC LIMIT 5;
SELECT * FROM characters ORDER BY created_at DESC LIMIT 5;
```

## Rollback (If Needed)

⚠️ Recommended: restore your pre-migration backup.

Manual rollback is possible but error-prone because migration #1 drops/replaces legacy structures.

---

**Last Updated**: 2026-01-06
