import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

interface UserProfile {
  id: string
  user_id: string
  bio: string | null
  twitter_url: string | null
  website_url: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/user/profile
 * Fetches the current user's profile data
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use admin client to fetch profile (bypasses RLS for consistent reads)
    const adminClient = getSupabaseAdmin()
    const { data: profile, error: profileError } = await adminClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine for new users
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      )
    }

    // Get GitHub URL from user metadata (auto-populated from OAuth)
    const githubIdentity = user.identities?.find(
      (identity) => identity.provider === "github"
    )
    const githubUsername =
      githubIdentity?.identity_data?.user_name ||
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username

    const githubUrl = githubUsername
      ? `https://github.com/${githubUsername}`
      : null

    return NextResponse.json({
      profile: profile || null,
      github_url: githubUrl,
    })
  } catch (error) {
    console.error("Error in GET /api/user/profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// URL validation regex patterns
const URL_REGEX = /^https?:\/\/.+/
const TWITTER_REGEX = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i
const LINKEDIN_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/.+/i

function validateUrl(url: string | null | undefined, pattern?: RegExp): boolean {
  if (!url || url.trim() === "") return true // Empty is valid
  if (!URL_REGEX.test(url)) return false
  if (pattern && !pattern.test(url)) return false
  return true
}

/**
 * PUT /api/user/profile
 * Updates the current user's profile data
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bio, twitter_url, website_url, linkedin_url } = body

    // Validate bio length
    if (bio && typeof bio === "string" && bio.length > 200) {
      return NextResponse.json(
        { error: "Bio must be 200 characters or less" },
        { status: 400 }
      )
    }

    // Validate URLs
    if (!validateUrl(twitter_url, TWITTER_REGEX)) {
      return NextResponse.json(
        { error: "Invalid Twitter URL. Must be a valid twitter.com or x.com URL" },
        { status: 400 }
      )
    }

    if (!validateUrl(website_url)) {
      return NextResponse.json(
        { error: "Invalid website URL. Must start with http:// or https://" },
        { status: 400 }
      )
    }

    if (!validateUrl(linkedin_url, LINKEDIN_REGEX)) {
      return NextResponse.json(
        { error: "Invalid LinkedIn URL. Must be a valid linkedin.com URL" },
        { status: 400 }
      )
    }

    // Use admin client for upsert
    const adminClient = getSupabaseAdmin()

    const profileData: Partial<UserProfile> = {
      user_id: user.id,
      bio: bio?.trim() || null,
      twitter_url: twitter_url?.trim() || null,
      website_url: website_url?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
    }

    const { data: profile, error: upsertError } = await adminClient
      .from("user_profiles")
      .upsert(profileData, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting profile:", upsertError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error in PUT /api/user/profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
