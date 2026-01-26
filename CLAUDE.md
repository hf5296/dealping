# DealPing Implementation Plan

## Overview
DealPing is a UK Amazon deals aggregator using the Keepa API to display verified deals with accurate pricing.

## Completed Features

### Core Infrastructure
- [x] Next.js 16 setup with TypeScript
- [x] Tailwind CSS styling with dark mode support
- [x] Keepa API integration (`src/lib/keepa.ts`)
- [x] Lightning Deals API with 24-hour file-based caching (500 tokens/call)
- [x] Daily cron job for refreshing deals (`/api/cron/refresh-deals`)
- [x] Amazon UK affiliate link generation

### Pages
- [x] Homepage (`/`) - Shows 8 Lightning Deals (accurate pricing), fully static
- [x] Deals page (`/deals`) - Shows browse deals with filtering/sorting (revalidates every 5 min)
- [x] Search page (`/search`) - Keepa product search with pagination, filtering, sorting
- [x] Product page (`/product/[asin]`) - Individual product details with price history chart
- [x] Categories page (`/categories`) - Category listing
- [x] Category page (`/categories/[slug]`) - Products by category with filters and load more
- [x] Auth pages (`/auth/signin`, `/auth/signup`) - UI only

### Components
- [x] Header with navigation + mobile hamburger menu
- [x] Footer
- [x] ProductCard - Displays deal with affiliate link
- [x] SearchBar - With search history (local storage)
- [x] CategoryCard
- [x] DealsClient - Client-side filtering/sorting for deals page
- [x] SearchResultsClient - Client-side filtering/sorting for search results
- [x] CategoryDealsClient - Client-side filtering for category pages
- [x] PriceHistoryChart - Real price history data from Keepa (5Y support)
- [x] PriceHistoryLoader - Lazy loading for price history (saves tokens)
- [x] ShareButtons - Social sharing (Twitter, Facebook, WhatsApp, Telegram, Copy)
- [x] MobileBottomNav - Sticky bottom navigation for mobile

### API Routes
- [x] `/api/cron/refresh-deals` - Cron endpoint for daily refresh
- [x] `/api/keepa/product/[asin]` - Get product by ASIN
- [x] `/api/keepa/search` - Search products
- [x] `/api/keepa/status` - Token status
- [x] `/api/deals` - Browse deals with pagination
- [x] `/api/search` - Search API

### SEO & Performance
- [x] Dynamic meta tags for product pages
- [x] Sitemap generation (`/sitemap.xml`)
- [x] Robots.txt (`/robots.txt`)
- [x] JSON-LD structured data for products
- [x] Loading skeletons for all major pages

---

## Remaining Features

### High Priority

#### 1. Price Alerts System
- [ ] Database setup (PostgreSQL/SQLite) for storing alerts
- [ ] User authentication (NextAuth already partially set up)
- [ ] Create alert API endpoints
- [ ] Email notification system (SendGrid/Resend)
- [ ] Price check cron job

### Medium Priority

#### 2. User Accounts
- [ ] Complete NextAuth setup with database
- [ ] User profile page
- [ ] Saved products/watchlist
- [ ] Alert management dashboard

#### 3. Mobile Optimization
- [x] Responsive improvements (mobile menu, bottom nav)
- [x] Touch-friendly interactions (min 44px tap targets)
- [ ] PWA support (optional)

### Low Priority

#### 4. Analytics & Tracking
- [ ] Click tracking for affiliate links
- [ ] Popular searches/products
- [ ] Conversion tracking

#### 5. Additional Features
- [x] Deal sharing (social links - Twitter, Facebook, WhatsApp, Telegram, Copy)
- [ ] Browser extension for price checking
- [ ] RSS feed for deals

---

## Technical Debt

- [x] Remove unused `productUtils.ts` (mock data)
- [x] Clean up DEBUG console.logs in keepa.ts
- [x] Add loading skeletons for better UX
- [x] Add proper error boundaries (global, app-level, and product-specific)

---

## Deployment Checklist

- [ ] Set up GCP hosting
- [ ] Configure environment variables (KEEPA_API_KEY, CRON_SECRET, etc.)
- [ ] Set up crontab for daily deal refresh:
  ```
  0 0 * * * curl -s -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/refresh-deals
  ```
- [ ] Configure domain and SSL
- [ ] Set up monitoring/logging

---

## Token Budget

Daily Keepa token budget: ~30,000 tokens (refills at 20 tokens/minute)

Current usage:
- Lightning Deals for homepage (daily): 500 tokens (24hr file cache)
- Browse Deals for /deals page: 5 tokens per 150 deals + validation
- Product page view: ~1 token (product data only)
- Price history load (on-demand): ~2 tokens (only when user clicks button)
- Search: 10 tokens per page

### Token Optimization Strategies
1. **Lightning Deals Cache**: 24-hour file-based cache prevents token waste on server restarts
2. **Product Cache**: 24-hour file-based cache for individual products
3. **Lazy Price History**: Price history only loads when user clicks "Load Price History" button
   - Before: ~2 tokens per product page view (even for quick glances)
   - After: ~1 token per view + ~2 tokens only if user wants price history

Note: Lightning Deals only used on homepage for guaranteed accurate pricing.
Browse Deals used elsewhere for more variety (some pricing may not match Amazon exactly).
