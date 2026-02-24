import { getSupabaseAdmin } from "@/lib/supabase"
import Image from "next/image"
import { Star, ExternalLink, GitBranch } from "lucide-react"
import MentionsRow from "@/app/components/projects/MentionsRow"

// Force dynamic rendering so profile updates are immediately visible
// Bio and social links are fetched fresh on each request
export const dynamic = 'force-dynamic'

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

interface UserProfile {
  id: string
  user_id: string
  bio: string | null
  twitter_url: string | null
  website_url: string | null
  linkedin_url: string | null
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

interface SupabaseUser {
  id: string
  email: string | null
  raw_user_meta_data: {
    avatar_url?: string
    full_name?: string
    name?: string
    user_name?: string
    preferred_username?: string
  }
  github_username?: string
}

async function getUserByUsername(
  username: string
): Promise<SupabaseUser | null> {
  const supabase = getSupabaseAdmin()

  // Query auth.users through Supabase admin API
  // Look for users where the GitHub username matches
  const { data: users, error } = await supabase.auth.admin.listUsers()

  if (error || !users) {
    console.error("Error listing users:", error)
    return null
  }

  // Find user by GitHub username in their metadata or identities
  const user = users.users.find((u) => {
    const githubIdentity = u.identities?.find(
      (identity) => identity.provider === "github"
    )
    const githubUsername =
      githubIdentity?.identity_data?.user_name ||
      u.user_metadata?.user_name ||
      u.user_metadata?.preferred_username

    return (
      githubUsername?.toLowerCase() === username.toLowerCase() ||
      u.user_metadata?.name?.toLowerCase() === username.toLowerCase()
    )
  })

  if (!user) {
    return null
  }

  // Get GitHub username for the profile
  const githubIdentity = user.identities?.find(
    (identity) => identity.provider === "github"
  )
  const githubUsername =
    githubIdentity?.identity_data?.user_name ||
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username

  return {
    id: user.id,
    email: user.email || null,
    raw_user_meta_data: user.user_metadata || {},
    github_username: githubUsername,
  }
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

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseAdmin()
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error)
    return null
  }

  return profile || null
}

// Social link icon components
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  )
}

function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// Helper function to extract display name from URL
function extractDisplayFromUrl(url: string, type: 'twitter' | 'website' | 'linkedin'): string {
  try {
    const urlObj = new URL(url)
    switch (type) {
      case 'twitter':
        // Extract @username from twitter.com/username or x.com/username
        const twitterPath = urlObj.pathname.replace(/^\//, '').split('/')[0]
        return `@${twitterPath}`
      case 'linkedin':
        // Extract name from linkedin.com/in/username
        const linkedinPath = urlObj.pathname.replace(/^\/in\//, '').replace(/^\//, '').split('/')[0]
        return linkedinPath
      case 'website':
        // Show domain without www
        return urlObj.hostname.replace(/^www\./, '')
      default:
        return url
    }
  } catch {
    return url
  }
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

  const [repos, profile] = await Promise.all([
    getUserRepos(user.id),
    getUserProfile(user.id),
  ])

  const displayName =
    user.raw_user_meta_data?.full_name ||
    user.raw_user_meta_data?.name ||
    user.raw_user_meta_data?.user_name ||
    username
  const avatarUrl = user.raw_user_meta_data?.avatar_url
  const githubUrl = user.github_username
    ? `https://github.com/${user.github_username}`
    : null

  // Check if any social links are available
  const hasSocialLinks =
    githubUrl || profile?.twitter_url || profile?.website_url || profile?.linkedin_url

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile header - matching showcase-page-v2.html design */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 pb-12 border-b border-[var(--color-border)]">
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-full flex-shrink-0 mx-auto md:mx-0"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex-shrink-0 flex items-center justify-center mx-auto md:mx-0">
              <span
                className="text-[40px] text-white font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Name */}
            <h1
              className="text-[32px] font-bold mb-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {displayName}
            </h1>

            {/* Handle */}
            <p className="text-[var(--color-text-secondary)] text-base mb-3">
              @{username}
            </p>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-[var(--color-text)] text-base leading-relaxed max-w-[600px] mb-5 mx-auto md:mx-0">
                {profile.bio}
              </p>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {/* GitHub Link */}
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm font-medium hover:text-indigo-500 transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" />
                    {user.github_username}
                  </a>
                )}

                {/* Twitter Link */}
                {profile?.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm font-medium hover:text-indigo-500 transition-colors"
                  >
                    <TwitterIcon className="w-4 h-4" />
                    {extractDisplayFromUrl(profile.twitter_url, 'twitter')}
                  </a>
                )}

                {/* Website Link */}
                {profile?.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm font-medium hover:text-indigo-500 transition-colors"
                  >
                    <WebsiteIcon className="w-4 h-4" />
                    {extractDisplayFromUrl(profile.website_url, 'website')}
                  </a>
                )}

                {/* LinkedIn Link */}
                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm font-medium hover:text-indigo-500 transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
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
    <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-indigo-500/50 transition-all duration-200 group">
      <a
        href={repo.repo_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
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

      {/* Mentions row - displays HN and Reddit mention counts */}
      <MentionsRow projectId={repo.id} projectName={repo.repo_name} />
    </div>
  )
}
