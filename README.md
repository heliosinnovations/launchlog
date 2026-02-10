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

See `supabase/README.md` for detailed database migration instructions.

### Running Migrations

1. **Via Supabase Dashboard:**
   - Go to https://supabase.com/dashboard/project/twgjcqivoyyjoricuueo
   - Navigate to SQL Editor
   - Run migrations in order: `000_migration_tracking.sql`, then `001_initial_schema.sql`, etc.

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

### Health Check

The `/api/health/db` endpoint verifies database schema integrity:

```bash
curl https://launchlog.app/api/health/db
```

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "checks": [
    { "name": "users_table", "status": "pass", "duration_ms": 15 },
    { "name": "auth_id_column", "status": "pass", "duration_ms": 12 },
    { "name": "auth_id_index", "status": "pass", "duration_ms": 8 },
    { "name": "projects_table", "status": "pass", "duration_ms": 10 }
  ]
}
```

**Response (unhealthy - schema drift detected):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-10T12:00:00.000Z",
  "checks": [
    { "name": "users_table", "status": "pass", "duration_ms": 15 },
    { "name": "auth_id_column", "status": "fail", "message": "column does not exist", "duration_ms": 12 }
  ]
}
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

## Production

Deployed on Vercel with automatic deployments from the `main` branch.

## Troubleshooting

### Auth Redirect Loop

If users experience infinite redirect loops after login:

1. **Check health endpoint:** `curl https://launchlog.app/api/health/db`
2. **Look for `auth_id_column` failure** - indicates schema drift
3. **Run migration:** Apply `003_add_auth_id.sql` if missing
4. **Verify:** Health check should return `status: "healthy"`

### Common Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| `no_code` | OAuth callback missing code | Retry login |
| `auth_failed` | Session exchange failed | Check Supabase auth config |
| `db_schema_error` | Schema drift detected | Run missing migrations |
| `user_sync_failed` | User upsert failed | Check database permissions |
| `missing_metadata` | GitHub metadata incomplete | Re-authorize GitHub OAuth |

### Checking Logs

Auth callback errors are logged with structured JSON:

```json
{
  "timestamp": "2026-02-10T12:00:00.000Z",
  "code": "SCHEMA_DRIFT",
  "message": "Database schema validation failed",
  "userId": "auth-user-123"
}
```

Check Vercel logs for `[AUTH_CALLBACK]` entries.

---

Built by [Helios Innovations](https://heliosinnovations.org)
