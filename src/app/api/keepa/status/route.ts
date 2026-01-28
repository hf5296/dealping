import { NextRequest, NextResponse } from 'next/server';
import { getTokenStatus } from '@/lib/keepa';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitExceeded } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
    // Require authentication to prevent public API quota monitoring
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: 'You must be signed in' },
            { status: 401 }
        );
    }

    const rl = checkRateLimit(session.user.id, 'keepa-status', { limit: 10, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    try {
        const status = await getTokenStatus();

        return NextResponse.json({
            success: true,
            tokensLeft: status.tokensLeft,
            refillRate: status.refillRate,
            dailyCapacity: status.refillRate * 60 * 24,
            percentAvailable: Math.round((status.tokensLeft / 1200) * 100),
        });
    } catch (error) {
        console.error('Error getting token status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get token status',
            },
            { status: 500 }
        );
    }
}
