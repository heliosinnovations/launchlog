import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  extractDemoUrl,
  captureScreenshot,
  uploadToStorage,
  getGitHubPreview,
  fetchReadmeFromGitHub,
  fetchRepoHomepage,
} from "@/lib/screenshot-utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * Response format for the screenshot capture API
 */
interface CaptureResponse {
  success: boolean;
  screenshot_url: string | null;
  source: "auto" | "github_og" | null;
  captured_at: string;
  error?: string;
}

/**
 * POST /api/projects/[id]/screenshot/capture
 *
 * Triggers screenshot capture for a project:
 * 1. Fetches project from database
 * 2. Gets README from GitHub API
 * 3. Extracts demo URL from README
 * 4. Captures screenshot (1280x720, WebP format, 10s timeout)
 * 5. Uploads to Supabase Storage bucket "project-screenshots"
 * 6. Updates database: screenshot_url, screenshot_source='auto', screenshot_captured_at
 * 7. Falls back to GitHub preview if capture fails
 *
 * Always returns successfully with either auto-captured or fallback screenshot.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<CaptureResponse>> {
  const { id: projectId } = await params;
  const capturedAt = new Date().toISOString();

  // Validate project ID format (UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid project ID format",
        screenshot_url: null,
        source: null,
        captured_at: capturedAt,
      },
      { status: 400 },
    );
  }

  // Get authenticated user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        screenshot_url: null,
        source: null,
        captured_at: capturedAt,
      },
      { status: 401 },
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Get the project and verify ownership
  const { data: project, error: projectError } = await supabaseAdmin
    .from("user_repos")
    .select("id, repo_full_name, repo_url, user_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      {
        success: false,
        error: "Project not found",
        screenshot_url: null,
        source: null,
        captured_at: capturedAt,
      },
      { status: 404 },
    );
  }

  // Verify project ownership
  if (project.user_id !== user.id) {
    return NextResponse.json(
      {
        success: false,
        error: "Not authorized to access this project",
        screenshot_url: null,
        source: null,
        captured_at: capturedAt,
      },
      { status: 403 },
    );
  }

  if (!project.repo_full_name) {
    return NextResponse.json(
      {
        success: false,
        error: "Project has no repository configured",
        screenshot_url: null,
        source: null,
        captured_at: capturedAt,
      },
      { status: 400 },
    );
  }

  // Get GitHub token for API access (if available)
  const { data: tokenData } = await supabaseAdmin
    .from("user_tokens")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .single();

  const githubToken = tokenData?.access_token;

  // Try to capture screenshot from live demo
  // Priority order: 1. GitHub homepage field, 2. README demo URL, 3. GitHub OG fallback
  let screenshotUrl: string | null = null;
  let source: "auto" | "github_og" = "github_og";
  let demoUrl: string | null = null;

  try {
    // Step 1: Check GitHub homepage field first (most authoritative source)
    const homepage = await fetchRepoHomepage(
      project.repo_full_name,
      githubToken,
    );

    if (homepage) {
      // Validate that homepage is a valid URL
      try {
        new URL(homepage);
        demoUrl = homepage;
        console.log(`Found homepage URL: ${demoUrl}`);
      } catch {
        console.log(`Invalid homepage URL format: ${homepage}`);
      }
    }

    // Step 2: If no homepage, scan README for demo URL
    if (!demoUrl) {
      const readme = await fetchReadmeFromGitHub(
        project.repo_full_name,
        githubToken,
      );

      if (readme) {
        demoUrl = extractDemoUrl(readme);
        if (demoUrl) {
          console.log(`Found demo URL in README: ${demoUrl}`);
        } else {
          console.log("No demo URL found in README, using fallback");
        }
      } else {
        console.log("Could not fetch README, using fallback");
      }
    }

    // Step 3: Capture screenshot if we have a demo URL
    if (demoUrl) {
      console.log(`Capturing screenshot from: ${demoUrl}`);
      const screenshotBuffer = await captureScreenshot(demoUrl);

      // Step 4: Upload to Supabase Storage
      screenshotUrl = await uploadToStorage(screenshotBuffer, projectId);
      source = "auto";
      console.log(`Screenshot captured and uploaded: ${screenshotUrl}`);
    }
  } catch (error) {
    // Log the error but don't fail - we'll use the fallback
    console.error("Screenshot capture failed:", error);
  }

  // If capture failed, use GitHub OpenGraph fallback
  if (!screenshotUrl) {
    try {
      screenshotUrl = getGitHubPreview(project.repo_full_name);
      source = "github_og";
      console.log(`Using GitHub OG fallback: ${screenshotUrl}`);
    } catch (error) {
      console.error("Failed to generate GitHub fallback:", error);
      // Even if this fails, return a generic error response
      return NextResponse.json(
        {
          success: false,
          error: "Failed to capture screenshot",
          screenshot_url: null,
          source: null,
          captured_at: capturedAt,
        },
        { status: 500 },
      );
    }
  }

  // Update database with screenshot information
  const { error: updateError } = await supabaseAdmin
    .from("user_repos")
    .update({
      screenshot_url: screenshotUrl,
      screenshot_source: source,
      screenshot_captured_at: capturedAt,
    })
    .eq("id", projectId);

  if (updateError) {
    console.error("Failed to update project with screenshot:", updateError);
    // Don't fail the request - the screenshot was captured successfully
  }

  // Return success response
  return NextResponse.json({
    success: true,
    screenshot_url: screenshotUrl,
    source,
    captured_at: capturedAt,
  });
}

/**
 * GET /api/projects/[id]/screenshot/capture
 *
 * Returns the current screenshot URL and metadata for a project
 * without triggering a new capture.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 },
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
        "id, screenshot_url, screenshot_source, screenshot_captured_at, user_id",
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
        { status: 403 },
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
      { status: 500 },
    );
  }
}
