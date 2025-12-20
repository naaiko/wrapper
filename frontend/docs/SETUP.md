# Supabase Setup Guide

This guide will help you set up the database for your Continuity Manager application.

## Step 1: Create Database Tables

1. Go to your Supabase dashboard: https://app.supabase.com/project/jdjwkidtslnqvfednuga
2. Click on the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `frontend/docs/supabase-schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

You should see a success message. This will create:
- `projects` table for storing your film/TV projects
- `scenes` table for storing scenes with story order and shooting schedule
- Row Level Security (RLS) policies (currently set to public access for MVP)
- Automatic timestamp updates

## Step 2: Verify Tables Were Created

1. In the Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see two tables:
   - `projects`
   - `scenes`

## Step 3: Test Your Application

1. Open your deployed application: https://wrapper-98r.pages.dev
2. Click "Get Started"
3. Create a new project
4. You should be redirected to the timeline view with demo scenes

## Troubleshooting

### "Failed to load projects" error
- Check that your Supabase URL and API key in `js/supabase-config.js` are correct
- Verify that the SQL schema was run successfully
- Check the browser console (F12) for detailed error messages

### Projects not showing up
- Make sure you ran the SQL schema
- Check that RLS policies are enabled (the schema includes public access policies)
- Verify the Supabase project is active and not paused

### Scenes not displaying
- Check that demo scenes were created (they should be created automatically for new projects)
- Verify the `scenes` table exists in your Supabase database
- Check browser console for errors

## Security Note

⚠️ **Important**: Currently, the database is configured with public access (no authentication) for MVP testing. For production use, you should:

1. Implement user authentication (Supabase Auth)
2. Update RLS policies to restrict access based on user ID
3. Add user_id column to projects table
4. Update policies to check `auth.uid() = user_id`

See the comments in `supabase-schema.sql` for production RLS policy examples.

## Next Steps

Once the database is set up and working:

1. Test creating, opening, and deleting projects
2. Test the timeline view with both story order and shooting schedule
3. Provide feedback on any issues or needed features
4. Consider implementing authentication for production use
