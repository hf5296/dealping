# DealPing

DealPing is a full-stack price discovery and alerting application for Amazon UK products. It combines live product data, price history, account management and scheduled notifications in a containerised Next.js application backed by PostgreSQL.

This is a portfolio project built to explore production-style application architecture, third-party API integration, authentication, background processing and container deployment.

## Features

- Search Amazon products and retrieve current pricing through Keepa
- Browse hot deals, categories and time-limited offers
- View sampled price-history charts while preserving minimum and maximum points
- Create target-price or any-price-drop alerts
- Send price-drop notifications through Resend
- Register with email/password or sign in with Google
- Manage profile details and invalidate sessions after password changes
- Protect scheduled refresh endpoints with a dedicated cron secret
- Generate affiliate links for supported networks
- Track and reserve Keepa API tokens to control external API usage

## Architecture

```text
                         ┌─────────────────────┐
Browser ────────────────►│ Next.js App Router  │
                         │ pages + API routes  │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       PostgreSQL/Prisma      NextAuth + bcrypt      External services
       users, products,       credentials and        Keepa / Amazon
       prices and alerts      Google OAuth           Awin / Resend
              ▲                                           ▲
              └──────── scheduled refresh jobs ───────────┘
```

The production Docker image uses a multi-stage build and runs the standalone Next.js server as a non-root user.

## Technology

- **Application:** Next.js 16, React 19 and TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma
- **Authentication:** NextAuth, Google OAuth and bcrypt
- **Data and integrations:** Keepa, Amazon Product Advertising API, Awin and Resend
- **Visualisation:** Recharts
- **Deployment:** Docker and Docker Compose

## Run locally

### Requirements

- Node.js 22+
- PostgreSQL database
- Keepa API key for live product data
- Optional Google, Resend, Amazon and Awin credentials for their respective features

### Setup

```bash
git clone https://github.com/hf5296/dealping.git
cd dealping
npm ci
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

The optional seed command creates demonstration products and categories:

```bash
npx prisma db seed
```

## Configuration

Copy `.env.example` to `.env` and replace only the values required for the features you intend to use.

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Signs authentication tokens | Yes |
| `NEXT_PUBLIC_APP_URL` | Public base URL for links and callbacks | Yes |
| `KEEPA_API_KEY` | Product search, pricing and history | Yes for live data |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in | Optional |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Password reset and price-alert email | Optional |
| `CRON_SECRET` | Protects scheduled refresh endpoints | Yes in production |
| `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG` | Amazon affiliate integration | Optional |
| `AWIN_API_TOKEN`, `AWIN_PUBLISHER_ID` | Awin affiliate integration | Optional |
| `TRUST_PROXY` | Trust proxy-provided client IP headers | Optional |

Keepa token-budget variables and maintenance mode are documented in `.env.example`.

## Docker

After creating `.env`:

```bash
docker compose up --build -d
docker compose ps
```

The Compose stack runs DealPing on port `3000` and persists its file-based API cache in a named volume. PostgreSQL is intentionally external to the stack and must be reachable through `DATABASE_URL`.

## Project structure

```text
src/
├── app/                 # Pages and route handlers
├── components/          # Reusable interface components
├── lib/                 # API clients, caching, email and rate limiting
├── types/               # Shared TypeScript types
└── auth.ts              # NextAuth configuration
prisma/
├── schema.prisma        # PostgreSQL data model
├── migrations/          # Schema migrations
└── seed.ts              # Demonstration data
```

See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for a deeper walkthrough of the data flows and implementation.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

These checks are intended to become required CI gates as the project is hardened.

## Security decisions

- Passwords are hashed with bcrypt.
- Login and API endpoints apply rate limiting.
- Password changes invalidate older sessions.
- Scheduled endpoints require a timing-safe cron-secret check.
- The production container runs as a non-root user.
- Secrets and local databases are excluded from version control.
- Proxy headers are trusted only when explicitly enabled.

## Current limitations

- Automated unit and integration tests have not yet been added.
- CI/CD is not configured yet.
- The in-memory rate limiter should be replaced by Redis for multi-instance deployments.
- Live functionality depends on third-party API availability and quotas.
- Dependency and lint findings should be resolved before treating the application as production-ready.
