"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Loader2, ImageOff } from "lucide-react"
import {
  captureScreenshot,
  blobToBase64,
  buildGitHubOGUrl,
} from "@/lib/screenshot-capture"

interface ProjectScreenshotProps {
  projectId: string
  repoFullName: string
  screenshotUrl: string | null
  screenshotSource: "captured" | "github_og" | null
  liveDemoUrl: string | null
  canCapture: boolean
  onScreenshotUpdated?: (url: string, source: "captured" | "github_og") => void
}

/**
 * ProjectScreenshot component displays a project screenshot with fallback to GitHub OG image
 * and allows admins to capture new screenshots using client-side capture
 *
 * Issue #124: Uses client-side screenshot capture instead of server-side Playwright
 */
export default function ProjectScreenshot({
  projectId,
  repoFullName,
  screenshotUrl,
  screenshotSource,
  liveDemoUrl,
  canCapture,
  onScreenshotUpdated,
}: ProjectScreenshotProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentScreenshotUrl, setCurrentScreenshotUrl] = useState(screenshotUrl)
  const [currentSource, setCurrentSource] = useState(screenshotSource)
  const [imageError, setImageError] = useState(false)

  // Determine the display URL with fallbacks
  const displayUrl =
    imageError || !currentScreenshotUrl
      ? buildGitHubOGUrl(repoFullName)
      : currentScreenshotUrl

  const handleCapture = async () => {
    if (!liveDemoUrl) {
      setError("No live demo URL configured")
      return
    }

    setIsCapturing(true)
    setError(null)

    try {
      // Attempt client-side screenshot capture
      const blob = await captureScreenshot(liveDemoUrl)

      let response: Response

      if (blob) {
        // Successfully captured screenshot - upload to server
        const base64Data = await blobToBase64(blob)

        response = await fetch(`/api/projects/${projectId}/screenshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshot_data: base64Data }),
        })
      } else {
        // Client-side capture failed (likely CORS) - use GitHub OG fallback
        response = await fetch(`/api/projects/${projectId}/screenshot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use_github_fallback: true }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save screenshot")
      }

      setCurrentScreenshotUrl(data.screenshot_url)
      setCurrentSource(data.screenshot_source)
      setImageError(false)

      if (onScreenshotUpdated) {
        onScreenshotUpdated(data.screenshot_url, data.screenshot_source)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed")
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="relative">
      {/* Screenshot Image */}
      <div className="relative aspect-video bg-[var(--color-surface-elevated)] rounded-lg overflow-hidden">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Project screenshot"
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageOff className="w-8 h-8 text-[var(--color-text-secondary)]" />
          </div>
        )}

        {/* Source badge */}
        {currentSource && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
            {currentSource === "captured" ? "Live Screenshot" : "GitHub Preview"}
          </div>
        )}
      </div>

      {/* Capture button for admins */}
      {canCapture && (
        <div className="mt-2">
          <button
            onClick={handleCapture}
            disabled={isCapturing || !liveDemoUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                {currentScreenshotUrl ? "Recapture" : "Capture Screenshot"}
              </>
            )}
          </button>

          {!liveDemoUrl && (
            <p className="mt-1 text-xs text-amber-500">
              Set a live demo URL to capture screenshots
            </p>
          )}

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  )
}
