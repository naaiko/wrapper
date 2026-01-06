# Run v0.2.3 Migrations

## Database Changes

This release includes database schema changes.

## Migration Files

Located in `supabase/migrations/`:

1. **`YYYYMMDDNNNNNN_migration_1.sql`** - Description
2. **`YYYYMMDDNNNNNN_migration_2.sql`** - Description

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the contents of migration file 1
5. Paste into SQL Editor and click "Run" ▶️
6. Repeat for migration file 2
7. Verify results show all changes applied

### Option 2: Supabase CLI (Local Development)

```powershell
# Apply all pending migrations
npx supabase db push

# Or apply specific migration
npx supabase db push --include-all
```

### Option 3: Manual SQL

Copy migration files from `supabase/migrations/` and run them in order.

## Verification

After running migrations, verify in Supabase Dashboard:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table';

-- Check data integrity
SELECT * FROM your_table LIMIT 10;
```

## Rollback (If Needed)

If migrations fail or cause issues:

```sql
-- Rollback migration 2
ALTER TABLE your_table DROP COLUMN column_name;

-- Rollback migration 1
ALTER TABLE your_table DROP COLUMN column_name;
```

## Migration Order

**IMPORTANT**: Run migrations in the order listed above.

---

**Status**: 📋 Instructions  
**Last Updated**: YYYY-MM-DD
