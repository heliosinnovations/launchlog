/**
 * LaunchLog Embeddable Widget
 * Version: 1.0.0
 *
 * Usage:
 * <script src="https://launchlog.com/embed/launchlog-widget.js" data-username="your-username" data-variant="grid"></script>
 *
 * Variants: grid, horizontal, bold
 * Options: data-limit (number of projects), data-theme (auto|light|dark)
 */

(function() {
  'use strict';

  // Get the current script element
  const currentScript = document.currentScript;
  if (!currentScript) return;

  // Configuration from data attributes
  const config = {
    username: currentScript.getAttribute('data-username') || currentScript.getAttribute('data-user'),
    variant: currentScript.getAttribute('data-variant') || currentScript.getAttribute('data-style') || 'grid',
    limit: parseInt(currentScript.getAttribute('data-limit') || '6', 10),
    theme: currentScript.getAttribute('data-theme') || 'auto',
    columns: currentScript.getAttribute('data-columns') || '3',
  };

  if (!config.username) {
    console.error('LaunchLog Widget: Missing data-username attribute');
    return;
  }

  // API endpoint
  const API_BASE = currentScript.src.replace('/embed/launchlog-widget.js', '');
  const API_URL = `${API_BASE}/api/widget/${encodeURIComponent(config.username)}`;

  // CSS for all widget variants
  const CSS = `
/* ===========================================
   LAUNCHLOG EMBEDDABLE WIDGET CSS
   Scoped to .ll-widget container
   =========================================== */

/* CSS Variables - Inherit from parent site when possible */
.ll-widget {
  --ll-font: inherit;
  --ll-font-mono: ui-monospace, 'JetBrains Mono', monospace;
  --ll-bg: #ffffff;
  --ll-bg-hover: #fafafa;
  --ll-bg-card: #f8fafc;
  --ll-bg-elevated: #f4f4f5;
  --ll-text: #111827;
  --ll-text-secondary: #6b7280;
  --ll-text-muted: #9ca3af;
  --ll-border: #e5e7eb;
  --ll-primary: #6366f1;
  --ll-primary-hover: #4f46e5;
  --ll-radius: 12px;
  --ll-radius-sm: 8px;
  --ll-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.08);
  --ll-shadow-glow: 0 0 40px rgba(99, 102, 241, 0.15);
  --ll-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);

  /* Platform colors */
  --ll-hn: #ff6600;
  --ll-reddit: #ff4500;
  --ll-star: #fbbf24;

  font-family: var(--ll-font);
  line-height: 1.5;
  box-sizing: border-box;
}

/* Dark mode via prefers-color-scheme */
@media (prefers-color-scheme: dark) {
  .ll-widget:not(.ll-light) {
    --ll-bg: #18181b;
    --ll-bg-hover: #27272a;
    --ll-bg-card: #1e293b;
    --ll-bg-elevated: #27272a;
    --ll-text: #fafafa;
    --ll-text-secondary: #a1a1aa;
    --ll-text-muted: #71717a;
    --ll-border: #3f3f46;
    --ll-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.4);
  }
}

/* Dark mode via .ll-dark class */
.ll-widget.ll-dark {
  --ll-bg: #18181b;
  --ll-bg-hover: #27272a;
  --ll-bg-card: #1e293b;
  --ll-bg-elevated: #27272a;
  --ll-text: #fafafa;
  --ll-text-secondary: #a1a1aa;
  --ll-text-muted: #71717a;
  --ll-border: #3f3f46;
  --ll-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.4);
}

/* Light mode via .ll-light class */
.ll-widget.ll-light {
  --ll-bg: #ffffff;
  --ll-bg-hover: #fafafa;
  --ll-bg-card: #f8fafc;
  --ll-bg-elevated: #f4f4f5;
  --ll-text: #111827;
  --ll-text-secondary: #6b7280;
  --ll-text-muted: #9ca3af;
  --ll-border: #e5e7eb;
}

.ll-widget * {
  box-sizing: border-box;
}

/* ===========================================
   GRID VARIANT
   =========================================== */
.ll-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.ll-grid--2col { grid-template-columns: repeat(2, 1fr); }
.ll-grid--3col { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 768px) {
  .ll-grid--2col, .ll-grid--3col { grid-template-columns: 1fr; }
}

.ll-card {
  background: var(--ll-bg);
  border: 1px solid var(--ll-border);
  border-radius: var(--ll-radius);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  display: block;
}

.ll-card:hover {
  border-color: var(--ll-primary);
  transform: translateY(-2px);
  box-shadow: var(--ll-shadow-glow);
}

.ll-card__screenshot {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--ll-bg-hover);
  overflow: hidden;
}

.ll-card__screenshot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.ll-card:hover .ll-card__screenshot img {
  transform: scale(1.03);
}

.ll-card__screenshot-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ll-gradient);
}

.ll-card__screenshot-placeholder svg {
  width: 40px;
  height: 40px;
  color: white;
  opacity: 0.7;
}

.ll-card__body {
  padding: 16px;
}

.ll-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.ll-card__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ll-text);
  line-height: 1.3;
  margin: 0;
}

.ll-card__lang {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ll-text-secondary);
  flex-shrink: 0;
}

.ll-card__lang-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ll-card__desc {
  font-size: 14px;
  color: var(--ll-text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ll-card__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--ll-text-secondary);
}

.ll-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ll-card__stat svg {
  width: 14px;
  height: 14px;
}

.ll-card__stat--star svg {
  color: var(--ll-star);
  fill: var(--ll-star);
}

.ll-card__mentions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

.ll-mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--ll-font-mono);
}

.ll-mention svg {
  width: 12px;
  height: 12px;
}

.ll-mention--hn {
  background: rgba(255, 102, 0, 0.1);
  color: var(--ll-hn);
}

.ll-mention--reddit {
  background: rgba(255, 69, 0, 0.1);
  color: var(--ll-reddit);
}

/* ===========================================
   HORIZONTAL STRIP VARIANT
   =========================================== */
.ll-strip {
  background: var(--ll-bg);
  border-radius: var(--ll-radius);
  padding: 20px;
}

.ll-strip__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ll-strip__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ll-strip__avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ll-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.ll-strip__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ll-strip__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ll-text);
}

.ll-strip__handle {
  font-size: 12px;
  color: var(--ll-text-muted);
}

.ll-strip__scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 4px;
}

.ll-strip__scroll::-webkit-scrollbar {
  display: none;
}

.ll-hcard {
  flex: 0 0 300px;
  scroll-snap-align: start;
  background: var(--ll-bg-card);
  border: 1px solid var(--ll-border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  display: block;
  color: inherit;
}

.ll-hcard:hover {
  border-color: var(--ll-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(99, 102, 241, 0.2);
}

.ll-hcard__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.ll-hcard__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ll-text);
}

.ll-hcard__lang {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 100px;
  background: var(--ll-bg-hover);
  font-size: 11px;
  font-weight: 500;
  color: var(--ll-text-secondary);
}

.ll-hcard__lang-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.ll-hcard__desc {
  font-size: 13px;
  color: var(--ll-text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ll-hcard__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ll-hcard__stats {
  display: flex;
  gap: 12px;
}

.ll-hcard__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ll-text-muted);
  font-family: var(--ll-font-mono);
  font-weight: 500;
}

.ll-hcard__stat svg {
  width: 14px;
  height: 14px;
}

.ll-hcard__stat--star svg {
  color: var(--ll-star);
  fill: var(--ll-star);
}

.ll-hcard__mentions {
  display: flex;
  gap: 6px;
}

.ll-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--ll-font-mono);
}

.ll-pill--hot {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.15));
  color: #f97316;
}

.ll-pill--hn {
  background: rgba(255, 102, 0, 0.12);
  color: var(--ll-hn);
}

.ll-pill--reddit {
  background: rgba(255, 69, 0, 0.12);
  color: var(--ll-reddit);
}

.ll-strip__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--ll-border);
}

.ll-strip__view-all {
  font-size: 13px;
  font-weight: 500;
  color: var(--ll-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ll-strip__view-all:hover {
  text-decoration: underline;
}

.ll-strip__powered {
  font-size: 11px;
  color: var(--ll-text-muted);
}

.ll-strip__powered a {
  color: var(--ll-text-secondary);
  text-decoration: none;
}

.ll-strip__powered a:hover {
  color: var(--ll-primary);
}

/* ===========================================
   BOLD VARIANT
   =========================================== */
.ll-bold-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.ll-bold-grid--2col { grid-template-columns: repeat(2, 1fr); }
.ll-bold-grid--3col { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 768px) {
  .ll-bold-grid--2col, .ll-bold-grid--3col { grid-template-columns: 1fr; }
}

.ll-bold-card {
  background: var(--ll-bg);
  border: 1px solid var(--ll-border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--ll-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  text-decoration: none;
  display: block;
}

.ll-bold-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--ll-gradient);
  opacity: 0;
  transition: opacity 0.3s;
}

.ll-bold-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--ll-shadow-glow);
  border-color: var(--ll-primary);
}

.ll-bold-card:hover::before {
  opacity: 1;
}

.ll-bold-card__screenshot {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: var(--ll-bg-elevated);
  overflow: hidden;
}

.ll-bold-card__screenshot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.ll-bold-card:hover .ll-bold-card__screenshot img {
  transform: scale(1.05);
}

.ll-bold-card__screenshot-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--ll-gradient);
  gap: 8px;
}

.ll-bold-card__screenshot-placeholder svg {
  width: 40px;
  height: 40px;
  color: white;
  opacity: 0.8;
}

.ll-bold-card__hot-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  border-radius: 100px;
  font-family: var(--ll-font-mono);
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.ll-bold-card__hot-badge--fire {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.9), rgba(239, 68, 68, 0.9));
}

.ll-bold-card__body {
  padding: 20px;
}

.ll-bold-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
}

.ll-bold-card__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ll-text);
  line-height: 1.2;
  margin: 0;
}

.ll-bold-card__lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--ll-bg-elevated);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ll-text-secondary);
  flex-shrink: 0;
}

.ll-bold-card__lang-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ll-bold-card__desc {
  font-size: 14px;
  color: var(--ll-text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ll-bold-card__stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--ll-border);
}

.ll-bold-card__stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ll-text-secondary);
}

.ll-bold-card__stat svg {
  width: 16px;
  height: 16px;
}

.ll-bold-card__stat--star svg {
  color: var(--ll-star);
  fill: var(--ll-star);
}

.ll-bold-card__mentions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.ll-bold-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--ll-font-mono);
}

.ll-bold-badge--hn {
  background: rgba(255, 102, 0, 0.12);
  color: var(--ll-hn);
}

.ll-bold-badge--reddit {
  background: rgba(255, 69, 0, 0.12);
  color: var(--ll-reddit);
}

/* ===========================================
   STATES: LOADING SKELETON
   =========================================== */
.ll-skeleton {
  background: linear-gradient(
    90deg,
    var(--ll-bg-hover) 0%,
    var(--ll-bg) 50%,
    var(--ll-bg-hover) 100%
  );
  background-size: 200% 100%;
  animation: ll-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes ll-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===========================================
   STATES: ERROR
   =========================================== */
.ll-error {
  background: var(--ll-bg);
  border: 1px solid var(--ll-border);
  border-radius: var(--ll-radius);
  padding: 32px;
  text-align: center;
}

.ll-error__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #ef4444;
}

.ll-error__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ll-text);
  margin: 0 0 4px;
}

.ll-error__message {
  font-size: 14px;
  color: var(--ll-text-secondary);
  margin: 0 0 16px;
}

.ll-error__retry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--ll-primary);
  color: white;
  border: none;
  border-radius: var(--ll-radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.ll-error__retry:hover {
  background: var(--ll-primary-hover);
}

/* ===========================================
   STATES: EMPTY
   =========================================== */
.ll-empty {
  background: var(--ll-bg);
  border: 1px dashed var(--ll-border);
  border-radius: var(--ll-radius);
  padding: 48px 32px;
  text-align: center;
}

.ll-empty__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--ll-text-muted);
}

.ll-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ll-text);
  margin: 0 0 4px;
}

.ll-empty__message {
  font-size: 14px;
  color: var(--ll-text-secondary);
  margin: 0;
}

/* ===========================================
   POWERED BY BADGE
   =========================================== */
.ll-powered {
  margin-top: 16px;
  text-align: center;
  font-size: 11px;
  color: var(--ll-text-muted);
}

.ll-powered a {
  color: var(--ll-text-secondary);
  text-decoration: none;
}

.ll-powered a:hover {
  color: var(--ll-primary);
}
`;

  // SVG Icons
  const ICONS = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    hn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-3.21 6.039-3.135-6.04H6.951z"/></svg>',
    reddit: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
  };

  // Language colors
  const LANGUAGE_COLORS = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
  };

  // Format star count
  function formatStars(stars) {
    if (stars >= 1000) {
      return (stars / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return stars.toString();
  }

  // Create container element
  function createContainer() {
    const container = document.createElement('div');
    container.className = 'll-widget';

    // Apply theme class
    if (config.theme === 'dark') {
      container.classList.add('ll-dark');
    } else if (config.theme === 'light') {
      container.classList.add('ll-light');
    }

    return container;
  }

  // Inject styles
  function injectStyles() {
    if (document.getElementById('ll-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'll-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Render loading skeleton
  function renderLoading(variant) {
    const skeletons = [];
    const count = Math.min(config.limit, 3);

    for (let i = 0; i < count; i++) {
      if (variant === 'horizontal') {
        skeletons.push(`
          <div class="ll-hcard">
            <div class="ll-hcard__top">
              <div class="ll-skeleton" style="width: 60%; height: 18px;"></div>
              <div class="ll-skeleton" style="width: 50px; height: 22px; border-radius: 100px;"></div>
            </div>
            <div style="margin-bottom: 14px;">
              <div class="ll-skeleton" style="width: 100%; height: 14px; margin-bottom: 6px;"></div>
              <div class="ll-skeleton" style="width: 80%; height: 14px;"></div>
            </div>
            <div class="ll-skeleton" style="width: 50px; height: 14px;"></div>
          </div>
        `);
      } else {
        skeletons.push(`
          <div class="ll-card">
            <div class="ll-card__screenshot">
              <div class="ll-skeleton" style="width: 100%; height: 100%;"></div>
            </div>
            <div class="ll-card__body">
              <div class="ll-card__header">
                <div class="ll-skeleton" style="width: 60%; height: 18px;"></div>
                <div class="ll-skeleton" style="width: 80px; height: 14px;"></div>
              </div>
              <div style="margin-bottom: 12px;">
                <div class="ll-skeleton" style="width: 100%; height: 14px; margin-bottom: 6px;"></div>
                <div class="ll-skeleton" style="width: 75%; height: 14px;"></div>
              </div>
              <div class="ll-skeleton" style="width: 120px; height: 14px;"></div>
            </div>
          </div>
        `);
      }
    }

    if (variant === 'horizontal') {
      return `<div class="ll-strip"><div class="ll-strip__scroll">${skeletons.join('')}</div></div>`;
    }
    return `<div class="ll-grid">${skeletons.join('')}</div>`;
  }

  // Render error state
  function renderError(retryFn) {
    return `
      <div class="ll-error">
        <div class="ll-error__icon">${ICONS.error}</div>
        <h3 class="ll-error__title">Unable to load projects</h3>
        <p class="ll-error__message">We couldn't fetch the project data. Please try again.</p>
        <button class="ll-error__retry" onclick="window.llWidgetRetry && window.llWidgetRetry()">
          ${ICONS.refresh}
          Retry
        </button>
      </div>
    `;
  }

  // Render empty state
  function renderEmpty() {
    return `
      <div class="ll-empty">
        <div class="ll-empty__icon">${ICONS.folder}</div>
        <h3 class="ll-empty__title">No projects yet</h3>
        <p class="ll-empty__message">This user hasn't added any projects to their portfolio.</p>
      </div>
    `;
  }

  // Render project card (grid variant)
  function renderGridCard(project) {
    const langColor = LANGUAGE_COLORS[project.language] || '#6e7681';
    const screenshot = project.screenshot
      ? `<img src="${project.screenshot}" alt="${project.name}" loading="lazy" />`
      : `<div class="ll-card__screenshot-placeholder">${ICONS.code}</div>`;

    let mentions = '';
    if (project.mentions.hackernews) {
      mentions += `<span class="ll-mention ll-mention--hn">${ICONS.hn}${project.mentions.hackernews}</span>`;
    }
    if (project.mentions.reddit) {
      mentions += `<span class="ll-mention ll-mention--reddit">${ICONS.reddit}${project.mentions.reddit}</span>`;
    }

    return `
      <a href="${project.repoUrl}" target="_blank" rel="noopener noreferrer" class="ll-card">
        <div class="ll-card__screenshot">${screenshot}</div>
        <div class="ll-card__body">
          <div class="ll-card__header">
            <h3 class="ll-card__title">${project.name}</h3>
            ${project.language ? `<span class="ll-card__lang"><span class="ll-card__lang-dot" style="background: ${langColor}"></span>${project.language}</span>` : ''}
          </div>
          ${project.description ? `<p class="ll-card__desc">${project.description}</p>` : ''}
          <div class="ll-card__meta">
            ${project.stars > 0 ? `<span class="ll-card__stat ll-card__stat--star">${ICONS.star}${formatStars(project.stars)}</span>` : ''}
            ${mentions ? `<div class="ll-card__mentions">${mentions}</div>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  // Render horizontal card
  function renderHorizontalCard(project) {
    const langColor = LANGUAGE_COLORS[project.language] || '#6e7681';
    const totalMentions = (project.mentions.hackernews || 0) + (project.mentions.reddit || 0);

    let mentionBadge = '';
    if (totalMentions > 0) {
      mentionBadge = `<span class="ll-pill ll-pill--hot">🔥 ${totalMentions}</span>`;
    }

    return `
      <a href="${project.repoUrl}" target="_blank" rel="noopener noreferrer" class="ll-hcard">
        <div class="ll-hcard__top">
          <span class="ll-hcard__title">${project.name}</span>
          ${project.language ? `<span class="ll-hcard__lang"><span class="ll-hcard__lang-dot" style="background: ${langColor}"></span>${project.language.substring(0, 2).toUpperCase()}</span>` : ''}
        </div>
        ${project.description ? `<p class="ll-hcard__desc">${project.description}</p>` : ''}
        <div class="ll-hcard__bottom">
          <div class="ll-hcard__stats">
            ${project.stars > 0 ? `<span class="ll-hcard__stat ll-hcard__stat--star">${ICONS.star}${formatStars(project.stars)}</span>` : ''}
          </div>
          ${mentionBadge ? `<div class="ll-hcard__mentions">${mentionBadge}</div>` : ''}
        </div>
      </a>
    `;
  }

  // Render bold card
  function renderBoldCard(project) {
    const langColor = LANGUAGE_COLORS[project.language] || '#6e7681';
    const totalMentions = (project.mentions.hackernews || 0) + (project.mentions.reddit || 0);
    const screenshot = project.screenshot
      ? `<img src="${project.screenshot}" alt="${project.name}" loading="lazy" />`
      : `<div class="ll-bold-card__screenshot-placeholder">${ICONS.code}</div>`;

    let hotBadge = '';
    if (totalMentions > 0) {
      hotBadge = `<span class="ll-bold-card__hot-badge${totalMentions >= 50 ? ' ll-bold-card__hot-badge--fire' : ''}">🔥 ${totalMentions} mentions</span>`;
    }

    let mentions = '';
    if (project.mentions.hackernews) {
      mentions += `<span class="ll-bold-badge ll-bold-badge--hn">${ICONS.hn}${project.mentions.hackernews}</span>`;
    }
    if (project.mentions.reddit) {
      mentions += `<span class="ll-bold-badge ll-bold-badge--reddit">${ICONS.reddit}${project.mentions.reddit}</span>`;
    }

    return `
      <a href="${project.repoUrl}" target="_blank" rel="noopener noreferrer" class="ll-bold-card">
        <div class="ll-bold-card__screenshot">
          ${screenshot}
          ${hotBadge}
        </div>
        <div class="ll-bold-card__body">
          <div class="ll-bold-card__header">
            <h3 class="ll-bold-card__title">${project.name}</h3>
            ${project.language ? `<span class="ll-bold-card__lang"><span class="ll-bold-card__lang-dot" style="background: ${langColor}"></span>${project.language}</span>` : ''}
          </div>
          ${project.description ? `<p class="ll-bold-card__desc">${project.description}</p>` : ''}
          <div class="ll-bold-card__stats">
            ${project.stars > 0 ? `<span class="ll-bold-card__stat ll-bold-card__stat--star">${ICONS.star}${formatStars(project.stars)}</span>` : ''}
            ${mentions ? `<div class="ll-bold-card__mentions">${mentions}</div>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  // Render grid widget
  function renderGrid(data) {
    const projects = data.projects.slice(0, config.limit);
    if (projects.length === 0) return renderEmpty();

    const cards = projects.map(renderGridCard).join('');
    const colClass = config.columns === '2' ? 'll-grid--2col' : config.columns === '3' ? 'll-grid--3col' : '';

    return `
      <div class="ll-grid ${colClass}">${cards}</div>
      <div class="ll-powered">Powered by <a href="https://launchlog.com/${data.user.username}" target="_blank" rel="noopener noreferrer">LaunchLog</a></div>
    `;
  }

  // Render horizontal strip widget
  function renderHorizontal(data) {
    const projects = data.projects.slice(0, config.limit);
    if (projects.length === 0) return renderEmpty();

    const cards = projects.map(renderHorizontalCard).join('');
    const avatarContent = data.user.avatar
      ? `<img src="${data.user.avatar}" alt="${data.user.username}" />`
      : data.user.displayName.charAt(0).toUpperCase();

    return `
      <div class="ll-strip">
        <div class="ll-strip__header">
          <div class="ll-strip__title">
            <div class="ll-strip__avatar">${avatarContent}</div>
            <div>
              <div class="ll-strip__name">${data.user.displayName}</div>
              <div class="ll-strip__handle">@${data.user.username}</div>
            </div>
          </div>
        </div>
        <div class="ll-strip__scroll">${cards}</div>
        <div class="ll-strip__footer">
          <a href="https://launchlog.com/${data.user.username}" target="_blank" rel="noopener noreferrer" class="ll-strip__view-all">
            View all ${data.projects.length} projects
            ${ICONS.chevronRight}
          </a>
          <span class="ll-strip__powered">Powered by <a href="https://launchlog.com" target="_blank" rel="noopener noreferrer">LaunchLog</a></span>
        </div>
      </div>
    `;
  }

  // Render bold widget
  function renderBold(data) {
    const projects = data.projects.slice(0, config.limit);
    if (projects.length === 0) return renderEmpty();

    const cards = projects.map(renderBoldCard).join('');
    const colClass = config.columns === '2' ? 'll-bold-grid--2col' : config.columns === '3' ? 'll-bold-grid--3col' : '';

    return `
      <div class="ll-bold-grid ${colClass}">${cards}</div>
      <div class="ll-powered">Powered by <a href="https://launchlog.com/${data.user.username}" target="_blank" rel="noopener noreferrer">LaunchLog</a></div>
    `;
  }

  // Main render function
  function render(data) {
    switch (config.variant) {
      case 'horizontal':
      case 'strip':
        return renderHorizontal(data);
      case 'bold':
      case 'feature':
        return renderBold(data);
      case 'grid':
      default:
        return renderGrid(data);
    }
  }

  // Initialize widget
  async function init() {
    injectStyles();

    const container = createContainer();

    // Insert container after the script tag
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

    // Show loading state
    container.innerHTML = renderLoading(config.variant);

    // Fetch data and render
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch widget data');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      container.innerHTML = render(data);
    } catch (error) {
      console.error('LaunchLog Widget Error:', error);

      // Set up retry function
      window.llWidgetRetry = function() {
        container.innerHTML = renderLoading(config.variant);
        init();
      };

      container.innerHTML = renderError();
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
