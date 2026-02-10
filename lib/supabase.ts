import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/** Browser client for client components */
export function createClientSupabase() {
  return createBrowserClient(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

let _supabaseAdmin: SupabaseClient | null = null;

/** Admin client for server-side operations (bypasses RLS) */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
  return _supabaseAdmin;
}
