import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Sync user to public.users table
  const user = data.user;
  const metadata = user.user_metadata;

  // GitHub OAuth: sub = user id, user_name/preferred_username = login
  const githubId = String(metadata.sub || metadata.provider_id || '');
  const username = metadata.user_name || metadata.preferred_username || '';

  if (!githubId || !username) {
    console.error('Missing required GitHub metadata:', { githubId, username, metadata });
    return NextResponse.redirect(`${origin}/login?error=missing_metadata`);
  }

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
    console.error('User sync error:', upsertError);
    return NextResponse.redirect(`${origin}/login?error=user_sync_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
