"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Star, Check, Loader2, ChevronRight, Code } from "lucide-react"

interface Repo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  stars: number
  forks: number
  topics: string[]
  updatedAt: string
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

export default function OnboardingPage() {
  const router = useRouter()
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/github/repos")

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/signin")
          return
        }
        throw new Error("Failed to fetch repositories")
      }

      const data = await response.json()
      setRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos

    const query = searchQuery.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query) ||
        repo.topics.some((t) => t.toLowerCase().includes(query))
    )
  }, [repos, searchQuery])

  function toggleRepo(repoId: number) {
    setSelectedRepos((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (selectedRepos.size === 0) {
      setError("Please select at least one repository")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const selectedRepoData = repos
        .filter((repo) => selectedRepos.has(repo.id))
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
        }))

      const response = await fetch("/api/user/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repos: selectedRepoData }),
      })

      if (!response.ok) {
        throw new Error("Failed to save selections")
      }

      const data = await response.json()
      router.push(data.redirectUrl || "/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">
            Loading your repositories...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Select Your Best Work
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
            Choose the repositories you want to showcase on your LaunchLog
            profile. You can change this later.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Search by name, language, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Selection count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {filteredRepos.length} repositories
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          <p className="text-sm font-medium text-indigo-500">
            {selectedRepos.size} selected
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Repo grid */}
        <div className="grid gap-3 mb-8">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
              <Code className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--color-text-secondary)]">
                {searchQuery
                  ? "No repositories match your search"
                  : "No public repositories found"}
              </p>
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                selected={selectedRepos.has(repo.id)}
                onToggle={() => toggleRepo(repo.id)}
              />
            ))
          )}
        </div>

        {/* Submit button */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={selectedRepos.size === 0 || saving}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue to Profile
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function RepoCard({
  repo,
  selected,
  onToggle,
}: {
  repo: Repo
  selected: boolean
  onToggle: () => void
}) {
  const languageColor = repo.language
    ? LANGUAGE_COLORS[repo.language] || "#6e7681"
    : null

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "bg-indigo-500/10 border-indigo-500"
          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/30"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            selected
              ? "bg-indigo-500 border-indigo-500"
              : "border-[var(--color-border)]"
          }`}
        >
          {selected && <Check className="w-4 h-4 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-[var(--color-text)] truncate">
              {repo.name}
            </h3>
            {repo.stars > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                {repo.stars.toLocaleString()}
              </span>
            )}
          </div>

          {repo.description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-2">
              {repo.description}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {repo.language && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: languageColor || "#6e7681" }}
                />
                {repo.language}
              </span>
            )}
            {repo.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
