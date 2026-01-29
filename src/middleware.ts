import { NextRequest, NextResponse } from 'next/server';

/**
 * Block direct browser access to API routes.
 *
 * Requests from our own frontend (fetch calls) include an Origin or Referer
 * header matching our domain. Direct URL visits, cross-site requests, and
 * casual scraping won't have a matching origin.
 *
 * Excluded from this check:
 *   - /api/auth/* — NextAuth needs direct browser access (redirects, callbacks)
 *   - /api/cron/* — Called by cron services with bearer token, no origin header
 *   - /api/admin/* — Called with bearer token, no origin header
 */

const ALLOWED_ORIGINS = [
    'https://dealping.co.uk',
    'https://www.dealping.co.uk',
    'http://localhost:3000',
    'http://localhost:3001',
];

function isAllowedOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return true;
    }

    const referer = request.headers.get('referer');
    if (referer) {
        return ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
    }

    return false;
}

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Only gate /api/* routes (exclude auth, cron, admin)
    if (
        path.startsWith('/api/') &&
        !path.startsWith('/api/auth/') &&
        !path.startsWith('/api/cron/') &&
        !path.startsWith('/api/admin/')
    ) {
        if (!isAllowedOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
