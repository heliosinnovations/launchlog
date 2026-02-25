-- Migration: Add screenshot support to user_repos table
-- This migration adds columns for storing project screenshot metadata

-- Add screenshot columns to user_repos table
ALTER TABLE user_repos
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_source TEXT,
ADD COLUMN IF NOT EXISTS screenshot_captured_at TIMESTAMPTZ;

-- Drop any existing screenshot_source constraint (from previous migrations)
-- This ensures we can apply the correct constraint values
ALTER TABLE user_repos DROP CONSTRAINT IF EXISTS user_repos_screenshot_source_check;
ALTER TABLE user_repos DROP CONSTRAINT IF EXISTS chk_screenshot_source;

-- Add check constraint for screenshot_source values
-- Valid values: 'auto' (captured automatically), 'manual' (user uploaded), 'github_preview' (from GitHub)
ALTER TABLE user_repos
ADD CONSTRAINT chk_screenshot_source
CHECK (screenshot_source IS NULL OR screenshot_source IN ('auto', 'manual', 'github_preview'));

-- Create index for querying repos with screenshots
CREATE INDEX IF NOT EXISTS idx_user_repos_screenshot_url ON user_repos(screenshot_url) WHERE screenshot_url IS NOT NULL;

-- Create index for filtering by screenshot source
CREATE INDEX IF NOT EXISTS idx_user_repos_screenshot_source ON user_repos(screenshot_source) WHERE screenshot_source IS NOT NULL;

-- Comments explaining the columns
COMMENT ON COLUMN user_repos.screenshot_url IS 'URL to the project screenshot stored in Supabase Storage (project-screenshots bucket)';
COMMENT ON COLUMN user_repos.screenshot_source IS 'Source of the screenshot: auto (captured automatically), manual (user uploaded), github_preview (from GitHub social preview)';
COMMENT ON COLUMN user_repos.screenshot_captured_at IS 'Timestamp when the screenshot was captured or uploaded';

-- ============================================
-- Storage Bucket Setup
-- ============================================
-- Note: The storage bucket 'project-screenshots' needs to be created via Supabase Dashboard or API.
-- This migration creates the bucket and sets up RLS policies.

-- Create the storage bucket (idempotent - won't error if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-screenshots',
  'project-screenshots',
  true,  -- Public read access
  5242880,  -- 5MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- Storage RLS Policies for project-screenshots bucket
-- ============================================
-- Policies are applied to the storage.objects table
-- They filter based on bucket_id to only affect our bucket

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Public read access for project-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to project-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from project-screenshots" ON storage.objects;

-- Policy: Allow public read access to screenshots
-- Anyone can view/download screenshots (including anonymous users)
CREATE POLICY "Public read access for project-screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-screenshots');

-- Policy: Allow authenticated users to upload screenshots
-- Logged-in users can upload new screenshots
CREATE POLICY "Authenticated users can upload to project-screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-screenshots');

-- Policy: Allow authenticated users to update their screenshots
-- Logged-in users can replace/update screenshots
CREATE POLICY "Authenticated users can update project-screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-screenshots')
WITH CHECK (bucket_id = 'project-screenshots');

-- Policy: Allow authenticated users to delete screenshots
-- Logged-in users can delete screenshots
CREATE POLICY "Authenticated users can delete from project-screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-screenshots');
