"use client"

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react"
import Image from "next/image"
import {
  X,
  Upload,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Crop,
} from "lucide-react"

interface ScreenshotUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onUploadSuccess: () => void
}

type UploadStatus = "idle" | "uploading" | "success" | "error"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const IDEAL_ASPECT_RATIO = 16 / 9

export default function ScreenshotUploadModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onUploadSuccess,
}: ScreenshotUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [aspectRatioWarning, setAspectRatioWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadStatus("idle")
    setUploadProgress(0)
    setErrorMessage(null)
    setIsDragging(false)
    setAspectRatioWarning(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Please upload a PNG, JPG, or WebP image.`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`
    }
    return null
  }, [])

  const checkAspectRatio = useCallback((file: File) => {
    const img = document.createElement("img")
    img.onload = () => {
      const ratio = img.width / img.height
      const difference = Math.abs(ratio - IDEAL_ASPECT_RATIO)
      setAspectRatioWarning(difference > 0.2) // Allow 0.2 tolerance
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }, [])

  const processFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        setErrorMessage(error)
        setUploadStatus("error")
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setErrorMessage(null)
      setUploadStatus("idle")
      checkAspectRatio(file)
    },
    [validateFile, checkAspectRatio]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setUploadStatus("uploading")
    setUploadProgress(0)
    setErrorMessage(null)

    // Simulate progress for UX (actual upload happens in one request)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("screenshot", selectedFile)

      const response = await fetch(
        `/api/projects/${projectId}/screenshot/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      clearInterval(progressInterval)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload screenshot")
      }

      setUploadProgress(100)
      setUploadStatus("success")

      // Notify parent of success
      setTimeout(() => {
        onUploadSuccess()
        handleClose()
      }, 1500)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload screenshot"
      )
    }
  }, [selectedFile, projectId, onUploadSuccess, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Upload Screenshot
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] truncate max-w-[300px]">
              {projectName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          {!previewUrl && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-[var(--color-border)] hover:border-indigo-500/50 hover:bg-[var(--color-surface-elevated)]"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isDragging
                      ? "bg-indigo-500/20"
                      : "bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  <Upload
                    className={`w-6 h-6 ${
                      isDragging ? "text-indigo-500" : "text-[var(--color-text-secondary)]"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium mb-1">
                    {isDragging ? "Drop image here" : "Drag & drop your screenshot"}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  PNG, JPG, WebP • Max 5MB • 16:9 recommended
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                <Image
                  src={previewUrl}
                  alt="Screenshot preview"
                  fill
                  className="object-contain"
                />
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-elevated)] rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                  <span className="text-sm truncate">{selectedFile?.name}</span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] flex-shrink-0 ml-2">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>

              {/* Aspect Ratio Warning */}
              {aspectRatioWarning && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <Crop className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Image is not 16:9 ratio. It will be auto-cropped to fit.
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              {uploadStatus === "uploading" && (
                <div className="space-y-2">
                  <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-[var(--color-text-secondary)]">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Success State */}
              {uploadStatus === "success" && (
                <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Upload successful!</span>
                </div>
              )}

              {/* Error State */}
              {uploadStatus === "error" && errorMessage && (
                <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Action Buttons */}
              {uploadStatus !== "success" && (
                <div className="flex gap-3">
                  <button
                    onClick={resetState}
                    disabled={uploadStatus === "uploading"}
                    className="flex-1 px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-[var(--color-bg)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploadStatus === "uploading"}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg"
                  >
                    {uploadStatus === "uploading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      "Upload Screenshot"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Initial Error State */}
          {!previewUrl && uploadStatus === "error" && errorMessage && (
            <div className="flex items-start gap-2 px-3 py-2 mt-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
