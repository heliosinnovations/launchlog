-- Migration Tracking Table
-- Tracks all applied migrations with checksums for drift detection

CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT,
  execution_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rolled_back'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_history_applied_at ON migration_history(applied_at DESC);

-- Schema version tracking for quick drift detection
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton row
  version TEXT NOT NULL,
  last_migration TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_tables TEXT[] NOT NULL DEFAULT ARRAY['users', 'projects', 'project_updates', 'analysis_jobs', 'profile_views'],
  expected_columns JSONB NOT NULL DEFAULT '{
    "users": ["id", "auth_id", "github_id", "username", "email", "name", "avatar_url", "bio", "github_username", "twitter_username", "website_url", "tier", "created_at", "updated_at"],
    "projects": ["id", "user_id", "github_repo_url", "repo_name", "repo_owner", "tech_stack", "description", "deployment_url", "status", "created_at", "updated_at"]
  }'::jsonb
);

-- Insert initial schema version
INSERT INTO schema_version (id, version, last_migration)
VALUES (1, '1.0.0', '000_migration_tracking')
ON CONFLICT (id) DO NOTHING;

-- Function to record migration
CREATE OR REPLACE FUNCTION record_migration(
  p_migration_name TEXT,
  p_checksum TEXT,
  p_applied_by TEXT DEFAULT 'system',
  p_execution_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO migration_history (migration_name, checksum, applied_by, execution_time_ms)
  VALUES (p_migration_name, p_checksum, p_applied_by, p_execution_time_ms);
  
  UPDATE schema_version
  SET last_migration = p_migration_name,
      last_updated = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if migration was applied
CREATE OR REPLACE FUNCTION is_migration_applied(p_migration_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM migration_history 
    WHERE migration_name = p_migration_name 
    AND status = 'success'
  );
END;
$$ LANGUAGE plpgsql;

-- Record this migration
SELECT record_migration('000_migration_tracking', md5('000_migration_tracking'), 'initial_setup');
