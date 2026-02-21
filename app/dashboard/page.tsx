import { redirect } from "next/navigation"
import { auth, signOut } from "@/auth"
import { supabase } from "@/lib/supabase"
import { LogOut, ExternalLink, Star, GitFork, Settings } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  // Fetch user's selected projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", session.user.id)
    .order("display_order", { ascending: true })

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Welcome, {session.user.name || "Developer"}!
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Manage your LaunchLog profile and showcased projects
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-elevated)] transition-all"
            >
              <Settings className="w-4 h-4" />
              Edit Projects
            </a>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Your Showcased Projects ({projects.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center">
              <GitFork className="w-8 h-8 text-[var(--color-text-secondary)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              No projects yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Add some repositories to showcase on your profile
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              Select Projects
            </a>
          </div>
        )}
      </div>
    </main>
  )
}

interface Project {
  id: string
  repo_name: string
  repo_full_name: string
  description: string | null
  primary_language: string | null
  stars: number
  forks: number
}

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
}

function ProjectCard({ project }: { project: Project }) {
  const languageColor = project.primary_language
    ? languageColors[project.primary_language] || "#6B7280"
    : null

  return (
    <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-text-secondary)] hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-[var(--color-text)] truncate">
          {project.repo_name}
        </h3>
        <a
          href={`https://github.com/${project.repo_full_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors flex-shrink-0"
          aria-label={`View ${project.repo_name} on GitHub`}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {project.description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        {project.primary_language && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: languageColor ?? undefined }}
              aria-hidden="true"
            />
            {project.primary_language}
          </span>
        )}

        {project.stars > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {project.stars}
          </span>
        )}

        {project.forks > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            {project.forks}
          </span>
        )}
      </div>
    </div>
  )
}
