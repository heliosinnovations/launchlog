import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { chromium, type Browser } from "playwright"

/**
 * Configuration for screenshot capture
 */
const SCREENSHOT_CONFIG = {
  viewport: { width: 1280, height: 720 },
  navigationTimeout: 10000,
  screenshotTimeout: 30000,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  storageBucket: "project-screenshots",
}

/**
 * Build GitHub Open Graph image URL as fallback
 */
function buildGitHubOGUrl(repoFullName: string): string {
  return `https://opengraph.githubassets.com/1/${repoFullName}`
}

/**
 * Validate URL for screenshot capture
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    return ["http:", "https:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Capture screenshot of a URL using Playwright
 */
async function captureScreenshot(url: string): Promise<Buffer | null> {
  let browser: Browser | null = null

  try {
    // Launch headless Chromium
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    })

    const context = await browser.newContext({
      viewport: SCREENSHOT_CONFIG.viewport,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    })

    const page = await context.newPage()

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: SCREENSHOT_CONFIG.navigationTimeout,
    })

    // Wait a bit for dynamic content to settle
    await page.waitForTimeout(2000)

    // Capture screenshot as PNG
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false, // Just viewport, not full page
    })

    await context.close()

    return screenshot
  } catch (error) {
    console.error("Screenshot capture error:", error)
    return null
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Upload screenshot to Supabase Storage
 */
async function uploadScreenshot(
  projectId: string,
  screenshot: Buffer
): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const timestamp = Date.now()
  const filename = `${projectId}_${timestamp}.png`

  // Check file size
  if (screenshot.length > SCREENSHOT_CONFIG.maxFileSize) {
    console.error("Screenshot exceeds max file size:", screenshot.length)
    return null
  }

  const { data, error } = await supabaseAdmin.storage
    .from(SCREENSHOT_CONFIG.storageBucket)
    .upload(filename, screenshot, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    console.error("Storage upload error:", error)
    return null
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage
    .from(SCREENSHOT_CONFIG.storageBucket)
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * POST /api/projects/[id]/screenshot/capture
 *
 * Captures a screenshot of the project's live demo URL:
 * 1. Validates user authentication and project ownership
 * 2. Extracts live demo URL from project
 * 3. Captures screenshot using Playwright headless browser
 * 4. Uploads to Supabase Storage
 * 5. Updates project record with screenshot URL
 * 6. Falls back to GitHub OG image on failure
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
      .select("id, repo_full_name, repo_url, live_demo_url, user_id")
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

    // Get body for optional live_demo_url override
    let liveDemoUrl = project.live_demo_url
    try {
      const body = await request.json()
      if (body.live_demo_url && isValidUrl(body.live_demo_url)) {
        liveDemoUrl = body.live_demo_url
      }
    } catch {
      // No body provided, use existing live_demo_url
    }

    let screenshotUrl: string | null = null
    let screenshotSource: "captured" | "github_og" = "github_og"

    // Attempt to capture screenshot if we have a valid live demo URL
    if (liveDemoUrl && isValidUrl(liveDemoUrl)) {
      console.log(`Attempting screenshot capture for: ${liveDemoUrl}`)

      const screenshot = await captureScreenshot(liveDemoUrl)

      if (screenshot) {
        // Upload to storage
        const uploadedUrl = await uploadScreenshot(projectId, screenshot)

        if (uploadedUrl) {
          screenshotUrl = uploadedUrl
          screenshotSource = "captured"
          console.log(`Screenshot captured successfully: ${screenshotUrl}`)
        }
      }

      // Retry once on failure
      if (!screenshotUrl) {
        console.log("First capture attempt failed, retrying...")
        const retryScreenshot = await captureScreenshot(liveDemoUrl)

        if (retryScreenshot) {
          const uploadedUrl = await uploadScreenshot(projectId, retryScreenshot)

          if (uploadedUrl) {
            screenshotUrl = uploadedUrl
            screenshotSource = "captured"
            console.log(`Screenshot captured on retry: ${screenshotUrl}`)
          }
        }
      }
    }

    // Fallback to GitHub OG image
    if (!screenshotUrl && project.repo_full_name) {
      screenshotUrl = buildGitHubOGUrl(project.repo_full_name)
      screenshotSource = "github_og"
      console.log(`Using GitHub OG fallback: ${screenshotUrl}`)
    }

    // Update project record
    const updateData: {
      screenshot_url: string | null
      screenshot_source: "captured" | "github_og" | null
      screenshot_captured_at: string | null
      live_demo_url?: string
    } = {
      screenshot_url: screenshotUrl,
      screenshot_source: screenshotSource,
      screenshot_captured_at: new Date().toISOString(),
    }

    // Update live_demo_url if provided
    if (liveDemoUrl && liveDemoUrl !== project.live_demo_url) {
      updateData.live_demo_url = liveDemoUrl
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_repos")
      .update(updateData)
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
          ? "Screenshot captured successfully"
          : "Using GitHub Open Graph image as fallback",
    })
  } catch (error) {
    console.error("Error in screenshot capture API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
