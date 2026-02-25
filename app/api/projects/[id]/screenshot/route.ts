import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

/**
 * Screenshot configuration
 */
const SCREENSHOT_CONFIG = {
  storageBucket: "project-screenshots",
  maxFileSize: 5 * 1024 * 1024, // 5MB
}

/**
 * Build GitHub Open Graph image URL as fallback
 */
function buildGitHubOGUrl(repoFullName: string): string {
  return `https://opengraph.githubassets.com/1/${repoFullName}`
}

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
 * POST /api/projects/[id]/screenshot
 *
 * Upload a screenshot captured client-side.
 * Accepts base64 PNG data and stores it in Supabase Storage.
 */
export async function POST(
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
      .select("id, repo_full_name, user_id")
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
    const { screenshot_data, use_github_fallback } = body as {
      screenshot_data?: string
      use_github_fallback?: boolean
    }

    let screenshotUrl: string | null = null
    let screenshotSource: "captured" | "github_og" = "github_og"

    if (use_github_fallback) {
      // Use GitHub OG image as fallback
      screenshotUrl = buildGitHubOGUrl(project.repo_full_name)
      screenshotSource = "github_og"
    } else if (screenshot_data) {
      // Validate base64 data
      if (!screenshot_data.startsWith("data:image/png;base64,")) {
        return NextResponse.json(
          { error: "Invalid screenshot format. Expected PNG base64 data." },
          { status: 400 }
        )
      }

      // Extract base64 content
      const base64Data = screenshot_data.replace("data:image/png;base64,", "")
      const buffer = Buffer.from(base64Data, "base64")

      // Check file size
      if (buffer.length > SCREENSHOT_CONFIG.maxFileSize) {
        return NextResponse.json(
          { error: "Screenshot exceeds maximum file size (5MB)" },
          { status: 400 }
        )
      }

      // Generate filename and upload
      const timestamp = Date.now()
      const filename = `${projectId}_${timestamp}.png`

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(SCREENSHOT_CONFIG.storageBucket)
        .upload(filename, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        return NextResponse.json(
          { error: "Failed to upload screenshot" },
          { status: 500 }
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from(SCREENSHOT_CONFIG.storageBucket)
        .getPublicUrl(uploadData.path)

      screenshotUrl = publicUrl
      screenshotSource = "captured"
    } else {
      return NextResponse.json(
        { error: "Missing screenshot_data or use_github_fallback" },
        { status: 400 }
      )
    }

    // Update project record
    const { error: updateError } = await supabaseAdmin
      .from("user_repos")
      .update({
        screenshot_url: screenshotUrl,
        screenshot_source: screenshotSource,
        screenshot_captured_at: new Date().toISOString(),
      })
      .eq("id", projectId)

    if (updateError) {
      console.error("Error updating project:", updateError)
      return NextResponse.json(
        { error: "Failed to update project with screenshot" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      screenshot_url: screenshotUrl,
      screenshot_source: screenshotSource,
      message:
        screenshotSource === "captured"
          ? "Screenshot uploaded successfully"
          : "Using GitHub Open Graph image as fallback",
    })
  } catch (error) {
    console.error("Error in screenshot POST API:", error)
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
