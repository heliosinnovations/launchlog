"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { X, ExternalLink, Loader2, Search } from "lucide-react";

/**
 * Mention data structure from API
 */
export interface Mention {
  id: string;
  source_type: "hackernews" | "reddit";
  source_url: string;
  title: string;
  score: number;
  comment_count: number;
  author: string;
  published_at: string;
}

interface MentionsResponse {
  mentions: Mention[];
  total: number;
}

type PlatformFilter = "all" | "hackernews" | "reddit";
type SortOption = "recent" | "score" | "comments";

interface MentionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
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

const ITEMS_PER_PAGE = 20;

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format score for display (e.g., 1234 -> "1.2k")
 */
function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

/**
 * Get platform display name
 */
function getPlatformName(mention: Mention): string {
  if (mention.source_type === "hackernews") {
    return "HackerNews";
  }
  // For Reddit, try to extract subreddit from URL
  const redditMatch = mention.source_url.match(/reddit\.com\/r\/([^/]+)/);
  if (redditMatch) {
    return `r/${redditMatch[1]}`;
  }
  return "Reddit";
}

/**
 * MentionsModal - Professional table modal with filters and sorting
 *
 * Design based on mentions-system-v3.html (lines 1007-1146):
 * - Modal with header showing project name and mention counts
 * - Filter bar with platform buttons (All, HackerNews, Reddit)
 * - Sort dropdown (Most recent, Highest score, Most comments)
 * - Table with columns: Source, Title, Score, Comments, Date, Link
 * - Pagination for 20+ mentions
 * - Empty state when no mentions found
 */
export function MentionsModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: MentionsModalProps) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch mentions when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchMentions() {
      setLoading(true);
      setError(null);

      try {
        // Fetch HN and Reddit mentions in parallel
        const [hnResponse, redditResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}/mentions/hackernews`),
          fetch(`/api/projects/${projectId}/mentions/reddit`),
        ]);

        const allMentions: Mention[] = [];

        if (hnResponse.ok) {
          const hnData: MentionsResponse = await hnResponse.json();
          allMentions.push(...hnData.mentions);
        }

        if (redditResponse.ok) {
          const redditData: MentionsResponse = await redditResponse.json();
          allMentions.push(...redditData.mentions);
        }

        setMentions(allMentions);
      } catch (err) {
        console.error("Failed to fetch mentions:", err);
        setError("Failed to load mentions");
      } finally {
        setLoading(false);
      }
    }

    fetchMentions();
  }, [isOpen, projectId]);

  // Reset pagination when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortBy]);

  // Close modal on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Filter and sort mentions
  const filteredAndSortedMentions = useMemo(() => {
    let result = [...mentions];

    // Apply filter
    if (filter !== "all") {
      result = result.filter((m) => m.source_type === filter);
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "comments":
          return b.comment_count - a.comment_count;
        case "recent":
        default:
          return (
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
          );
      }
    });

    return result;
  }, [mentions, filter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedMentions.length / ITEMS_PER_PAGE
  );
  const paginatedMentions = filteredAndSortedMentions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Count by platform
  const hnCount = mentions.filter((m) => m.source_type === "hackernews").length;
  const redditCount = mentions.filter((m) => m.source_type === "reddit").length;

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentions-modal-title"
    >
      <div className="w-full max-w-[900px] max-h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[14px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4 flex-wrap">
            <h2
              id="mentions-modal-title"
              className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold"
            >
              {projectName}
            </h2>
            {(hnCount > 0 || redditCount > 0) && (
              <div className="flex gap-3">
                {hnCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[rgba(255,102,0,0.12)] text-xs font-semibold font-[family-name:var(--font-jetbrains-mono)] text-[#FF6600]">
                    <HackerNewsIcon className="w-3 h-3" />
                    {hnCount} HN
                  </span>
                )}
                {redditCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[rgba(255,69,0,0.12)] text-xs font-semibold font-[family-name:var(--font-jetbrains-mono)] text-[#FF4500]">
                    <RedditIcon className="w-3 h-3" />
                    {redditCount} Reddit
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-all flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 px-6 py-3.5 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] flex-wrap">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            Filter:
          </span>
          <button
            onClick={() => setFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              filter === "all"
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("hackernews")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              filter === "hackernews"
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <HackerNewsIcon className="w-3 h-3" />
            HackerNews
          </button>
          <button
            onClick={() => setFilter("reddit")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              filter === "reddit"
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <RedditIcon className="w-3 h-3" />
            Reddit
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] text-xs font-normal cursor-pointer"
            >
              <option value="recent">Most recent</option>
              <option value="score">Highest score</option>
              <option value="comments">Most comments</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                className="w-6 h-6 animate-spin text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Loading mentions...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-red-500">{error}</span>
            </div>
          ) : filteredAndSortedMentions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[10px] flex items-center justify-center">
                <Search
                  className="w-6 h-6 text-[var(--color-text-secondary)]"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-[15px] font-semibold mb-1">
                No mentions found yet
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                We&apos;ll keep scanning for discussions about your project.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] first:pl-6">
                        Source
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                        Title
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                        Score
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                        Comments
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)]">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] last:pr-6">
                        {/* Empty header for link column */}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMentions.map((mention) => (
                      <tr
                        key={mention.id}
                        className="hover:bg-[var(--color-surface-elevated)] transition-colors"
                      >
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] first:pl-6 align-middle">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                                mention.source_type === "hackernews"
                                  ? "bg-[rgba(255,102,0,0.15)]"
                                  : "bg-[rgba(255,69,0,0.15)]"
                              }`}
                            >
                              {mention.source_type === "hackernews" ? (
                                <HackerNewsIcon className="w-3.5 h-3.5 text-[#FF6600]" />
                              ) : (
                                <RedditIcon className="w-3.5 h-3.5 text-[#FF4500]" />
                              )}
                            </span>
                            <span className="text-[13px] text-[var(--color-text-secondary)]">
                              {getPlatformName(mention)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] align-middle max-w-[350px]">
                          <a
                            href={mention.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary-light)] transition-colors line-clamp-2"
                          >
                            {mention.title}
                          </a>
                        </td>
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] align-middle">
                          <span
                            className={`text-sm font-semibold font-[family-name:var(--font-jetbrains-mono)] ${
                              mention.source_type === "hackernews"
                                ? "text-[#FF6600]"
                                : "text-[#FF4500]"
                            }`}
                          >
                            {formatScore(mention.score)}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] align-middle">
                          <span className="text-[13px] text-[var(--color-text-secondary)] font-[family-name:var(--font-jetbrains-mono)]">
                            {mention.comment_count}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] align-middle">
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {formatDate(mention.published_at)}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-b border-[var(--color-border-subtle)] last:pr-6 align-middle">
                          <a
                            href={mention.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
                            aria-label={`Open ${mention.title} in new tab`}
                          >
                            <ExternalLink
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredAndSortedMentions.length
                    )}{" "}
                    of {filteredAndSortedMentions.length} mentions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentionsModal;
