"use client";

import Link from "next/link";
import { Rocket, Github, Twitter, MessageCircle } from "lucide-react";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

function FooterLink({ href, children, external = false }: FooterLinkProps) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text-primary)] transition-colors"
      {...linkProps}
    >
      {children}
    </Link>
  );
}

interface SocialLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const navigationLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
    { href: "/blog", label: "Blog" },
    { href: "https://github.com/heliosinnovations/launchlog", label: "GitHub", external: true },
  ];

  const socialLinks = [
    {
      href: "https://twitter.com/launchlog",
      label: "Follow us on Twitter",
      icon: <Twitter className="w-5 h-5" aria-hidden="true" />,
    },
    {
      href: "https://github.com/heliosinnovations/launchlog",
      label: "View our GitHub repository",
      icon: <Github className="w-5 h-5" aria-hidden="true" />,
    },
    {
      href: "https://discord.gg/launchlog",
      label: "Join our Discord community",
      icon: <MessageCircle className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
      <div className="max-w-[1000px] mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
          {/* Logo + Tagline */}
          <div className="md:col-span-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold flex items-center gap-2 text-[var(--color-text)] hover:opacity-80 transition-opacity mb-3"
              aria-label="LaunchLog home"
            >
              <div
                className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                <Rocket className="w-4 h-4 text-white" />
              </div>
              LaunchLog
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Track your open source impact
            </p>
          </div>

          {/* Navigation Links */}
          <nav
            className="md:col-span-5 flex flex-wrap gap-x-6 gap-y-3"
            aria-label="Footer navigation"
          >
            {navigationLinks.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
                external={link.external}
              >
                {link.label}
              </FooterLink>
            ))}
          </nav>

          {/* Social Links */}
          <div
            className="md:col-span-3 flex gap-4 md:justify-end"
            role="list"
            aria-label="Social media links"
          >
            {socialLinks.map((social) => (
              <div key={social.href} role="listitem">
                <SocialLink href={social.href} label={social.label}>
                  {social.icon}
                </SocialLink>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-sm text-[var(--color-text-secondary)]">
            © 2026 LaunchLog. All rights reserved.
          </p>

          {/* Legal Links */}
          <nav className="flex gap-6" aria-label="Legal">
            {legalLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
