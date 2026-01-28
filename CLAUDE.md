# DealPing Implementation Plan

## Overview
DealPing is a UK Amazon deals aggregator using the Keepa API to display verified deals with accurate pricing.

## Completed Features

### Core Infrastructure
- [x] Next.js 16 setup with TypeScript
- [x] Tailwind CSS styling with dark mode support
- [x] Keepa API integration (`src/lib/keepa.ts`)
- [x] Lightning Deals API with 4-hour file-based caching (500 tokens/call)
- [x] Browse Deals with 10-minute file-based caching (5 tokens/call)
- [x] Search with 3-hour file-based caching (10 tokens/call)
- [x] Product data with 1-hour file-based caching (1-2 tokens/call)
- [x] Daily cron job for refreshing deals (`/api/cron/refresh-deals`)
- [x] Amazon UK affiliate link generation
- [x] Maintenance mode proxy (MAINTENANCE_MODE env toggle, `src/proxy.ts` — Next.js 16 convention)

### Anti-Fake-Deal System
- [x] `isLowest90` filter - Homepage lightning deals only (removed from /deals and category pages)
- [x] `maxSalesRank` filter - Only popular products (top 100k general, 200k categories)
- [x] `minRating` filter - At least 3.5 stars
- [x] Category exclusions (Books, Kindle, Music, DVD) for general browsing only
- [x] Kindle/ebook keyword filtering
- [x] Keepa deltaPercent fallback for deals without validated RRP
- [x] Expired lightning deal filtering
- [x] Lightning deal pricing edge-case fix (back-calculate originalPrice when Keepa reports same deal/regular price)

### Pricing & Price History
- [x] Price source tracking (`priceSource`: `list`, `avg90`, `deal`)
- [x] Lightning deal disclaimer (explains "was" price = regular selling price, not inflated RRP)
- [x] Browse deal disclaimer (explains "was" price = 90-day average)
- [x] Price history chart with stepAfter interpolation (accurate step-like prices)
- [x] AreaChart with gradient fill, colour-coded stats (green/amber/red)
- [x] Average price reference line (dashed amber)
- [x] Time period selector (1M, 3M, 1Y, 5Y, ALL) with data age detection
- [x] Stats computed from actual data array for consistency
- [x] Min/max preservation during chart data sampling
- [x] Lazy-loaded price history (PriceHistoryLoader saves tokens)

### Pages
- [x] Homepage (`/`) - Lightning Deals only (no browse deals fallback), friendly empty state, enlarged category cards
- [x] Deals page (`/deals`) - Browse deals with category + time range filters, pending filter pattern (all filters go through Apply button), Load More every 48 products (revalidates every 5 min)
- [x] Custom 404 page — branded with DealPing styling, dark mode, "Browse Deals" CTA
- [x] Search page (`/search`) - Keepa product search with pagination, filtering, sorting
- [x] Product page (`/product/[asin]`) - Product details with price history, disclaimers, alerts, sharing, rating overlay on image
- [x] Categories page (`/categories`) - Category listing
- [x] Category page (`/categories/[slug]`) - Products by category with filters and load more
- [x] Alerts page (`/alerts`) - User's price alerts dashboard (auth-protected)
- [x] Profile page (`/profile`) - Name editing, password change, alerts summary (auth-protected)
- [x] Sign in page (`/auth/signin`) - Credentials + Google login
- [x] Sign up page (`/auth/signup`) - User registration
- [x] Coming soon page (`/coming-soon`) - Maintenance mode landing

### Components
- [x] Header with navigation, search, user menu dropdown, mobile hamburger menu
- [x] Footer (3-column layout: brand, categories, quick links — all links verified)
- [x] ProductCard - Deal card with discount badge, deal score, "Posted X ago" badge, affiliate link
- [x] ProductCardSkeleton - Loading skeleton for product cards
- [x] SearchBar - With search history (local storage)
- [x] CategoryCard
- [x] DealsClient - Client-side filtering/sorting with category dropdown, Apply button, Load More pagination (48 per batch)
- [x] SearchResultsClient - Client-side filtering/sorting for search results
- [x] CategoryDealsClient - Client-side filtering for category pages
- [x] PriceHistoryChart - Recharts area chart with stats panel
- [x] PriceHistoryLoader - Lazy loading wrapper for price history
- [x] ShareButtons - Social sharing (Twitter, Facebook, WhatsApp, Telegram, Copy)
- [x] SetAlertButton - Price alert form with target price, "any drop" option, auth redirect, "Manage alerts" link on success
- [x] MobileBottomNav - Sticky bottom navigation for mobile
- [x] Providers - NextAuth SessionProvider wrapper

### API Routes
- [x] `/api/auth/[...nextauth]` - NextAuth handler (Google + Credentials)
- [x] `/api/auth/signup` - User registration
- [x] `/api/alerts` - GET/POST alerts (auth-protected)
- [x] `/api/alerts/[id]` - PATCH/DELETE individual alert
- [x] `/api/user/profile` - GET/PATCH user profile (auth-protected)
- [x] `/api/user/password` - POST change password (auth-protected)
- [x] `/api/keepa/product/[asin]` - Get product by ASIN
- [x] `/api/keepa/search` - Search products
- [x] `/api/keepa/status` - Token status
- [x] `/api/deals` - Browse deals with pagination
- [x] `/api/search` - Search API
- [x] `/api/categories` - Get categories list
- [x] `/api/products` - Get products from DB
- [x] `/api/products/[id]` - Get product by ID from DB
- [x] `/api/cron/refresh-deals` - Daily refresh lightning deals
- [x] `/api/cron/check-prices` - Price check for alerts (every 6hrs, 1 token/ASIN, 24hr notification cooldown)

### Authentication & User Accounts
- [x] NextAuth v5 with JWT strategy
- [x] Google OAuth provider
- [x] Credentials provider (email + bcrypt password)
- [x] User profile page with name editing and password change
- [x] Alert management dashboard
- [x] Auth-protected routes with `router.replace` (prevents back-button loops)
- [x] Callback URL support for post-login redirect

### Price Alerts System
- [x] Database setup (PostgreSQL/Neon with Prisma 7 ORM, `prisma-client` generator)
- [x] Alert API endpoints (GET/POST/PATCH/DELETE)
- [x] Email notification system (Resend with HTML templates)
- [x] Price check cron job (`/api/cron/check-prices`)
- [x] "Set Price Alert" button on product pages
- [x] Alerts management page (`/alerts`) with pause/resume/delete
- [x] Product persistence in DB (by ASIN) with price records
- [x] Batch processing (20 ASINs at a time)

### SEO & Performance
- [x] Dynamic meta tags for product pages (title, description, OpenGraph, Twitter cards)
- [x] Sitemap generation (`/sitemap.xml`)
- [x] Robots.txt (`/robots.txt`)
- [x] JSON-LD structured data for products (Product schema with Offer, AggregateRating)
- [x] Loading skeletons for all major pages
- [x] Error boundaries (global, app-level, product-specific)

### Mobile Optimization
- [x] Responsive design (mobile menu, bottom nav)
- [x] Touch-friendly interactions (min 44px tap targets)

### Utilities
- [x] `src/lib/keepa.ts` - Keepa API, caching, transforms, affiliate URLs
- [x] `src/lib/utils.ts` - `formatTimeAgo()` shared helper
- [x] `src/lib/email.ts` - Resend email with HTML template (dev mode logs instead of sending)
- [x] `src/lib/prisma.ts` - PrismaClient singleton (Prisma 7 `prisma-client` with `@prisma/adapter-pg`)
- [x] `src/lib/rateLimit.ts` - Rate limiting
- [x] `src/lib/sampleData.ts` - Categories and sample data
- [x] `src/lib/amazon.ts`, `awin.ts` - Affiliate integrations

---

## Remaining Features

### Medium Priority
- [ ] PWA support (optional - add to home screen, offline)

### Low Priority
- [ ] Browser extension for price checking
- [ ] RSS feed for deals

---

## Deployment Checklist

- [x] Set up GCP hosting
- [x] Configure environment variables
- [x] Configure Resend API key for production emails
- [x] Configure domain and SSL
- [x] Click tracking for affiliate links
- [x] Popular searches/products
- [ ] Set up crontab for deal refresh + price checks:
  ```
  # Refresh lightning deals daily at midnight
  0 0 * * * curl -s -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/refresh-deals
  # Check alert prices every 6 hours (1 token per unique ASIN)
  0 */6 * * * curl -s -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/check-prices
  ```
- [ ] Set up monitoring/logging

---

## Database Schema (Prisma 7 + PostgreSQL/Neon)

| Model | Key Fields |
|---|---|
| User | id, email (unique), name, password (bcrypt), emailVerified |
| Account | OAuth provider accounts (Google) |
| Session | User sessions |
| Category | id, name, slug, icon, color |
| Product | id, asin (unique), name, description, imageUrl, categoryId |
| Retailer | id, name (unique), slug (unique), affiliateNetwork, affiliateId |
| PriceRecord | id, productId, retailerId, price, originalPrice, url, recordedAt |
| PriceAlert | id, userId, productId, targetPrice, alertOnAnyDrop, notifyEmail, isActive, lastNotified |

Unique constraint: PriceAlert(userId + productId)

---

## Token Budget

Daily Keepa token budget: ~30,000 tokens (refills at 20 tokens/minute)

### Token Cost per Endpoint
| Endpoint | Cost | File Cache Duration |
|---|---|---|
| Lightning Deals | 500 tokens/call | 4 hours |
| Browse Deals | 5 tokens/150 deals | 10 minutes |
| Product | 1-2 tokens/ASIN | 1 hour |
| Search | 10 tokens/page | 3 hours |
| Price History | 1-2 tokens/ASIN | 1 hour (shared with product) |
| Price Check (Cron) | 1 token/ASIN | On demand |

### Token Optimization Strategies
1. **File-based caching on ALL endpoints** - persists across server restarts and hot reloads
2. **Lightning Deals cache (4hr)** - refreshed 6x/day = 3,000 tokens/day
3. **Browse Deals cache (10min)** - prevents user refresh spam
4. **Search cache (3hr)** - same search term returns cached results
5. **Product cache (1hr)** - individual product pages
6. **Lazy Price History** - only loads when user clicks button
7. **No RRP validation by default** - uses Keepa's deltaPercent instead of batch product fetch (saves 1 token/product)
8. **Batch alert processing** - groups ASINs to minimize API calls

### Estimated Daily Usage (moderate traffic)
- Homepage lightning deals: ~3,000 tokens (6 refreshes)
- Browse deals page: ~720 tokens (1 refresh per 10 min = 144 calls, but many are cache hits)
- Category pages (12 categories): ~360 tokens
- Product views (~100/day): ~200 tokens
- Searches (~50 unique/day): ~500 tokens (3hr cache per term, empty results cached too)
- Price alert checks (4x/day): ~100 tokens (assuming ~25 unique ASINs)
- **Total: ~5,000 tokens/day** (well within 30,000 budget)

Note: Lightning Deals only used on homepage for guaranteed accurate pricing.
Browse Deals used elsewhere with anti-fake-deal filters for quality control.
