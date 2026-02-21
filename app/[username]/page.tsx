import { getSupabaseAdmin } from "@/lib/supabase"
import Image from "next/image"
import { Star, ExternalLink, GitBranch } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

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

interface PageProps {
  params: Promise<{ username: string }>
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

async function getUserByUsername(username: string) {
  const supabase = getSupabaseAdmin()
  // First try to find user by GitHub username in accounts table
  const { data: account } = await supabase
    .from("accounts")
    .select("userId")
    .eq("provider", "github")
    .ilike("providerAccountId", username)
    .single()

  if (account) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", account.userId)
      .single()
    return user
  }

  // Fallback: try to find user by name
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .ilike("name", username)
    .single()

  return user
}

async function getUserRepos(userId: string): Promise<UserRepo[]> {
  const supabase = getSupabaseAdmin()
  const { data: repos } = await supabase
    .from("user_repos")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true })

  return repos || []
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params

  // For now, show a placeholder if we can't find the user
  // In production, this would query the database
  const user = await getUserByUsername(username)

  if (!user) {
    // Show a "coming soon" placeholder instead of 404
    // This allows the redirect to work even before the user has a profile
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl text-white font-bold">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            @{username}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg mb-8">
            Profile coming soon
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)]">
            <GitBranch className="w-5 h-5" />
            Setting up LaunchLog profile...
          </div>
        </div>
      </div>
    )
  }

  const repos = await getUserRepos(user.id)

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="text-center mb-12">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || username}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-[var(--color-border)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl text-white font-bold">
                {(user.name || username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {user.name || username}
          </h1>
          {user.email && (
            <p className="text-[var(--color-text-secondary)]">{user.email}</p>
          )}
        </div>

        {/* Projects section */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-500" />
            Showcased Projects
          </h2>

          {repos.length === 0 ? (
            <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
              <p className="text-[var(--color-text-secondary)]">
                No projects showcased yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {repos.map((repo) => (
                <ProjectCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ repo }: { repo: UserRepo }) {
  const languageColor = repo.repo_language
    ? LANGUAGE_COLORS[repo.repo_language] || "#6e7681"
    : null

  return (
    <a
      href={repo.repo_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-indigo-500/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-indigo-400 transition-colors">
          {repo.repo_name}
        </h3>
        <ExternalLink className="w-4 h-4 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      {repo.repo_description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
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
      </div>
    </a>
  )
}
