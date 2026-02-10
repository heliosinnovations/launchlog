-- Add auth_id column to users table for Supabase Auth integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update existing users: set auth_id to their email if auth.users entry exists
-- This migration assumes GitHub OAuth provider_id is used as github_id
DO $$
DECLARE
  u RECORD;
  auth_user_id UUID;
BEGIN
  FOR u IN SELECT id, email FROM public.users WHERE auth_id IS NULL LOOP
    SELECT id INTO auth_user_id FROM auth.users WHERE email = u.email LIMIT 1;
    IF auth_user_id IS NOT NULL THEN
      UPDATE public.users SET auth_id = auth_user_id WHERE id = u.id;
    END IF;
  END LOOP;
END $$;
