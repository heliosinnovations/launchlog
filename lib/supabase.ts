import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

let supabaseAdminInstance: SupabaseClient | null = null

/**
 * Creates a Supabase admin client with service role key.
 * Use this for server-side operations that need full access (not user-scoped).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseAdminInstance
}

/**
 * Creates a Supabase browser client for client-side auth operations.
 * Uses the anon key which respects RLS policies.
 *
 * Cookie Security Configuration:
 * - secure: true in production (HTTPS only) - prevents cookie transmission over HTTP
 * - httpOnly: false (REQUIRED) - Supabase SSR needs client-side JavaScript access to manage auth state
 * - sameSite: 'lax' - CSRF protection while allowing normal navigation
 *
 * Note: httpOnly: false is an acceptable security tradeoff for Supabase SSR because:
 * 1. Supabase auth tokens are short-lived and refreshed automatically
 * 2. Client-side access is required for the auth flow to work
 * 3. The secure flag prevents transmission over insecure connections
 * 4. sameSite: 'lax' provides CSRF protection
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      secure: typeof window !== 'undefined'
        ? window.location.protocol === 'https:'
        : true,  // Default secure for SSR
      sameSite: "lax",
    },
  })
}
