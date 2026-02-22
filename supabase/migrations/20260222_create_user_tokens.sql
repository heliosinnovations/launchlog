-- Migration: Create user_tokens table for storing OAuth provider tokens
-- This table stores GitHub OAuth tokens that are captured during the auth callback
-- because Supabase only provides provider_token immediately after OAuth exchange

CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for fast lookups by user_id and provider
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_provider ON user_tokens(user_id, provider);

-- Row Level Security policies
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tokens (via service role, not directly)
-- For security, we don't allow direct client access to tokens
-- All token access should go through the service role in API routes
CREATE POLICY "Service role can manage user_tokens"
  ON user_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment explaining the table's purpose
COMMENT ON TABLE user_tokens IS 'Stores OAuth provider access tokens for authenticated users. Tokens are captured during OAuth callback because Supabase provider_token is only available immediately after exchange.';
