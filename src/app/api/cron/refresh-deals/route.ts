import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getLightningDeals, clearLightningDealsCache } from '@/lib/keepa';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp, rateLimitExceeded } from '@/lib/rateLimit';

// This endpoint is meant to be called by a cron job once daily (e.g., at midnight)
// It refreshes the Lightning Deals cache and revalidates the homepage

// Vercel Cron: Add to vercel.json to run at midnight UK time
// Or use an external cron service like cron-job.org

function verifySecret(provided: string, expected: string): boolean {
    const key = 'secret-compare';
    const a = crypto.createHmac('sha256', key).update(provided).digest();
    const b = crypto.createHmac('sha256', key).update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
    // Rate limit: 2 requests per hour
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'cron-refresh-deals', { limit: 2, windowSeconds: 3600 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    // Verify cron secret with timing-safe comparison
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = authHeader?.replace('Bearer ', '') || '';

    if (!cronSecret || !verifySecret(providedSecret, cronSecret)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
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

        // Revalidate pages to pick up new deals
        revalidatePath('/');
        revalidatePath('/deals');
        revalidatePath('/lightning-deals');

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
