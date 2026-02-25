import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import sharp from "sharp"
import { getSupabaseAdmin } from "./supabase"

/**
 * Screenshot utility functions for auto-capturing project screenshots
 * Uses Puppeteer with @sparticuz/chromium for Vercel serverless compatibility
 */

/**
 * Common demo URL patterns to look for in README files
 */
const DEMO_URL_PATTERNS = [
  // Markdown links with demo-related text
  /\[(?:demo|live demo|live site|website|try it|view demo|open app|launch|live preview)\]\(([^)]+)\)/gi,
  // Vercel deployment URLs
  /https?:\/\/[a-z0-9-]+\.vercel\.app\/?/gi,
  // Netlify deployment URLs
  /https?:\/\/[a-z0-9-]+\.netlify\.app\/?/gi,
  // GitHub Pages URLs
  /https?:\/\/[a-z0-9-]+\.github\.io\/[a-z0-9-]+\/?/gi,
  // Railway deployment URLs
  /https?:\/\/[a-z0-9-]+\.railway\.app\/?/gi,
  // Render deployment URLs
  /https?:\/\/[a-z0-9-]+\.onrender\.com\/?/gi,
  // Heroku deployment URLs
  /https?:\/\/[a-z0-9-]+\.herokuapp\.com\/?/gi,
  // Generic "Demo:" or "Live:" followed by URL
  /(?:demo|live|website|url|site):\s*(https?:\/\/[^\s\)]+)/gi,
  // Badge image links pointing to live sites
  /\[!\[.*?\]\([^)]+\)\]\((https?:\/\/(?!github\.com|shields\.io|badge)[^\s\)]+)\)/gi,
]

/**
 * URLs to exclude from demo detection (not actually demo sites)
 */
const EXCLUDED_URL_PATTERNS = [
  /github\.com/i,
  /npmjs\.com/i,
  /shields\.io/i,
  /badge/i,
  /travis-ci/i,
  /circleci/i,
  /codecov/i,
  /coveralls/i,
  /snyk\.io/i,
  /dependabot/i,
]

/**
 * Extract a demo URL from a README file content
 * Looks for common patterns like Vercel, Netlify, Heroku deployments
 * @param readme - The README content as a string
 * @returns The extracted demo URL or null if not found
 */
export function extractDemoUrl(readme: string): string | null {
  if (!readme || typeof readme !== "string") {
    return null
  }

  const foundUrls: string[] = []

  for (const pattern of DEMO_URL_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    let match

    while ((match = pattern.exec(readme)) !== null) {
      // Extract the URL from the match (either capture group 1 or the full match)
      const url = match[1] || match[0]

      // Skip excluded URLs
      const isExcluded = EXCLUDED_URL_PATTERNS.some((excludePattern) =>
        excludePattern.test(url)
      )

      if (!isExcluded && url.startsWith("http")) {
        foundUrls.push(url)
      }
    }
  }

  // Return the first valid URL found, or null
  return foundUrls.length > 0 ? foundUrls[0] : null
}

/**
 * Capture a screenshot of a URL using headless Chromium
 * Optimized for Vercel serverless environment
 * @param url - The URL to capture
 * @returns Screenshot buffer in WebP format
 */
export async function captureScreenshot(url: string): Promise<Buffer> {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided")
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(`Invalid URL format: ${url}`)
  }

  let browser = null

  try {
    // Configure Chromium for serverless environment
    // @sparticuz/chromium provides args and executablePath for serverless
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    // Set a reasonable user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    // Navigate to the URL with 10 second timeout
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 10000,
    })

    // Wait a bit for any animations to settle
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Capture screenshot as PNG first (Puppeteer doesn't support WebP directly)
    const pngBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    })

    // Convert to WebP using sharp for better compression
    const webpBuffer = await sharp(pngBuffer)
      .webp({ quality: 80 })
      .toBuffer()

    return webpBuffer
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Upload a screenshot buffer to Supabase Storage
 * @param buffer - The screenshot buffer (WebP format)
 * @param projectId - The project ID for naming the file
 * @returns The public URL of the uploaded screenshot
 */
export async function uploadToStorage(
  buffer: Buffer,
  projectId: string
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty buffer provided")
  }

  if (!projectId) {
    throw new Error("Project ID is required")
  }

  const supabase = getSupabaseAdmin()
  const fileName = `${projectId}.webp`

  // Upload to Supabase Storage bucket "project-screenshots"
  const { error } = await supabase.storage
    .from("project-screenshots")
    .upload(fileName, buffer, {
      contentType: "image/webp",
      upsert: true, // Overwrite existing file
    })

  if (error) {
    throw new Error(`Failed to upload screenshot: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("project-screenshots")
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Generate a GitHub OpenGraph preview URL as fallback
 * Uses GitHub's built-in social preview image
 * @param repoFullName - The full repository name (e.g., "owner/repo")
 * @returns The GitHub OpenGraph URL
 */
export function getGitHubPreview(repoFullName: string): string {
  if (!repoFullName || typeof repoFullName !== "string") {
    throw new Error("Invalid repository name")
  }

  // GitHub's OpenGraph image URL format
  // This generates a nice preview image with repo stats
  return `https://opengraph.githubassets.com/1/${repoFullName}`
}

/**
 * Fetch README content from GitHub API
 * @param repoFullName - The full repository name (e.g., "owner/repo")
 * @param githubToken - Optional GitHub token for private repos or higher rate limits
 * @returns The README content as a string, or null if not found
 */
export async function fetchReadmeFromGitHub(
  repoFullName: string,
  githubToken?: string
): Promise<string | null> {
  if (!repoFullName) {
    return null
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "LaunchLog/1.0",
  }

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      { headers }
    )

    if (!response.ok) {
      return null
    }

    return await response.text()
  } catch {
    return null
  }
}
