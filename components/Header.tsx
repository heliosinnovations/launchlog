"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, Github, Menu, X } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#docs", label: "Docs" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <header>
      <nav
        className="flex justify-between items-center px-5 py-4 md:px-12 md:py-5 max-w-[1280px] mx-auto"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold flex items-center gap-2.5 text-[var(--color-text)] no-underline"
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
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[var(--color-text-secondary)] text-sm font-medium no-underline transition-colors duration-200 hover:text-[var(--color-text)]"
            >
              {link.label}
            </a>
          ))}

          {/* CTA Button */}
          <a
            href="/auth/github"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Get Started Free with GitHub"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            Get Started Free
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-[var(--color-surface)] border-t border-[var(--color-border)] px-5 py-4"
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[var(--color-text-secondary)] text-sm font-medium no-underline transition-colors duration-200 hover:text-[var(--color-text)] py-2"
                role="menuitem"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            {/* Mobile CTA Button */}
            <a
              href="/auth/github"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-[0_4px_16px_rgba(99,102,241,0.3)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-2"
              role="menuitem"
              aria-label="Get Started Free with GitHub"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              Get Started Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
