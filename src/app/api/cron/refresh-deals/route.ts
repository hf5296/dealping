import { NextRequest, NextResponse } from 'next/server';
import { getLightningDeals, clearLightningDealsCache } from '@/lib/keepa';
import { revalidatePath } from 'next/cache';

// This endpoint is meant to be called by a cron job once daily (e.g., at midnight)
// It refreshes the Lightning Deals cache and revalidates the homepage

// Vercel Cron: Add to vercel.json to run at midnight UK time
// Or use an external cron service like cron-job.org

export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow calls without auth in development, or with correct secret in production
    if (process.env.NODE_ENV === 'production' && cronSecret) {
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    try {
        console.log('[cron/refresh-deals] Starting daily Lightning Deals refresh...');

        // Clear the existing cache to force a fresh fetch
        clearLightningDealsCache();

        // Fetch fresh Lightning Deals (costs 500 tokens)
        const result = await getLightningDeals({
            state: 'AVAILABLE',
            minPercentOff: 10, // Lower threshold to cache more deals
            skipCache: true,   // Force fresh fetch
        });

        console.log(`[cron/refresh-deals] Fetched ${result.deals.length} deals, ${result.tokensLeft} tokens remaining`);

        // Revalidate the homepage to pick up new deals
        revalidatePath('/');
        revalidatePath('/deals');

        return NextResponse.json({
            success: true,
            dealsCount: result.deals.length,
            tokensLeft: result.tokensLeft,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[cron/refresh-deals] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to refresh deals',
            },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
