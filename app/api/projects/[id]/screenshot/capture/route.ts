import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { captureWithFallback } from "@/lib/screenshot-utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * Response type for the screenshot capture API
 */
interface ScreenshotCaptureResponse {
  success: boolean;
  screenshot_url?: string;
  source?: "auto" | "github_preview";
  error?: string;
}

/**
 * Storage bucket name for screenshots
 * Defined in .env as NEXT_PUBLIC_STORAGE_BUCKET_SCREENSHOTS
 */
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_SCREENSHOTS || "project-screenshots";

/**
 * POST /api/projects/[id]/screenshot/capture
 *
 * Captures a screenshot for a project:
 * 1. Verifies the user owns the project
 * 2. Extracts demo URL from README (or uses repo homepage)
 * 3. Captures screenshot using Puppeteer (with fallback to GitHub preview)
 * 4. Uploads to Supabase Storage
 * 5. Updates database with screenshot_url, source, captured_at
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing the project ID
 * @returns JSON response with screenshot URL and source
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ScreenshotCaptureResponse>> {
  try {
    const { id: projectId } = await params;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: "Invalid project ID format" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the project (user_repo) and verify ownership
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select("id, repo_url, repo_full_name, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify project ownership
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to access this project" },
        { status: 403 }
      );
    }

    if (!project.repo_full_name) {
      return NextResponse.json(
        { success: false, error: "Project has no repository name configured" },
        { status: 400 }
      );
    }

    // Capture screenshot with automatic fallback
    const result = await captureWithFallback(project.repo_full_name);

    if (!result.screenshot) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to capture screenshot",
        },
        { status: 500 }
      );
    }

    // Generate unique filename for the screenshot
    const timestamp = Date.now();
    const safeRepoName = project.repo_full_name.replace("/", "-");
    const extension = result.source === "github_preview" ? "png" : "webp";
    const filename = `${safeRepoName}-${timestamp}.${extension}`;
    const storagePath = `${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, result.screenshot, {
        contentType:
          result.source === "github_preview" ? "image/png" : "image/webp",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Screenshot upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload screenshot to storage" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded screenshot
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    // Update database with screenshot metadata
    const { error: updateError } = await supabaseAdmin
      .from("user_repos")
      .update({
        screenshot_url: publicUrl,
        screenshot_source: result.source,
        screenshot_captured_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Database update error:", updateError);
      // Note: Screenshot is uploaded but DB update failed
      // We still return success since the screenshot exists
      return NextResponse.json({
        success: true,
        screenshot_url: publicUrl,
        source: result.source,
        error: "Screenshot saved but database update failed",
      });
    }

    return NextResponse.json({
      success: true,
      screenshot_url: publicUrl,
      source: result.source,
    });
  } catch (error) {
    console.error("Error in screenshot capture API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/screenshot/capture
 *
 * Returns the current screenshot URL and metadata for a project
 * without triggering a new capture.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the project (user_repo) and verify ownership
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select(
        "id, screenshot_url, screenshot_source, screenshot_captured_at, user_id"
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify project ownership
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      screenshot_url: project.screenshot_url,
      source: project.screenshot_source,
      captured_at: project.screenshot_captured_at,
    });
  } catch (error) {
    console.error("Error in screenshot GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
