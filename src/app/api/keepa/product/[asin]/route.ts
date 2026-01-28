import { NextRequest, NextResponse } from 'next/server';
import { getProductWithHistory } from '@/lib/keepa';
import { checkRateLimit, getClientIp, rateLimitExceeded } from '@/lib/rateLimit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'keepa-product', { limit: 20, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

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
        });

        if (!result.product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            product: result.product,
            priceHistory: includeHistory ? result.priceHistory : null,
            fromCache: result.fromCache,
            tokensLeft: result.tokensLeft,
        });
    } catch (error) {
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
