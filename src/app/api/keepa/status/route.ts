import { NextResponse } from 'next/server';
import { getTokenStatus } from '@/lib/keepa';

export async function GET() {
    try {
        const status = await getTokenStatus();

        return NextResponse.json({
            success: true,
            ...status,
            // Calculate approximate daily capacity
            dailyCapacity: status.refillRate * 60 * 24,
            // % of tokens currently available (assuming 1200 max bucket for 20 tokens/min)
            percentAvailable: Math.round((status.tokensLeft / 1200) * 100),
        });
    } catch (error) {
        console.error('Error getting token status:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get token status',
            },
            { status: 500 }
        );
    }
}
