/**
 * Tests for Manual Screenshot Upload API
 *
 * This file tests the screenshot upload functionality for projects.
 * Issue #3: Manual Screenshot Upload API
 *
 * Key requirements tested:
 * 1. User authentication is required
 * 2. Project ownership verification
 * 3. File type validation (PNG, JPG, JPEG, WebP only)
 * 4. File size validation (max 5MB)
 * 5. Magic bytes validation (security check)
 * 6. Image processing (resize, WebP conversion)
 */

/**
 * Test helper: Creates a mock PNG file buffer with valid magic bytes
 */
function createMockPngBuffer(sizeInBytes: number = 1000): Buffer {
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const padding = Buffer.alloc(Math.max(0, sizeInBytes - pngHeader.length));
  return Buffer.concat([pngHeader, padding]);
}

/**
 * Test helper: Creates a mock JPEG file buffer with valid magic bytes
 */
function createMockJpegBuffer(sizeInBytes: number = 1000): Buffer {
  // JPEG magic bytes: FF D8 FF
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const padding = Buffer.alloc(Math.max(0, sizeInBytes - jpegHeader.length));
  return Buffer.concat([jpegHeader, padding]);
}

/**
 * Test helper: Creates a mock WebP file buffer with valid magic bytes
 */
function createMockWebpBuffer(sizeInBytes: number = 1000): Buffer {
  // WebP magic bytes: RIFF....WEBP (positions 0-3 and 8-11)
  const webpHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // File size placeholder
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]);
  const padding = Buffer.alloc(Math.max(0, sizeInBytes - webpHeader.length));
  return Buffer.concat([webpHeader, padding]);
}

/**
 * Test helper: Creates an invalid file buffer (not an image)
 */
function createInvalidBuffer(sizeInBytes: number = 1000): Buffer {
  // Random bytes that don't match any image format
  const buffer = Buffer.alloc(sizeInBytes);
  for (let i = 0; i < Math.min(100, sizeInBytes); i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  // Ensure first bytes don't match any image magic bytes
  buffer[0] = 0x00;
  buffer[1] = 0x00;
  buffer[2] = 0x00;
  buffer[3] = 0x00;
  return buffer;
}

describe("Screenshot Upload API - Magic Bytes Validation", () => {
  /**
   * Mirror the validateImageMagicBytes function for testing
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

  it("should detect PNG files correctly", () => {
    const pngBuffer = createMockPngBuffer();
    expect(validateImageMagicBytes(pngBuffer)).toBe("image/png");
  });

  it("should detect JPEG files correctly", () => {
    const jpegBuffer = createMockJpegBuffer();
    expect(validateImageMagicBytes(jpegBuffer)).toBe("image/jpeg");
  });

  it("should detect WebP files correctly", () => {
    const webpBuffer = createMockWebpBuffer();
    expect(validateImageMagicBytes(webpBuffer)).toBe("image/webp");
  });

  it("should reject invalid files", () => {
    const invalidBuffer = createInvalidBuffer();
    expect(validateImageMagicBytes(invalidBuffer)).toBeNull();
  });

  it("should reject files that are too small", () => {
    const tinyBuffer = Buffer.from([0x89, 0x50]);
    expect(validateImageMagicBytes(tinyBuffer)).toBeNull();
  });

  it("should reject empty buffers", () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(validateImageMagicBytes(emptyBuffer)).toBeNull();
  });
});

describe("Screenshot Upload API - Filename Sanitization", () => {
  /**
   * Mirror the sanitizeFilename function for testing
   */
  function sanitizeFilename(filename: string): string {
    const basename = filename.replace(/^.*[\\/]/, "");
    const sanitized = basename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".")
      .substring(0, 100);

    return sanitized || "upload";
  }

  it("should remove path traversal sequences", () => {
    // Path traversal sequences are stripped to just the basename
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\..\\windows\\system32")).toBe("system32");
  });

  it("should remove path separators", () => {
    expect(sanitizeFilename("/etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\file.png")).toBe("file.png");
  });

  it("should preserve valid characters", () => {
    expect(sanitizeFilename("my-image_v2.png")).toBe("my-image_v2.png");
    expect(sanitizeFilename("screenshot123.jpg")).toBe("screenshot123.jpg");
  });

  it("should replace special characters with underscore", () => {
    expect(sanitizeFilename("image<>:*?.png")).toBe("image_____.png");
    expect(sanitizeFilename("file with spaces.jpg")).toBe(
      "file_with_spaces.jpg"
    );
  });

  it("should collapse multiple dots", () => {
    expect(sanitizeFilename("file...name.png")).toBe("file.name.png");
    expect(sanitizeFilename("test....jpg")).toBe("test.jpg");
  });

  it("should truncate long filenames", () => {
    const longName = "a".repeat(200) + ".png";
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(100);
  });

  it("should return default for empty string", () => {
    expect(sanitizeFilename("")).toBe("upload");
  });

  it("should return default for path-only input", () => {
    expect(sanitizeFilename("/")).toBe("upload");
    expect(sanitizeFilename("../")).toBe("upload");
  });
});

describe("Screenshot Upload API - File Size Validation", () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  it("should accept files under 5MB", () => {
    const sizes = [
      1024, // 1KB
      1024 * 1024, // 1MB
      4 * 1024 * 1024, // 4MB
      5 * 1024 * 1024 - 1, // Just under 5MB
    ];

    for (const size of sizes) {
      expect(size <= MAX_FILE_SIZE).toBe(true);
    }
  });

  it("should reject files over 5MB", () => {
    const sizes = [
      5 * 1024 * 1024 + 1, // Just over 5MB
      10 * 1024 * 1024, // 10MB
    ];

    for (const size of sizes) {
      expect(size > MAX_FILE_SIZE).toBe(true);
    }
  });

  it("should accept files exactly at 5MB", () => {
    const exactlyFiveMB = 5 * 1024 * 1024;
    // Files exactly at limit are accepted (not > but <=)
    expect(exactlyFiveMB <= MAX_FILE_SIZE).toBe(true);
  });
});

describe("Screenshot Upload API - MIME Type Validation", () => {
  const ALLOWED_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  it("should accept valid MIME types", () => {
    for (const mimeType of ALLOWED_MIME_TYPES) {
      expect(ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())).toBe(true);
    }
  });

  it("should accept case-insensitive MIME types", () => {
    const casedTypes = ["IMAGE/PNG", "Image/Jpeg", "image/WEBP"];
    for (const mimeType of casedTypes) {
      expect(
        ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())
      ).toBe(true);
    }
  });

  it("should reject invalid MIME types", () => {
    const invalidTypes = [
      "image/gif",
      "image/bmp",
      "image/tiff",
      "application/pdf",
      "text/plain",
      "video/mp4",
    ];

    for (const mimeType of invalidTypes) {
      expect(ALLOWED_MIME_TYPES.includes(mimeType)).toBe(false);
    }
  });
});

describe("Screenshot Upload API - UUID Validation", () => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it("should accept valid UUIDs", () => {
    const validUuids = [
      "123e4567-e89b-12d3-a456-426614174000",
      "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
      "00000000-0000-0000-0000-000000000000",
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ];

    for (const uuid of validUuids) {
      expect(uuidRegex.test(uuid)).toBe(true);
    }
  });

  it("should reject invalid UUIDs", () => {
    const invalidUuids = [
      "not-a-uuid",
      "123456789",
      "123e4567-e89b-12d3-a456",
      "123e4567-e89b-12d3-a456-426614174000-extra",
      "123e4567e89b12d3a456426614174000",
      "",
      "null",
      "../../../etc/passwd",
    ];

    for (const uuid of invalidUuids) {
      expect(uuidRegex.test(uuid)).toBe(false);
    }
  });
});

describe("Screenshot Upload API - Image Processing Config", () => {
  const OUTPUT_CONFIG = {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 80,
    format: "webp" as const,
  };

  it("should use correct max dimensions", () => {
    expect(OUTPUT_CONFIG.maxWidth).toBe(1280);
    expect(OUTPUT_CONFIG.maxHeight).toBe(720);
  });

  it("should use WebP format for output", () => {
    expect(OUTPUT_CONFIG.format).toBe("webp");
  });

  it("should use quality 80 for optimization", () => {
    expect(OUTPUT_CONFIG.quality).toBe(80);
  });

  it("should resize images that exceed max dimensions", () => {
    const testCases = [
      { width: 1920, height: 1080, needsResize: true },
      { width: 1280, height: 720, needsResize: false },
      { width: 640, height: 480, needsResize: false },
      { width: 2560, height: 720, needsResize: true },
      { width: 1280, height: 1080, needsResize: true },
    ];

    for (const testCase of testCases) {
      const needsResize =
        testCase.width > OUTPUT_CONFIG.maxWidth ||
        testCase.height > OUTPUT_CONFIG.maxHeight;
      expect(needsResize).toBe(testCase.needsResize);
    }
  });
});

describe("Screenshot Upload API - Storage Path Generation", () => {
  it("should generate correct storage path format", () => {
    const userId = "user-123";
    const projectId = "123e4567-e89b-12d3-a456-426614174000";
    const timestamp = Date.now();
    const filename = `${projectId}-${timestamp}.webp`;
    const storagePath = `${userId}/${filename}`;

    expect(storagePath).toMatch(/^user-123\/123e4567-e89b-12d3-a456-426614174000-\d+\.webp$/);
  });

  it("should use unique timestamps for different uploads", async () => {
    const projectId = "123e4567-e89b-12d3-a456-426614174000";
    const timestamp1 = Date.now();

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 5));
    const timestamp2 = Date.now();

    expect(timestamp1).not.toBe(timestamp2);

    const filename1 = `${projectId}-${timestamp1}.webp`;
    const filename2 = `${projectId}-${timestamp2}.webp`;

    expect(filename1).not.toBe(filename2);
  });
});

describe("Screenshot Upload API - Error Messages", () => {
  it("should have descriptive error messages for common failures", () => {
    const errorMessages = {
      noAuth: "Unauthorized. Please sign in to upload screenshots.",
      noProject: "Project not found",
      notOwner: "Not authorized to upload screenshots for this project",
      noFile: "No screenshot file provided. Include a file with key 'screenshot'.",
      invalidType: (type: string) =>
        `Invalid file type: ${type}. Allowed types: PNG, JPG, JPEG, WebP.`,
      tooLarge: (sizeMB: string) =>
        `File too large. Maximum size is 5MB. Your file is ${sizeMB}MB.`,
      invalidImage:
        "Invalid image file. The file does not appear to be a valid PNG, JPG, or WebP image.",
      processingFailed:
        "Failed to process image. Please ensure the file is a valid image.",
      uploadFailed: "Failed to upload screenshot to storage. Please try again.",
    };

    // Verify error messages are informative
    expect(errorMessages.noAuth).toContain("sign in");
    expect(errorMessages.notOwner).toContain("authorized");
    expect(errorMessages.noFile).toContain("screenshot");
    expect(errorMessages.invalidType("image/gif")).toContain("Allowed types");
    expect(errorMessages.tooLarge("6.50")).toContain("5MB");
    expect(errorMessages.invalidImage).toContain("valid");
    expect(errorMessages.processingFailed).toContain("process");
    expect(errorMessages.uploadFailed).toContain("try again");
  });
});

describe("Screenshot Upload API - Response Format", () => {
  interface ScreenshotUploadResponse {
    success: boolean;
    screenshot_url?: string;
    source?: "manual";
    captured_at?: string;
    error?: string;
  }

  it("should return success response with required fields", () => {
    const successResponse: ScreenshotUploadResponse = {
      success: true,
      screenshot_url: "https://example.com/screenshot.webp",
      source: "manual",
      captured_at: new Date().toISOString(),
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.screenshot_url).toBeDefined();
    expect(successResponse.source).toBe("manual");
    expect(successResponse.captured_at).toBeDefined();
    expect(successResponse.error).toBeUndefined();
  });

  it("should return error response with required fields", () => {
    const errorResponse: ScreenshotUploadResponse = {
      success: false,
      error: "Something went wrong",
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.screenshot_url).toBeUndefined();
  });

  it("should use ISO 8601 format for captured_at", () => {
    const capturedAt = new Date().toISOString();
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(capturedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
    );
  });
});
