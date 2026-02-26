import { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getActivityStatus } from "@/lib/activity-status";
import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProjectsGrid } from "./ProjectsGrid";
import { ProjectsFilters } from "./ProjectsFilters";

// Force dynamic rendering so profile updates are immediately visible
export const dynamic = "force-dynamic";

interface UserRepo {
  id: string;
  repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  repo_description: string | null;
  repo_language: string | null;
  repo_stars: number;
  repo_forks?: number;
  display_order: number;
  screenshot_url: string | null;
  screenshot_source: string | null;
  demo_url: string | null;
  updated_at: string | null;
  created_at: string | null;
}

// UserProfile type reserved for future bio display
// interface UserProfile { id, user_id, bio, twitter_url, website_url, linkedin_url, github_username }

interface PageProps {
  params: Promise<{ username: string }>;
}

interface SupabaseUser {
  id: string;
  email: string | null;
  raw_user_meta_data: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    user_name?: string;
    preferred_username?: string;
  };
  github_username?: string;
}

interface MentionCount {
  hackernews: number;
  reddit: number;
}

// Generate SEO metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: `@${username}'s Projects | LaunchLog`,
      description: `View all projects from @${username} on LaunchLog`,
    };
  }

  const displayName =
    user.raw_user_meta_data?.full_name ||
    user.raw_user_meta_data?.name ||
    username;

  return {
    title: `${displayName}'s Projects | LaunchLog`,
    description: `Explore all projects built by ${displayName}. View GitHub stats, activity status, and social mentions.`,
    openGraph: {
      title: `${displayName}'s Projects`,
      description: `Explore all projects built by ${displayName}`,
      type: "profile",
    },
  };
}

/**
 * Get user by GitHub username using direct indexed lookup on user_profiles table.
 */
async function getUserByUsername(
  username: string,
): Promise<SupabaseUser | null> {
  const supabase = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, github_username")
    .ilike("github_username", username)
    .single();

  if (profileError || !profile) {
    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile by username:", profileError);
    }
    return null;
  }

  const { data: authUser, error: authError } =
    await supabase.auth.admin.getUserById(profile.user_id);

  if (authError || !authUser?.user) {
    console.error("Error fetching auth user:", authError);
    return null;
  }

  const user = authUser.user;

  return {
    id: user.id,
    email: user.email || null,
    raw_user_meta_data: user.user_metadata || {},
    github_username: profile.github_username || undefined,
  };
}

/**
 * Get ALL user repos (not limited like profile page)
 */
async function getAllUserRepos(userId: string): Promise<UserRepo[]> {
  const supabase = getSupabaseAdmin();
  const { data: repos, error } = await supabase
    .from("user_repos")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching repos:", error);
    return [];
  }

  return repos || [];
}

// Note: getUserProfile is available for future use (bio display in sidebar)
// async function getUserProfile(userId: string): Promise<UserProfile | null> {...}

/**
 * Get mention counts for all repos
 */
async function getMentionCounts(
  repoIds: string[],
): Promise<Record<string, MentionCount>> {
  if (repoIds.length === 0) return {};

  const supabase = getSupabaseAdmin();
  const { data: mentions, error } = await supabase
    .from("project_mentions")
    .select("project_id, source_type")
    .in("project_id", repoIds);

  if (error) {
    console.error("Error fetching mentions:", error);
    return {};
  }

  const counts: Record<string, MentionCount> = {};

  if (mentions) {
    for (const mention of mentions) {
      if (!counts[mention.project_id]) {
        counts[mention.project_id] = { hackernews: 0, reddit: 0 };
      }
      if (mention.source_type === "hackernews") {
        counts[mention.project_id].hackernews++;
      } else if (mention.source_type === "reddit") {
        counts[mention.project_id].reddit++;
      }
    }
  }

  return counts;
}

/**
 * Extract unique languages from repos
 */
function extractLanguages(repos: UserRepo[]): string[] {
  const languages = new Set<string>();
  repos.forEach((repo) => {
    if (repo.repo_language) {
      languages.add(repo.repo_language);
    }
  });
  return Array.from(languages).sort();
}

/**
 * Calculate language counts
 */
function getLanguageCounts(repos: UserRepo[]): Record<string, number> {
  const counts: Record<string, number> = {};
  repos.forEach((repo) => {
    if (repo.repo_language) {
      counts[repo.repo_language] = (counts[repo.repo_language] || 0) + 1;
    }
  });
  return counts;
}

/**
 * Calculate activity status counts
 */
function getStatusCounts(
  repos: UserRepo[],
): Record<"active" | "recent" | "archived", number> {
  const counts = { active: 0, recent: 0, archived: 0 };
  repos.forEach((repo) => {
    const status = getActivityStatus(repo.updated_at, repo.created_at);
    // Treat "new" as "active" for counting purposes
    if (status === "new") {
      counts.active++;
    } else {
      counts[status]++;
    }
  });
  return counts;
}

export default async function ProjectsPage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    // Show a "coming soon" placeholder
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
            <FolderOpen className="w-5 h-5" />
            Setting up LaunchLog profile...
          </div>
        </div>
      </div>
    );
  }

  // Fetch repos - profile is reserved for future bio/social links display
  const repos = await getAllUserRepos(user.id);

  const repoIds = repos.map((r) => r.id);
  const mentionCounts = await getMentionCounts(repoIds);

  const displayName =
    user.raw_user_meta_data?.full_name ||
    user.raw_user_meta_data?.name ||
    user.raw_user_meta_data?.user_name ||
    username;
  const avatarUrl = user.raw_user_meta_data?.avatar_url;

  // Calculate stats
  const totalStars = repos.reduce((sum, repo) => sum + repo.repo_stars, 0);
  const totalMentions = Object.values(mentionCounts).reduce(
    (sum, counts) => sum + counts.hackernews + counts.reddit,
    0,
  );
  const languages = extractLanguages(repos);
  const languageCounts = getLanguageCounts(repos);
  const statusCounts = getStatusCounts(repos);

  // Enrich repos with activity status and mentions
  const enrichedRepos = repos.map((repo) => ({
    ...repo,
    activityStatus: getActivityStatus(repo.updated_at, repo.created_at),
    mentions: mentionCounts[repo.id] || { hackernews: 0, reddit: 0 },
  }));

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-4 sm:px-8 py-4 sticky top-0 bg-[var(--color-bg)] backdrop-blur-sm z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-md flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                />
              </svg>
            </div>
            <span
              className="font-bold text-lg"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              LaunchLog
            </span>
          </Link>
          <div className="flex gap-3 items-center">
            <Link
              href="#"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="#"
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Create Your Portfolio
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[100px] lg:h-fit space-y-6">
            {/* User Summary Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full mb-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center mb-4">
                  <span
                    className="text-2xl text-white font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {displayName}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                @{username}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {repos.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Projects
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {totalStars >= 1000
                      ? `${(totalStars / 1000).toFixed(1)}k`
                      : totalStars}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Stars
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {totalMentions}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Mentions
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface-elevated)] rounded-lg">
                  <div
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {languages.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Languages
                  </div>
                </div>
              </div>

              {/* Back to profile */}
              <Link
                href={`/${username}`}
                className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to profile
              </Link>
            </div>

            {/* Filters */}
            <ProjectsFilters
              languages={languages}
              languageCounts={languageCounts}
              statusCounts={statusCounts}
            />
          </aside>

          {/* Main Content */}
          <div className="min-w-0">
            <ProjectsGrid projects={enrichedRepos} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 text-center text-sm text-[var(--color-text-secondary)]">
          Portfolio powered by{" "}
          <Link href="/" className="text-[var(--color-primary)] font-semibold">
            LaunchLog
          </Link>{" "}
          &bull;{" "}
          <Link href="#" className="text-[var(--color-primary)]">
            Create your free portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
}
