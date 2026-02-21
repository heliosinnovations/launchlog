import { auth } from "@/auth"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

interface RepoSelection {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { repos } = body as { repos: RepoSelection[] }

    if (!Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: "No repositories selected" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Delete existing user repos (replace with new selection)
    const { error: deleteError } = await supabase
      .from("user_repos")
      .delete()
      .eq("user_id", session.user.id)

    if (deleteError) {
      console.error("Error deleting existing repos:", deleteError)
      // Continue anyway - table might not exist yet or no records
    }

    // Insert new selections
    const repoRecords = repos.map((repo, index) => ({
      user_id: session.user.id,
      repo_id: repo.id,
      repo_name: repo.name,
      repo_full_name: repo.fullName,
      repo_url: repo.url,
      repo_description: repo.description,
      repo_language: repo.language,
      repo_stars: repo.stars,
      display_order: index,
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from("user_repos")
      .insert(repoRecords)

    if (insertError) {
      console.error("Error inserting repos:", insertError)
      return NextResponse.json(
        { error: "Failed to save repository selections" },
        { status: 500 }
      )
    }

    // Get the user's GitHub username for redirect
    const { data: account } = await supabase
      .from("accounts")
      .select("providerAccountId")
      .eq("userId", session.user.id)
      .eq("provider", "github")
      .single()

    // Fetch GitHub username from the user's profile
    let username = session.user.name?.replace(/\s+/g, "") || "user"

    if (account?.providerAccountId) {
      // Get actual GitHub username
      const { data: user } = await supabase
        .from("users")
        .select("name")
        .eq("id", session.user.id)
        .single()

      if (user?.name) {
        // Try to get GitHub username from account
        const accessToken = await getAccessToken(session.user.id)
        if (accessToken) {
          const ghUser = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "LaunchLog",
            },
          })
          if (ghUser.ok) {
            const userData = await ghUser.json()
            username = userData.login
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: repos.length,
      redirectUrl: `/${username}`,
    })
  } catch (error) {
    console.error("Error saving user repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("accounts")
    .select("access_token")
    .eq("userId", userId)
    .eq("provider", "github")
    .single()

  return data?.access_token || null
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data: repos, error } = await supabase
      .from("user_repos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching user repos:", error)
      return NextResponse.json(
        { error: "Failed to fetch saved repositories" },
        { status: 500 }
      )
    }

    return NextResponse.json({ repos: repos || [] })
  } catch (error) {
    console.error("Error in GET /api/user/repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
