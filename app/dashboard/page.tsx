"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
  Copy,
  ExternalLink,
  Plus,
  Loader2,
  Zap,
  Code,
  Menu,
  X,
  User,
} from "lucide-react"
import DashboardFooter from "@/components/DashboardFooter"
import ProjectScreenshotCard, { ProjectData } from "@/components/ProjectScreenshotCard"
import { ToastContainer, useToast } from "@/components/Toast"

// UserRepo type alias for ProjectData
type UserRepo = ProjectData

interface User {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
    name?: string
    user_name?: string
    preferred_username?: string
  }
  identities?: Array<{
    provider: string
    identity_data?: {
      avatar_url?: string
      full_name?: string
      name?: string
      user_name?: string
    }
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [repos, setRepos] = useState<UserRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const fetchUserAndRepos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user data
      const userResponse = await fetch("/api/auth/user")
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          router.push("/signin")
          return
        }
        throw new Error("Failed to fetch user data")
      }
      const userData = await userResponse.json()
      setUser(userData.user)

      // Fetch user's saved repos
      const reposResponse = await fetch("/api/user/repos")
      if (!reposResponse.ok) {
        throw new Error("Failed to fetch repositories")
      }
      const reposData = await reposResponse.json()
      setRepos(reposData.repos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUserAndRepos()
  }, [fetchUserAndRepos])

  const getUsername = () => {
    if (!user) return "user"
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.user_name ||
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0] ||
      "user"
    )
  }

  const getDisplayName = () => {
    if (!user) return "User"
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.full_name ||
      githubIdentity?.identity_data?.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      getUsername()
    )
  }

  const getAvatarUrl = () => {
    if (!user) return null
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.avatar_url || user.user_metadata?.avatar_url
    )
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const profileUrl = `launchlog.com/${getUsername()}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(`https://${text}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const response = await fetch("/api/auth/signout", { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to sign out")
      }
      router.push("/")
    } catch {
      setSigningOut(false)
      setError("Failed to sign out. Please try again.")
    }
  }

  const totalStars = repos.reduce((sum, repo) => sum + (repo.repo_stars || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => fetchUserAndRepos()}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
        {/* Logo + Close Button */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <Zap className="w-[18px] h-[18px] text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              LaunchLog
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Overview
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-indigo-500/15 text-indigo-500 font-medium text-sm mb-1"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all mb-1"
          >
            <FolderKanban className="w-5 h-5" />
            Projects
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </Link>
        </nav>

        <nav className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Settings
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        {/* User Info */}
        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            {getAvatarUrl() ? (
              <Image
                src={getAvatarUrl()!}
                alt={getDisplayName()}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {getDisplayName()}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                @{getUsername()}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all disabled:opacity-50"
              title="Sign out"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] lg:ml-[260px]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Left side: Menu button (mobile) + Logo (mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                LaunchLog
              </span>
            </div>
          </div>

          {/* Right side: User info + Sign out */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info - hidden on very small screens, shown on sm+ */}
            <div className="hidden sm:flex items-center gap-3">
              {getAvatarUrl() ? (
                <Image
                  src={getAvatarUrl()!}
                  alt={getDisplayName()}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-tight">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">
                  @{getUsername()}
                </p>
              </div>
            </div>

            {/* View Profile link - hidden on mobile */}
            <Link
              href={`/${getUsername()}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">View Profile</span>
            </Link>

            {/* Mobile avatar (visible only on xs screens) */}
            <div className="sm:hidden">
              {getAvatarUrl() ? (
                <Image
                  src={getAvatarUrl()!}
                  alt={getDisplayName()}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials()}
                </div>
              )}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              title="Sign out"
            >
              {signingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-6 lg:p-10 max-w-[1200px]">
        {/* Page Header */}
        <div className="mb-12">
          <h1
            className="text-3xl lg:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Dashboard
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base lg:text-lg">
            Manage your LaunchLog profile and track your project visibility.
          </p>
        </div>

        {/* Profile URL Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <span className="font-semibold text-sm">Your LaunchLog Profile</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 rounded-full text-xs font-medium text-green-500 w-fit">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
            <span className="flex-1 font-mono text-sm lg:text-base text-indigo-500 truncate">
              {profileUrl}
            </span>
            <button
              onClick={() => copyToClipboard(profileUrl)}
              className="p-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-all"
              title={copied ? "Copied!" : "Copy URL"}
            >
              <Copy className="w-[18px] h-[18px]" />
            </button>
            <Link
              href={`/${getUsername()}`}
              target="_blank"
              className="p-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-all"
              title="Open profile"
            >
              <ExternalLink className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div
              className="text-2xl lg:text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {repos.length}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Showcased Projects
            </div>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div
              className="text-2xl lg:text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              --
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Profile Views
            </div>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div
              className="text-2xl lg:text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {totalStars}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Total Stars
            </div>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <div
              className="text-2xl lg:text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              --
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Mentions Found
            </div>
          </div>
        </div>

        {/* Selected Repos Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Your Projects
          </h2>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)] transition-all w-fit"
          >
            <Plus className="w-4 h-4" />
            Add More
          </Link>
        </div>

        {/* Repos Grid or Empty State */}
        {repos.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center mb-12">
            <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-8 h-8 text-[var(--color-text-secondary)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
              Select repositories from your GitHub account to showcase on your
              LaunchLog profile.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Select Repositories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
            {repos.map((repo) => (
              <ProjectScreenshotCard
                key={repo.id}
                project={repo}
                onScreenshotUpdate={fetchUserAndRepos}
                showSuccess={showSuccess}
                showError={showError}
              />
            ))}
          </div>
        )}

        {/* Embed Code Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold mb-1">Embed on Your Website</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Add this code snippet to showcase your projects anywhere.
              </p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  `<script src="https://launchlog.com/embed/${getUsername()}.js"></script>\n<div id="launchlog-widget"></div>`
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)] transition-all w-fit"
            >
              <Copy className="w-4 h-4" />
              Copy Code
            </button>
          </div>
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <code>
              <span className="text-pink-400">&lt;script</span>{" "}
              <span className="text-purple-400">src</span>=
              <span className="text-green-400">
                &quot;https://launchlog.com/embed/{getUsername()}.js&quot;
              </span>
              <span className="text-pink-400">&gt;&lt;/script&gt;</span>
              <br />
              <span className="text-pink-400">&lt;div</span>{" "}
              <span className="text-purple-400">id</span>=
              <span className="text-green-400">&quot;launchlog-widget&quot;</span>
              <span className="text-pink-400">&gt;&lt;/div&gt;</span>
            </code>
          </div>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Preview
            </div>
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
              <p className="text-[var(--color-text-secondary)] text-center">
                Widget preview will appear here
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="lg:ml-[260px] mt-auto">
        <DashboardFooter />
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
