import { auth } from "@/auth"
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

interface SelectedRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { repos } = (await request.json()) as { repos: SelectedRepo[] }

    if (!Array.isArray(repos)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // First, delete any existing selected repos for this user
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("user_id", session.user.id)

    if (deleteError) {
      console.error("Error deleting existing repos:", deleteError)
      // Continue anyway - might not have any existing repos
    }

    // Insert new selected repos
    const userId = session.user.id
    if (repos.length > 0) {
      const projectsToInsert = repos.map((repo, index) => ({
        user_id: userId,
        github_repo_id: repo.id,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        description: repo.description,
        primary_language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        is_visible: true,
        display_order: index,
      }))

      const { error: insertError } = await supabase
        .from("projects")
        .insert(projectsToInsert)

      if (insertError) {
        console.error("Error inserting repos:", insertError)
        return NextResponse.json(
          { error: "Failed to save selected repositories" },
          { status: 500 }
        )
      }
    }

    // Update user profile to mark onboarding as complete
    const { error: updateError } = await supabase
      .from("users")
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      // Non-critical, continue
    }

    return NextResponse.json({ success: true, count: repos.length })
  } catch (error) {
    console.error("Error saving repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.user.id)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching user repos:", error)
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
