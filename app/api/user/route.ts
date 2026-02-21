import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the GitHub identity for username and avatar
    const githubIdentity = user.identities?.find(
      (identity) => identity.provider === "github"
    )

    const username =
      githubIdentity?.identity_data?.user_name ||
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0] ||
      "user"

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      githubIdentity?.identity_data?.full_name ||
      githubIdentity?.identity_data?.name ||
      username

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      githubIdentity?.identity_data?.avatar_url ||
      null

    return NextResponse.json({
      user: {
        id: user.id,
        name,
        username,
        avatarUrl,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
