"use client"

import Link from "next/link"
import { Rocket } from "lucide-react"

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-auto">
      <div className="px-6 lg:px-10 py-8 max-w-[1200px]">
        {/* Main Footer Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center"
              aria-hidden="true"
            >
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="text-sm font-semibold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              LaunchLog
            </span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              — Track your open source impact
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6" aria-label="Footer navigation">
            <Link
              href="/privacy"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="https://github.com/heliosinnovations/launchlog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              GitHub
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-secondary)]">
            © {currentYear} LaunchLog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
