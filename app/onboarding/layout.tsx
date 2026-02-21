import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect("/signin")
  }

  return <>{children}</>
}
