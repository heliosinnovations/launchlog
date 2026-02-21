# LaunchLog Architecture

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
  - Server Components for better performance
  - Dynamic routes for user profiles: `app/[username]/page.tsx`
  - ISR (Incremental Static Regeneration) for profile caching
- **Tailwind CSS** for styling
- **React 19** (latest stable)

### Backend
- **Next.js API Routes** (`app/api/`)
- **Server Actions** for mutations
- **Edge Functions** for lightweight endpoints

### Database
- **Supabase** (Postgres)
  - Hosted database with built-in auth
  - Real-time subscriptions (for future features)
  - Row-level security policies

### Authentication
- **Supabase Auth** with **GitHub OAuth**
  - Users sign in with GitHub
  - Automatically sync GitHub repos on first login
  - Access token stored for repo fetching

### Deployment
- **Vercel**
  - Zero-config Next.js deployment
  - Edge network for global CDN
  - Automatic HTTPS
  - Preview deployments for PRs

---

## Database Schema

### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username TEXT UNIQUE NOT NULL,
  github_id INTEGER UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id INTEGER UNIQUE NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL, -- e.g., "octocat/Hello-World"
  description TEXT,
  homepage_url TEXT,
  primary_language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  screenshot_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `mentions`
```sql
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'hackernews' | 'producthunt' | 'reddit' | 'twitter' | 'blog' | 'youtube'
  source_url TEXT NOT NULL,
  title TEXT,
  excerpt TEXT,
  score INTEGER, -- HN points, PH upvotes, Reddit upvotes
  comment_count INTEGER,
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentions_project_id ON mentions(project_id);
CREATE INDEX idx_mentions_source_type ON mentions(source_type);
```

### `repo_metadata`
```sql
CREATE TABLE repo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  readme_md TEXT, -- Full README content
  tech_stack JSONB, -- Extracted from package.json, requirements.txt, etc.
  topics TEXT[], -- GitHub topics
  last_commit_at TIMESTAMPTZ,
  release_tag TEXT,
  release_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## User Profile Pages (Dynamic Routes)

### Route Structure
```
app/
  [username]/
    page.tsx          # User showcase page
    layout.tsx        # Shared layout
    loading.tsx       # Loading state
    error.tsx         # Error boundary
```

### Incremental Static Regeneration (ISR)

**Problem**: Generating a static page for every user doesn't scale (thousands of users = thousands of build-time pages).

**Solution**: Dynamic routes with ISR

```typescript
// app/[username]/page.tsx
export const revalidate = 3600; // Revalidate every 1 hour

export default async function UserShowcase({ params }: { params: { username: string } }) {
  const { username } = params;

  // Fetch from database
  const user = await fetchUserData(username);

  if (!user) {
    notFound(); // 404
  }

  return <ShowcasePage user={user} />;
}
```

**How it works:**
1. First request to `/alice` → generates page on-demand, caches it
2. Subsequent requests → serve cached page (fast)
3. After 1 hour → next request regenerates page in background, serves stale version immediately
4. Fresh page replaces cached version

**Benefits:**
- No build-time bottleneck (pages generated on first visit)
- Fast response times (cached after first visit)
- Always reasonably fresh (revalidates every hour)
- Scales to millions of users

---

## API Integrations

### GitHub API
```typescript
// app/api/sync/route.ts
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  const { userId } = await request.json();

  // Get user's GitHub token from Supabase
  const octokit = new Octokit({ auth: userToken });

  // Fetch repos
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100
  });

  // Sync to database
  for (const repo of repos) {
    await supabase.from('projects').upsert({
      github_repo_id: repo.id,
      repo_name: repo.name,
      repo_full_name: repo.full_name,
      description: repo.description,
      homepage_url: repo.homepage,
      primary_language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count
    });
  }
}
```

### HackerNews Algolia API
```typescript
// app/api/mentions/hackernews/route.ts
export async function POST(request: Request) {
  const { repoUrl } = await request.json();

  const response = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(repoUrl)}&tags=story`
  );

  const data = await response.json();

  // Store mentions in database
  for (const hit of data.hits) {
    await supabase.from('mentions').insert({
      project_id: projectId,
      source_type: 'hackernews',
      source_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      title: hit.title,
      score: hit.points,
      comment_count: hit.num_comments,
      author: hit.author,
      published_at: new Date(hit.created_at)
    });
  }
}
```

### Product Hunt API
- Requires approval for API access
- Alternative: Web scraping (carefully, respecting robots.txt)

### Reddit API
```typescript
// app/api/mentions/reddit/route.ts
export async function POST(request: Request) {
  const { repoUrl } = await request.json();

  const response = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(repoUrl)}`
  );

  const data = await response.json();

  // Store mentions
}
```

### Twitter/X API
- Requires paid API access ($100/month minimum for v2 API)
- **V1 decision**: Skip Twitter mentions, add in V2

---

## Screenshot Generation

### Options

**Option 1: Puppeteer (headless Chrome)**
```typescript
import puppeteer from 'puppeteer';

export async function captureScreenshot(url: string): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'networkidle2' });

  const screenshot = await page.screenshot({
    type: 'png',
    encoding: 'base64'
  });

  await browser.close();

  // Upload to Supabase Storage
  const { data } = await supabase.storage
    .from('screenshots')
    .upload(`${projectId}.png`, Buffer.from(screenshot, 'base64'));

  return data.publicUrl;
}
```

**Option 2: Screenshot API service**
- screenshotapi.net
- urlbox.io
- Cheaper, faster, no server overhead

**V1 decision**: Use screenshot API service, fallback to repo social image (og:image)

---

## Embeddable Widget

### Widget Script
```javascript
// public/embed.js
(function() {
  const username = document.currentScript.getAttribute('data-username');
  const theme = document.currentScript.getAttribute('data-theme') || 'auto';
  const variant = document.currentScript.getAttribute('data-variant') || 'card';

  // Fetch user data
  fetch(`https://launchlog.com/api/embed/${username}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('launchlog-widget');
      container.innerHTML = renderWidget(data, variant, theme);

      // Inherit parent site's CSS variables
      applyParentStyles(container);
    });
})();
```

### Usage
```html
<div id="launchlog-widget"></div>
<script
  src="https://launchlog.com/embed.js"
  data-username="alice"
  data-variant="card"
  data-theme="auto"
></script>
```

### Variants
1. **Card** - Project grid with thumbnails
2. **Compact** - List view with icons
3. **Minimal** - Text-only list

---

## Caching Strategy

### Profile Pages
- **ISR revalidation**: 1 hour
- **Why**: Balance between freshness and performance
- **Edge case**: User can manually trigger refresh via dashboard

### GitHub Sync
- **Automatic sync**: Every 24 hours (cron job)
- **Manual sync**: User clicks "Sync Now" button
- **Webhook**: GitHub webhook triggers immediate sync on push (future)

### Mentions
- **Background job**: Runs daily to fetch new mentions
- **Rate limits**: Respect API rate limits (HN: no limit, Reddit: 60 req/min)

---

## MVP Feature Scope (V1)

### Must Have
- ✅ GitHub OAuth sign-in
- ✅ Auto-sync repos from GitHub
- ✅ User profile page (`/[username]`)
- ✅ Project showcase grid
- ✅ Basic widget (card variant)
- ✅ HackerNews mentions
- ✅ Reddit mentions
- ✅ Manual "Add Mention" form
- ✅ Screenshots (via API service)

### Nice to Have (V2)
- ⏳ Product Hunt mentions
- ⏳ Twitter/X mentions
- ⏳ YouTube video mentions
- ⏳ Blog post mentions (via web search)
- ⏳ GitHub webhook auto-sync
- ⏳ Custom domain for profiles
- ⏳ Analytics (page views, widget embeds)
- ⏳ Dark mode toggle
- ⏳ Widget customization UI

---

## Security Considerations

### Authentication
- Use Supabase Row-Level Security (RLS) policies
- Users can only edit their own data
- Public read access to profile pages

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can read public profiles
CREATE POLICY "Public profiles are viewable by all"
  ON users FOR SELECT
  USING (true);
```

### API Keys
- Store in Vercel environment variables
- Never expose in client-side code
- Rotate GitHub OAuth tokens periodically

### Rate Limiting
- Implement rate limiting on API routes (next-rate-limit)
- Prevent abuse of sync endpoint

---

## Deployment Checklist

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
GITHUB_OAUTH_CLIENT_ID=xxx
GITHUB_OAUTH_CLIENT_SECRET=xxx
SCREENSHOT_API_KEY=xxx
```

### Database Setup
1. Create Supabase project
2. Run schema migrations
3. Enable GitHub OAuth provider
4. Set up RLS policies

### Domain
- `launchlog.com` (primary)
- `www.launchlog.com` (redirect to primary)

---

## Future Enhancements

### Auto-Detection of Mentions
- Cron job searches for repo URL across web
- NLP to filter false positives
- Notification when new mention found

### Social Sharing
- Auto-generate og:image for profile pages
- "Share on Twitter" button with pre-filled text

### Monetization (Future)
- Premium tier: custom domain, analytics, priority support
- Free tier: launchlog.com/username subdomain

---

## Why This Stack?

**Next.js**: Industry standard for React SSR/SSG, excellent DX, Vercel integration

**Supabase**: Postgres + Auth + Storage in one, generous free tier, easy migrations

**Vercel**: Best Next.js deployment experience, global CDN, zero config

**ISR over SSG**: Scales to millions of users without build-time bottleneck

**Tailwind**: Rapid styling, consistent design system, small bundle size

---

**Status**: Architecture finalized. Ready for V1 implementation.
