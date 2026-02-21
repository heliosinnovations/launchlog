import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseInstance
}
