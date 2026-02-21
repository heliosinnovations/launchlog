import { auth } from "@/auth"
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get the user's GitHub access token from the accounts table
    const supabase = getSupabaseAdmin()
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("access_token")
      .eq("userId", session.user.id)
      .eq("provider", "github")
      .single()

    if (accountError || !account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not linked" },
        { status: 400 }
      )
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
            Authorization: `Bearer ${account.access_token}`,
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
