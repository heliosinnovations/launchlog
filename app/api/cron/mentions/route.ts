import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Algolia HN Search API response types
 * Documentation: https://hn.algolia.com/api
 */
interface AlgoliaHit {
  objectID: string;
  title: string;
  url: string | null;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_id?: number;
}

interface AlgoliaSearchResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

/**
 * Project from user_repos table
 */
interface Project {
  id: string;
  repo_url: string | null;
  repo_name: string;
  repo_full_name: string | null;
}

/**
 * Cron job response
 */
interface CronResponse {
  processed: number;
  found: number;
  errors: string[];
}

/**
 * Search HackerNews via Algolia API for mentions of a repo
 */
async function searchHackerNews(query: string): Promise<AlgoliaHit[]> {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=100`,
    {
      headers: {
        "User-Agent": "LaunchLog/1.0 (Cron Job)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Algolia API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: AlgoliaSearchResponse = await response.json();
  return data.hits;
}

/**
 * Build HackerNews item URL from objectID
 */
function buildHackerNewsUrl(objectID: string): string {
  return `https://news.ycombinator.com/item?id=${objectID}`;
}

/**
 * Process a batch of projects and search HN for mentions
 */
async function processBatch(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  projects: Project[],
): Promise<{ found: number; errors: string[] }> {
  let found = 0;
  const errors: string[] = [];

  for (const project of projects) {
    try {
      // Search by repo_name (as specified in requirements)
      let hnHits: AlgoliaHit[] = [];

      if (project.repo_name) {
        hnHits = await searchHackerNews(project.repo_name);
      }

      // Also search by repo_full_name to catch more mentions (e.g., "user/repo")
      if (project.repo_full_name) {
        try {
          const additionalHits = await searchHackerNews(project.repo_full_name);
          // Merge results, dedupe by objectID
          const existingIds = new Set(hnHits.map((h) => h.objectID));
          for (const hit of additionalHits) {
            if (!existingIds.has(hit.objectID)) {
              hnHits.push(hit);
            }
          }
        } catch (error) {
          // Log but continue - primary search may have succeeded
          console.error(
            `Additional search failed for ${project.repo_full_name}:`,
            error,
          );
        }
      }

      // Store new mentions (upsert to deduplicate by source_url)
      for (const hit of hnHits) {
        const sourceUrl = buildHackerNewsUrl(hit.objectID);

        const { error: upsertError } = await supabaseAdmin
          .from("mentions")
          .upsert(
            {
              project_id: project.id,
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
              ignoreDuplicates: false, // Update existing records with fresh data
            },
          );

        if (upsertError) {
          console.error(`Upsert error for project ${project.id}:`, upsertError);
        }
      }

      found += hnHits.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Project ${project.id} (${project.repo_name}): ${errorMsg}`);
      console.error(`Error processing project ${project.id}:`, error);
    }
  }

  return { found, errors };
}

/**
 * Sleep helper for batch delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/cron/mentions
 *
 * Vercel Cron endpoint that automatically searches HackerNews for all projects
 * and updates the mentions database.
 *
 * Schedule: Every 3 hours (configured in vercel.json)
 *
 * Authentication: Requires CRON_SECRET header to match env var
 *
 * Processing:
 * 1. Fetches all projects from user_repos table
 * 2. Processes in batches of 10 with 500ms delay between batches
 * 3. For each project, searches HN Algolia API for repo_name
 * 4. Upserts new mentions (deduplicates by source_url UNIQUE constraint)
 *
 * Returns: JSON summary with processed count, found count, and errors
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET authentication
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // Check authorization header matches CRON_SECRET
  // Vercel cron jobs send: Authorization: Bearer <CRON_SECRET>
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const response: CronResponse = {
    processed: 0,
    found: 0,
    errors: [],
  };

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all projects from user_repos
    const { data: projects, error: fetchError } = await supabaseAdmin
      .from("user_repos")
      .select("id, repo_url, repo_name, repo_full_name");

    if (fetchError) {
      console.error("Error fetching projects:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 },
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        processed: 0,
        found: 0,
        errors: [],
        message: "No projects to process",
      });
    }

    // Process in batches of 10 with 500ms delay between batches
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 500;

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);
      const batchResult = await processBatch(supabaseAdmin, batch);

      response.processed += batch.length;
      response.found += batchResult.found;
      response.errors.push(...batchResult.errors);

      // Delay between batches (skip delay after last batch)
      if (i + BATCH_SIZE < projects.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Cron job completed: processed=${response.processed}, found=${response.found}, errors=${response.errors.length}, duration=${duration}ms`,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in cron job:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    response.errors.push(`Fatal error: ${errorMsg}`);
    return NextResponse.json(response, { status: 500 });
  }
}
