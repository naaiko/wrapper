# Database Migrations - vX.Y.Z

## Overview

This release includes N database migrations.

## Migration Files

Located in `supabase/migrations/`:

### 1. `YYYYMMDDNNNNNN_migration_name.sql`

**Purpose**: Brief description of what this migration does

**Changes**:
- ADD COLUMN column_name type
- CREATE INDEX index_name
- ALTER TABLE modifications

**Impact**: 
- ✅ Backwards compatible / ⚠️ Breaking change
- ✅ Existing data preserved / ⚠️ Data migration required
- ✅ Safe to rollback / ⚠️ Rollback requires manual steps

**Verification**:
```sql
-- Query to verify migration succeeded
SELECT * FROM table_name LIMIT 10;
```

## Execution Order

**IMPORTANT**: Run migrations in this order:

1. First: `YYYYMMDDNNNNNN_migration_1.sql`
2. Second: `YYYYMMDDNNNNNN_migration_2.sql`

The numeric prefix ensures correct ordering.

## How to Run

See [RUN_MIGRATIONS.md](RUN_MIGRATIONS.md) for detailed instructions.

### Quick Steps

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration 1
3. Run ▶️
4. Repeat for each migration in order
5. Verify with verification queries

## Rollback

If needed, rollback in reverse order:

```sql
-- Rollback migration 2
ALTER TABLE table_name DROP COLUMN column_name;

-- Rollback migration 1
DROP INDEX IF EXISTS index_name;
```

## Dependencies

**Required for features**:
- Feature 1 needs migration 1
- Feature 2 needs migration 2

**Breaking changes**: None / List any breaking changes

**API changes**: 
- Service changes
- Component changes

## Schema After Migrations

```sql
CREATE TABLE table_name (
    -- Existing columns
    id UUID PRIMARY KEY,
    
    -- New columns (vX.Y.Z)
    new_column TEXT,  -- NEW
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New indexes
CREATE INDEX idx_name ON table_name(column_name); -- NEW
```

## Testing

After running migrations, test:

1. ✅ Test case 1
2. ✅ Test case 2
3. ✅ Existing functionality still works
4. ✅ No errors in browser console

## Migration History

| Date | Migration | Version | Status |
|------|-----------|---------|--------|
| YYYY-MM-DD | YYYYMMDDNNNNNN | vX.Y.Z | ✅ Required / ⚠️ Optional |

---

**Status**: ✅ Required / ⚠️ Optional for vX.Y.Z  
**Total Migrations**: N  
**Backwards Compatible**: Yes / No  
**Data Loss Risk**: None / Low / High
