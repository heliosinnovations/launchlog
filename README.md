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
3. **Embed anywhere** - `<script src="launchlog.com/embed/launchlog-widget.js" data-username="yourusername"></script>`
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

Add your LaunchLog projects to any website with a single script tag.

### Quick Start

```html
<script
  src="https://launchlog.com/embed/launchlog-widget.js"
  data-username="your-username"
  data-variant="grid"
></script>
```

### Widget Variants

**Grid** (default) - Responsive project cards with screenshots

```html
<script
  src="https://launchlog.com/embed/launchlog-widget.js"
  data-username="your-username"
  data-variant="grid"
  data-columns="3"
  data-limit="6"
></script>
```

**Horizontal Strip** - Scrollable carousel for full-width sections

```html
<script
  src="https://launchlog.com/embed/launchlog-widget.js"
  data-username="your-username"
  data-variant="horizontal"
  data-limit="5"
></script>
```

**Bold Feature Cards** - Eye-catching cards with gradient accents

```html
<script
  src="https://launchlog.com/embed/launchlog-widget.js"
  data-username="your-username"
  data-variant="bold"
  data-columns="3"
></script>
```

### Configuration Options

| Attribute | Description | Values | Default |
|-----------|-------------|--------|---------|
| `data-username` | Your LaunchLog username (required) | string | - |
| `data-variant` | Widget style | `grid`, `horizontal`, `bold` | `grid` |
| `data-limit` | Number of projects to show | number | `6` |
| `data-columns` | Grid columns (grid/bold only) | `2`, `3` | `3` |
| `data-theme` | Color theme | `auto`, `light`, `dark` | `auto` |

### Dark Mode

Widgets automatically detect your site's color scheme via `prefers-color-scheme`. You can also force a theme:

```html
<!-- Force light mode -->
<script ... data-theme="light"></script>

<!-- Force dark mode -->
<script ... data-theme="dark"></script>
```

### Customization

Override CSS variables to match your site's design:

```css
.ll-widget {
  --ll-bg: #your-background;
  --ll-text: #your-text-color;
  --ll-primary: #your-brand-color;
  --ll-border: #your-border-color;
  --ll-radius: 12px;
}
```

### Technical Details

- **Pure vanilla JS** - No dependencies
- **~5KB gzipped** - Minimal footprint
- **DOM injection** - No iframes
- **Lazy loading** - Images load on scroll
- **CORS enabled** - Works on any domain
- **CDN cached** - 1 hour cache with stale-while-revalidate

### API Endpoint

For custom integrations, fetch widget data directly:

```
GET /api/widget/[username]
```

Response:
```json
{
  "user": {
    "username": "...",
    "avatar": "...",
    "displayName": "..."
  },
  "projects": [
    {
      "name": "...",
      "description": "...",
      "screenshot": "...",
      "stars": 0,
      "language": "...",
      "repoUrl": "...",
      "demoUrl": "...",
      "mentions": {
        "hackernews": 5,
        "reddit": 3
      }
    }
  ]
}
```

---

**Status:** In development. First version coming soon.
