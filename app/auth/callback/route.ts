import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface AuthError {
  code: string;
  message: string;
  userId?: string;
  details?: unknown;
}

function logAuthError(error: AuthError): void {
  console.error('[AUTH_CALLBACK]', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...error,
  }));
}

async function verifyUsersTableSchema(): Promise<{ valid: boolean; error?: string }> {
  try {
    const { error } = await getSupabaseAdmin()
      .from('users')
      .select('auth_id')
      .limit(0);

    if (error) {
      return { valid: false, error: `Schema check failed: ${error.message}` };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Schema verification error: ${e instanceof Error ? e.message : 'Unknown'}` };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    logAuthError({ code: 'NO_AUTH_CODE', message: 'OAuth callback missing code parameter' });
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange code for session with error handling
  let data, error;
  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  } catch (e) {
    logAuthError({
      code: 'SESSION_EXCHANGE_EXCEPTION',
      message: 'Exception during session exchange',
      details: e instanceof Error ? e.message : e,
    });
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (error || !data.user) {
    logAuthError({
      code: 'SESSION_EXCHANGE_FAILED',
      message: error?.message || 'No user data returned',
      details: error,
    });
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;
  const metadata = user.user_metadata;

  // Validate required GitHub metadata
  const githubId = String(metadata.sub || metadata.provider_id || '');
  const username = metadata.user_name || metadata.preferred_username || '';

  if (!githubId || !username) {
    logAuthError({
      code: 'MISSING_METADATA',
      message: 'Missing required GitHub metadata',
      userId: user.id,
      details: { githubId: !!githubId, username: !!username },
    });
    return NextResponse.redirect(`${origin}/login?error=missing_metadata`);
  }

  // Verify database schema before attempting upsert
  const schemaCheck = await verifyUsersTableSchema();
  if (!schemaCheck.valid) {
    logAuthError({
      code: 'SCHEMA_DRIFT',
      message: schemaCheck.error || 'Database schema validation failed',
      userId: user.id,
    });
    return NextResponse.redirect(`${origin}/login?error=db_schema_error`);
  }

  // Sync user to public.users table
  try {
    const { error: upsertError } = await getSupabaseAdmin()
      .from('users')
      .upsert({
        auth_id: user.id,
        github_id: githubId,
        username,
        email: user.email!,
        name: metadata.full_name || metadata.name || username,
        avatar_url: metadata.avatar_url || null,
        bio: metadata.bio || null,
        github_username: username,
        twitter_username: metadata.twitter_username || null,
        website_url: metadata.website || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'auth_id'
      });

    if (upsertError) {
      logAuthError({
        code: 'USER_UPSERT_FAILED',
        message: upsertError.message,
        userId: user.id,
        details: { code: upsertError.code, hint: upsertError.hint },
      });
      return NextResponse.redirect(`${origin}/login?error=user_sync_failed`);
    }
  } catch (e) {
    logAuthError({
      code: 'USER_UPSERT_EXCEPTION',
      message: 'Exception during user upsert',
      userId: user.id,
      details: e instanceof Error ? e.message : e,
    });
    return NextResponse.redirect(`${origin}/login?error=user_sync_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
