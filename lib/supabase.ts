import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role key
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Helper to get GitHub access token from NextAuth accounts table
export async function getGitHubToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("access_token")
    .eq("userId", userId)
    .eq("provider", "github")
    .single()

  if (error || !data) {
    console.error("Error fetching GitHub token:", error)
    return null
  }

  return data.access_token
}
