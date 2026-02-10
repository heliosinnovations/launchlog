import { NextResponse } from 'next/server';
import { createServerSupabase } from './supabase-server';
import { supabaseAdmin } from './supabase';

export interface UserSession {
  id: string;
  email: string;
  username?: string;
  tier?: string;
}

/** Get current session from Supabase auth */
export async function getSession(): Promise<UserSession | null> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch user details from public.users
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, username, tier')
    .eq('auth_id', user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    email: user.email!,
    username: data.username,
    tier: data.tier,
  };
}

/** Require auth or return 401 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}
