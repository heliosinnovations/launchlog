-- Remove RLS policies (authorization handled in API routes)

-- Drop all RLS policies for users
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can delete own record" ON users;

-- Drop all RLS policies for projects
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Drop all RLS policies for project_updates
DROP POLICY IF EXISTS "Public updates are viewable" ON project_updates;
DROP POLICY IF EXISTS "Project owners can insert updates" ON project_updates;
DROP POLICY IF EXISTS "Project owners can update updates" ON project_updates;
DROP POLICY IF EXISTS "Project owners can delete updates" ON project_updates;

-- Drop all RLS policies for analysis_jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON analysis_jobs;

-- Drop all RLS policies for profile_views
DROP POLICY IF EXISTS "Profile owners can view analytics" ON profile_views;
DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views DISABLE ROW LEVEL SECURITY;
