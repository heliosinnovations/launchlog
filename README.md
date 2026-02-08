# LaunchLog

Your portfolio of shipped projects. Stop sharing GitHub repos. Start showcasing what you've actually built, launched, and shipped.

## Features

- 🚀 Beautiful public profile pages
- 📊 Project showcase with screenshots and tech stack
- 🔐 GitHub OAuth authentication
- 📈 Analytics and profile views
- 🎨 Dark mode by default
- ⚡ Fast and responsive

## Tech Stack

- Next.js 16 with App Router
- Supabase for database and auth
- Tailwind CSS v4
- TypeScript
- NextAuth.js

## Environment Variables

Required environment variables (set in Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Database Setup

See `supabase/README.md` for database migration instructions.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Production

Deployed on Vercel with automatic deployments from the `main` branch.

---

Built by [Helios Innovations](https://heliosinnovations.org)
