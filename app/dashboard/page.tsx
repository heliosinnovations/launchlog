"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  FolderOpen,
  BarChart2,
  Settings,
  Plus,
  Copy,
  ExternalLink,
  Star,
  GitFork,
  Loader2,
  Rocket,
  Code,
} from "lucide-react"

interface UserRepo {
  id: string
  repo_id: number
  repo_name: string
  repo_full_name: string
  repo_url: string
  repo_description: string | null
  repo_language: string | null
  repo_stars: number
  display_order: number
}

interface UserData {
  name: string
  username: string
  avatarUrl: string | null
  email: string | null
}

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

export default function DashboardPage() {
  const router = useRouter()
  const [repos, setRepos] = useState<UserRepo[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user data
      const userResponse = await fetch("/api/user")
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          router.push("/signin")
          return
        }
        throw new Error("Failed to fetch user data")
      }
      const userData = await userResponse.json()
      setUser(userData.user)

      // Fetch repos
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
    fetchData()
  }, [fetchData])

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  const profileUrl = user?.username
    ? `launchlog.com/${user.username}`
    : "launchlog.com/your-profile"
  const fullProfileUrl = user?.username
    ? `https://launchlog.com/${user.username}`
    : "#"
  const embedCode = user?.username
    ? `<script src="https://launchlog.com/embed/${user.username}.js"></script>\n<div id="launchlog-widget"></div>`
    : ""

  // Calculate stats
  const totalStars = repos.reduce((sum, repo) => sum + repo.repo_stars, 0)
  const projectCount = repos.length

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
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:-translate-y-0.5 transition-transform"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex flex-col w-[260px] fixed left-0 top-0 bottom-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 mb-10"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
            <Rocket className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-xl font-bold">LaunchLog</span>
        </Link>

        {/* Navigation */}
        <nav className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Overview
          </p>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-medium text-sm"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors font-medium text-sm"
            >
              <FolderOpen className="w-5 h-5" />
              Projects
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors font-medium text-sm"
            >
              <BarChart2 className="w-5 h-5" />
              Analytics
            </Link>
          </div>
        </nav>

        <nav>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Settings
          </p>
          <div className="space-y-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors font-medium text-sm"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name || "User"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{user?.name || "User"}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                @{user?.username || "username"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] p-6 lg:p-10 max-w-[1000px]">
        {/* Page Header */}
        <div className="mb-12">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Dashboard
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage your LaunchLog profile and track your project visibility.
          </p>
        </div>

        {/* Profile URL Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold">Your LaunchLog Profile</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
            <span
              className="flex-1 text-indigo-400 text-sm"
              style={{ fontFamily: "monospace" }}
            >
              {profileUrl}
            </span>
            <button
              onClick={() => copyToClipboard(fullProfileUrl)}
              className="p-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              title={copied ? "Copied!" : "Copy URL"}
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={fullProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {projectCount}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Showcased Projects
            </p>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              --
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Profile Views
            </p>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {totalStars}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Total Stars
            </p>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              --
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Mentions Found
            </p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Your Projects
            </h2>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add More
            </Link>
          </div>

          {repos.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No projects yet
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
                Select repositories to showcase on your LaunchLog profile
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:-translate-y-0.5 transition-transform shadow-[0_8px_24px_rgba(99,102,241,0.35)]"
              >
                <Plus className="w-5 h-5" />
                Select Your First Repository
              </Link>
            </div>
          ) : (
            /* Repos Grid */
            <div className="grid gap-4 md:grid-cols-2">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>

        {/* Embed Code Section */}
        {repos.length > 0 && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold mb-1">Embed on Your Website</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Add this code snippet to showcase your projects anywhere.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(embedCode)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)] transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div
              className="p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl overflow-x-auto"
              style={{ fontFamily: "monospace" }}
            >
              <code className="text-sm text-[var(--color-text-secondary)]">
                <span className="text-pink-400">&lt;script</span>{" "}
                <span className="text-purple-400">src</span>=
                <span className="text-green-400">
                  &quot;https://launchlog.com/embed/{user?.username}.js&quot;
                </span>
                <span className="text-pink-400">&gt;&lt;/script&gt;</span>
                <br />
                <span className="text-pink-400">&lt;div</span>{" "}
                <span className="text-purple-400">id</span>=
                <span className="text-green-400">&quot;launchlog-widget&quot;</span>
                <span className="text-pink-400">&gt;&lt;/div&gt;</span>
              </code>
            </div>

            {/* Preview Section */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Preview
              </p>
              <div className="p-8 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl min-h-[150px] flex items-center justify-center">
                <p className="text-[var(--color-text-secondary)]">
                  Widget preview will appear here
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function RepoCard({ repo }: { repo: UserRepo }) {
  const languageColor = repo.repo_language
    ? LANGUAGE_COLORS[repo.repo_language] || "#6e7681"
    : null

  return (
    <a
      href={repo.repo_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-indigo-400 transition-colors">
          {repo.repo_name}
        </h3>
        <span className="px-2 py-1 text-[11px] uppercase tracking-wide bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] rounded">
          Public
        </span>
      </div>

      {repo.repo_description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
          {repo.repo_description}
        </p>
      )}

      <div className="flex items-center gap-4">
        {repo.repo_language && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: languageColor || "#6e7681" }}
            />
            {repo.repo_language}
          </span>
        )}
        {repo.repo_stars > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            {repo.repo_stars.toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
          <GitFork className="w-3.5 h-3.5" />
          0
        </span>
      </div>
    </a>
  )
}
