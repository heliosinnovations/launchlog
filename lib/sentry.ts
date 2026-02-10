// Sentry error monitoring setup
// Install with: npm install @sentry/nextjs

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  // Sentry initialization will be done via sentry.client.config.ts
  // This file provides helper functions for manual error capture
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Sentry not loaded]', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry ${level}]`, message);
  }
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.setUser(user);
  }
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry: {
      captureException: (error: Error, context?: { extra?: Record<string, unknown> }) => void;
      captureMessage: (message: string, level?: string) => void;
      setUser: (user: { id: string; email?: string; username?: string } | null) => void;
    };
  }
}
