import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/projects/[id]/screenshot
 *
 * Get screenshot information for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      )
    }

    // Get authenticated user (optional for public access)
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get the project
    const supabaseAdmin = getSupabaseAdmin()
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select(
        "id, repo_full_name, screenshot_url, screenshot_source, screenshot_captured_at, live_demo_url, user_id"
      )
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Return screenshot info (public access allowed)
    return NextResponse.json({
      id: project.id,
      screenshot_url: project.screenshot_url,
      screenshot_source: project.screenshot_source,
      screenshot_captured_at: project.screenshot_captured_at,
      live_demo_url: user?.id === project.user_id ? project.live_demo_url : null,
      can_capture: user?.id === project.user_id,
    })
  } catch (error) {
    console.error("Error in screenshot GET API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]/screenshot
 *
 * Update the live demo URL for screenshot capture
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the project and verify ownership
    const supabaseAdmin = getSupabaseAdmin()
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select("id, user_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify project ownership
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { live_demo_url } = body as { live_demo_url?: string }

    // Validate URL if provided
    if (live_demo_url) {
      try {
        const parsed = new URL(live_demo_url)
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: "Invalid URL protocol" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
      }
    }

    // Update the project
    const { error: updateError } = await supabaseAdmin
      .from("user_repos")
      .update({ live_demo_url: live_demo_url || null })
      .eq("id", projectId)

    if (updateError) {
      console.error("Error updating project:", updateError)
      return NextResponse.json(
        { error: "Failed to update live demo URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      live_demo_url: live_demo_url || null,
    })
  } catch (error) {
    console.error("Error in screenshot PATCH API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
