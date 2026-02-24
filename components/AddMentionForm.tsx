"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Info, X, Loader2, Check } from "lucide-react";

/**
 * Platform type for mentions
 */
export type MentionPlatform = "hackernews" | "reddit";

/**
 * Form state for adding a mention
 */
interface AddMentionFormState {
  platform: MentionPlatform;
  url: string;
  title: string;
}

/**
 * Form validation errors
 */
interface FormErrors {
  url?: string;
  title?: string;
  general?: string;
}

/**
 * Props for AddMentionForm component
 */
interface AddMentionFormProps {
  projectId: string;
  onCancel: () => void;
  onSuccess: () => void;
  existingUrls?: string[];
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
 * URL validation patterns for each platform
 */
const URL_PATTERNS: Record<MentionPlatform, RegExp> = {
  hackernews: /^https?:\/\/(news\.ycombinator\.com|hn\.algolia\.com)\/item\?id=\d+/i,
  reddit: /^https?:\/\/(www\.)?(old\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/(comments|s)\/[a-zA-Z0-9]+/i,
};

/**
 * URL placeholder text for each platform
 */
const URL_PLACEHOLDERS: Record<MentionPlatform, string> = {
  hackernews: "https://news.ycombinator.com/item?id=...",
  reddit: "https://www.reddit.com/r/reactjs/comments/...",
};

/**
 * Validate URL for the selected platform
 */
function validateUrl(url: string, platform: MentionPlatform): string | undefined {
  if (!url.trim()) {
    return "URL is required";
  }

  try {
    new URL(url);
  } catch {
    return "Please enter a valid URL";
  }

  if (!URL_PATTERNS[platform].test(url)) {
    const platformName = platform === "hackernews" ? "HackerNews" : "Reddit";
    return `Please enter a valid ${platformName} URL`;
  }

  return undefined;
}

/**
 * Check if URL is a duplicate
 */
function isDuplicateUrl(url: string, existingUrls: string[]): boolean {
  const normalizedUrl = url.toLowerCase().replace(/\/$/, "");
  return existingUrls.some(
    (existing) => existing.toLowerCase().replace(/\/$/, "") === normalizedUrl
  );
}

/**
 * AddMentionForm - Professional form for manually adding mentions
 *
 * Design based on mentions-system-v3.html (lines 1174-1306):
 * - Header with icon, title, and description
 * - Platform radio buttons (HackerNews, Reddit)
 * - URL input with validation
 * - Optional title field
 * - Footer with Cancel and Submit buttons
 * - Error states with inline feedback
 */
export function AddMentionForm({
  projectId,
  onCancel,
  onSuccess,
  existingUrls = [],
}: AddMentionFormProps) {
  const [formState, setFormState] = useState<AddMentionFormState>({
    platform: "hackernews",
    url: "",
    title: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Clear URL error when platform changes
  useEffect(() => {
    if (touched.url && formState.url) {
      const urlError = validateUrl(formState.url, formState.platform);
      setErrors((prev) => ({ ...prev, url: urlError }));
    }
  }, [formState.platform, formState.url, touched.url]);

  // Handle platform change
  const handlePlatformChange = useCallback((platform: MentionPlatform) => {
    setFormState((prev) => ({ ...prev, platform }));
  }, []);

  // Handle URL change
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setFormState((prev) => ({ ...prev, url }));

      // Validate on change if field has been touched
      if (touched.url) {
        const urlError = validateUrl(url, formState.platform);
        setErrors((prev) => ({ ...prev, url: urlError }));
      }
    },
    [formState.platform, touched.url]
  );

  // Handle URL blur (mark as touched and validate)
  const handleUrlBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, url: true }));
    const urlError = validateUrl(formState.url, formState.platform);
    setErrors((prev) => ({ ...prev, url: urlError }));
  }, [formState.url, formState.platform]);

  // Handle title change
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, title: e.target.value }));
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate URL
      const urlError = validateUrl(formState.url, formState.platform);
      if (urlError) {
        setErrors({ url: urlError });
        setTouched({ url: true });
        return;
      }

      // Check for duplicates
      if (isDuplicateUrl(formState.url, existingUrls)) {
        setErrors({ url: "This mention has already been added" });
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        const response = await fetch(
          `/api/projects/${projectId}/mentions/${formState.platform}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formState.url,
              title: formState.title || undefined,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to add mention");
        }

        // Show success state briefly before closing
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add mention";
        setErrors({ general: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, projectId, existingUrls, onSuccess]
  );

  // Determine if submit button should be disabled
  const isSubmitDisabled =
    isSubmitting ||
    showSuccess ||
    !formState.url.trim() ||
    !!errors.url;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[14px] max-w-[480px] w-full"
      onKeyDown={handleKeyDown}
      role="form"
      aria-label="Add mention form"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--color-border)]">
        <div className="w-9 h-9 rounded-[6px] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
          {showSuccess ? (
            <Check className="w-[18px] h-[18px] text-white" aria-hidden="true" />
          ) : (
            <Plus className="w-[18px] h-[18px] text-white" aria-hidden="true" />
          )}
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold">
            {showSuccess ? "Mention Added" : "Add Mention"}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {showSuccess
              ? "Successfully added to your project"
              : "Manually add a discussion link"}
          </p>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6">
          {/* General error message */}
          {errors.general && (
            <div
              className="mb-5 p-3 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
              role="alert"
            >
              <X className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {errors.general}
            </div>
          )}

          {/* Platform Selection */}
          <div className="mb-5">
            <label className="flex items-center justify-between text-[13px] font-semibold mb-2 text-[var(--color-text)]">
              Platform
            </label>
            <div
              className="flex gap-3 flex-col sm:flex-row"
              role="radiogroup"
              aria-label="Select platform"
            >
              {/* HackerNews Radio */}
              <label className="flex-1 relative cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="hackernews"
                  checked={formState.platform === "hackernews"}
                  onChange={() => handlePlatformChange("hackernews")}
                  className="sr-only"
                  aria-describedby="hn-platform-label"
                />
                <span
                  id="hn-platform-label"
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-[6px] border transition-all ${
                    formState.platform === "hackernews"
                      ? "border-[var(--color-primary)] bg-[rgba(99,102,241,0.08)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-text-secondary)]"
                  }`}
                >
                  <span className="w-6 h-6 rounded-[4px] bg-[rgba(255,102,0,0.15)] flex items-center justify-center">
                    <HackerNewsIcon className="w-3.5 h-3.5 text-[#FF6600]" />
                  </span>
                  <span className="text-[13px] font-medium">HackerNews</span>
                </span>
              </label>

              {/* Reddit Radio */}
              <label className="flex-1 relative cursor-pointer">
                <input
                  type="radio"
                  name="platform"
                  value="reddit"
                  checked={formState.platform === "reddit"}
                  onChange={() => handlePlatformChange("reddit")}
                  className="sr-only"
                  aria-describedby="reddit-platform-label"
                />
                <span
                  id="reddit-platform-label"
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-[6px] border transition-all ${
                    formState.platform === "reddit"
                      ? "border-[var(--color-primary)] bg-[rgba(99,102,241,0.08)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-text-secondary)]"
                  }`}
                >
                  <span className="w-6 h-6 rounded-[4px] bg-[rgba(255,69,0,0.15)] flex items-center justify-center">
                    <RedditIcon className="w-3.5 h-3.5 text-[#FF4500]" />
                  </span>
                  <span className="text-[13px] font-medium">Reddit</span>
                </span>
              </label>
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-5">
            <label
              htmlFor="mention-url"
              className="flex items-center justify-between text-[13px] font-semibold mb-2 text-[var(--color-text)]"
            >
              URL
              <span className="font-normal text-[var(--color-text-secondary)] text-[11px]">
                Required
              </span>
            </label>
            <input
              id="mention-url"
              type="url"
              value={formState.url}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              placeholder={URL_PLACEHOLDERS[formState.platform]}
              className={`w-full px-3.5 py-3 bg-[var(--color-surface-elevated)] border rounded-[6px] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] transition-all focus:outline-none focus:border-[var(--color-primary)] ${
                errors.url && touched.url
                  ? "border-red-500"
                  : "border-[var(--color-border)]"
              }`}
              disabled={isSubmitting || showSuccess}
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? "url-error" : "url-hint"}
            />
            {errors.url && touched.url ? (
              <p
                id="url-error"
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5"
                role="alert"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                {errors.url}
              </p>
            ) : (
              <p
                id="url-hint"
                className="mt-1.5 text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5"
              >
                <Info className="w-3 h-3" aria-hidden="true" />
                Paste the full URL to the discussion
              </p>
            )}
          </div>

          {/* Title Input (Optional) */}
          <div>
            <label
              htmlFor="mention-title"
              className="flex items-center justify-between text-[13px] font-semibold mb-2 text-[var(--color-text)]"
            >
              Title
              <span className="font-normal text-[var(--color-text-secondary)] text-[11px]">
                Optional
              </span>
            </label>
            <input
              id="mention-title"
              type="text"
              value={formState.title}
              onChange={handleTitleChange}
              placeholder="Auto-fetched from URL"
              className="w-full px-3.5 py-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] transition-all focus:outline-none focus:border-[var(--color-primary)]"
              disabled={isSubmitting || showSuccess}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-[18px] py-2.5 bg-transparent border border-[var(--color-border)] rounded-[6px] text-[13px] font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 border-none rounded-[6px] text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="w-3.5 h-3.5 animate-spin"
                  aria-hidden="true"
                />
                Adding...
              </>
            ) : showSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Added!
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add Mention
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMentionForm;
