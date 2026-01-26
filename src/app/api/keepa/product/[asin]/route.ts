import { NextRequest, NextResponse } from 'next/server';
import { getProductWithHistory } from '@/lib/keepa';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    try {
        const { asin } = await params;
        const searchParams = request.nextUrl.searchParams;
        const includeHistory = searchParams.get('history') === 'true';

        if (!asin || asin.length < 5) {
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
                error: error instanceof Error ? error.message : 'Failed to fetch product',
            },
            { status: 500 }
        );
    }
}
