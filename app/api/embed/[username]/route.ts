import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// CORS headers for embedding on external sites
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // CDN cache: 1 hour, stale-while-revalidate for 24 hours
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface WidgetProject {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  demo_url: string | null;
  screenshot_url: string | null;
  full_name: string;
  mentions: {
    hackernews: number;
    reddit: number;
  };
  updated_at: string;
}

interface WidgetData {
  username: string;
  display_name: string;
  avatar_url: string | null;
  projects: WidgetProject[];
  last_updated: string;
  total_mentions: number;
}

/**
 * GET /api/embed/[username]
 * Returns widget data as JSON for a given username
 *
 * Query params:
 * - limit: number of projects (default: 6, max: 12)
 * - style: grid | horizontal | feature (for analytics)
 * - theme: light | dark | auto (for analytics)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 12);

    const supabase = getSupabaseAdmin();

    // Get user profile by GitHub username (case-insensitive)
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, github_username")
      .ilike("github_username", username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404, headers: corsHeaders },
      );
    }

    // Get user auth data for display name and avatar
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(profile.user_id);

    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404, headers: corsHeaders },
      );
    }

    const user = authUser.user;

    // Get user repos with mentions counts
    const { data: repos, error: reposError } = await supabase
      .from("user_repos")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (reposError) {
      console.error("Error fetching repos:", reposError);
      return NextResponse.json(
        { error: "Failed to fetch projects", code: "FETCH_ERROR" },
        { status: 500, headers: corsHeaders },
      );
    }

    // Get mention counts for all repos
    const repoIds = (repos || []).map((r) => r.id);
    const mentionCounts: Record<
      string,
      { hackernews: number; reddit: number }
    > = {};

    if (repoIds.length > 0) {
      const { data: mentions } = await supabase
        .from("project_mentions")
        .select("project_id, source_type")
        .in("project_id", repoIds);

      if (mentions) {
        for (const mention of mentions) {
          if (!mentionCounts[mention.project_id]) {
            mentionCounts[mention.project_id] = { hackernews: 0, reddit: 0 };
          }
          if (mention.source_type === "hackernews") {
            mentionCounts[mention.project_id].hackernews++;
          } else if (mention.source_type === "reddit") {
            mentionCounts[mention.project_id].reddit++;
          }
        }
      }
    }

    // Build widget data
    const projects: WidgetProject[] = (repos || []).map((repo) => ({
      id: repo.id,
      name: repo.repo_name,
      description: repo.repo_description,
      language: repo.repo_language,
      stars: repo.repo_stars,
      url: repo.repo_url,
      demo_url: repo.demo_url,
      screenshot_url:
        repo.screenshot_url ||
        (repo.repo_full_name
          ? `https://opengraph.githubassets.com/1/${repo.repo_full_name}`
          : null),
      full_name: repo.repo_full_name,
      mentions: mentionCounts[repo.id] || { hackernews: 0, reddit: 0 },
      updated_at: repo.updated_at || new Date().toISOString(),
    }));

    const totalMentions = projects.reduce(
      (sum, p) => sum + p.mentions.hackernews + p.mentions.reddit,
      0,
    );

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      profile.github_username ||
      username;

    const widgetData: WidgetData = {
      username: profile.github_username || username,
      display_name: displayName,
      avatar_url: user.user_metadata?.avatar_url || null,
      projects,
      last_updated: new Date().toISOString(),
      total_mentions: totalMentions,
    };

    return NextResponse.json(widgetData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Widget API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500, headers: corsHeaders },
    );
  }
}
