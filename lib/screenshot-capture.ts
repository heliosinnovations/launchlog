/**
 * Client-side screenshot capture utility
 *
 * Issue #124: Replace server-side Playwright with client-side capture
 *
 * This module provides screenshot capture functionality using iframes and Canvas API.
 * Due to CORS restrictions, cross-origin URLs may not render correctly in the iframe.
 * For cross-origin URLs, we use html2canvas as a fallback or return null to trigger
 * the GitHub OG image fallback.
 */

import html2canvas from "html2canvas"

/**
 * Screenshot capture configuration
 */
export const SCREENSHOT_CONFIG = {
  viewport: { width: 1280, height: 720 },
  timeout: 10000, // 10 seconds
  storageBucket: "project-screenshots",
  maxFileSize: 5 * 1024 * 1024, // 5MB
}

/**
 * Build GitHub Open Graph image URL as fallback
 */
export function buildGitHubOGUrl(repoFullName: string): string {
  return `https://opengraph.githubassets.com/1/${repoFullName}`
}

/**
 * Validate URL for screenshot capture
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Generate a unique filename for the screenshot
 */
export function generateFilename(projectId: string): string {
  const timestamp = Date.now()
  return `${projectId}_${timestamp}.png`
}

/**
 * Capture screenshot of a URL using iframe + html2canvas
 *
 * Due to browser security restrictions (CORS), this approach has limitations:
 * - Same-origin URLs: Works fully
 * - Cross-origin URLs with permissive CORS: May work partially
 * - Cross-origin URLs without CORS headers: Will fail silently
 *
 * When capture fails, returns null to allow fallback to GitHub OG image.
 *
 * @param url - The URL to capture
 * @returns A Blob containing the PNG screenshot, or null if capture failed
 */
export async function captureScreenshot(url: string): Promise<Blob | null> {
  if (!isValidUrl(url)) {
    console.error("Invalid URL for screenshot capture:", url)
    return null
  }

  return new Promise((resolve) => {
    // Create hidden iframe container
    const container = document.createElement("div")
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${SCREENSHOT_CONFIG.viewport.width}px;
      height: ${SCREENSHOT_CONFIG.viewport.height}px;
      overflow: hidden;
      z-index: -9999;
    `

    // Create iframe
    const iframe = document.createElement("iframe")
    iframe.style.cssText = `
      width: ${SCREENSHOT_CONFIG.viewport.width}px;
      height: ${SCREENSHOT_CONFIG.viewport.height}px;
      border: none;
    `
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin")

    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.warn("Screenshot capture timed out for:", url)
      cleanup()
      resolve(null)
    }, SCREENSHOT_CONFIG.timeout)

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId)
      if (container.parentElement) {
        document.body.removeChild(container)
      }
    }

    // Handle iframe load
    iframe.onload = async () => {
      try {
        // Wait for content to render
        await new Promise((r) => setTimeout(r, 2000))

        // Try to access iframe content (will fail for cross-origin)
        let targetElement: HTMLElement | null = null

        try {
          // Attempt same-origin access
          if (iframe.contentDocument && iframe.contentDocument.body) {
            targetElement = iframe.contentDocument.body
          }
        } catch {
          // Cross-origin access denied - expected for most external URLs
          console.info(
            "Cross-origin iframe access denied (expected for external URLs):",
            url
          )
        }

        if (targetElement) {
          // Same-origin: use html2canvas on iframe content
          const canvas = await html2canvas(targetElement, {
            width: SCREENSHOT_CONFIG.viewport.width,
            height: SCREENSHOT_CONFIG.viewport.height,
            windowWidth: SCREENSHOT_CONFIG.viewport.width,
            windowHeight: SCREENSHOT_CONFIG.viewport.height,
            useCORS: true,
            allowTaint: false,
            logging: false,
          })

          canvas.toBlob(
            (blob) => {
              cleanup()
              resolve(blob)
            },
            "image/png",
            1.0
          )
        } else {
          // Cross-origin: cannot capture, return null for GitHub OG fallback
          console.info(
            "Cannot capture cross-origin URL, falling back to GitHub OG:",
            url
          )
          cleanup()
          resolve(null)
        }
      } catch (error) {
        console.error("Screenshot capture failed:", error)
        cleanup()
        resolve(null)
      }
    }

    // Handle iframe error
    iframe.onerror = () => {
      console.error("Failed to load URL in iframe:", url)
      cleanup()
      resolve(null)
    }

    // Add to DOM and load URL
    container.appendChild(iframe)
    document.body.appendChild(container)
    iframe.src = url
  })
}

/**
 * Convert a Blob to base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert blob to base64"))
      }
    }
    reader.onerror = () => reject(new Error("FileReader error"))
    reader.readAsDataURL(blob)
  })
}
