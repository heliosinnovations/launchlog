import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Reddit JSON API response types
 * Reddit provides a JSON API by appending .json to URLs
 * Documentation: https://www.reddit.com/dev/api/
 */
interface RedditPost {
  kind: string;
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    subreddit: string;
    selftext?: string;
  };
}

interface RedditSearchResponse {
  kind: string;
  data: {
    children: RedditPost[];
    after: string | null;
    before: string | null;
    dist: number;
  };
}

/**
 * Mention response format as specified in the issue
 */
interface Mention {
  id: string;
  source_type: "reddit";
  source_url: string;
  title: string;
  score: number;
  comment_count: number;
  author: string;
  published_at: string;
}

interface MentionsResponse {
  mentions: Mention[];
  total: number;
}

/**
 * Rate limiter to respect Reddit's rate limits
 * Reddit API allows ~60 requests per minute for unauthenticated requests
 * Using a conservative 30 req/min to be safe
 */
class RateLimiter {
  private tokens: number;
  private _lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(maxRequestsPerMinute: number = 30) {
    this.maxTokens = maxRequestsPerMinute;
    this.tokens = maxRequestsPerMinute;
    this._lastRefill = Date.now();
    this.refillRate = maxRequestsPerMinute / 60000; // per minute to per ms
  }

  /**
   * Get the timestamp of the last token refill/access
   * Used for cleanup of inactive rate limiters
   */
  get lastRefill(): number {
    return this._lastRefill;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const timePassed = now - this._lastRefill;

    // Refill tokens based on time passed
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + timePassed * this.refillRate,
    );
    this._lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for a token to become available
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.tokens = 0;
    this._lastRefill = Date.now();
  }
}

/**
 * Per-user rate limiters to ensure each user gets their own 30 req/min budget
 * Prevents one user's requests from consuming another user's rate limit tokens
 */
const userRateLimiters = new Map<string, RateLimiter>();

/**
 * Cleanup interval duration for inactive rate limiters (5 minutes)
 */
const RATE_LIMITER_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Inactivity threshold after which a rate limiter is considered stale (5 minutes)
 */
const RATE_LIMITER_INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Get or create a rate limiter for a specific user
 * Each user gets their own 30 req/min budget
 */
function getUserRateLimiter(userId: string): RateLimiter {
  if (!userRateLimiters.has(userId)) {
    userRateLimiters.set(userId, new RateLimiter(30));
  }
  return userRateLimiters.get(userId)!;
}

/**
 * Cleanup inactive rate limiters to prevent memory leaks
 * Removes rate limiters that haven't been used for 5 minutes
 */
function cleanupInactiveRateLimiters(): void {
  const now = Date.now();
  for (const [userId, limiter] of userRateLimiters.entries()) {
    if (now - limiter.lastRefill > RATE_LIMITER_INACTIVITY_THRESHOLD_MS) {
      userRateLimiters.delete(userId);
    }
  }
}

// Start cleanup interval for inactive rate limiters
// This runs every 5 minutes to remove stale entries and prevent memory leaks
setInterval(cleanupInactiveRateLimiters, RATE_LIMITER_CLEANUP_INTERVAL_MS);

/**
 * List of subreddits to search for project mentions
 * These are tech/programming focused subreddits where projects are often shared
 */
const SUBREDDITS_TO_SEARCH = [
  "programming",
  "webdev",
  "reactjs",
  "javascript",
  "typescript",
  "nextjs",
  "node",
  "opensource",
  "coolgithubprojects",
  "SideProject",
  "selfhosted",
];

/**
 * Search Reddit for posts mentioning a URL or term
 * Uses Reddit's JSON API (no auth required for search)
 *
 * @param query - Search query (URL or term to search for)
 * @param rateLimiter - User-specific rate limiter instance
 * @param subreddit - Optional subreddit to limit search to
 */
async function searchReddit(
  query: string,
  rateLimiter: RateLimiter,
  subreddit?: string,
): Promise<RedditPost[]> {
  // Wait for rate limit token from user-specific limiter
  await rateLimiter.acquire();

  // Build search URL
  // Reddit search across all subreddits or specific one
  const baseUrl = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : `https://www.reddit.com/search.json`;

  const searchParams = new URLSearchParams({
    q: query,
    sort: "relevance",
    limit: "100",
    restrict_sr: subreddit ? "true" : "false",
    type: "link",
  });

  const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
    headers: {
      "User-Agent": "LaunchLog/1.0 (https://launchlog.com)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    // Reddit returns 429 for rate limiting
    if (response.status === 429) {
      throw new Error("Reddit API rate limit exceeded");
    }
    throw new Error(
      `Reddit API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: RedditSearchResponse = await response.json();
  return data.data.children || [];
}

/**
 * Build Reddit post URL from permalink
 */
function buildRedditUrl(permalink: string): string {
  return `https://www.reddit.com${permalink}`;
}

/**
 * Convert Unix timestamp to ISO string
 */
function unixToIsoString(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString();
}

/**
 * GET /api/projects/[id]/mentions/reddit
 *
 * Fetches Reddit mentions for a project (user_repo):
 * 1. Gets the repo's GitHub URL from user_repos table
 * 2. Searches Reddit for mentions across multiple subreddits
 * 3. Stores new mentions in the database (deduplicates by source_url)
 * 4. Returns all Reddit mentions for the project
 *
 * Note: The [id] parameter is the user_repo.id (UUID), not the GitHub repo_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    // Validate project ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 },
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the project (user_repo) and verify ownership
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select("id, repo_url, repo_full_name, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify project ownership
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 },
      );
    }

    if (!project.repo_url) {
      return NextResponse.json(
        { error: "Project has no repository URL configured" },
        { status: 400 },
      );
    }

    // Get the user's rate limiter - each user gets their own 30 req/min budget
    const userLimiter = getUserRateLimiter(user.id);

    // Search Reddit for mentions using both the URL and repo full name
    const allPosts: RedditPost[] = [];
    const seenIds = new Set<string>();

    try {
      // Search by repo URL (e.g., https://github.com/user/repo)
      const urlPosts = await searchReddit(project.repo_url, userLimiter);
      for (const post of urlPosts) {
        if (!seenIds.has(post.data.id)) {
          seenIds.add(post.data.id);
          allPosts.push(post);
        }
      }

      // Also search by repo full name to catch more mentions (e.g., "user/repo")
      if (project.repo_full_name) {
        const namePosts = await searchReddit(project.repo_full_name, userLimiter);
        for (const post of namePosts) {
          if (!seenIds.has(post.data.id)) {
            seenIds.add(post.data.id);
            allPosts.push(post);
          }
        }
      }

      // Search in specific tech subreddits for better coverage
      for (const subreddit of SUBREDDITS_TO_SEARCH) {
        try {
          const subredditPosts = await searchReddit(
            project.repo_url,
            userLimiter,
            subreddit,
          );
          for (const post of subredditPosts) {
            if (!seenIds.has(post.data.id)) {
              seenIds.add(post.data.id);
              allPosts.push(post);
            }
          }
        } catch (error) {
          // Log but continue - individual subreddit search failures shouldn't stop the whole process
          console.error(`Error searching r/${subreddit}:`, error);
        }
      }
    } catch (error) {
      console.error("Reddit search error:", error);
      // Continue with existing mentions even if search fails
    }

    // Process and store new mentions (deduplicate by source_url)
    for (const post of allPosts) {
      const sourceUrl = buildRedditUrl(post.data.permalink);

      // Use upsert to handle deduplication - if source_url exists, update; otherwise insert
      const { error: upsertError } = await supabaseAdmin
        .from("mentions")
        .upsert(
          {
            project_id: projectId,
            source_type: "reddit",
            source_url: sourceUrl,
            title: post.data.title || "Untitled",
            score: post.data.score || 0,
            comment_count: post.data.num_comments || 0,
            author: post.data.author || "unknown",
            published_at: unixToIsoString(post.data.created_utc),
          },
          {
            onConflict: "source_url",
            ignoreDuplicates: false, // Update existing records
          },
        );

      if (upsertError) {
        // Log but don't fail - some upserts may fail due to race conditions
        console.error("Upsert error for Reddit mention:", upsertError);
      }
    }

    // Fetch all Reddit mentions for this project from the database
    const { data: mentions, error: fetchError } = await supabaseAdmin
      .from("mentions")
      .select(
        "id, source_type, source_url, title, score, comment_count, author, published_at",
      )
      .eq("project_id", projectId)
      .eq("source_type", "reddit")
      .order("published_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching Reddit mentions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch mentions" },
        { status: 500 },
      );
    }

    // Transform to response format
    const response: MentionsResponse = {
      mentions: (mentions || []).map((m) => ({
        id: m.id,
        source_type: "reddit" as const,
        source_url: m.source_url,
        title: m.title,
        score: m.score,
        comment_count: m.comment_count,
        author: m.author,
        published_at: m.published_at,
      })),
      total: mentions?.length || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in Reddit mentions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[id]/mentions/reddit
 *
 * Manually trigger a refresh of Reddit mentions for a project
 * Returns the updated list of mentions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Reuse GET logic for refresh - it always fetches fresh data
  return GET(request, { params });
}
