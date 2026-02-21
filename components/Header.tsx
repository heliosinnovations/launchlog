"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Github, Rocket } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <nav
        className="flex justify-between items-center py-5 px-5 md:px-12 max-w-[1280px] mx-auto"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold flex items-center gap-2.5 text-[var(--color-text)] hover:opacity-80 transition-opacity"
          aria-label="LaunchLog home"
        >
          <div
            className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center"
            aria-hidden="true"
          >
            <Rocket className="w-[18px] h-[18px] text-white" />
          </div>
          LaunchLog
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text)] transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text)] transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text)] transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text)] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/github"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Sign in with GitHub"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            Get Started Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="px-5 pb-6 pt-2 space-y-4 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
          <Link
            href="#features"
            className="block text-[var(--color-text-secondary)] text-base font-medium hover:text-[var(--color-text)] transition-colors py-2"
            onClick={closeMobileMenu}
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="block text-[var(--color-text-secondary)] text-base font-medium hover:text-[var(--color-text)] transition-colors py-2"
            onClick={closeMobileMenu}
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="block text-[var(--color-text-secondary)] text-base font-medium hover:text-[var(--color-text)] transition-colors py-2"
            onClick={closeMobileMenu}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="block text-[var(--color-text-secondary)] text-base font-medium hover:text-[var(--color-text)] transition-colors py-2"
            onClick={closeMobileMenu}
          >
            Login
          </Link>
          <Link
            href="/auth/github"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-5 py-3 rounded-lg text-base font-semibold transition-all duration-300 shadow-[0_4px_16px_rgba(99,102,241,0.3)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-4"
            onClick={closeMobileMenu}
            aria-label="Sign in with GitHub"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}
