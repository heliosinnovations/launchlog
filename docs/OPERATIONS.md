# LaunchLog Operations Guide

## Backup Strategy

### Database (Supabase)
- **Automatic Backups**: Supabase Pro provides daily automated backups with 7-day retention
- **Point-in-Time Recovery**: Available on paid plans for recovery to any point in the last 7 days
- **Manual Backups**: Export via Supabase dashboard or use `pg_dump` with service role key

```bash
# Manual backup command (requires psql)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Application Code
- **Git Repository**: All code stored in GitHub at `heliosinnovations/launchlog`
- **Branch Strategy**: `main` branch for production, feature branches for development
- **Vercel Deployments**: Every commit to main triggers automatic deployment

### Environment Variables
- Production env vars stored securely in Vercel
- Local `.env.local` in `.gitignore` (never committed)
- Document all required env vars in README.md

## Rollback Procedures

### Vercel Deployment Rollback
1. Go to Vercel Dashboard → LaunchLog project
2. Navigate to "Deployments" tab
3. Find the last known good deployment
4. Click "..." menu → "Promote to Production"

```bash
# Or via CLI
vercel rollback [deployment-url]
```

### Database Rollback
1. **Supabase Dashboard**: Go to Settings → Database → Backups
2. **Restore Point**: Select backup timestamp before the issue
3. **Restore**: Click "Restore" (creates new project with restored data)

For migration rollback, create down migrations:
```sql
-- Example: Rollback migration 002
DROP TABLE IF EXISTS new_table_name;
```

### Emergency Contacts
- Vercel Support: support.vercel.com
- Supabase Support: support.supabase.com
- GitHub Status: githubstatus.com

## Monitoring

### Error Monitoring (Sentry)
- Configure `NEXT_PUBLIC_SENTRY_DSN` in Vercel env vars
- Errors automatically captured in production
- Dashboard: sentry.io

### Analytics (Google Analytics)
- Configure `NEXT_PUBLIC_GA_ID` in Vercel env vars
- Key events tracked:
  - `sign_up` - New user registrations
  - `project_created` - New projects added
  - `profile_view` - Public profile visits
  - `cta_click` - Conversion tracking

### Uptime Monitoring
- Vercel provides built-in analytics
- Consider BetterUptime or similar for alerts

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm run test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables verified in Vercel

### Post-Deployment
- [ ] Verify homepage loads
- [ ] Test OAuth login flow
- [ ] Create test project
- [ ] Check error monitoring for new errors
- [ ] Verify analytics events firing

## Incident Response

### Severity Levels
1. **P1 - Critical**: Site completely down, data loss
2. **P2 - Major**: Core feature broken (auth, project creation)
3. **P3 - Minor**: UI issues, non-critical feature bugs
4. **P4 - Low**: Cosmetic issues, minor improvements

### Response Actions
1. **Assess**: Identify scope and impact
2. **Communicate**: Update status page if applicable
3. **Mitigate**: Rollback if needed
4. **Fix**: Deploy fix to staging first
5. **Review**: Post-incident review within 24 hours
