import Link from "next/link";
import { Rocket, Github, Twitter, MessageCircle } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Docs", href: "#" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Support", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
};

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

export default function Footer() {
  return (
    <footer
      className="bg-[var(--color-surface)]"
      style={{
        borderTop: "2px solid",
        borderImage: "linear-gradient(to right, #6366F1, #8B5CF6, #D946EF) 1",
      }}
    >
      <div className="max-w-[1000px] mx-auto px-6 py-16">
        {/* Main Footer Content - 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand Column */}
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold flex items-center gap-2 text-[var(--color-text)] hover:opacity-80 transition-opacity mb-4"
              aria-label="LaunchLog home"
            >
              <div
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center"
                aria-hidden="true"
              >
                <Rocket className="w-4 h-4 text-white" />
              </div>
              LaunchLog
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Your developer portfolio, always up-to-date. Automatically.
            </p>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-[var(--color-text)] mb-4 uppercase tracking-wider">
                {section.title}
              </h3>
              <nav aria-label={`${section.title} links`}>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-sm text-[var(--color-text-secondary)]">
            &copy; {new Date().getFullYear()} LaunchLog. All rights reserved.
          </p>

          {/* Social Links */}
          <div
            className="flex gap-5"
            role="list"
            aria-label="Social media links"
          >
            {socialLinks.map((social) => (
              <div key={social.href} role="listitem">
                <Link
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:scale-110 transition-all duration-200"
                  aria-label={social.label}
                >
                  {social.icon}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
