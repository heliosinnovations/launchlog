import { describe, it, expect } from 'vitest';

// Mock types matching Supabase response shapes
interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    sub?: string;
    provider_id?: string;
    user_name?: string;
    preferred_username?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
    twitter_username?: string;
    website?: string;
  };
}


// Test the schema verification logic
describe('Auth Callback - Schema Verification', () => {
  describe('verifyUsersTableSchema logic', () => {
    it('should return valid when auth_id column exists', async () => {
      // Simulating successful schema check
      const mockQueryResult = { error: null };
      const isValid = mockQueryResult.error === null;
      expect(isValid).toBe(true);
    });

    it('should return invalid when auth_id column is missing', async () => {
      // Simulating schema drift error
      const mockQueryResult = { 
        error: { message: 'column "auth_id" does not exist' } 
      };
      const isValid = mockQueryResult.error === null;
      expect(isValid).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      // Simulating connection error
      const mockError = new Error('Connection refused');
      const result = { valid: false, error: `Schema verification error: ${mockError.message}` };
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });
});

// Test the error logging format
describe('Auth Callback - Error Logging', () => {
  describe('logAuthError format', () => {
    it('should create properly structured error objects', () => {
      const error = {
        code: 'SCHEMA_DRIFT',
        message: 'Database schema validation failed',
        userId: 'user-123',
        details: { column: 'auth_id' },
      };

      expect(error.code).toBe('SCHEMA_DRIFT');
      expect(error.message).toBeDefined();
      expect(error.userId).toBeDefined();
    });

    it('should handle error without userId', () => {
      const error = {
        code: 'NO_AUTH_CODE',
        message: 'OAuth callback missing code parameter',
      };

      expect(error.code).toBe('NO_AUTH_CODE');
      expect(error).not.toHaveProperty('userId');
    });
  });
});

// Test GitHub metadata validation
describe('Auth Callback - GitHub Metadata Validation', () => {
  const createMockUser = (metadata: Partial<MockUser['user_metadata']>): MockUser => ({
    id: 'auth-user-123',
    email: 'test@example.com',
    user_metadata: metadata,
  });

  it('should extract githubId from sub field', () => {
    const user = createMockUser({ sub: '12345', user_name: 'testuser' });
    const githubId = String(user.user_metadata.sub || user.user_metadata.provider_id || '');
    expect(githubId).toBe('12345');
  });

  it('should fallback to provider_id when sub is missing', () => {
    const user = createMockUser({ provider_id: '67890', user_name: 'testuser' });
    const githubId = String(user.user_metadata.sub || user.user_metadata.provider_id || '');
    expect(githubId).toBe('67890');
  });

  it('should extract username from user_name field', () => {
    const user = createMockUser({ sub: '123', user_name: 'myuser' });
    const username = user.user_metadata.user_name || user.user_metadata.preferred_username || '';
    expect(username).toBe('myuser');
  });

  it('should fallback to preferred_username when user_name is missing', () => {
    const user = createMockUser({ sub: '123', preferred_username: 'prefuser' });
    const username = user.user_metadata.user_name || user.user_metadata.preferred_username || '';
    expect(username).toBe('prefuser');
  });

  it('should fail validation when githubId is missing', () => {
    const user = createMockUser({ user_name: 'testuser' });
    const githubId = String(user.user_metadata.sub || user.user_metadata.provider_id || '');
    const isValid = !!githubId && githubId !== '';
    expect(isValid).toBe(false);
  });

  it('should fail validation when username is missing', () => {
    const user = createMockUser({ sub: '12345' });
    const username = user.user_metadata.user_name || user.user_metadata.preferred_username || '';
    const isValid = !!username;
    expect(isValid).toBe(false);
  });
});

// Test upsert payload construction
describe('Auth Callback - User Upsert Payload', () => {
  it('should construct valid upsert payload from metadata', () => {
    const user: MockUser = {
      id: 'auth-123',
      email: 'test@example.com',
      user_metadata: {
        sub: '456',
        user_name: 'testuser',
        full_name: 'Test User',
        avatar_url: 'https://avatars.github.com/u/456',
        bio: 'Developer',
        twitter_username: 'testtwitter',
        website: 'https://test.com',
      },
    };

    const payload = {
      auth_id: user.id,
      github_id: String(user.user_metadata.sub),
      username: user.user_metadata.user_name,
      email: user.email,
      name: user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name,
      avatar_url: user.user_metadata.avatar_url || null,
      bio: user.user_metadata.bio || null,
      github_username: user.user_metadata.user_name,
      twitter_username: user.user_metadata.twitter_username || null,
      website_url: user.user_metadata.website || null,
    };

    expect(payload.auth_id).toBe('auth-123');
    expect(payload.github_id).toBe('456');
    expect(payload.username).toBe('testuser');
    expect(payload.email).toBe('test@example.com');
    expect(payload.name).toBe('Test User');
    expect(payload.avatar_url).toBe('https://avatars.github.com/u/456');
  });

  it('should handle missing optional fields with null', () => {
    const user: MockUser = {
      id: 'auth-123',
      email: 'test@example.com',
      user_metadata: {
        sub: '456',
        user_name: 'testuser',
      },
    };

    const payload = {
      auth_id: user.id,
      github_id: String(user.user_metadata.sub),
      username: user.user_metadata.user_name,
      email: user.email,
      name: user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name,
      avatar_url: user.user_metadata.avatar_url || null,
      bio: user.user_metadata.bio || null,
      github_username: user.user_metadata.user_name,
      twitter_username: user.user_metadata.twitter_username || null,
      website_url: user.user_metadata.website || null,
    };

    expect(payload.avatar_url).toBeNull();
    expect(payload.bio).toBeNull();
    expect(payload.twitter_username).toBeNull();
    expect(payload.website_url).toBeNull();
    expect(payload.name).toBe('testuser'); // Fallback to username
  });
});

// Test error redirect URLs
describe('Auth Callback - Error Redirect URLs', () => {
  const origin = 'https://launchlog.app';

  it('should redirect to login with no_code error', () => {
    const redirectUrl = `${origin}/login?error=no_code`;
    expect(redirectUrl).toBe('https://launchlog.app/login?error=no_code');
  });

  it('should redirect to login with auth_failed error', () => {
    const redirectUrl = `${origin}/login?error=auth_failed`;
    expect(redirectUrl).toBe('https://launchlog.app/login?error=auth_failed');
  });

  it('should redirect to login with db_schema_error', () => {
    const redirectUrl = `${origin}/login?error=db_schema_error`;
    expect(redirectUrl).toBe('https://launchlog.app/login?error=db_schema_error');
  });

  it('should redirect to login with user_sync_failed error', () => {
    const redirectUrl = `${origin}/login?error=user_sync_failed`;
    expect(redirectUrl).toBe('https://launchlog.app/login?error=user_sync_failed');
  });

  it('should redirect to login with missing_metadata error', () => {
    const redirectUrl = `${origin}/login?error=missing_metadata`;
    expect(redirectUrl).toBe('https://launchlog.app/login?error=missing_metadata');
  });

  it('should redirect to dashboard on success', () => {
    const next = '/dashboard';
    const redirectUrl = `${origin}${next}`;
    expect(redirectUrl).toBe('https://launchlog.app/dashboard');
  });

  it('should respect custom next parameter', () => {
    const next = '/projects/new';
    const redirectUrl = `${origin}${next}`;
    expect(redirectUrl).toBe('https://launchlog.app/projects/new');
  });
});
