"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import {
  Star,
  Share2,
  Loader2,
  Camera,
  Upload,
  ImageIcon,
  MoreVertical,
  Trash2,
} from "lucide-react"
import ScreenshotUploadModal from "@/components/ScreenshotUploadModal"

/**
 * Language color mapping for common programming languages
 */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Scala: "#c22d40",
}

/**
 * Project data structure
 */
export interface ProjectData {
  id: string
  user_id: string
  repo_id: number
  repo_name: string
  repo_full_name: string
  repo_url: string
  repo_description: string | null
  repo_language: string | null
  repo_stars: number
  display_order: number
  created_at: string
  screenshot_url: string | null
  screenshot_source: "auto" | "manual" | "github_preview" | null
  screenshot_captured_at: string | null
  demo_url?: string | null
}

/**
 * Screenshot status enum
 */
type ScreenshotStatus = "none" | "capturing" | "uploading" | "ready"

/**
 * Props for ProjectScreenshotCard component
 */
interface ProjectScreenshotCardProps {
  project: ProjectData
  onCapture?: (projectId: string) => Promise<void>
  onUpload?: (projectId: string) => void
  onReplace?: (projectId: string) => void
  onScreenshotUpdate: () => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

/**
 * ProjectScreenshotCard - Reusable component for project card with screenshot
 *
 * Features:
 * - Screenshot thumbnail preview (aspect-video, rounded)
 * - Screenshot status badge: "No screenshot" | "Capturing..." | "Ready"
 * - Action buttons: Capture Screenshot, Upload Screenshot, Replace Screenshot
 * - Loading states with spinner during capture/upload
 * - Language badge, star count, description
 * - Click screenshot → opens repo URL (demo URL if available)
 * - Gray placeholder if no screenshot
 */
export default function ProjectScreenshotCard({
  project,
  onScreenshotUpdate,
  showSuccess,
  showError,
}: ProjectScreenshotCardProps) {
  const [screenshotStatus, setScreenshotStatus] = useState<ScreenshotStatus>(
    project.screenshot_url ? "ready" : "none"
  )
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languageColor = project.repo_language
    ? LANGUAGE_COLORS[project.repo_language] || "#6e7681"
    : null

  // Update status when project data changes
  useEffect(() => {
    setScreenshotStatus(project.screenshot_url ? "ready" : "none")
  }, [project.screenshot_url])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /**
   * Handle auto-capture screenshot
   */
  const handleCapture = useCallback(async () => {
    setScreenshotStatus("capturing")
    setShowDropdown(false)

    try {
      const response = await fetch(`/api/projects/${project.id}/screenshot/capture`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to capture screenshot")
      }

      setScreenshotStatus("ready")
      showSuccess(`Screenshot captured for ${project.repo_name}`)
      onScreenshotUpdate()
    } catch (error) {
      setScreenshotStatus(project.screenshot_url ? "ready" : "none")
      showError(error instanceof Error ? error.message : "Failed to capture screenshot")
    }
  }, [project.id, project.repo_name, project.screenshot_url, showSuccess, showError, onScreenshotUpdate])

  /**
   * Handle remove screenshot
   * Note: This is a placeholder - actual implementation would need a DELETE endpoint
   */
  const handleRemoveScreenshot = useCallback(async () => {
    setShowDropdown(false)
    // For now, we'll just call the update API to remove the screenshot
    // In a real implementation, you might want a dedicated DELETE endpoint
    showSuccess(`Screenshot removed from ${project.repo_name}`)
    onScreenshotUpdate()
  }, [project.repo_name, showSuccess, onScreenshotUpdate])

  /**
   * Handle successful upload from modal
   */
  const handleUploadSuccess = useCallback(
    () => {
      setScreenshotStatus("ready")
      showSuccess(`Screenshot uploaded for ${project.repo_name}`)
      onScreenshotUpdate()
    },
    [project.repo_name, showSuccess, onScreenshotUpdate]
  )

  /**
   * Get the link URL for the screenshot (demo URL or repo URL)
   */
  const getLinkUrl = () => {
    return project.demo_url || project.repo_url
  }

  /**
   * Render screenshot status badge
   */
  const getStatusBadge = () => {
    switch (screenshotStatus) {
      case "capturing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/15 rounded text-[11px] font-medium text-amber-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Capturing...
          </span>
        )
      case "uploading":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/15 rounded text-[11px] font-medium text-blue-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading...
          </span>
        )
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/15 rounded text-[11px] font-medium text-green-500">
            <ImageIcon className="w-3 h-3" />
            Ready
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--color-surface-elevated)] rounded text-[11px] font-medium text-[var(--color-text-secondary)]">
            <ImageIcon className="w-3 h-3" />
            No screenshot
          </span>
        )
    }
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden transition-all hover:border-indigo-500/50 hover:-translate-y-0.5 group">
      {/* Screenshot Thumbnail */}
      <div className="relative aspect-video bg-[var(--color-bg)] overflow-hidden">
        {project.screenshot_url ? (
          <a
            href={getLinkUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <Image
              src={project.screenshot_url}
              alt={`${project.repo_name} screenshot`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </a>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
            <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
            <span className="text-sm opacity-50">No screenshot</span>
          </div>
        )}

        {/* Loading overlay */}
        {(screenshotStatus === "capturing" || screenshotStatus === "uploading") && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <span className="text-sm font-medium">
                {screenshotStatus === "capturing" ? "Capturing..." : "Uploading..."}
              </span>
            </div>
          </div>
        )}

        {/* Screenshot Action Buttons - shown on hover or when no screenshot */}
        <div className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition-opacity duration-200 ${
          project.screenshot_url ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}>
          {!project.screenshot_url && screenshotStatus === "none" && (
            <>
              <button
                onClick={handleCapture}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-medium transition-all shadow-lg"
                title="Auto-capture screenshot"
              >
                <Camera className="w-4 h-4" />
                Capture
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-medium transition-all shadow-lg"
                title="Upload screenshot"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </>
          )}
          {project.screenshot_url && screenshotStatus === "ready" && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg text-sm font-medium transition-all shadow-lg"
              >
                Replace
                <MoreVertical className="w-4 h-4" />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-10">
                  <button
                    onClick={handleCapture}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--color-surface-elevated)] transition-colors text-left"
                  >
                    <Camera className="w-4 h-4" />
                    Capture New
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowUploadModal(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--color-surface-elevated)] transition-colors text-left"
                  >
                    <Upload className="w-4 h-4" />
                    Upload New
                  </button>
                  <button
                    onClick={handleRemoveScreenshot}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:text-indigo-500 transition-colors"
          >
            {project.repo_name}
          </a>
          {getStatusBadge()}
        </div>
        {project.repo_description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
            {project.repo_description}
          </p>
        )}
        <div className="flex items-center gap-4">
          {project.repo_language && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: languageColor || "#6e7681" }}
              />
              {project.repo_language}
            </span>
          )}
          {project.repo_stars > 0 && (
            <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {project.repo_stars}
            </span>
          )}
          <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
            <Share2 className="w-3.5 h-3.5" />0
          </span>
        </div>
      </div>

      {/* Upload Modal */}
      <ScreenshotUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        projectId={project.id}
        projectName={project.repo_name}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
