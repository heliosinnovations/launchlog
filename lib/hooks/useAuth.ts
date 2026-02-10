'use client';

import { createClientSupabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  username?: string;
  tier?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientSupabase();

    const fetchUser = async (authUser: User | null) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Fetch user details from public.users
      const { data } = await supabase
        .from('users')
        .select('id, username, tier, name, avatar_url')
        .eq('auth_id', authUser.id)
        .single();

      setUser(data ? {
        id: data.id,
        email: authUser.email!,
        name: data.name || authUser.user_metadata?.full_name,
        avatar_url: data.avatar_url || authUser.user_metadata?.avatar_url,
        username: data.username,
        tier: data.tier,
      } : null);
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => fetchUser(user));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => fetchUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return { user, loading, signOut };
}
