# Database Migrations - v0.2.4

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
