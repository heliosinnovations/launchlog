"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the projects page
 */
export default function ProjectsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Projects page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Something went wrong
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          We couldn&apos;t load this page. This might be a temporary issue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-light)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--color-border)] rounded-lg font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[var(--color-text-secondary)]">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
