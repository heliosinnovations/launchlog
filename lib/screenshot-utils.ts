/**
 * Screenshot utilities for capturing project screenshots.
 * Uses Puppeteer Core with @sparticuz/chromium for Vercel serverless deployment.
 */
import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

/**
 * Configuration constants for screenshot capture
 */
const SCREENSHOT_CONFIG = {
  viewport: { width: 1280, height: 720 },
  navigationTimeout: 10000, // 10 seconds
  waitUntil: "networkidle0" as const,
  screenshotType: "webp" as const,
  screenshotQuality: 80,
};

/**
 * Regex patterns for extracting demo URLs from README content.
 * Ordered by specificity - most specific patterns first.
 */
const DEMO_URL_PATTERNS = [
  // Markdown links with demo/live keywords
  /\[(?:demo|live(?:\s+demo)?|preview|website|try(?:\s+it)?)\]\(([^)]+)\)/gi,
  // "Demo: https://..." or "Live: https://..." patterns
  /(?:demo|live|preview|website):\s*(https?:\/\/[^\s]+)/gi,
  // Vercel deployment URLs
  /https:\/\/[a-z0-9-]+\.vercel\.app/gi,
  // Netlify deployment URLs
  /https:\/\/[a-z0-9-]+\.netlify\.app/gi,
  // GitHub Pages URLs
  /https:\/\/[a-z0-9-]+\.github\.io(?:\/[^\s)]+)?/gi,
];

/**
 * Extracts a demo URL from a GitHub repository.
 * Checks the repo's homepage field first, then parses the README for demo links.
 *
 * @param repoFullName - Full repository name (e.g., "owner/repo")
 * @returns The extracted demo URL or null if not found
 */
export async function extractDemoUrl(
  repoFullName: string
): Promise<string | null> {
  try {
    // First, try to get the repo's homepage field via GitHub API
    const repoResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LaunchLog/1.0",
        },
      }
    );

    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      // GitHub homepage field is the most reliable source
      if (repoData.homepage && isValidDemoUrl(repoData.homepage)) {
        return repoData.homepage;
      }
    }

    // Fallback: fetch and parse the README
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "LaunchLog/1.0",
        },
      }
    );

    if (!readmeResponse.ok) {
      console.warn(`Failed to fetch README for ${repoFullName}`);
      return null;
    }

    const readmeContent = await readmeResponse.text();
    return extractDemoUrlFromText(readmeContent);
  } catch (error) {
    console.error(`Error extracting demo URL for ${repoFullName}:`, error);
    return null;
  }
}

/**
 * Extracts demo URL from text content using regex patterns.
 *
 * @param text - Text content to search (typically README content)
 * @returns The first valid demo URL found or null
 */
function extractDemoUrlFromText(text: string): string | null {
  for (const pattern of DEMO_URL_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;

    const match = pattern.exec(text);
    if (match) {
      // For capture groups (patterns with parentheses), use the captured group
      // For non-capturing patterns, use the full match
      const url = match[1] || match[0];
      if (isValidDemoUrl(url)) {
        return url;
      }
    }
  }
  return null;
}

/**
 * Validates if a URL is a valid demo URL (not GitHub, not README anchors, etc.)
 *
 * @param url - URL to validate
 * @returns true if the URL is a valid demo URL
 */
function isValidDemoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTP or HTTPS
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Exclude GitHub URLs (not demos)
    if (parsed.hostname.includes("github.com")) {
      return false;
    }

    // Exclude common non-demo URLs
    const excludedHosts = [
      "npmjs.com",
      "npm.im",
      "badge.fury.io",
      "shields.io",
      "codecov.io",
      "coveralls.io",
      "travis-ci.org",
      "circleci.com",
      "snyk.io",
    ];

    if (excludedHosts.some((host) => parsed.hostname.includes(host))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Captures a screenshot of a web page using Puppeteer.
 * Configured for Vercel serverless environment using @sparticuz/chromium.
 *
 * @param url - URL of the page to capture
 * @returns Buffer containing the WebP screenshot
 * @throws Error if screenshot capture fails
 */
export async function captureScreenshot(url: string): Promise<Buffer> {
  let browser: Browser | null = null;

  try {
    // Launch browser with serverless-compatible configuration
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: SCREENSHOT_CONFIG.viewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page: Page = await browser.newPage();

    // Set viewport explicitly
    await page.setViewport(SCREENSHOT_CONFIG.viewport);

    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: SCREENSHOT_CONFIG.waitUntil,
      timeout: SCREENSHOT_CONFIG.navigationTimeout,
    });

    // Capture screenshot as WebP for smaller file size
    const screenshot = await page.screenshot({
      type: SCREENSHOT_CONFIG.screenshotType,
      quality: SCREENSHOT_CONFIG.screenshotQuality,
      fullPage: false, // Only capture viewport
    });

    return Buffer.from(screenshot);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generates a GitHub preview image URL (Open Graph image) for a repository.
 * GitHub automatically generates social preview images for repositories.
 *
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns URL to the GitHub OpenGraph preview image
 */
export function getGitHubPreview(owner: string, repo: string): string {
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}

/**
 * Type for screenshot capture result
 */
export interface ScreenshotResult {
  screenshot: Buffer | null;
  source: "auto" | "github_preview";
  url: string;
  error?: string;
}

/**
 * Attempts to capture a screenshot with automatic fallback.
 * First tries to capture from demo URL, then falls back to GitHub preview.
 *
 * @param repoFullName - Full repository name (e.g., "owner/repo")
 * @returns ScreenshotResult with the screenshot buffer and metadata
 */
export async function captureWithFallback(
  repoFullName: string
): Promise<ScreenshotResult> {
  const [owner, repo] = repoFullName.split("/");

  // Try to extract and capture from demo URL
  try {
    const demoUrl = await extractDemoUrl(repoFullName);

    if (demoUrl) {
      try {
        const screenshot = await captureScreenshot(demoUrl);
        return {
          screenshot,
          source: "auto",
          url: demoUrl,
        };
      } catch (captureError) {
        console.warn(
          `Failed to capture screenshot from ${demoUrl}:`,
          captureError
        );
        // Fall through to GitHub preview
      }
    }
  } catch (extractError) {
    console.warn(`Failed to extract demo URL for ${repoFullName}:`, extractError);
    // Fall through to GitHub preview
  }

  // Fallback: Use GitHub preview image
  const githubPreviewUrl = getGitHubPreview(owner, repo);

  try {
    // Fetch the GitHub preview image
    const response = await fetch(githubPreviewUrl, {
      headers: {
        "User-Agent": "LaunchLog/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub preview fetch failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      screenshot: Buffer.from(arrayBuffer),
      source: "github_preview",
      url: githubPreviewUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch GitHub preview for ${repoFullName}:`, error);
    return {
      screenshot: null,
      source: "github_preview",
      url: githubPreviewUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
