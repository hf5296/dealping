# Future Updates

## Remaining Features

### Medium Priority
- [ ] **PWA Support** - Add to home screen, offline mode, push notifications
  - Would need a service worker and manifest.json
  - Consider using `next-pwa` package

### Low Priority
- [ ] **Browser Extension** - Chrome/Firefox extension for checking prices while browsing Amazon
- [ ] **RSS Feed** - `/feed.xml` endpoint for deals so users can subscribe in RSS readers

---

## Deployment Tasks

### Cron Jobs (Not Yet Configured)
Set up scheduled tasks to keep data fresh:

```bash
# Refresh lightning deals daily at midnight
0 0 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/refresh-deals

# Check alert prices every 6 hours (1 token per unique ASIN)
0 */6 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/check-prices
```

Options for running cron jobs:
1. **GCP Cloud Scheduler** - If hosting on GCP
2. **Vercel Cron** - If using Vercel (add to vercel.json)
3. **External service** - cron-job.org, EasyCron, etc.
4. **Server crontab** - If you have SSH access to a server

### Monitoring & Logging
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Better Uptime, etc.)
- [ ] Configure log aggregation for debugging production issues

---

## Token Budget Reference

Daily Keepa token budget: ~30,000 tokens (refills at 20 tokens/minute)

| Endpoint | Cost | Cache Duration |
|----------|------|----------------|
| Lightning Deals | 500 tokens/call | 4 hours |
| Browse Deals | 5 tokens/150 deals | 30 minutes |
| Product | 1-2 tokens/ASIN | 1 hour |
| Search | 10 tokens/page | 3 hours |
| Price Check (Cron) | 1 token/ASIN | On demand |

**Estimated daily usage:** ~5,000 tokens (well within budget)

---

## Ideas for Future Features

- [ ] Deal notifications via email digest (daily/weekly best deals)
- [ ] Price drop percentage customization per alert
- [ ] Wishlist/favorites feature
- [ ] Deal sharing with friends
- [ ] Price comparison with other retailers
- [ ] Historical price charts on category pages
- [ ] "Similar deals" recommendations
- [ ] User reviews/comments on deals
