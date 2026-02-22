import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          const secureOptions = {
            ...options,
            secure: true,
            httpOnly: true,
            sameSite: "lax" as const,
          };
          request.cookies.set({
            name,
            value,
            ...secureOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...secureOptions,
          });
        },
        remove(name: string, options) {
          const secureOptions = {
            ...options,
            secure: true,
            httpOnly: true,
            sameSite: "lax" as const,
          };
          request.cookies.set({
            name,
            value: "",
            ...secureOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...secureOptions,
          });
        },
      },
    },
  );

  // Refresh the session by calling getUser()
  // This will refresh the session if it's expired and set the new cookies
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
