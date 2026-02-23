"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  Zap,
  Menu,
  X,
  User,
  Save,
  Github,
  Twitter,
  Linkedin,
  Globe,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import DashboardFooter from "@/components/DashboardFooter"

interface UserProfile {
  id?: string
  user_id?: string
  bio: string | null
  twitter_url: string | null
  website_url: string | null
  linkedin_url: string | null
}

interface User {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
    name?: string
    user_name?: string
    preferred_username?: string
  }
  identities?: Array<{
    provider: string
    identity_data?: {
      avatar_url?: string
      full_name?: string
      name?: string
      user_name?: string
    }
  }>
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    bio: "",
    twitter_url: "",
    website_url: "",
    linkedin_url: "",
  })
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Form validation states
  const [bioLength, setBioLength] = useState(0)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchUserAndProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user data
      const userResponse = await fetch("/api/auth/user")
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          router.push("/signin")
          return
        }
        throw new Error("Failed to fetch user data")
      }
      const userData = await userResponse.json()
      setUser(userData.user)

      // Fetch profile data
      const profileResponse = await fetch("/api/user/profile")
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.profile) {
          setProfile({
            bio: profileData.profile.bio || "",
            twitter_url: profileData.profile.twitter_url || "",
            website_url: profileData.profile.website_url || "",
            linkedin_url: profileData.profile.linkedin_url || "",
          })
          setBioLength(profileData.profile.bio?.length || 0)
        }
        setGithubUrl(profileData.github_url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUserAndProfile()
  }, [fetchUserAndProfile])

  const getUsername = () => {
    if (!user) return "user"
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.user_name ||
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0] ||
      "user"
    )
  }

  const getDisplayName = () => {
    if (!user) return "User"
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.full_name ||
      githubIdentity?.identity_data?.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      getUsername()
    )
  }

  const getAvatarUrl = () => {
    if (!user) return null
    const githubIdentity = user.identities?.find((i) => i.provider === "github")
    return (
      githubIdentity?.identity_data?.avatar_url || user.user_metadata?.avatar_url
    )
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const response = await fetch("/api/auth/signout", { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to sign out")
      }
      router.push("/")
    } catch {
      setSigningOut(false)
      setError("Failed to sign out. Please try again.")
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate bio length
    if (profile.bio && profile.bio.length > 200) {
      errors.bio = "Bio must be 200 characters or less"
    }

    // Validate Twitter URL
    if (profile.twitter_url && profile.twitter_url.trim()) {
      const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i
      if (!twitterRegex.test(profile.twitter_url)) {
        errors.twitter_url = "Must be a valid Twitter/X URL (e.g., https://twitter.com/username)"
      }
    }

    // Validate Website URL
    if (profile.website_url && profile.website_url.trim()) {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(profile.website_url)) {
        errors.website_url = "Must start with http:// or https://"
      }
    }

    // Validate LinkedIn URL
    if (profile.linkedin_url && profile.linkedin_url.trim()) {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/i
      if (!linkedinRegex.test(profile.linkedin_url)) {
        errors.linkedin_url = "Must be a valid LinkedIn URL (e.g., https://linkedin.com/in/username)"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: profile.bio || null,
          twitter_url: profile.twitter_url || null,
          website_url: profile.website_url || null,
          linkedin_url: profile.linkedin_url || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save profile")
      }

      setSuccess("Profile saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const handleBioChange = (value: string) => {
    setProfile({ ...profile, bio: value })
    setBioLength(value.length)
    if (formErrors.bio && value.length <= 200) {
      setFormErrors({ ...formErrors, bio: "" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">
            Loading settings...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
        {/* Logo + Close Button */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <Zap className="w-[18px] h-[18px] text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              LaunchLog
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Overview
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all mb-1"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all mb-1"
          >
            <FolderKanban className="w-5 h-5" />
            Projects
          </Link>
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] font-medium text-sm transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </Link>
        </nav>

        <nav className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
            Settings
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-indigo-500/15 text-indigo-500 font-medium text-sm mb-1"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        {/* User Info */}
        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            {getAvatarUrl() ? (
              <Image
                src={getAvatarUrl()!}
                alt={getDisplayName()}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {getDisplayName()}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                @{getUsername()}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all disabled:opacity-50"
              title="Sign out"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] lg:ml-[260px]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Left side: Menu button (mobile) + Logo (mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                LaunchLog
              </span>
            </div>
          </div>

          {/* Right side: User info + Sign out */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              {getAvatarUrl() ? (
                <Image
                  src={getAvatarUrl()!}
                  alt={getDisplayName()}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials()}
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-tight">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">
                  @{getUsername()}
                </p>
              </div>
            </div>

            <Link
              href={`/${getUsername()}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">View Profile</span>
            </Link>

            <div className="sm:hidden">
              {getAvatarUrl() ? (
                <Image
                  src={getAvatarUrl()!}
                  alt={getDisplayName()}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials()}
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              title="Sign out"
            >
              {signingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-[260px] p-6 lg:p-10 max-w-[800px]">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-3xl lg:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Settings
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base lg:text-lg">
            Manage your profile information and social links.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Profile Information
          </h2>

          {/* Bio Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              value={profile.bio || ""}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Tell people about yourself in a few words..."
              maxLength={200}
              rows={3}
              className={`w-full px-4 py-3 bg-[var(--color-bg)] border rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none ${
                formErrors.bio ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            <div className="flex justify-between mt-2">
              {formErrors.bio ? (
                <span className="text-xs text-red-500">{formErrors.bio}</span>
              ) : (
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Brief description for your public profile
                </span>
              )}
              <span className={`text-xs ${bioLength > 200 ? "text-red-500" : "text-[var(--color-text-secondary)]"}`}>
                {bioLength}/200
              </span>
            </div>
          </div>
        </div>

        {/* Social Links Form */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Social Links
          </h2>

          {/* GitHub (Read-only) */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Github className="w-4 h-4" />
              GitHub
              <span className="text-xs text-[var(--color-text-secondary)] font-normal">(Auto-populated from OAuth)</span>
            </label>
            <input
              type="url"
              value={githubUrl || ""}
              disabled
              className="w-full px-4 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] cursor-not-allowed"
            />
          </div>

          {/* Twitter/X */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Twitter className="w-4 h-4" />
              Twitter / X
            </label>
            <input
              type="url"
              value={profile.twitter_url || ""}
              onChange={(e) => {
                setProfile({ ...profile, twitter_url: e.target.value })
                if (formErrors.twitter_url) {
                  setFormErrors({ ...formErrors, twitter_url: "" })
                }
              }}
              placeholder="https://twitter.com/username"
              className={`w-full px-4 py-3 bg-[var(--color-bg)] border rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                formErrors.twitter_url ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {formErrors.twitter_url && (
              <span className="text-xs text-red-500 mt-1 block">{formErrors.twitter_url}</span>
            )}
          </div>

          {/* Website */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Globe className="w-4 h-4" />
              Website
            </label>
            <input
              type="url"
              value={profile.website_url || ""}
              onChange={(e) => {
                setProfile({ ...profile, website_url: e.target.value })
                if (formErrors.website_url) {
                  setFormErrors({ ...formErrors, website_url: "" })
                }
              }}
              placeholder="https://yourwebsite.com"
              className={`w-full px-4 py-3 bg-[var(--color-bg)] border rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                formErrors.website_url ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {formErrors.website_url && (
              <span className="text-xs text-red-500 mt-1 block">{formErrors.website_url}</span>
            )}
          </div>

          {/* LinkedIn */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <input
              type="url"
              value={profile.linkedin_url || ""}
              onChange={(e) => {
                setProfile({ ...profile, linkedin_url: e.target.value })
                if (formErrors.linkedin_url) {
                  setFormErrors({ ...formErrors, linkedin_url: "" })
                }
              }}
              placeholder="https://linkedin.com/in/username"
              className={`w-full px-4 py-3 bg-[var(--color-bg)] border rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                formErrors.linkedin_url ? "border-red-500" : "border-[var(--color-border)]"
              }`}
            />
            {formErrors.linkedin_url && (
              <span className="text-xs text-red-500 mt-1 block">{formErrors.linkedin_url}</span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <div className="lg:ml-[260px] mt-auto">
        <DashboardFooter />
      </div>
    </div>
  )
}
