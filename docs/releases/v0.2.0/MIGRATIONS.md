# Database Migrations - v0.2.0

## Overview

This release includes 2 database migrations to support the Cast Grid feature.

## Migration Files

Located in `docs/releases/v0.2.0/migrations/`:

### 1. `20251226000001_add_actor_first_last_name.sql`

**Purpose**: Add first_name and last_name columns to Cast table

**Changes**:
- Adds `first_name TEXT` column
- Adds `last_name TEXT` column  
- Migrates existing `actor_name` data by splitting on space
- First word → `first_name`
- Rest → `last_name`

**Impact**: 
- ✅ Backwards compatible (NULL allowed)
- ✅ Existing data preserved in `actor_name`
- ✅ Safe to rollback

**Verification**:
```sql
SELECT 
    id,
    actor_name,
    first_name,
    last_name,
    created_at
FROM Cast
ORDER BY created_at DESC
LIMIT 10;
```

### 2. `20251226000002_add_actor_role.sql`

**Purpose**: Add role classification column to Cast table

**Changes**:
- Adds `role TEXT` column
- Adds CHECK constraint: `role IN ('hoofdrol', 'bijrol', 'figurant', 'extra')`
- Creates index `idx_actors_role` for filtering performance

**Impact**:
- ✅ Backwards compatible (NULL allowed)
- ✅ No data migration needed
- ✅ Safe to rollback

**Verification**:
```sql
SELECT 
    'Migration complete' as status,
    COUNT(*) as total_actors,
    COUNT(role) as actors_with_role
FROM Cast;
```

## Execution Order

**IMPORTANT**: Run migrations in this order:

1. First: `20251226000001_add_actor_first_last_name.sql`
2. Second: `20251226000002_add_actor_role.sql`

The numeric prefix ensures correct ordering.

## How to Run

See [RUN_MIGRATIONS.md](RUN_MIGRATIONS.md) for detailed instructions.

### Quick Steps

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration 1
3. Run ▶️
4. Copy contents of migration 2  
5. Run ▶️
6. Verify with verification queries

## Rollback

If needed, rollback in reverse order:

```sql
-- Rollback migration 2
DROP INDEX IF EXISTS idx_actors_role;
ALTER TABLE Cast DROP COLUMN IF EXISTS role;

-- Rollback migration 1
ALTER TABLE Cast DROP COLUMN IF EXISTS last_name;
ALTER TABLE Cast DROP COLUMN IF EXISTS first_name;
```

## Dependencies

**Required for features**:
- Cast Grid filter by role
- Cast Member name display (first + last)
- Cast Member search by name parts

**Breaking changes**: None

**API changes**: 
- `ActorService.create()` now accepts `first_name`, `last_name`, `role`
- `ActorCard` expects `name` (computed from first + last)

## Schema After Migrations

```sql
CREATE TABLE Cast (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Name fields (v0.2.0)
    actor_name TEXT,           -- Original full name (kept for backwards compatibility)
    character_name TEXT,
    first_name TEXT,           -- NEW in v0.2.0
    last_name TEXT,            -- NEW in v0.2.0
    
    -- Classification (v0.2.0)
    role TEXT CHECK (role IS NULL OR role IN ('hoofdrol', 'bijrol', 'figurant', 'extra')), -- NEW
    
    -- Contact & Physical
    email TEXT,
    phone TEXT,
    height TEXT,
    hair_color TEXT,
    hair_style TEXT,
    eye_color TEXT,
    skin_tone TEXT,
    body_type TEXT,
    distinguishing_features TEXT,
    
    -- Media
    profile_image_url TEXT,
    reference_images JSONB,
    
    -- Other
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_actors_project_id ON Cast(project_id);
CREATE INDEX idx_actors_role ON Cast(role); -- NEW in v0.2.0
```

## Testing

After running migrations, test:

1. ✅ Create new Cast Member with first_name, last_name, role
2. ✅ Filter Cast by role in Cast Grid
3. ✅ Search Cast by name
4. ✅ Existing Cast still display correctly
5. ✅ No errors in browser console

## Migration History

| Date | Migration | Version | Status |
|------|-----------|---------|--------|
| 2025-12-26 | 20251226000001 | v0.2.0 | ✅ Required |
| 2025-12-26 | 20251226000002 | v0.2.0 | ✅ Required |

---

**Status**: ✅ Required for v0.2.0  
**Total Migrations**: 2  
**Backwards Compatible**: Yes  
**Data Loss Risk**: None
