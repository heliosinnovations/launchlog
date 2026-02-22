import { createSupabaseServerClient } from "@/lib/supabase/server"
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
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { repos } = body as { repos: RepoSelection[] }

    if (!Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: "No repositories selected" },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Delete existing user repos (replace with new selection)
    const { error: deleteError } = await supabaseAdmin
      .from("user_repos")
      .delete()
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting existing repos:", deleteError)
      // Continue anyway - table might not exist yet or no records
    }

    // Insert new selections
    const repoRecords = repos.map((repo, index) => ({
      user_id: user.id,
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

    const { error: insertError } = await supabaseAdmin
      .from("user_repos")
      .insert(repoRecords)

    if (insertError) {
      console.error("Error inserting repos:", insertError)
      return NextResponse.json(
        { error: "Failed to save repository selections" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: repos.length,
      redirectUrl: `/dashboard`,
    })
  } catch (error) {
    console.error("Error saving user repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: repos, error } = await supabaseAdmin
      .from("user_repos")
      .select("*")
      .eq("user_id", user.id)
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
