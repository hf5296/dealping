import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from '@/lib/keepa';

// Cache product details for 1 hour
const productCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    try {
        const { asin } = await params;

        if (!asin) {
            return NextResponse.json(
                { success: false, error: 'ASIN is required' },
                { status: 400 }
            );
        }

        // Check cache
        const cached = productCache.get(asin);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            return NextResponse.json(cached.data);
        }

        // Get product from Keepa
        const result = await getProduct(asin, { stats: 90, history: false });

        if (!result.product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        const responseData = {
            success: true,
            product: result.product,
            tokensLeft: result.tokensLeft,
        };

        // Update cache
        productCache.set(asin, {
            data: responseData,
            timestamp: Date.now(),
        });

        return NextResponse.json(responseData);
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
