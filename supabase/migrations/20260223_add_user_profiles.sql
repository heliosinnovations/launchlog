-- Migration: Create user_profiles table for bio and social links
-- This table extends user profile data beyond what's stored in auth.users metadata

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT CHECK (char_length(bio) <= 200),
  twitter_url TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Row Level Security policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (for public profile pages)
CREATE POLICY "Public profiles are viewable by all"
  ON user_profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on changes
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Comment explaining the table's purpose
COMMENT ON TABLE user_profiles IS 'Stores extended profile information for users including bio and social links. Separate from auth.users metadata for flexibility and public access.';
COMMENT ON COLUMN user_profiles.bio IS 'User bio text, max 200 characters';
COMMENT ON COLUMN user_profiles.twitter_url IS 'Full Twitter/X profile URL';
COMMENT ON COLUMN user_profiles.website_url IS 'Personal website URL';
COMMENT ON COLUMN user_profiles.linkedin_url IS 'LinkedIn profile URL';
