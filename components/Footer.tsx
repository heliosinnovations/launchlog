import Link from "next/link";
import { Github, Twitter, MessageCircle, Rocket } from "lucide-react";

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
    label: "GitHub",
    href: "https://github.com",
    icon: Github,
  },
  {
    label: "Twitter",
    href: "https://twitter.com",
    icon: Twitter,
  },
  {
    label: "Discord",
    href: "https://discord.com",
    icon: MessageCircle,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-transparent bg-[var(--color-surface)]"
      style={{
        borderImage:
          "linear-gradient(to right, #6366F1, #8B5CF6, #D946EF) 1",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold flex items-center gap-2.5 text-[var(--color-text)] hover:opacity-80 transition-opacity mb-4"
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
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Your developer portfolio, always up-to-date. Automatically.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-semibold text-sm text-[var(--color-text)] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-sm text-[var(--color-text-secondary)] text-center md:text-left">
            &copy; {currentYear} LaunchLog. Free forever. Built for makers who
            ship.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
                  aria-label={`Follow us on ${social.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
