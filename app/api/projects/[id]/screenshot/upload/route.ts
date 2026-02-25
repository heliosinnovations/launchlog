import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

/**
 * Response type for the screenshot upload API
 */
interface ScreenshotUploadResponse {
  success: boolean;
  screenshot_url?: string;
  source?: "manual";
  captured_at?: string;
  error?: string;
}

/**
 * Storage bucket name for screenshots
 */
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_SCREENSHOTS || "project-screenshots";

/**
 * Allowed MIME types for uploaded images
 */
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Output image configuration
 */
const OUTPUT_CONFIG = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 80,
  format: "webp" as const,
};

/**
 * Validates the uploaded file is actually an image by checking magic bytes
 * @param buffer - File buffer to validate
 * @returns The detected MIME type or null if not a valid image
 */
function validateImageMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Processes the image: resize and convert to WebP
 * @param buffer - Original image buffer
 * @returns Processed image buffer
 */
async function processImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // Determine if resizing is needed
  const needsResize =
    (metadata.width && metadata.width > OUTPUT_CONFIG.maxWidth) ||
    (metadata.height && metadata.height > OUTPUT_CONFIG.maxHeight);

  let pipeline = image;

  if (needsResize) {
    pipeline = pipeline.resize(OUTPUT_CONFIG.maxWidth, OUTPUT_CONFIG.maxHeight, {
      fit: "inside", // Maintain aspect ratio, fit within bounds
      withoutEnlargement: true, // Don't upscale small images
    });
  }

  // Convert to WebP with quality optimization
  return pipeline
    .webp({
      quality: OUTPUT_CONFIG.quality,
      effort: 4, // Balanced compression effort (0-6)
    })
    .toBuffer();
}

/**
 * POST /api/projects/[id]/screenshot/upload
 *
 * Uploads a user-provided screenshot for a project:
 * 1. Validates user authentication
 * 2. Validates project ownership
 * 3. Validates file type (PNG, JPG, JPEG, WebP)
 * 4. Validates file size (max 5MB)
 * 5. Validates image magic bytes (security check)
 * 6. Processes image with Sharp (resize to max 1280x720, convert to WebP)
 * 7. Uploads to Supabase Storage
 * 8. Updates database with screenshot metadata
 *
 * @param request - Next.js request with multipart/form-data body
 * @param params - Route parameters containing the project ID
 * @returns JSON response with screenshot URL and metadata
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ScreenshotUploadResponse>> {
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
        { success: false, error: "Unauthorized. Please sign in to upload screenshots." },
        { status: 401 }
      );
    }

    // Get the project (user_repo) and verify ownership
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select("id, repo_full_name, user_id")
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
        { success: false, error: "Not authorized to upload screenshots for this project" },
        { status: 403 }
      );
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid form data. Please send a multipart/form-data request." },
        { status: 400 }
      );
    }

    // Get the screenshot file
    const file = formData.get("screenshot");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No screenshot file provided. Include a file with key 'screenshot'." },
        { status: 400 }
      );
    }

    // Validate file size (client-reported)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        },
        { status: 413 }
      );
    }

    // Validate MIME type (client-reported)
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed types: PNG, JPG, JPEG, WebP.`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate actual file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is 5MB.`,
        },
        { status: 413 }
      );
    }

    // Validate magic bytes to ensure it's actually an image
    const detectedType = validateImageMagicBytes(buffer);
    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image file. The file does not appear to be a valid PNG, JPG, or WebP image.",
        },
        { status: 400 }
      );
    }

    // Process image (resize and convert to WebP)
    let processedImage: Buffer;
    try {
      processedImage = await processImage(buffer);
    } catch (processingError) {
      console.error("Image processing error:", processingError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process image. Please ensure the file is a valid image.",
        },
        { status: 500 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${projectId}-${timestamp}.webp`;
    const storagePath = `${user.id}/${filename}`;

    // Delete existing screenshot if present (cleanup)
    // We ignore errors here since the old file may not exist
    const { data: existingProject } = await supabaseAdmin
      .from("user_repos")
      .select("screenshot_url")
      .eq("id", projectId)
      .single();

    if (existingProject?.screenshot_url) {
      try {
        // Extract path from URL
        const urlParts = existingProject.screenshot_url.split(`${STORAGE_BUCKET}/`);
        if (urlParts.length > 1) {
          await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([urlParts[1]]);
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, processedImage, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Screenshot upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload screenshot to storage. Please try again.",
        },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded screenshot
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    // Update database with screenshot metadata
    const capturedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("user_repos")
      .update({
        screenshot_url: publicUrl,
        screenshot_source: "manual",
        screenshot_captured_at: capturedAt,
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Database update error:", updateError);
      // Screenshot is uploaded but DB update failed
      return NextResponse.json({
        success: true,
        screenshot_url: publicUrl,
        source: "manual",
        captured_at: capturedAt,
        error: "Screenshot saved but database update failed. Please try again.",
      });
    }

    return NextResponse.json({
      success: true,
      screenshot_url: publicUrl,
      source: "manual",
      captured_at: capturedAt,
    });
  } catch (error) {
    console.error("Error in screenshot upload API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
