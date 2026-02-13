FROM node:22-alpine AS base

# --- Stage 1: Install dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build the application ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output)
RUN npm run build

# --- Stage 3: Production image ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone server and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client (needed at runtime by the ORM)
# Prisma 7 with adapter-pg uses a pure JS driver — no native engine binaries
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create cache directory for file-based Keepa caching
RUN mkdir -p .cache && chown nextjs:nodejs .cache

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
