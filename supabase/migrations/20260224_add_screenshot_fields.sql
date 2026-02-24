-- Migration: Add screenshot fields to user_repos table
-- This enables automatic screenshot capture for project live demos

-- Add screenshot columns to user_repos table
ALTER TABLE user_repos
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_source TEXT CHECK (screenshot_source IN ('captured', 'github_og') OR screenshot_source IS NULL),
ADD COLUMN IF NOT EXISTS screenshot_captured_at TIMESTAMPTZ;

-- Add live_demo_url column to store the URL we capture screenshots from
-- This is extracted from the project README or manually set by the user
ALTER TABLE user_repos
ADD COLUMN IF NOT EXISTS live_demo_url TEXT;

-- Index for efficient queries on screenshot status
CREATE INDEX IF NOT EXISTS idx_user_repos_screenshot_source ON user_repos(screenshot_source);

-- Comments explaining the columns
COMMENT ON COLUMN user_repos.screenshot_url IS 'Supabase Storage URL for the captured project screenshot';
COMMENT ON COLUMN user_repos.screenshot_source IS 'Source of screenshot: captured (Playwright), github_og (GitHub Open Graph), or NULL';
COMMENT ON COLUMN user_repos.screenshot_captured_at IS 'Timestamp when the screenshot was last captured';
COMMENT ON COLUMN user_repos.live_demo_url IS 'URL of the live demo to capture screenshots from';
