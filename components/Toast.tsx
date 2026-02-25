"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle, AlertCircle, X, Info } from "lucide-react"

export type ToastType = "success" | "error" | "info"

export interface ToastData {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onDismiss(toast.id), 300)
  }, [toast.id, onDismiss])

  useEffect(() => {
    const duration = toast.duration ?? 5000
    const timer = setTimeout(handleDismiss, duration)
    return () => clearTimeout(timer)
  }, [toast.duration, handleDismiss])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgColors = {
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-red-500/10 border-red-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        bgColors[toast.type]
      } ${
        isExiting
          ? "opacity-0 translate-x-4"
          : "opacity-100 translate-x-0"
      }`}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setToasts((prev) => [...prev, { id, type, message, duration }])
      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback(
    (message: string, duration?: number) => addToast("success", message, duration),
    [addToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => addToast("error", message, duration),
    [addToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => addToast("info", message, duration),
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  }
}
