import { signIn } from "@/auth"
import { Github } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily: 'var(--font-space-grotesk)'}}>
              Welcome to LaunchLog
            </h1>
            <p className="text-gray-400">
              Sign in with GitHub to create your developer portfolio
            </p>
          </div>

          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/onboarding" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292F] hover:bg-[#2f363d] text-white rounded-xl transition-all font-medium"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
