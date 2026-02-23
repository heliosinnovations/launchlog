-- Migration: Create mentions table for storing HackerNews, Reddit, and other social proof mentions
-- This table stores references to discussions about projects across the web (HN, Reddit, ProductHunt, etc.)

CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'hackernews' | 'reddit' | 'twitter' | 'producthunt' | 'youtube' | 'blog'
  source_url TEXT NOT NULL UNIQUE, -- UNIQUE to prevent duplicate mentions
  title TEXT,
  excerpt TEXT,
  score INTEGER, -- HN points, PH upvotes, Reddit upvotes
  comment_count INTEGER,
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentions_project_id ON mentions(project_id);
CREATE INDEX IF NOT EXISTS idx_mentions_source_type ON mentions(source_type);
CREATE INDEX IF NOT EXISTS idx_mentions_published_at ON mentions(published_at DESC);

-- Row Level Security policies
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- Anyone can read mentions (for public profile pages)
CREATE POLICY "Public mentions are viewable by all"
  ON mentions
  FOR SELECT
  USING (true);

-- Project owners can insert mentions for their projects
-- Checks project ownership via projects.user_id = auth.uid()
CREATE POLICY "Project owners can insert mentions"
  ON mentions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = mentions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can update their project's mentions
CREATE POLICY "Project owners can update mentions"
  ON mentions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = mentions.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = mentions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can delete their project's mentions
CREATE POLICY "Project owners can delete mentions"
  ON mentions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = mentions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_mentions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on changes
DROP TRIGGER IF EXISTS trigger_update_mentions_updated_at ON mentions;
CREATE TRIGGER trigger_update_mentions_updated_at
  BEFORE UPDATE ON mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_mentions_updated_at();

-- Comments explaining the table and columns
COMMENT ON TABLE mentions IS 'Stores social proof mentions of projects from HackerNews, Reddit, ProductHunt, Twitter, YouTube, and blogs.';
COMMENT ON COLUMN mentions.project_id IS 'Reference to the project this mention is about';
COMMENT ON COLUMN mentions.source_type IS 'Type of source: hackernews, reddit, twitter, producthunt, youtube, blog';
COMMENT ON COLUMN mentions.source_url IS 'Unique URL to the original mention (prevents duplicates)';
COMMENT ON COLUMN mentions.title IS 'Title of the post/discussion';
COMMENT ON COLUMN mentions.excerpt IS 'Short excerpt or description of the mention';
COMMENT ON COLUMN mentions.score IS 'Engagement score (HN points, Reddit upvotes, PH upvotes, etc.)';
COMMENT ON COLUMN mentions.comment_count IS 'Number of comments on the mention';
COMMENT ON COLUMN mentions.author IS 'Author/username who created the mention';
COMMENT ON COLUMN mentions.published_at IS 'When the original mention was published';
