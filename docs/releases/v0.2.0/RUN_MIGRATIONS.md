# Run v0.2.0 Migrations

## Error
```
Could not find the 'role' column of 'Cast' in the schema cache
```

## Solution
The database is missing required columns. Run these migrations in your Supabase Dashboard:

### Migration Files
- `supabase/migrations/20260106000001_add_actor_first_last_name.sql`
- `supabase/migrations/20260106000002_add_actor_role.sql`

### Step 1: Open SQL Editor
1. Go to https://supabase.com/dashboard/project/jdjwkidtslnqvfednuga
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run Migration 1 - Add first_name and last_name

Copy and paste this SQL from `20260106000001_add_actor_first_last_name.sql`:

```sql
-- Add first_name and last_name columns
ALTER TABLE Cast
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data: split actor_name into first_name and last_name
UPDATE Cast
SET 
    first_name = SPLIT_PART(actor_name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN actor_name) > 0 THEN SUBSTRING(actor_name FROM POSITION(' ' IN actor_name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL;

-- Verify migration
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

Click "Run" ▶️

### Step 3: Run Migration 2 - Add role column

Create a new query and paste from `20260106000002_add_actor_role.sql`:

```sql
-- Add role column to Cast table
ALTER TABLE Cast 
ADD COLUMN IF NOT EXISTS role TEXT 
CHECK (role IS NULL OR role IN ('hoofdrol', 'bijrol', 'figurant', 'extra'));

-- Add index for filtering by role
CREATE INDEX IF NOT EXISTS idx_actors_role ON Cast(role);

-- Verification query
SELECT 
    'Migration complete' as status,
    COUNT(*) as total_actors,
    COUNT(role) as actors_with_role
FROM Cast;
```

Click "Run" ▶️

### Step 4: Verify
Refresh your application and try adding an Cast Member again. The error should be gone.

---

**Note**: These migrations use `IF NOT EXISTS` so they're safe to run multiple times.
