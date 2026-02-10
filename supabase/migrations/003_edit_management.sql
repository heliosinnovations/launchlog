-- Migration: Add fields for project edit and management system

-- Add new project status values
-- We need to alter the existing enum to add new values
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'beta';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'sunset';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'in_progress';

-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS screenshots TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS primary_screenshot_index INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'shipped';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metrics_public BOOLEAN DEFAULT false;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status);
