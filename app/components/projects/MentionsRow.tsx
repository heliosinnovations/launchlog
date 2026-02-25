"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, ChevronRight, Loader2, Info } from "lucide-react";
import { MentionsModal } from "./MentionsModal";

/**
 * API response types for mention endpoints
 */
interface MentionsResponse {
  mentions: {
    id: string;
    source_type: "hackernews" | "reddit";
    source_url: string;
    title: string;
    score: number;
    comment_count: number;
    author: string;
    published_at: string;
  }[];
  total: number;
}

interface MentionCounts {
  hackernews: number;
  reddit: number;
}

interface MentionsRowProps {
  projectId: string;
  projectName: string;
  onViewAll?: () => void;
}

/**
 * HackerNews icon component (Y Combinator logo style)
 */
function HackerNewsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 0v24h24V0H0zm12.4 14.8h-.8l-3.6-7.3h2l2.4 5.5 2.4-5.5h2l-3.6 7.3v4.3h-1.8l.8.1v-4.4z" />
    </svg>
  );
}

/**
 * Reddit icon component
 */
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

/**
 * MentionsRow - Compact display of HN and Reddit mention counts for project cards
 *
 * Design based on mentions-system-v3.html:
 * - Horizontal flex layout with 16px gap
 * - 14px row height with 14px/16px padding
 * - JetBrains Mono for counts
 * - Platform colors: HN #FF6600, Reddit #FF4500
 * - 22x22px icon badges with 4px radius
 */
export function MentionsRow({ projectId, projectName, onViewAll }: MentionsRowProps) {
  const [counts, setCounts] = useState<MentionCounts>({ hackernews: 0, reddit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    onViewAll?.();
  }, [onViewAll]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    async function fetchMentionCounts() {
      setLoading(true);
      setError(null);

      try {
        // Fetch HN and Reddit mentions in parallel
        const [hnResponse, redditResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}/mentions/hackernews`),
          fetch(`/api/projects/${projectId}/mentions/reddit`),
        ]);

        // Handle individual endpoint errors gracefully
        let hnCount = 0;
        let redditCount = 0;

        if (hnResponse.ok) {
          const hnData: MentionsResponse = await hnResponse.json();
          hnCount = hnData.total;
        }

        if (redditResponse.ok) {
          const redditData: MentionsResponse = await redditResponse.json();
          redditCount = redditData.total;
        }

        setCounts({ hackernews: hnCount, reddit: redditCount });
      } catch (err) {
        console.error("Failed to fetch mention counts:", err);
        setError("Failed to load mentions");
      } finally {
        setLoading(false);
      }
    }

    fetchMentionCounts();
  }, [projectId]);

  const totalMentions = counts.hackernews + counts.reddit;

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center gap-4 px-4 py-3.5 bg-[var(--color-surface-elevated)] rounded-[10px] mt-1"
        role="status"
        aria-label="Loading mentions"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          Mentions
        </span>
        <span className="w-px h-5 bg-[var(--color-border)]" aria-hidden="true" />
        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-secondary)]" aria-hidden="true" />
        <span className="text-xs text-[var(--color-text-secondary)]">Loading...</span>
      </div>
    );
  }

  // Error state - show gracefully degraded UI
  if (error) {
    return (
      <div
        className="flex items-center gap-4 px-4 py-3.5 bg-[var(--color-surface-elevated)] rounded-[10px] mt-1"
        role="alert"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          Mentions
        </span>
        <span className="w-px h-5 bg-[var(--color-border)]" aria-hidden="true" />
        <span className="text-xs text-[var(--color-text-secondary)]">Unable to load</span>
      </div>
    );
  }

  // No mentions found
  if (totalMentions === 0) {
    return (
      <div className="flex items-center gap-4 px-4 py-3.5 bg-[var(--color-surface-elevated)] rounded-[10px] mt-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          Mentions
        </span>
        <span className="w-px h-5 bg-[var(--color-border)]" aria-hidden="true" />
        <span className="text-xs text-[var(--color-text-secondary)]">No mentions found</span>
      </div>
    );
  }

  // Mentions found - display counts
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 bg-[var(--color-surface-elevated)] rounded-[10px] mt-1">
      {/* Label */}
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
        Mentions
      </span>

      {/* Divider */}
      <span className="w-px h-5 bg-[var(--color-border)]" aria-hidden="true" />

      {/* HackerNews stat */}
      {counts.hackernews > 0 && (
        <div className="flex items-center gap-2" aria-label={`${counts.hackernews} HackerNews mentions`}>
          <span
            className="w-[22px] h-[22px] rounded flex items-center justify-center bg-[rgba(255,102,0,0.15)]"
          >
            <HackerNewsIcon className="w-3 h-3 text-[#FF6600]" />
          </span>
          <span className="text-sm font-bold text-[#FF6600] font-[family-name:var(--font-jetbrains-mono)]">
            {counts.hackernews}
          </span>
        </div>
      )}

      {/* Reddit stat */}
      {counts.reddit > 0 && (
        <div className="flex items-center gap-2" aria-label={`${counts.reddit} Reddit mentions`}>
          <span
            className="w-[22px] h-[22px] rounded flex items-center justify-center bg-[rgba(255,69,0,0.15)]"
          >
            <RedditIcon className="w-3 h-3 text-[#FF4500]" />
          </span>
          <span className="text-sm font-bold text-[#FF4500] font-[family-name:var(--font-jetbrains-mono)]">
            {counts.reddit}
          </span>
        </div>
      )}

      {/* Update frequency indicator */}
      <span className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)] opacity-70">
        <Info className="w-3 h-3" aria-hidden="true" />
        Updates daily
      </span>

      {/* View all link */}
      <button
        onClick={handleOpenModal}
        className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
        aria-label="View all mentions"
      >
        View all
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* Mentions Modal */}
      <MentionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projectId={projectId}
        projectName={projectName}
      />
    </div>
  );
}

export default MentionsRow;
