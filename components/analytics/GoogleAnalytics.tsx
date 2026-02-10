'use client';

import Script from 'next/script';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_TRACKING_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Event tracking helper
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Common event trackers
export const analytics = {
  signUp: (method: string = 'github') => trackEvent('sign_up', 'engagement', method),
  projectCreated: () => trackEvent('project_created', 'engagement'),
  storyWritten: () => trackEvent('story_written', 'engagement'),
  embedGenerated: () => trackEvent('embed_generated', 'engagement'),
  profileViewed: (username: string) => trackEvent('profile_view', 'engagement', username),
  ctaClick: (ctaName: string) => trackEvent('cta_click', 'conversion', ctaName),
};

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
