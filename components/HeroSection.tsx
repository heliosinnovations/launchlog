"use client";

import Link from "next/link";
import { Github, CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
      </div>

      <div className="relative max-w-[1100px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        {/* Hero Badge */}
        <span
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[13px] text-[var(--color-text-secondary)] mb-8 shadow-sm"
          role="status"
          aria-label="Platform status"
        >
          <span
            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            aria-hidden="true"
          />
          Now in public beta
        </span>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[36px] md:text-[52px] lg:text-[72px] font-bold tracking-[-0.03em] leading-[1.05] mb-6">
          Your code.
          <br />
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
            Your impact.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-[600px] mx-auto mb-10 leading-relaxed">
          Auto-sync your GitHub projects. Track mentions across HackerNews,
          Reddit, Product Hunt & more. Show the world what you&apos;ve built.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-4 mb-6"
          role="group"
          aria-label="Call to action buttons"
        >
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_32px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Sign in with GitHub to connect your account"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
            Sign in with GitHub
          </Link>
        </div>

        {/* Trust indicator */}
        <p className="flex items-center justify-center gap-2 text-[14px] text-[var(--color-text-secondary)] mb-16">
          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
          Free forever. No credit card needed.
        </p>

        {/* Mention Badges Showcase */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 flex-wrap mb-4"
          role="list"
          aria-label="Example platform mention badges"
        >
          <ShowcaseBadge
            platform="hn"
            icon={<HNIcon />}
            value="312"
            label="points"
          />
          <ShowcaseBadge
            platform="ph"
            icon={<PHIcon />}
            value="#2"
            label="Product"
          />
          <ShowcaseBadge
            platform="twitter"
            icon={<TwitterIcon />}
            value="847"
            label="likes"
          />
          <ShowcaseBadge
            platform="reddit"
            icon={<RedditIcon />}
            value="2.4K"
            label="upvotes"
          />
        </div>

        {/* Caption */}
        <p className="text-[13px] text-[var(--color-text-secondary)] text-center">
          Example badges that appear on your projects — updated automatically
        </p>
      </div>
    </section>
  );
}

// Showcase Badge Component
interface ShowcaseBadgeProps {
  platform: "hn" | "ph" | "twitter" | "reddit";
  icon: React.ReactNode;
  value: string;
  label: string;
}

function ShowcaseBadge({ platform, icon, value, label }: ShowcaseBadgeProps) {
  const platformStyles = {
    hn: {
      borderColor: "rgba(255, 102, 0, 0.3)",
      iconColor: "text-[#FF6600]",
      hoverBg: "hover:bg-[rgba(255,102,0,0.08)]",
      hoverBorder: "hover:border-[#FF6600]",
    },
    ph: {
      borderColor: "rgba(218, 85, 47, 0.3)",
      iconColor: "text-[#DA552F]",
      hoverBg: "hover:bg-[rgba(218,85,47,0.08)]",
      hoverBorder: "hover:border-[#DA552F]",
    },
    twitter: {
      borderColor: "rgba(29, 161, 242, 0.3)",
      iconColor: "text-[#1DA1F2]",
      hoverBg: "hover:bg-[rgba(29,161,242,0.08)]",
      hoverBorder: "hover:border-[#1DA1F2]",
    },
    reddit: {
      borderColor: "rgba(255, 69, 0, 0.3)",
      iconColor: "text-[#FF4500]",
      hoverBg: "hover:bg-[rgba(255,69,0,0.08)]",
      hoverBorder: "hover:border-[#FF4500]",
    },
  };

  const styles = platformStyles[platform];

  return (
    <div
      className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 bg-[var(--color-surface)] border rounded-xl text-[14px] sm:text-[15px] font-semibold transition-all duration-300 cursor-default w-full sm:w-auto justify-center sm:justify-start ${styles.hoverBg} ${styles.hoverBorder} hover:-translate-y-1 hover:shadow-lg`}
      style={{ borderColor: styles.borderColor }}
      role="listitem"
      aria-label={`${platform === "hn" ? "HackerNews" : platform === "ph" ? "Product Hunt" : platform === "twitter" ? "Twitter" : "Reddit"}: ${value} ${label}`}
    >
      <span className={`w-[22px] h-[22px] ${styles.iconColor}`} aria-hidden="true">
        {icon}
      </span>
      <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg">
        {value}
      </span>
      <span className="text-[var(--color-text-secondary)] font-medium">
        {label}
      </span>
    </div>
  );
}

// Platform Icons as SVG components
function HNIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-3.21 6.039-3.135-6.04H6.951z" />
    </svg>
  );
}

function PHIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.806-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}
