# Supabase Database Setup

## Running the Migration

1. Go to the Supabase Dashboard: https://supabase.com/dashboard/project/twgjcqivoyyjoricuueo
2. Navigate to SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run in the SQL Editor

Or use the Supabase CLI:

```bash
supabase db push
```

## Tables Created

- `users` - User profiles and authentication
- `projects` - User projects with auto-detected and custom fields
- `project_updates` - Project changelog/updates
- `analysis_jobs` - Background job tracking
- `profile_views` - Analytics for profile views

All tables have Row Level Security (RLS) enabled with appropriate policies.
