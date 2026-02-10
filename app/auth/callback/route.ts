import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert({
      auth_id: user.id,
      github_id: metadata.provider_id || metadata.sub,
      username: metadata.user_name || metadata.preferred_username,
      email: user.email,
      name: metadata.full_name || metadata.name || metadata.user_name,
      avatar_url: metadata.avatar_url,
      bio: metadata.bio,
      github_username: metadata.user_name,
      twitter_username: metadata.twitter_username,
      website_url: metadata.website,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'auth_id'
    });

  if (upsertError) {
    console.error('User sync error:', upsertError);
    // Continue anyway - user can sign in, profile may be incomplete
  }

  return NextResponse.redirect(`${origin}${next}`);
}
