"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Star, GitFork, Check, Loader2, AlertCircle, ArrowRight } from "lucide-react"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  updated_at: string
}

// Language colors mapping
const languageColors: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3776AB",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#B07219",
  Ruby: "#701516",
  PHP: "#777BB4",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#4FC08D",
  HTML: "#E34C26",
  CSS: "#563D7C",
  SCSS: "#C6538C",
  Shell: "#89E051",
}

export default function OnboardingPage() {
  const router = useRouter()
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch repos on mount
  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("/api/github/repos")
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to sign in
            router.push("/signin")
            return
          }
          throw new Error("Failed to fetch repositories")
        }
        const data = await response.json()
        setRepos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repositories")
      } finally {
        setIsLoading(false)
      }
    }
    fetchRepos()
  }, [router])

  // Filter repos by search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos
    const query = searchQuery.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
    )
  }, [repos, searchQuery])

  // Toggle repo selection
  const toggleRepo = (repoId: number) => {
    setSelectedRepos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(repoId)) {
        newSet.delete(repoId)
      } else {
        newSet.add(repoId)
      }
      return newSet
    })
  }

  // Select all visible repos
  const selectAll = () => {
    const allIds = filteredRepos.map((repo) => repo.id)
    setSelectedRepos(new Set(allIds))
  }

  // Deselect all repos
  const deselectAll = () => {
    setSelectedRepos(new Set())
  }

  // Handle save and continue
  const handleContinue = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const selectedRepoData = repos.filter((repo) => selectedRepos.has(repo.id))

      const response = await fetch("/api/user/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos: selectedRepoData }),
      })

      if (!response.ok) {
        throw new Error("Failed to save repositories")
      }

      // Redirect to dashboard or profile
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save repositories")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle skip (continue with no repos)
  const handleSkip = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/user/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos: [] }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete onboarding")
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Choose your repos
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Select the repositories you want to showcase on your LaunchLog profile.
            You can always change this later.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Search and Actions Bar */}
          <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  aria-label="Search repositories"
                />
              </div>

              {/* Select/Deselect Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  disabled={isLoading || filteredRepos.length === 0}
                  className="px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  disabled={isLoading || selectedRepos.size === 0}
                  className="px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Selection Count */}
            {!isLoading && (
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                {selectedRepos.size} of {repos.length} repositories selected
              </p>
            )}
          </div>

          {/* Repos Grid */}
          <div className="p-4 sm:p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[var(--color-text-secondary)]">
                  Loading your repositories...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-[var(--color-text)]">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && repos.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center">
                <div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center">
                  <GitFork className="w-8 h-8 text-[var(--color-text-secondary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  No repositories found
                </h3>
                <p className="text-[var(--color-text-secondary)] max-w-md">
                  We couldn&apos;t find any public repositories in your GitHub account.
                  Create some repos and come back!
                </p>
              </div>
            )}

            {/* No Search Results */}
            {!isLoading && !error && repos.length > 0 && filteredRepos.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-center">
                <Search className="w-12 h-12 text-[var(--color-text-secondary)]" />
                <p className="text-[var(--color-text)]">
                  No repositories match &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-indigo-500 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Repos Grid */}
            {!isLoading && !error && filteredRepos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    isSelected={selectedRepos.has(repo.id)}
                    onToggle={() => toggleRepo(repo.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <button
                onClick={handleSkip}
                disabled={isSaving}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>

              <button
                onClick={handleContinue}
                disabled={isSaving || selectedRepos.size === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Repo Card Component
interface RepoCardProps {
  repo: GitHubRepo
  isSelected: boolean
  onToggle: () => void
}

function RepoCard({ repo, isSelected, onToggle }: RepoCardProps) {
  const languageColor = repo.language ? languageColors[repo.language] || "#6B7280" : null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative w-full p-4 text-left rounded-xl border-2 transition-all duration-200
        ${
          isSelected
            ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)] hover:shadow-md"
        }
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Deselect" : "Select"} ${repo.name}`}
    >
      {/* Selection Indicator */}
      <div
        className={`
          absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all
          ${
            isSelected
              ? "bg-indigo-500 text-white"
              : "bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
          }
        `}
      >
        {isSelected && <Check className="w-4 h-4" />}
      </div>

      {/* Repo Name */}
      <h3 className="font-semibold text-[var(--color-text)] pr-8 truncate mb-2">
        {repo.name}
      </h3>

      {/* Description */}
      {repo.description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
          {repo.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        {/* Language */}
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: languageColor ?? undefined }}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}

        {/* Stars */}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {formatNumber(repo.stargazers_count)}
          </span>
        )}

        {/* Forks */}
        {repo.forks_count > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            {formatNumber(repo.forks_count)}
          </span>
        )}
      </div>
    </button>
  )
}

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return num.toString()
}
