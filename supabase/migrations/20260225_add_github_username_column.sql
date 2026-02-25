-- Migration: Add github_username column to user_profiles for fast profile lookups
-- This replaces the slow auth.admin.listUsers() call with a direct indexed query

-- Add github_username column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS github_username TEXT;

-- Create unique index on lowercase github_username for case-insensitive lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_github_username_lower
ON user_profiles (LOWER(github_username))
WHERE github_username IS NOT NULL;

-- Backfill existing profiles from auth.users metadata
-- This uses a DO block to iterate through existing profiles and populate github_username
DO $$
DECLARE
  profile_record RECORD;
  github_username_value TEXT;
BEGIN
  FOR profile_record IN
    SELECT up.id, up.user_id
    FROM user_profiles up
    WHERE up.github_username IS NULL
  LOOP
    -- Get github_username from auth.users raw_user_meta_data
    SELECT
      COALESCE(
        raw_user_meta_data->>'user_name',
        raw_user_meta_data->>'preferred_username'
      )
    INTO github_username_value
    FROM auth.users
    WHERE id = profile_record.user_id;

    -- Update the profile if we found a username
    IF github_username_value IS NOT NULL THEN
      UPDATE user_profiles
      SET github_username = github_username_value
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END $$;

-- Comment explaining the column's purpose
COMMENT ON COLUMN user_profiles.github_username IS 'GitHub username for direct profile lookups. Populated from OAuth on signup/signin.';
