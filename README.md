# LaunchLog

Your developer portfolio, always up-to-date. Automatically.

## The Problem

You build cool stuff. You push to GitHub. Your portfolio site? Still showing that project from 2023.

Updating portfolios manually sucks. So nobody does it. Your best work stays hidden.

## The Solution

Connect your GitHub. LaunchLog auto-generates beautiful showcase pages that update themselves.

- **Auto-sync from GitHub:** README changes, new commits, stars, releases - all reflected instantly
- **Embeddable widgets:** Drop a script tag in your portfolio. It stays fresh forever.
- **Matches your site:** Widgets inherit your site's styling - fonts, colors, spacing. Looks native, not embedded.
- **Smart screenshots:** Auto-captures project screenshots from live URLs or repo images.
- **Zero maintenance:** Build. Push. Showcase. That's it.

## How It Works

1. **Connect GitHub** - Sign in, select repos to showcase
2. **Get your page** - `launchlog.com/yourusername`
3. **Embed anywhere** - `<script src="launchlog.com/embed/yourusername.js"></script>`
4. **Ship and forget** - Updates automatically when you push code

## What Gets Showcased

- **Project cards** with README excerpts and descriptions
- **Screenshots** auto-captured from live demos or repo images
- **Live activity status** ("Updated 2 days ago", "Active development")
- **GitHub stats** (stars, forks, primary language)
- **Social proof** - Mentions across the web (like citations for research papers)
  - HackerNews discussions (points, comments)
  - Product Hunt launches (upvotes, ranking)
  - Reddit threads (upvotes, subreddit)
  - Twitter/X mentions and threads
  - Blog posts and articles
  - YouTube videos featuring the project
- **Links** to repo + live demo (parsed from README)
- **Release history** and version info
- **Tech stack** extracted from package.json, requirements.txt, go.mod, etc.

## Design Philosophy

**Widgets should feel native, not foreign.**

- Inherit parent site's CSS variables (fonts, colors, spacing)
- Responsive by default
- No iframe jank
- Minimal footprint (~5KB gzipped)
- Works with dark mode
- Accessible (WCAG AA compliant)

## Use Cases

- **Portfolio sites** - Always current without manual updates
- **Personal sites** - Show what you're actively building
- **Dev profiles** - Embed in About pages, blogs, newsletters
- **GitHub profiles** - Enhanced README with live project grid
- **Job applications** - Proof of consistent shipping

## Why LaunchLog is Different

**Other tools show GitHub stats. We show real-world impact.**

- **GitProfile, GPortfolio** → Show stars and forks
- **LaunchLog** → Shows HackerNews threads, Product Hunt launches, blog mentions, Twitter buzz

**It's like Google Scholar citations, but for your projects.**

Prove you didn't just build it. Prove people talked about it.

## Vision

Free forever. Built for makers who ship.

Your portfolio should reflect your work, not your ability to maintain a portfolio.

---

## Embeddable Widget

Drop a widget on your portfolio site. It stays fresh forever, automatically updating when you push code.

### Quick Start

Add this to your website where you want the widget to appear:

```html
<!-- 1. Add a container div -->
<div data-launchlog="your-username"></div>

<!-- 2. Include the widget script (before </body>) -->
<script src="https://launchlog.com/api/embed/your-username/widget.js"></script>
```

### Widget Styles

Choose from three design variations:

| Style | Description |
|-------|-------------|
| `grid` | Clean, editorial grid layout (default) |
| `horizontal` | Horizontal scrolling carousel |
| `feature` | Bold feature cards with gradients |

### Configuration Options

Customize the widget with query parameters:

```html
<script src="https://launchlog.com/api/embed/your-username/widget.js?style=grid&theme=auto&limit=6"></script>
```

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `style` | `grid`, `horizontal`, `feature` | `grid` | Widget layout style |
| `theme` | `light`, `dark`, `auto` | `auto` | Color theme (auto follows system) |
| `limit` | `1-12` | `6` | Max number of projects to show |

### Customizing Colors

The widget inherits CSS variables from your site. Override them to match your brand:

```css
:root {
  /* Typography */
  --ll-font: 'Your Font', sans-serif;

  /* Colors */
  --ll-bg: #ffffff;
  --ll-bg-hover: #fafafa;
  --ll-text: #111827;
  --ll-text-secondary: #6b7280;
  --ll-text-tertiary: #9ca3af;
  --ll-border: #e5e7eb;
  --ll-primary: #6366f1;
  --ll-primary-hover: #4f46e5;

  /* Border radius */
  --ll-radius: 12px;
  --ll-radius-sm: 8px;
}
```

### Dark Mode

The widget automatically supports dark mode:

- **Auto theme** (`theme=auto`): Follows `prefers-color-scheme`
- **Manual toggle**: Add `.ll-dark` class to the container
- **Force light**: Use `theme=light` parameter

```html
<!-- Force dark mode -->
<div data-launchlog="your-username" class="ll-dark"></div>
```

### Technical Details

- **Pure vanilla JS** - No dependencies
- **~5KB gzipped** - Minimal footprint
- **DOM injection** - No iframes
- **Lazy loading** - Images load on scroll
- **CORS enabled** - Works on any domain
- **CDN cached** - 1 hour cache with stale-while-revalidate

### API Endpoint

Direct API access for custom integrations:

```bash
GET /api/embed/{username}?limit=6
```

Returns JSON with project data, mentions, and metadata.

---

**Status:** In development. First version coming soon.
