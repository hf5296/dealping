import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Block direct access to API routes (except auth, cron, admin which use their own auth)
    if (
        path.startsWith('/api/') &&
        !path.startsWith('/api/auth/') &&
        !path.startsWith('/api/cron/') &&
        !path.startsWith('/api/admin/')
    ) {
        if (!isAllowedOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceMode) {
        // Allow access to the coming-soon page itself
        if (path === '/coming-soon') {
            return NextResponse.next();
        }

        // Allow static assets, API routes, and Next.js internals
        if (
            path.startsWith('/_next') ||
            path.startsWith('/api') ||
            /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(path)
        ) {
            return NextResponse.next();
        }

        // Redirect all other routes to coming-soon page
        return NextResponse.redirect(new URL('/coming-soon', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
