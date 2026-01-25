import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceMode) {
        // Allow access to the coming-soon page itself
        if (request.nextUrl.pathname === '/coming-soon') {
            return NextResponse.next();
        }

        // Allow static assets, API routes, and Next.js internals
        if (
            request.nextUrl.pathname.startsWith('/_next') ||
            request.nextUrl.pathname.startsWith('/api') ||
            request.nextUrl.pathname.includes('.') // Static files like favicon, images
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
