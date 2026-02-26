"use client";

import Image from "next/image";
import {
  Star,
  ExternalLink,
  GitFork,
  Code,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { MentionsModal } from "@/app/components/projects/MentionsModal";

interface MentionCount {
  hackernews: number;
  reddit: number;
}

interface EnrichedRepo {
  id: string;
  repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  repo_description: string | null;
  repo_language: string | null;
  repo_stars: number;
  repo_forks?: number;
  display_order: number;
  screenshot_url: string | null;
  screenshot_source: string | null;
  demo_url: string | null;
  updated_at: string | null;
  created_at: string | null;
  activityStatus: "active" | "recent" | "archived" | "new";
  mentions: MentionCount;
}

interface ProjectCardProps {
  project: EnrichedRepo;
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

const DEFAULT_GRADIENT = { from: "#6366f1", to: "#4f46e5" };

/**
 * Get screenshot URL with fallback to GitHub OpenGraph
 */
function getScreenshotUrl(project: EnrichedRepo): string | null {
  if (project.screenshot_url) {
    return project.screenshot_url;
  }

  if (project.repo_full_name) {
    return `https://opengraph.githubassets.com/1/${project.repo_full_name}`;
  }

  return null;
}

/**
 * Format relative time from date
 */
function getRelativeTime(dateString: string | null): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Activity badge component
 */
function ActivityBadge({
  status,
}: {
  status: "active" | "recent" | "archived" | "new";
}) {
  const config = {
    new: {
      label: "New",
      classes: "bg-blue-500/15 text-blue-500",
    },
    active: {
      label: "Active",
      classes: "bg-green-500/15 text-green-500",
    },
    recent: {
      label: "Recently Updated",
      classes: "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
    },
    archived: {
      label: "Archived",
      classes:
        "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
    },
  };

  const { label, classes } = config[status];

  return (
    <span
      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

/**
 * HackerNews icon component
 */
function HackerNewsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M0 0v24h24V0H0zm12.4 14.8h-.8l-3.6-7.3h2l2.4 5.5 2.4-5.5h2l-3.6 7.3v4.3h-1.8l.8.1v-4.4z" />
    </svg>
  );
}

/**
 * Reddit icon component
 */
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

/**
 * GitHub icon component
 */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const screenshotUrl = getScreenshotUrl(project);
  const gradient = project.repo_language
    ? LANGUAGE_GRADIENTS[project.repo_language] || DEFAULT_GRADIENT
    : DEFAULT_GRADIENT;
  const languageColor = project.repo_language
    ? LANGUAGE_COLORS[project.repo_language] || "#6e7681"
    : null;

  const totalMentions = project.mentions.hackernews + project.mentions.reddit;
  const relativeTime = getRelativeTime(project.updated_at);

  const handleScreenshotClick = () => {
    const url = project.demo_url || project.repo_url;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Screenshot */}
      <div
        className="relative w-full aspect-[16/10] overflow-hidden cursor-pointer"
        onClick={handleScreenshotClick}
      >
        {screenshotUrl ? (
          <Image
            src={screenshotUrl}
            alt={`${project.repo_name} screenshot`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
          >
            <Code className="w-12 h-12 text-white/60" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        {/* Activity badge */}
        <ActivityBadge status={project.activityStatus} />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header: Name + Language */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-lg text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-1"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {project.repo_name}
          </a>
          {project.repo_language && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] flex-shrink-0">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: languageColor || "#6e7681" }}
              />
              {project.repo_language}
            </span>
          )}
        </div>

        {/* Description */}
        {project.repo_description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
            {project.repo_description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-[var(--color-border-subtle)]">
          {/* Stars */}
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {project.repo_stars.toLocaleString()}
          </span>

          {/* Forks (if available) */}
          {project.repo_forks !== undefined && project.repo_forks > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
              <GitFork className="w-4 h-4" />
              {project.repo_forks.toLocaleString()}
            </span>
          )}

          {/* Updated time */}
          <span className="ml-auto text-xs text-[var(--color-text-secondary)]">
            Updated {relativeTime}
          </span>
        </div>

        {/* Mentions Row */}
        {totalMentions > 0 ? (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-surface-elevated)] rounded-lg mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <MessageSquare className="w-3.5 h-3.5" />
              Mentions
            </span>
            <span className="w-px h-4 bg-[var(--color-border)]" />

            {project.mentions.hackernews > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#FF6600]">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-[rgba(255,102,0,0.15)]">
                  <HackerNewsIcon className="w-3 h-3" />
                </span>
                {project.mentions.hackernews}
              </span>
            )}

            {project.mentions.reddit > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#FF4500]">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-[rgba(255,69,0,0.15)]">
                  <RedditIcon className="w-3 h-3" />
                </span>
                {project.mentions.reddit}
              </span>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-surface-elevated)] rounded-lg mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              <MessageSquare className="w-3.5 h-3.5" />
              Mentions
            </span>
            <span className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">
              No mentions found
            </span>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-2.5">
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            GitHub
          </a>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Demo
            </a>
          )}
        </div>
      </div>

      {/* Mentions Modal */}
      <MentionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={project.id}
        projectName={project.repo_name}
      />
    </article>
  );
}
