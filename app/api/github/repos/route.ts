import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics: string[]
  private: boolean
  fork: boolean
  archived: boolean
  updated_at: string
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's GitHub access token from the auth provider
    // Supabase stores provider tokens in identities
    const githubIdentity = user.identities?.find(
      (identity) => identity.provider === "github"
    )

    if (!githubIdentity) {
      return NextResponse.json(
        { error: "GitHub account not linked" },
        { status: 400 }
      )
    }

    // Try to get the access token from the session first (fresh login)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let accessToken = session?.provider_token

    // If no provider_token in session, retrieve from stored tokens
    // (provider_token is only available immediately after OAuth exchange)
    if (!accessToken) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from("user_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "github")
        .single()

      if (tokenError || !tokenData?.access_token) {
        console.error("Error retrieving GitHub token:", tokenError)
        return NextResponse.json(
          {
            error: "GitHub access token not available. Please sign out and sign in again.",
            code: "TOKEN_NOT_FOUND",
          },
          { status: 401 }
        )
      }

      accessToken = tokenData.access_token
    }

    // Fetch repos from GitHub API
    const repos: GitHubRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}&type=owner`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "LaunchLog",
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("GitHub API error:", response.status, errorText)
        return NextResponse.json(
          { error: "Failed to fetch repositories from GitHub" },
          { status: response.status }
        )
      }

      const pageRepos: GitHubRepo[] = await response.json()

      if (pageRepos.length === 0) {
        break
      }

      // Filter out forks and archived repos, only include public repos
      const filteredRepos = pageRepos.filter(
        (repo) => !repo.fork && !repo.archived && !repo.private
      )

      repos.push(...filteredRepos)
      page++

      // Safety limit
      if (page > 10) break
    }

    // Transform to a cleaner format
    const transformedRepos = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics,
      updatedAt: repo.updated_at,
    }))

    return NextResponse.json({ repos: transformedRepos })
  } catch (error) {
    console.error("Error fetching GitHub repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
