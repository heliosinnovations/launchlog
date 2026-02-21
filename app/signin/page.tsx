import { signIn } from "@/auth"
import { Github } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[var(--color-surface)]/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-[var(--color-text)] mb-2">
              LaunchLog
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Sign in to showcase your projects
            </p>
          </div>

          {/* GitHub Sign In Button */}
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/onboarding" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292e] hover:bg-[#1b1f23] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-500"
            >
              <Github className="w-5 h-5" aria-hidden="true" />
              Continue with GitHub
            </button>
          </form>

          {/* Privacy Notice */}
          <p className="text-sm text-[var(--color-text-secondary)] text-center mt-6">
            By signing in, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
