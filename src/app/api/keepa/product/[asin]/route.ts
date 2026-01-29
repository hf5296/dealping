import { NextRequest, NextResponse } from 'next/server';
import { getProductWithHistory } from '@/lib/keepa';
import { checkRateLimit, getClientIp, getSessionId, sessionCookieHeader, rateLimitExceeded } from '@/lib/rateLimit';
import { BudgetExhaustedError } from '@/lib/keepaBudget';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'keepa-product', { limit: 12, windowSeconds: 60 });
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
        const { asin } = await params;
        const searchParams = request.nextUrl.searchParams;
        const includeHistory = searchParams.get('history') === 'true';

        if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ASIN' },
                { status: 400 }
            );
        }

        // This function uses file-based caching (24 hour cache)
        // First request costs ~2 tokens, subsequent requests are free
        const result = await getProductWithHistory(asin, {
            historyDays: includeHistory ? 1825 : 90, // 5 years if history requested
            userFacing: true,
        });

        if (!result.product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        const res = NextResponse.json({
            success: true,
            product: result.product,
            priceHistory: includeHistory ? result.priceHistory : null,
        });
        res.headers.set('Set-Cookie', sessionCookieHeader(sessionId));
        return res;
    } catch (error) {
        if (error instanceof BudgetExhaustedError) {
            return NextResponse.json(
                { success: false, error: 'Service temporarily unavailable. Please try again later.' },
                { status: 503, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
            );
        }
        console.error('Error fetching product:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch product',
            },
            { status: 500 }
        );
    }
}
