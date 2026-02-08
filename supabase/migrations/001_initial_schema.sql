-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'lifetime');
CREATE TYPE project_status AS ENUM ('analyzing', 'ready', 'error');
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_username TEXT,
  twitter_username TEXT,
  website_url TEXT,
  tier user_tier DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- GitHub info
  github_repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,

  -- Auto-detected fields
  tech_stack JSONB,
  description TEXT,
  readme_content TEXT,
  deployment_url TEXT,
  screenshot_url TEXT,
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  last_commit_date TIMESTAMP WITH TIME ZONE,
  created_date TIMESTAMP WITH TIME ZONE,
  primary_language TEXT,

  -- User-added fields
  custom_name TEXT,
  custom_description TEXT,
  launch_date DATE,
  launch_story TEXT,
  revenue DECIMAL(10, 2),
  users_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Status
  status project_status DEFAULT 'analyzing',
  analysis_completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project updates table
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis jobs table
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status job_status DEFAULT 'queued',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile views table
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_hash TEXT,
  referrer TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX idx_analysis_jobs_project_status ON analysis_jobs(project_id, status);
CREATE INDEX idx_profile_views_user_viewed ON profile_views(user_id, viewed_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = github_id);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own record" ON users
  FOR DELETE USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Public projects are viewable by everyone" ON projects
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_updates
CREATE POLICY "Public updates are viewable" ON project_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND (projects.is_public = true OR projects.user_id = auth.uid())
    )
  );

CREATE POLICY "Project owners can insert updates" ON project_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update updates" ON project_updates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete updates" ON project_updates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for analysis_jobs
CREATE POLICY "Users can view own jobs" ON analysis_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = analysis_jobs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for profile_views
CREATE POLICY "Profile owners can view analytics" ON profile_views
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert profile views" ON profile_views
  FOR INSERT WITH CHECK (true);
