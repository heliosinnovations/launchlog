import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";
export const revalidate = 3600; // Cache for 1 hour

/**
 * Widget API Endpoint
 * Returns user data and projects in a lightweight JSON format for embeddable widgets.
 *
 * GET /api/widget/[username]
 *
 * Response format:
 * {
 *   user: { username, avatar, displayName },
 *   projects: [{ name, description, screenshot, stars, language, repoUrl, demoUrl, mentions }]
 * }
 */

interface UserRepo {
  id: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  repo_description: string | null;
  repo_language: string | null;
  repo_stars: number;
  screenshot_url: string | null;
  demo_url: string | null;
}

type MentionCounts = Record<string, number>;

interface WidgetProject {
  name: string;
  description: string | null;
  screenshot: string | null;
  stars: number;
  language: string | null;
  repoUrl: string;
  demoUrl: string | null;
  mentions: {
    hackernews?: number;
    reddit?: number;
    total?: number;
  };
}

interface WidgetResponse {
  user: {
    username: string;
    avatar: string | null;
    displayName: string;
  };
  projects: WidgetProject[];
}

interface ErrorResponse {
  error: string;
  code: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse<WidgetResponse | ErrorResponse>> {
  const { username } = await params;

  // CORS headers for embeddable widgets
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    "Content-Type": "application/json",
  };

  try {
    const supabase = getSupabaseAdmin();

    // Get user profile by username
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, github_username")
      .ilike("github_username", username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404, headers }
      );
    }

    // Get user details from auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(profile.user_id);

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404, headers }
      );
    }

    const user = authUser.user;
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      profile.github_username;

    // Get user repos (visible projects)
    const { data: repos, error: reposError } = await supabase
      .from("user_repos")
      .select("id, repo_name, repo_full_name, repo_url, repo_description, repo_language, repo_stars, screenshot_url, demo_url")
      .eq("user_id", profile.user_id)
      .order("display_order", { ascending: true });

    if (reposError) {
      console.error("Error fetching repos:", reposError);
      return NextResponse.json(
        { error: "Failed to fetch projects", code: "FETCH_ERROR" },
        { status: 500, headers }
      );
    }

    // Get mention counts for all projects
    const projectIds = repos?.map((r: UserRepo) => r.id) || [];
    let mentionsByProject: Record<string, MentionCounts> = {};

    if (projectIds.length > 0) {
      const { data: mentions } = await supabase
        .from("project_mentions")
        .select("project_id, source_type")
        .in("project_id", projectIds);

      if (mentions) {
        // Group mentions by project_id and source_type
        mentionsByProject = mentions.reduce((acc: Record<string, MentionCounts>, mention: { project_id: string; source_type: string }) => {
          if (!acc[mention.project_id]) {
            acc[mention.project_id] = {};
          }
          acc[mention.project_id][mention.source_type] =
            (acc[mention.project_id][mention.source_type] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // Build projects array with mentions
    const projects: WidgetProject[] = (repos || []).map((repo: UserRepo) => {
      const repoMentions: MentionCounts = mentionsByProject[repo.id] || {};
      const hnCount = repoMentions["hackernews"] || 0;
      const redditCount = repoMentions["reddit"] || 0;
      const totalMentions = hnCount + redditCount;

      // Generate fallback screenshot URL if none exists
      const screenshotUrl = repo.screenshot_url ||
        (repo.repo_full_name ? `https://opengraph.githubassets.com/1/${repo.repo_full_name}` : null);

      return {
        name: repo.repo_name,
        description: repo.repo_description,
        screenshot: screenshotUrl,
        stars: repo.repo_stars,
        language: repo.repo_language,
        repoUrl: repo.repo_url,
        demoUrl: repo.demo_url,
        mentions: {
          hackernews: hnCount || undefined,
          reddit: redditCount || undefined,
          total: totalMentions || undefined,
        },
      };
    });

    const response: WidgetResponse = {
      user: {
        username: profile.github_username,
        avatar: avatarUrl,
        displayName,
      },
      projects,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (error) {
    console.error("Widget API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500, headers }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
