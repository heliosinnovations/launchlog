"use client";

import Image from "next/image";
import { Star, ExternalLink, Code } from "lucide-react";
import MentionsRow from "@/app/components/projects/MentionsRow";
import {
  type ActivityStatus,
  getActivityStatus,
  getActivityLabel,
  getActivityBadgeClasses,
} from "@/lib/activity-status";

interface UserRepo {
  id: string;
  repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  repo_description: string | null;
  repo_language: string | null;
  repo_stars: number;
  display_order: number;
  screenshot_url: string | null;
  screenshot_source: string | null;
  demo_url: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Scala: "#c22d40",
};

// Language-specific gradient colors for placeholder backgrounds
const LANGUAGE_GRADIENTS: Record<string, { from: string; to: string }> = {
  TypeScript: { from: "#3178c6", to: "#235a9e" },
  JavaScript: { from: "#f7df1e", to: "#d4b800" },
  Python: { from: "#3572A5", to: "#2b5b87" },
  Rust: { from: "#dea584", to: "#b5836b" },
  Go: { from: "#00ADD8", to: "#007d9c" },
  Java: { from: "#b07219", to: "#8a5a14" },
  "C++": { from: "#f34b7d", to: "#c73d64" },
  C: { from: "#555555", to: "#3d3d3d" },
  Ruby: { from: "#cc342d", to: "#a32a25" },
  PHP: { from: "#4F5D95", to: "#3d4a78" },
  Swift: { from: "#F05138", to: "#c4412d" },
  Kotlin: { from: "#A97BFF", to: "#8862cc" },
  Dart: { from: "#00B4AB", to: "#009088" },
  Vue: { from: "#41b883", to: "#34926a" },
  HTML: { from: "#e34c26", to: "#b73d1e" },
  CSS: { from: "#563d7c", to: "#443062" },
  Shell: { from: "#89e051", to: "#6eb541" },
  Scala: { from: "#c22d40", to: "#9b2433" },
};

// Default gradient for unknown languages
const DEFAULT_GRADIENT = { from: "#6366f1", to: "#4f46e5" };

/**
 * Gets the screenshot URL with fallback hierarchy:
 * 1. Primary: screenshot_url from database
 * 2. Fallback 1: GitHub OpenGraph preview (always available for public repos)
 * 3. Fallback 2: null (will show gradient placeholder - not used since GitHub preview is reliable)
 */
function getScreenshotUrl(repo: UserRepo): string | null {
  // Primary: Use screenshot_url if it exists
  if (repo.screenshot_url) {
    return repo.screenshot_url;
  }

  // Fallback: Generate GitHub OpenGraph preview URL
  // GitHub provides social previews at: https://opengraph.githubassets.com/{hash}/{owner}/{repo}
  // This is always available for public repositories
  if (repo.repo_full_name) {
    return `https://opengraph.githubassets.com/1/${repo.repo_full_name}`;
  }

  return null;
}

/**
 * Activity badge component for project cards
 */
function ActivityBadge({ status }: { status: ActivityStatus }) {
  const label = getActivityLabel(status);
  const classes = getActivityBadgeClasses(status);

  return (
    <span
      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

/**
 * ProjectScreenshot component - Displays project screenshot with fallback hierarchy
 * - Primary: screenshot_url from database
 * - Fallback 1: GitHub OpenGraph preview
 * - Fallback 2: Gradient placeholder with language icon
 */
function ProjectScreenshot({
  repo,
  onClick,
  activityStatus,
}: {
  repo: UserRepo;
  onClick?: () => void;
  activityStatus?: ActivityStatus;
}) {
  const screenshotUrl = getScreenshotUrl(repo);
  const gradient = repo.repo_language
    ? LANGUAGE_GRADIENTS[repo.repo_language] || DEFAULT_GRADIENT
    : DEFAULT_GRADIENT;

  // Gradient placeholder with language icon
  if (!screenshotUrl) {
    return (
      <div
        className="relative w-full aspect-video rounded-t-xl overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
        onClick={onClick}
        role="img"
        aria-label={`${repo.repo_name} placeholder`}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Language icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Code className="w-12 h-12 text-white/60" />
        </div>
        {/* Activity badge */}
        {activityStatus && <ActivityBadge status={activityStatus} />}
      </div>
    );
  }

  // Screenshot image with lazy loading and blur placeholder
  return (
    <div
      className="relative w-full aspect-video rounded-t-xl overflow-hidden cursor-pointer group/screenshot"
      onClick={onClick}
    >
      <Image
        src={screenshotUrl}
        alt={`${repo.repo_name} screenshot`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 group-hover/screenshot:scale-[1.02]"
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBBAIDAAAAAAAAAAAAAQIDBAARBRIhMQYTQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQADAQEBAAAAAAAAAAAAAAAAAQIRITH/2gAMAwEAAhEDEQA/AJN29tVSxWrVPL41qST7J7c0h+2UykKyqNF/BwOtCes+uY5K22WtvM8UEDyyPK5d2LMSSSfsk5YwMVrpp+5P/9k="
        onError={(e) => {
          // If image fails to load, hide it (parent will show gradient placeholder)
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
      {/* Hover shadow overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover/screenshot:bg-black/10 transition-colors duration-300" />
      {/* Activity badge */}
      {activityStatus && <ActivityBadge status={activityStatus} />}
    </div>
  );
}

export default function ProjectCard({ repo }: { repo: UserRepo }) {
  // Calculate activity status from timestamps
  const activityStatus = getActivityStatus(repo.updated_at, repo.created_at);
  const languageColor = repo.repo_language
    ? LANGUAGE_COLORS[repo.repo_language] || "#6e7681"
    : null;

  // Determine click target for screenshot - demo URL if available, otherwise repo URL
  const screenshotClickUrl = repo.demo_url || repo.repo_url;

  const handleScreenshotClick = () => {
    window.open(screenshotClickUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 group overflow-hidden">
      {/* Screenshot section */}
      <ProjectScreenshot
        repo={repo}
        onClick={handleScreenshotClick}
        activityStatus={activityStatus}
      />

      {/* Content section */}
      <div className="p-5">
        <a
          href={repo.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-[var(--color-text)] group-hover:text-indigo-400 transition-colors line-clamp-1">
              {repo.repo_name}
            </h3>
            <ExternalLink className="w-4 h-4 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>

          {repo.repo_description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
              {repo.repo_description}
            </p>
          )}

          <div className="flex items-center gap-4">
            {repo.repo_language && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: languageColor || "#6e7681" }}
                />
                {repo.repo_language}
              </span>
            )}
            {repo.repo_stars > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                {repo.repo_stars.toLocaleString()}
              </span>
            )}
          </div>
        </a>

        {/* Mentions row - displays HN and Reddit mention counts */}
        <MentionsRow projectId={repo.id} projectName={repo.repo_name} />
      </div>
    </div>
  );
}
