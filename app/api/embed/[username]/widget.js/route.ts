import { NextRequest, NextResponse } from "next/server";

// CORS and caching headers
const headers = {
  "Content-Type": "application/javascript; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // CDN cache: 1 hour, stale-while-revalidate for 24 hours
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

/**
 * GET /api/embed/[username]/widget.js
 * Returns the LaunchLog widget JavaScript for embedding
 *
 * Query params:
 * - style: grid | horizontal | feature (default: grid)
 * - theme: light | dark | auto (default: auto)
 * - limit: number of projects (default: 6, max: 12)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const searchParams = request.nextUrl.searchParams;

  const style = searchParams.get("style") || "grid";
  const theme = searchParams.get("theme") || "auto";
  const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 12);

  // Get the base URL for API calls
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "launchlog.com";
  const baseUrl = `${protocol}://${host}`;

  // The widget script - pure vanilla JS
  const widgetScript = `
(function() {
  'use strict';

  // Configuration
  var CONFIG = {
    username: '${username}',
    style: '${style}',
    theme: '${theme}',
    limit: ${limit},
    baseUrl: '${baseUrl}',
    apiUrl: '${baseUrl}/api/embed/${username}?limit=${limit}'
  };

  // Language colors (GitHub-style)
  var LANG_COLORS = {
    'TypeScript': '#3178c6', 'JavaScript': '#f1e05a', 'Python': '#3572A5',
    'Rust': '#dea584', 'Go': '#00ADD8', 'Java': '#b07219', 'C++': '#f34b7d',
    'C': '#555555', 'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138',
    'Kotlin': '#A97BFF', 'Dart': '#00B4AB', 'Vue': '#41b883', 'HTML': '#e34c26',
    'CSS': '#563d7c', 'Shell': '#89e051', 'Scala': '#c22d40'
  };

  // CSS Styles (minified)
  var CSS = \`
    .ll-widget{font-family:var(--ll-font,inherit);--ll-bg:#fff;--ll-bg-hover:#fafafa;--ll-text:#111827;--ll-text-secondary:#6b7280;--ll-text-tertiary:#9ca3af;--ll-border:#e5e7eb;--ll-primary:#6366f1;--ll-primary-hover:#4f46e5;--ll-radius:12px;--ll-radius-sm:8px;--ll-hn:#ff6600;--ll-reddit:#ff4500;--ll-star:#fbbf24}
    @media(prefers-color-scheme:dark){.ll-widget:not(.ll-light){--ll-bg:#18181b;--ll-bg-hover:#27272a;--ll-text:#fafafa;--ll-text-secondary:#a1a1aa;--ll-text-tertiary:#71717a;--ll-border:#3f3f46}}
    .ll-widget.ll-dark{--ll-bg:#18181b;--ll-bg-hover:#27272a;--ll-text:#fafafa;--ll-text-secondary:#a1a1aa;--ll-text-tertiary:#71717a;--ll-border:#3f3f46}
    .ll-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
    @media(min-width:640px){.ll-grid--2col{grid-template-columns:repeat(2,1fr)}}
    @media(min-width:1024px){.ll-grid--3col{grid-template-columns:repeat(3,1fr)}}
    .ll-strip{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:8px 0}
    .ll-strip::-webkit-scrollbar{height:8px}.ll-strip::-webkit-scrollbar-track{background:var(--ll-bg-hover);border-radius:4px}.ll-strip::-webkit-scrollbar-thumb{background:var(--ll-border);border-radius:4px}
    .ll-strip .ll-card{flex:0 0 300px;scroll-snap-align:start}
    .ll-card{background:var(--ll-bg);border:1px solid var(--ll-border);border-radius:var(--ll-radius);overflow:hidden;transition:border-color .2s,transform .2s}
    .ll-card:hover{border-color:var(--ll-primary);transform:translateY(-2px)}
    .ll-card__screenshot{position:relative;width:100%;aspect-ratio:16/9;background:var(--ll-bg-hover);overflow:hidden}
    .ll-card__screenshot img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
    .ll-card:hover .ll-card__screenshot img{transform:scale(1.03)}
    .ll-card__screenshot-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .ll-card__screenshot-placeholder svg{width:40px;height:40px;color:var(--ll-text-tertiary);opacity:.5}
    .ll-card__body{padding:16px}
    .ll-card__header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}
    .ll-card__title{font-size:16px;font-weight:600;color:var(--ll-text);text-decoration:none;line-height:1.3}
    .ll-card__title:hover{color:var(--ll-primary)}
    .ll-card__lang{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ll-text-secondary);flex-shrink:0}
    .ll-card__lang-dot{width:8px;height:8px;border-radius:50%}
    .ll-card__desc{font-size:14px;color:var(--ll-text-secondary);line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .ll-card__meta{display:flex;align-items:center;gap:16px;font-size:13px;color:var(--ll-text-secondary)}
    .ll-card__stat{display:inline-flex;align-items:center;gap:4px}
    .ll-card__stat svg{width:14px;height:14px}
    .ll-card__stat--star svg{color:var(--ll-star);fill:var(--ll-star)}
    .ll-card__mentions{margin-left:auto;display:flex;gap:6px}
    .ll-mention{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;font-family:ui-monospace,monospace}
    .ll-mention svg{width:12px;height:12px}
    .ll-mention--hn{background:rgba(255,102,0,.1);color:var(--ll-hn)}
    .ll-mention--reddit{background:rgba(255,69,0,.1);color:var(--ll-reddit)}
    .ll-card__footer{padding:12px 16px;border-top:1px solid var(--ll-border);display:flex;justify-content:space-between;align-items:center}
    .ll-card__updated{font-size:12px;color:var(--ll-text-tertiary)}
    .ll-card__link{font-size:12px;color:var(--ll-primary);text-decoration:none;display:inline-flex;align-items:center;gap:4px}
    .ll-card__link:hover{text-decoration:underline}
    .ll-card__link svg{width:14px;height:14px}
    .ll-skeleton{background:linear-gradient(90deg,var(--ll-bg-hover) 0%,var(--ll-bg) 50%,var(--ll-bg-hover) 100%);background-size:200% 100%;animation:ll-shimmer 1.5s infinite;border-radius:4px}
    @keyframes ll-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .ll-card--loading .ll-card__screenshot{background:var(--ll-bg-hover)}
    .ll-card--loading .ll-skeleton-title{height:18px;width:60%}
    .ll-card--loading .ll-skeleton-lang{height:14px;width:80px}
    .ll-card--loading .ll-skeleton-desc{height:14px;width:100%;margin-bottom:6px}
    .ll-card--loading .ll-skeleton-desc:last-child{width:75%;margin-bottom:0}
    .ll-card--loading .ll-skeleton-meta{height:14px;width:120px}
    .ll-error{background:var(--ll-bg);border:1px solid var(--ll-border);border-radius:var(--ll-radius);padding:32px;text-align:center}
    .ll-error__icon{width:48px;height:48px;margin:0 auto 16px;color:#ef4444}
    .ll-error__title{font-size:16px;font-weight:600;color:var(--ll-text);margin-bottom:4px}
    .ll-error__message{font-size:14px;color:var(--ll-text-secondary);margin-bottom:16px}
    .ll-error__retry{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:var(--ll-primary);color:#fff;border:none;border-radius:var(--ll-radius-sm);font-size:14px;font-weight:500;cursor:pointer;transition:background .2s}
    .ll-error__retry:hover{background:var(--ll-primary-hover)}
    .ll-error__retry svg{width:16px;height:16px}
    .ll-empty{background:var(--ll-bg);border:1px dashed var(--ll-border);border-radius:var(--ll-radius);padding:48px 32px;text-align:center}
    .ll-empty__icon{width:48px;height:48px;margin:0 auto 16px;color:var(--ll-text-tertiary)}
    .ll-empty__title{font-size:16px;font-weight:600;color:var(--ll-text);margin-bottom:4px}
    .ll-empty__message{font-size:14px;color:var(--ll-text-secondary)}
    .ll-powered{margin-top:16px;text-align:center;font-size:11px;color:var(--ll-text-tertiary)}
    .ll-powered a{color:var(--ll-text-secondary);text-decoration:none}
    .ll-powered a:hover{color:var(--ll-primary)}
    .ll-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}
    @media(min-width:768px){.ll-feature-grid--2col{grid-template-columns:repeat(2,1fr)}}
    @media(min-width:1024px){.ll-feature-grid--3col{grid-template-columns:repeat(3,1fr)}}
    .ll-feature-card{background:var(--ll-bg);border:1px solid var(--ll-border);border-radius:20px;overflow:hidden;box-shadow:0 4px 24px -4px rgba(0,0,0,.08);transition:all .3s;position:relative}
    .ll-feature-card:hover{transform:translateY(-4px);box-shadow:0 8px 32px -4px rgba(0,0,0,.12)}
    .ll-feature-card__gradient{position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)}
    .ll-feature-card__screenshot{position:relative;width:100%;aspect-ratio:16/10;background:var(--ll-bg-hover);overflow:hidden}
    .ll-feature-card__screenshot img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
    .ll-feature-card:hover .ll-feature-card__screenshot img{transform:scale(1.05)}
    .ll-feature-card__body{padding:20px}
    .ll-feature-card__title{font-size:18px;font-weight:700;color:var(--ll-text);margin-bottom:8px;text-decoration:none;display:block}
    .ll-feature-card__title:hover{color:var(--ll-primary)}
    .ll-feature-card__desc{font-size:14px;color:var(--ll-text-secondary);line-height:1.6;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .ll-feature-card__stats{display:flex;gap:12px;flex-wrap:wrap}
    .ll-feature-card__stat{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--ll-bg-hover);border-radius:8px;font-size:13px;color:var(--ll-text-secondary)}
    .ll-feature-card__stat svg{width:16px;height:16px}
    .ll-feature-card__stat--star svg{color:var(--ll-star);fill:var(--ll-star)}
    .ll-feature-card__stat--hn{color:var(--ll-hn)}
    .ll-feature-card__stat--reddit{color:var(--ll-reddit)}
  \`;

  // SVG Icons (inline for performance)
  var ICONS = {
    placeholder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    star: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    hn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-3.21 6.039-3.135-6.04H6.951z"/></svg>',
    reddit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0z"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  };

  // Utility functions
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m];
    });
  }

  function formatStars(n) {
    if (n >= 1000) return (n/1000).toFixed(1).replace(/\\.0$/,'') + 'k';
    return n.toString();
  }

  function timeAgo(date) {
    var seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    var months = Math.floor(days / 30);
    return months + ' month' + (months === 1 ? '' : 's') + ' ago';
  }

  function getLangColor(lang) {
    return LANG_COLORS[lang] || '#6e7681';
  }

  // Inject styles
  function injectStyles() {
    if (document.getElementById('ll-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'll-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // Render loading skeleton
  function renderLoading(container, count) {
    var gridClass = CONFIG.style === 'horizontal' ? 'll-strip' : 'll-grid';
    var html = '<div class="' + gridClass + '">';
    for (var i = 0; i < count; i++) {
      html += '<article class="ll-card ll-card--loading">' +
        '<div class="ll-card__screenshot"></div>' +
        '<div class="ll-card__body">' +
          '<div class="ll-card__header">' +
            '<div class="ll-skeleton ll-skeleton-title"></div>' +
            '<div class="ll-skeleton ll-skeleton-lang"></div>' +
          '</div>' +
          '<div style="margin-bottom:12px">' +
            '<div class="ll-skeleton ll-skeleton-desc"></div>' +
            '<div class="ll-skeleton ll-skeleton-desc"></div>' +
          '</div>' +
          '<div class="ll-skeleton ll-skeleton-meta"></div>' +
        '</div>' +
      '</article>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // Render error state
  function renderError(container, message, onRetry) {
    container.innerHTML = '<div class="ll-error">' +
      '<div class="ll-error__icon">' + ICONS.error + '</div>' +
      '<h3 class="ll-error__title">Unable to load projects</h3>' +
      '<p class="ll-error__message">' + escapeHtml(message || 'Please try again later.') + '</p>' +
      '<button class="ll-error__retry">' + ICONS.refresh + ' Retry</button>' +
    '</div>';
    container.querySelector('.ll-error__retry').addEventListener('click', onRetry);
  }

  // Render empty state
  function renderEmpty(container) {
    container.innerHTML = '<div class="ll-empty">' +
      '<div class="ll-empty__icon">' + ICONS.folder + '</div>' +
      '<h3 class="ll-empty__title">No projects yet</h3>' +
      '<p class="ll-empty__message">This user hasn\\'t added any projects to their portfolio.</p>' +
    '</div>';
  }

  // Render a single project card (grid/horizontal style)
  function renderCard(project) {
    var screenshot = project.screenshot_url
      ? '<img src="' + escapeHtml(project.screenshot_url) + '" alt="' + escapeHtml(project.name) + '" loading="lazy">'
      : '<div class="ll-card__screenshot-placeholder">' + ICONS.placeholder + '</div>';

    var lang = project.language
      ? '<span class="ll-card__lang"><span class="ll-card__lang-dot" style="background:' + getLangColor(project.language) + '"></span>' + escapeHtml(project.language) + '</span>'
      : '';

    var stars = project.stars > 0
      ? '<span class="ll-card__stat ll-card__stat--star">' + ICONS.star + formatStars(project.stars) + '</span>'
      : '';

    var mentions = '';
    if (project.mentions.hackernews > 0 || project.mentions.reddit > 0) {
      mentions = '<div class="ll-card__mentions">';
      if (project.mentions.hackernews > 0) {
        mentions += '<span class="ll-mention ll-mention--hn">' + ICONS.hn + project.mentions.hackernews + '</span>';
      }
      if (project.mentions.reddit > 0) {
        mentions += '<span class="ll-mention ll-mention--reddit">' + ICONS.reddit + project.mentions.reddit + '</span>';
      }
      mentions += '</div>';
    }

    var viewLink = project.demo_url || project.url;
    var viewText = project.demo_url ? 'Live Demo' : 'View';

    return '<article class="ll-card">' +
      '<a href="' + escapeHtml(viewLink) + '" target="_blank" rel="noopener noreferrer" class="ll-card__screenshot">' + screenshot + '</a>' +
      '<div class="ll-card__body">' +
        '<div class="ll-card__header">' +
          '<a href="' + escapeHtml(project.url) + '" target="_blank" rel="noopener noreferrer" class="ll-card__title">' + escapeHtml(project.name) + '</a>' +
          lang +
        '</div>' +
        (project.description ? '<p class="ll-card__desc">' + escapeHtml(project.description) + '</p>' : '') +
        '<div class="ll-card__meta">' + stars + mentions + '</div>' +
      '</div>' +
      '<div class="ll-card__footer">' +
        '<span class="ll-card__updated">Updated ' + timeAgo(project.updated_at) + '</span>' +
        '<a href="' + escapeHtml(viewLink) + '" target="_blank" rel="noopener noreferrer" class="ll-card__link">' + escapeHtml(viewText) + ICONS.external + '</a>' +
      '</div>' +
    '</article>';
  }

  // Render a feature card (bold style)
  function renderFeatureCard(project) {
    var screenshot = project.screenshot_url
      ? '<img src="' + escapeHtml(project.screenshot_url) + '" alt="' + escapeHtml(project.name) + '" loading="lazy">'
      : '<div class="ll-card__screenshot-placeholder">' + ICONS.placeholder + '</div>';

    var stats = '<div class="ll-feature-card__stats">';
    if (project.language) {
      stats += '<span class="ll-feature-card__stat"><span style="width:10px;height:10px;border-radius:50%;background:' + getLangColor(project.language) + '"></span>' + escapeHtml(project.language) + '</span>';
    }
    if (project.stars > 0) {
      stats += '<span class="ll-feature-card__stat ll-feature-card__stat--star">' + ICONS.star + formatStars(project.stars) + '</span>';
    }
    if (project.mentions.hackernews > 0) {
      stats += '<span class="ll-feature-card__stat ll-feature-card__stat--hn">' + ICONS.hn + ' ' + project.mentions.hackernews + '</span>';
    }
    if (project.mentions.reddit > 0) {
      stats += '<span class="ll-feature-card__stat ll-feature-card__stat--reddit">' + ICONS.reddit + ' ' + project.mentions.reddit + '</span>';
    }
    stats += '</div>';

    var viewLink = project.demo_url || project.url;

    return '<article class="ll-feature-card">' +
      '<div class="ll-feature-card__gradient"></div>' +
      '<a href="' + escapeHtml(viewLink) + '" target="_blank" rel="noopener noreferrer" class="ll-feature-card__screenshot">' + screenshot + '</a>' +
      '<div class="ll-feature-card__body">' +
        '<a href="' + escapeHtml(project.url) + '" target="_blank" rel="noopener noreferrer" class="ll-feature-card__title">' + escapeHtml(project.name) + '</a>' +
        (project.description ? '<p class="ll-feature-card__desc">' + escapeHtml(project.description) + '</p>' : '') +
        stats +
      '</div>' +
    '</article>';
  }

  // Render projects based on style
  function renderProjects(container, data) {
    if (!data.projects || data.projects.length === 0) {
      renderEmpty(container);
      return;
    }

    var html = '';
    var gridClass = '';

    if (CONFIG.style === 'horizontal') {
      gridClass = 'll-strip';
    } else if (CONFIG.style === 'feature') {
      gridClass = 'll-feature-grid';
      if (data.projects.length === 2) gridClass += ' ll-feature-grid--2col';
      else if (data.projects.length >= 3) gridClass += ' ll-feature-grid--3col';
    } else {
      gridClass = 'll-grid';
      if (data.projects.length === 2) gridClass += ' ll-grid--2col';
      else if (data.projects.length >= 3) gridClass += ' ll-grid--3col';
    }

    html += '<div class="' + gridClass + '">';
    for (var i = 0; i < data.projects.length; i++) {
      if (CONFIG.style === 'feature') {
        html += renderFeatureCard(data.projects[i]);
      } else {
        html += renderCard(data.projects[i]);
      }
    }
    html += '</div>';

    html += '<div class="ll-powered">Powered by <a href="' + CONFIG.baseUrl + '/' + escapeHtml(data.username) + '" target="_blank" rel="noopener noreferrer">LaunchLog</a></div>';

    container.innerHTML = html;
  }

  // Initialize widget
  function init() {
    // Find target element
    var target = document.querySelector('[data-launchlog="' + CONFIG.username + '"]');
    if (!target) {
      console.warn('[LaunchLog] Target element not found for user: ' + CONFIG.username);
      return;
    }

    // Apply theme class
    var themeClass = 'll-widget';
    if (CONFIG.theme === 'dark') {
      themeClass += ' ll-dark';
    } else if (CONFIG.theme === 'light') {
      themeClass += ' ll-light';
    }
    target.className = (target.className + ' ' + themeClass).trim();

    // Inject styles
    injectStyles();

    // Show loading state
    renderLoading(target, Math.min(CONFIG.limit, 3));

    // Fetch data
    function fetchData() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', CONFIG.apiUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              renderProjects(target, data);
            } catch (e) {
              renderError(target, 'Failed to parse response', fetchData);
            }
          } else {
            var errorMsg = 'Failed to load projects';
            try {
              var err = JSON.parse(xhr.responseText);
              errorMsg = err.error || errorMsg;
            } catch (e) {}
            renderError(target, errorMsg, fetchData);
          }
        }
      };
      xhr.onerror = function() {
        renderError(target, 'Network error', fetchData);
      };
      xhr.send();
    }

    fetchData();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`.trim();

  return new NextResponse(widgetScript, {
    status: 200,
    headers,
  });
}
