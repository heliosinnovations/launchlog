import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // Default to onboarding, but we'll check if user has repos
  const explicitNext = searchParams.get("next")

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure: true,        // Force HTTPS cookies
                sameSite: "lax",     // CSRF protection
                httpOnly: false,     // Supabase needs client access
              })
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine redirect destination
      let redirectPath = explicitNext

      // If no explicit next param, check if user has completed onboarding
      if (!redirectPath) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Check if user has existing repos (completed onboarding)
          const supabaseAdmin = getSupabaseAdmin()
          const { data: userRepos, error: reposError } = await supabaseAdmin
            .from("user_repos")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)

          if (!reposError && userRepos && userRepos.length > 0) {
            // User has repos, skip onboarding
            redirectPath = "/dashboard"
          } else {
            // New user or no repos, go to onboarding
            redirectPath = "/onboarding"
          }
        } else {
          // No user found, default to onboarding
          redirectPath = "/onboarding"
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`)
}
