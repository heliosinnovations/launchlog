import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

/**
 * Algolia HN Search API response types
 * Documentation: https://hn.algolia.com/api
 */
interface AlgoliaHit {
  objectID: string
  title: string
  url: string | null
  author: string
  points: number
  num_comments: number
  created_at: string
  story_id?: number
}

interface AlgoliaSearchResponse {
  hits: AlgoliaHit[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
}

/**
 * Mention response format as specified in the issue
 */
interface Mention {
  id: string
  source_type: "hackernews"
  source_url: string
  title: string
  score: number
  comment_count: number
  author: string
  published_at: string
}

interface MentionsResponse {
  mentions: Mention[]
  total: number
}

/**
 * Rate limiter to respect Algolia's 10 req/sec limit
 * Uses a simple token bucket algorithm
 */
class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per ms

  constructor(maxRequestsPerSecond: number = 10) {
    this.maxTokens = maxRequestsPerSecond
    this.tokens = maxRequestsPerSecond
    this.lastRefill = Date.now()
    this.refillRate = maxRequestsPerSecond / 1000
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const timePassed = now - this.lastRefill

    // Refill tokens based on time passed
    this.tokens = Math.min(this.maxTokens, this.tokens + timePassed * this.refillRate)
    this.lastRefill = now

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }

    // Wait for a token to become available
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    this.tokens = 0
    this.lastRefill = Date.now()
  }
}

// Singleton rate limiter instance
const rateLimiter = new RateLimiter(10)

/**
 * Search HackerNews via Algolia API for mentions of a GitHub repo URL
 */
async function searchHackerNews(repoUrl: string): Promise<AlgoliaHit[]> {
  // Wait for rate limit token
  await rateLimiter.acquire()

  // Search for the full repo URL (will find posts that link to or mention the repo)
  const encodedQuery = encodeURIComponent(repoUrl)
  const response = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=100`,
    {
      headers: {
        "User-Agent": "LaunchLog/1.0",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Algolia API error: ${response.status} ${response.statusText}`)
  }

  const data: AlgoliaSearchResponse = await response.json()
  return data.hits
}

/**
 * Build HackerNews item URL from objectID
 */
function buildHackerNewsUrl(objectID: string): string {
  return `https://news.ycombinator.com/item?id=${objectID}`
}

/**
 * GET /api/projects/[id]/mentions/hackernews
 *
 * Fetches HackerNews mentions for a project (user_repo):
 * 1. Gets the repo's GitHub URL from user_repos table
 * 2. Searches HN Algolia API for mentions
 * 3. Stores new mentions in the database (deduplicates by source_url)
 * 4. Returns all HN mentions for the project
 *
 * Note: The [id] parameter is the user_repo.id (UUID), not the GitHub repo_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Validate project ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format" },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the project (user_repo) and verify ownership
    const supabaseAdmin = getSupabaseAdmin()
    const { data: project, error: projectError } = await supabaseAdmin
      .from("user_repos")
      .select("id, repo_url, repo_full_name, user_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Verify project ownership
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this project" },
        { status: 403 }
      )
    }

    if (!project.repo_url) {
      return NextResponse.json(
        { error: "Project has no repository URL configured" },
        { status: 400 }
      )
    }

    // Search HackerNews for mentions using both the URL and repo full name
    let hnHits: AlgoliaHit[] = []
    try {
      // Search by repo URL (e.g., https://github.com/user/repo)
      hnHits = await searchHackerNews(project.repo_url)

      // Also search by repo full name to catch more mentions (e.g., "user/repo")
      if (project.repo_full_name) {
        const additionalHits = await searchHackerNews(project.repo_full_name)
        // Merge results, dedupe by objectID
        const existingIds = new Set(hnHits.map((h) => h.objectID))
        for (const hit of additionalHits) {
          if (!existingIds.has(hit.objectID)) {
            hnHits.push(hit)
          }
        }
      }
    } catch (error) {
      console.error("HackerNews search error:", error)
      // Continue with existing mentions even if search fails
    }

    // Process and store new mentions (deduplicate by source_url)
    for (const hit of hnHits) {
      const sourceUrl = buildHackerNewsUrl(hit.objectID)

      // Use upsert to handle deduplication - if source_url exists, update; otherwise insert
      const { error: upsertError } = await supabaseAdmin
        .from("mentions")
        .upsert(
          {
            project_id: projectId,
            source_type: "hackernews",
            source_url: sourceUrl,
            title: hit.title || "Untitled",
            score: hit.points || 0,
            comment_count: hit.num_comments || 0,
            author: hit.author || "unknown",
            published_at: hit.created_at,
          },
          {
            onConflict: "source_url",
            ignoreDuplicates: false, // Update existing records
          }
        )

      if (upsertError) {
        // Log but don't fail - some upserts may fail due to race conditions
        console.error("Upsert error for mention:", upsertError)
      }
    }

    // Fetch all HN mentions for this project from the database
    const { data: mentions, error: fetchError } = await supabaseAdmin
      .from("mentions")
      .select("id, source_type, source_url, title, score, comment_count, author, published_at")
      .eq("project_id", projectId)
      .eq("source_type", "hackernews")
      .order("published_at", { ascending: false })

    if (fetchError) {
      console.error("Error fetching mentions:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch mentions" },
        { status: 500 }
      )
    }

    // Transform to response format
    const response: MentionsResponse = {
      mentions: (mentions || []).map((m) => ({
        id: m.id,
        source_type: "hackernews" as const,
        source_url: m.source_url,
        title: m.title,
        score: m.score,
        comment_count: m.comment_count,
        author: m.author,
        published_at: m.published_at,
      })),
      total: mentions?.length || 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in HackerNews mentions API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/mentions/hackernews
 *
 * Manually trigger a refresh of HackerNews mentions for a project
 * Returns the updated list of mentions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reuse GET logic for refresh - it always fetches fresh data
  return GET(request, { params })
}
