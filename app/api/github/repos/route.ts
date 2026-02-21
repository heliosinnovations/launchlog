import { auth } from "@/auth"
import { getGitHubToken } from "@/lib/supabase"
import { NextResponse } from "next/server"

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  html_url: string
  private: boolean
  updated_at: string
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's GitHub access token from accounts table
    const accessToken = await getGitHubToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub access token not found. Please reconnect your GitHub account." },
        { status: 401 }
      )
    }

    // Fetch repos from GitHub API
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
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

    const repos: GitHubRepo[] = await response.json()

    // Return relevant repo data, filtering out private repos
    const publicRepos = repos
      .filter((repo) => !repo.private)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        html_url: repo.html_url,
        updated_at: repo.updated_at,
      }))

    return NextResponse.json(publicRepos)
  } catch (error) {
    console.error("Error fetching GitHub repos:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
