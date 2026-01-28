# DealPing Project Guide

A comprehensive guide to understanding how this project works. Written for beginners who want to understand modern web development with Next.js.

---

## Table of Contents

1. [What Does This Project Do?](#what-does-this-project-do)
2. [The Tech Stack](#the-tech-stack)
3. [Project Structure](#project-structure)
4. [How Data Flows Through the App](#how-data-flows-through-the-app)
5. [Key Concepts Explained](#key-concepts-explained)
6. [How Specific Features Work](#how-specific-features-work)
7. [Local Development](#local-development)
8. [Common Tasks](#common-tasks)
9. [Debugging Tips](#debugging-tips)

---

## What Does This Project Do?

DealPing is a deals aggregator website for Amazon UK. It:

1. **Fetches deals** from the Keepa API (a service that tracks Amazon prices)
2. **Displays them** in a user-friendly website
3. **Lets users set price alerts** to get notified when products drop in price
4. **Tracks price history** so users can see if a deal is genuinely good

The goal: Help people find genuine deals, not fake "50% off" products where the original price was inflated.

---

## The Tech Stack

Here's every technology used and WHY it's used:

### Frontend

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **Next.js 16** | React framework for building websites | Handles routing, server-side rendering, API routes - everything in one package |
| **React** | UI library | Build interactive user interfaces with components |
| **TypeScript** | JavaScript with types | Catches errors before they happen, better autocomplete |
| **Tailwind CSS** | Utility CSS framework | Write styles quickly without switching files |

### Backend

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **Next.js API Routes** | Backend endpoints | No need for separate backend server |
| **Prisma** | Database toolkit | Easy database queries with TypeScript support |
| **PostgreSQL (Neon)** | Database | Stores users, alerts, products |
| **NextAuth.js** | Authentication | Handles login/signup, sessions, OAuth |

### External Services

| Service | What It Does | Why We Use It |
|---------|--------------|---------------|
| **Keepa API** | Amazon price data | Provides deals, price history, product info |
| **Resend** | Email sending | Send price alert notifications |
| **Google OAuth** | Social login | Let users sign in with Google |
| **Neon** | Hosted PostgreSQL | Free tier, no server management |

### Development Tools

| Tool | What It Does |
|------|--------------|
| **ESLint** | Catches code problems |
| **Prettier** | Formats code consistently |
| **Prisma Studio** | Visual database editor |

---

## Project Structure

```
dealping/
├── .cache/                    # File-based cache (auto-generated)
│   ├── lightning-deals.json   # Cached lightning deals (4 hours)
│   ├── browse-deals/          # Cached browse deals (30 min)
│   ├── products/              # Cached product data (1 hour)
│   └── search/                # Cached search results (3 hours)
│
├── prisma/
│   ├── schema.prisma          # Database schema (tables, relationships)
│   ├── seed.ts                # Script to populate initial data
│   └── generated/             # Auto-generated Prisma client
│
├── src/
│   ├── app/                   # Next.js App Router (pages & API)
│   │   ├── page.tsx           # Homepage (/)
│   │   ├── layout.tsx         # Root layout (wraps all pages)
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   │
│   │   ├── deals/             # /deals page
│   │   │   ├── page.tsx       # Server component (fetches data)
│   │   │   ├── DealsClient.tsx # Client component (interactivity)
│   │   │   └── loading.tsx    # Loading skeleton
│   │   │
│   │   ├── lightning-deals/   # /lightning-deals page
│   │   │   ├── page.tsx
│   │   │   └── LightningDealsClient.tsx
│   │   │
│   │   ├── product/[id]/      # /product/:id (dynamic route)
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── categories/
│   │   │   ├── page.tsx       # /categories (list all)
│   │   │   └── [slug]/        # /categories/:slug (dynamic)
│   │   │       └── page.tsx
│   │   │
│   │   ├── search/            # /search?q=...
│   │   ├── alerts/            # /alerts (user's alerts)
│   │   ├── profile/           # /profile (user settings)
│   │   │
│   │   ├── auth/              # Authentication pages
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   └── api/               # API Routes (backend endpoints)
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── deals/         # GET /api/deals
│   │       ├── lightning-deals/ # GET /api/lightning-deals
│   │       ├── search/        # GET /api/search
│   │       ├── alerts/        # GET/POST /api/alerts
│   │       ├── user/          # User profile/password
│   │       ├── cron/          # Scheduled tasks
│   │       └── keepa/         # Direct Keepa API access
│   │
│   ├── components/            # Reusable UI components
│   │   ├── Header.tsx         # Navigation bar
│   │   ├── Footer.tsx         # Page footer
│   │   ├── ProductCard.tsx    # Deal card component
│   │   ├── ProductCardSkeleton.tsx # Loading placeholder
│   │   ├── SearchBar.tsx      # Search input
│   │   ├── CategoryCard.tsx   # Category tile
│   │   ├── PriceHistoryChart.tsx # Price graph
│   │   ├── SetAlertButton.tsx # Alert creation form
│   │   └── ShareButtons.tsx   # Social sharing
│   │
│   ├── lib/                   # Utility functions & services
│   │   ├── keepa.ts           # Keepa API client + caching
│   │   ├── prisma.ts          # Database client
│   │   ├── email.ts           # Email sending
│   │   ├── rateLimit.ts       # Rate limiting
│   │   ├── utils.ts           # Helper functions
│   │   └── sampleData.ts      # Category definitions
│   │
│   ├── auth.ts                # NextAuth configuration
│   ├── proxy.ts               # Maintenance mode middleware
│   └── types/                 # TypeScript type definitions
│
├── public/                    # Static files (images, etc.)
├── .env                       # Environment variables (secrets)
├── package.json               # Dependencies & scripts
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── next.config.ts             # Next.js config
```

---

## How Data Flows Through the App

### Example: Viewing Lightning Deals

```
1. USER visits /lightning-deals

2. SERVER (page.tsx - Server Component)
   └── Calls getLightningDeals() from lib/keepa.ts

3. KEEPA.TS checks cache
   ├── Cache HIT (< 4 hours old)?
   │   └── Return cached data immediately (no API call)
   │
   └── Cache MISS?
       ├── Call Keepa API (costs 500 tokens)
       ├── Save to .cache/lightning-deals.json
       └── Return fresh data

4. SERVER renders HTML with deals data

5. HTML sent to BROWSER

6. CLIENT (LightningDealsClient.tsx - Client Component)
   └── Handles filtering, sorting, "Load More" button
   └── All client-side (no new API calls for filtering)
```

### Example: Setting a Price Alert

```
1. USER clicks "Set Alert" button

2. CLIENT (SetAlertButton.tsx)
   └── Checks if user is logged in
       ├── NOT logged in → Redirect to /auth/signin
       └── Logged in → Show alert form

3. USER fills form, clicks "Create Alert"

4. CLIENT sends POST to /api/alerts
   └── Includes: productId, targetPrice, alertOnAnyDrop

5. API ROUTE (api/alerts/route.ts)
   ├── Validates user session (NextAuth)
   ├── Creates/updates Product in database (by ASIN)
   ├── Creates PriceAlert record
   └── Returns success

6. CRON JOB (runs every 6 hours)
   ├── Fetches all active alerts
   ├── Gets current prices from Keepa (batched)
   ├── Compares with target prices
   └── Sends email if price dropped
```

---

## Key Concepts Explained

### Server Components vs Client Components

Next.js 13+ introduced a new mental model. By default, components are **Server Components**.

**Server Components** (default):
- Run on the server only
- Can directly access databases, APIs, file system
- Cannot use useState, useEffect, onClick
- Better for SEO, faster initial load

```tsx
// page.tsx - Server Component (no "use client")
export default async function DealsPage() {
  const deals = await fetchDeals(); // Direct database/API access
  return <div>{deals.map(d => <ProductCard {...d} />)}</div>;
}
```

**Client Components** (add "use client"):
- Run in the browser
- Can use React hooks (useState, useEffect)
- Can handle user interactions (onClick, onChange)
- Needed for interactivity

```tsx
"use client"; // This makes it a Client Component

export default function DealsClient({ initialDeals }) {
  const [sortBy, setSortBy] = useState("percentOff"); // useState works!

  return (
    <select onChange={(e) => setSortBy(e.target.value)}> {/* Events work! */}
      <option value="percentOff">Best Deal</option>
    </select>
  );
}
```

**Pattern used in this project:**
- `page.tsx` = Server Component (fetches data)
- `*Client.tsx` = Client Component (handles interactivity)

### API Routes

API routes let you build backend endpoints without a separate server.

```
src/app/api/deals/route.ts  →  GET /api/deals
src/app/api/alerts/route.ts →  GET/POST /api/alerts
```

```tsx
// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // This runs on the server
  const deals = await fetchFromKeepa();
  return NextResponse.json({ deals });
}
```

### Dynamic Routes

Square brackets `[param]` create dynamic routes:

```
src/app/product/[id]/page.tsx  →  /product/B08N5WRWNW
src/app/categories/[slug]/page.tsx  →  /categories/electronics
```

```tsx
// src/app/product/[id]/page.tsx
export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id); // id = "B08N5WRWNW"
  return <div>{product.name}</div>;
}
```

### Caching Strategy

The app uses **file-based caching** to minimize Keepa API calls (which cost tokens).

```
.cache/
├── lightning-deals.json     # All lightning deals (4 hour TTL)
├── browse-deals/            # Browse deals by query hash (30 min TTL)
│   └── a1b2c3d4.json
├── products/                # Individual products (1 hour TTL)
│   └── B08N5WRWNW.json
└── search/                  # Search results (3 hour TTL)
    └── e5f6g7h8.json
```

Why file-based (not memory)?
- **Persists across server restarts** - Dev server hot reload doesn't waste tokens
- **Shared across serverless instances** - If using Vercel/serverless

### Authentication Flow

Using NextAuth.js with two providers:

1. **Credentials** (email + password)
   - Password hashed with bcrypt
   - Stored in PostgreSQL

2. **Google OAuth**
   - User clicks "Sign in with Google"
   - Redirects to Google
   - Google redirects back with user info
   - Account linked in database

```tsx
// Check if user is logged in
import { useSession } from "next-auth/react";

function Component() {
  const { data: session } = useSession();

  if (!session) {
    return <p>Please sign in</p>;
  }

  return <p>Hello {session.user.name}</p>;
}
```

### Database with Prisma

Prisma is an ORM (Object-Relational Mapper). It lets you:
- Define your database schema in `schema.prisma`
- Generate TypeScript types automatically
- Write database queries in TypeScript (not SQL)

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  alerts    PriceAlert[]
}

model PriceAlert {
  id          String @id @default(cuid())
  userId      String
  targetPrice Float
  user        User   @relation(fields: [userId], references: [id])
}
```

```tsx
// Using Prisma in code
import { prisma } from "@/lib/prisma";

// Create a user
const user = await prisma.user.create({
  data: { email: "test@example.com", name: "Test" }
});

// Find all alerts for a user
const alerts = await prisma.priceAlert.findMany({
  where: { userId: user.id },
  include: { product: true } // Join with Product table
});
```

---

## How Specific Features Work

### Lightning Deals

**What:** Amazon's official time-limited deals with guaranteed strikethrough pricing.

**Flow:**
1. `getLightningDeals()` in `keepa.ts` fetches from Keepa API
2. Costs 500 tokens per call (expensive!)
3. Cached for 4 hours in `.cache/lightning-deals.json`
4. Individual expired deals filtered out even from cache
5. Homepage shows 12, /lightning-deals shows all with filtering

**Why we trust these:** Amazon guarantees the strikethrough price. No fake discounts.

### Browse Deals (Hot Deals)

**What:** Products currently at their 90-day lowest price.

**Flow:**
1. `browseDeals()` fetches from Keepa's deal finder
2. Costs 5 tokens per 150 deals
3. Cached for 30 minutes
4. Filtered by: min rating (3.5+), max sales rank (200k), no books/Kindle

**Anti-fake-deal filters:**
- `maxSalesRank: 200000` - Only popular products
- `minRating: 35` - At least 3.5 stars
- Kindle/ebook keyword filtering
- Category exclusions (Books, Music, DVD)

### Price Alerts

**Database tables involved:**
- `User` - The person who set the alert
- `Product` - The Amazon product (by ASIN)
- `PriceAlert` - Links user to product with target price

**Check process (runs every 6 hours):**
1. Cron job calls `/api/cron/check-prices`
2. Fetches all active alerts from database
3. Groups by unique ASIN (deduplicated)
4. Fetches current prices from Keepa (1 token per ASIN)
5. Compares with target prices
6. Sends email via Resend if price dropped
7. Updates `lastNotified` to prevent spam (24hr cooldown)

### Price History Charts

**Library:** Recharts (React charting library)

**Data source:** Keepa provides historical prices as arrays:
```
[timestamp1, price1, timestamp2, price2, ...]
```

**Processing:**
1. Convert Keepa timestamps (minutes since 2011) to JS dates
2. Convert prices from cents to pounds
3. Sample data points for performance (max ~100 points)
4. Always preserve min/max price points during sampling

---

## Local Development

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Set up database
npx prisma generate    # Generate Prisma client
npx prisma db push     # Create tables in database
npx prisma db seed     # (Optional) Add sample data

# 4. Start development server
npm run dev
```

### Required Environment Variables

```env
# Database (get from Neon dashboard)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-string"

# Keepa API (get from keepa.com)
KEEPA_API_KEY="your-keepa-key"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Resend (get from resend.com)
RESEND_API_KEY="re_..."

# Cron job authentication
CRON_SECRET="another-random-string"
```

### Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Visual database editor
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client after schema change

# Type checking
npx tsc --noEmit         # Check for TypeScript errors
```

---

## Common Tasks

### Add a New Page

1. Create folder in `src/app/`:
   ```
   src/app/new-page/page.tsx
   ```

2. Create the page component:
   ```tsx
   export default function NewPage() {
     return <div>Hello World</div>;
   }
   ```

3. Visit `http://localhost:3000/new-page`

### Add a New API Endpoint

1. Create file in `src/app/api/`:
   ```
   src/app/api/my-endpoint/route.ts
   ```

2. Export HTTP method handlers:
   ```tsx
   import { NextResponse } from 'next/server';

   export async function GET() {
     return NextResponse.json({ message: "Hello" });
   }

   export async function POST(request: Request) {
     const body = await request.json();
     return NextResponse.json({ received: body });
   }
   ```

### Add a Database Table

1. Edit `prisma/schema.prisma`:
   ```prisma
   model NewTable {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. Push to database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. Use in code:
   ```tsx
   import { prisma } from "@/lib/prisma";
   const items = await prisma.newTable.findMany();
   ```

---

## Debugging Tips

### "Cannot find module" errors
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run dev
```

### API returning stale data
```bash
# Clear the file cache
rm -rf .cache
```

### Check Keepa token usage
Visit `/api/keepa/status` to see remaining tokens.

### Database issues
```bash
# Open visual editor
npx prisma studio

# Reset database (DELETES ALL DATA)
npx prisma db push --force-reset
```

### See server-side logs
Check the terminal where `npm run dev` is running. All `console.log` from server components and API routes appear there.

### See client-side logs
Open browser DevTools (F12) → Console tab.

---

## Questions?

If something in this guide is unclear, the code is the source of truth:

- **How does X work?** → Read the relevant file in `src/`
- **What data does the API return?** → Check the route in `src/app/api/`
- **What's in the database?** → Look at `prisma/schema.prisma`
- **How is Y styled?** → Search for Tailwind classes in the component
