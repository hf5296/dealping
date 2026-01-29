import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/keepa';
import { checkRateLimit, getClientIp, getSessionId, sessionCookieHeader, rateLimitExceeded } from '@/lib/rateLimit';
import { BudgetExhaustedError } from '@/lib/keepaBudget';

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour (Keepa's same-request caching)

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'keepa-search', { limit: 5, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    // Session-based rate limit (survives IP rotation)
    const sessionId = getSessionId(request);
    const sessionRl = checkRateLimit(sessionId, 'session-keepa', { limit: 12, windowSeconds: 60 });
    if (!sessionRl.allowed) {
        const res = rateLimitExceeded(sessionRl);
        res.headers.set('Set-Cookie', sessionCookieHeader(sessionId));
        return res;
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '0', 10);

        if (!query || query.length > 200) {
            return NextResponse.json(
                { success: false, error: 'Search query is required (max 200 characters)', products: [] },
                { status: 400 }
            );
        }

        // Create cache key
        const cacheKey = `${query.toLowerCase()}_${page}`;

        // Check cache
        const cached = searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            const res = NextResponse.json(cached.data);
            res.headers.set('Set-Cookie', sessionCookieHeader(sessionId));
            return res;
        }

        // Search products via Keepa
        const result = await searchProducts(query, { page, stats: 90, userFacing: true });

        const responseData = {
            success: true,
            products: result.products,
            query,
            page,
            total: result.products.length,
            tokensLeft: result.tokensLeft,
        };

        // Update cache
        searchCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now(),
        });

        // Clean old cache entries periodically
        if (searchCache.size > 1000) {
            const now = Date.now();
            for (const [key, value] of searchCache.entries()) {
                if (now - value.timestamp > CACHE_DURATION_MS) {
                    searchCache.delete(key);
                }
            }
        }

        const res = NextResponse.json(responseData);
        res.headers.set('Set-Cookie', sessionCookieHeader(sessionId));
        return res;
    } catch (error) {
        if (error instanceof BudgetExhaustedError) {
            return NextResponse.json(
                { success: false, error: 'Service temporarily unavailable. Please try again later.', products: [] },
                { status: 503, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
            );
        }
        console.error('Error searching products:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to search products',
                products: [],
            },
            { status: 500 }
        );
    }
}
