import { NextRequest, NextResponse } from 'next/server';
import { getLightningDeals, DealPingProduct } from '@/lib/keepa';
import { checkRateLimit, getClientIp, rateLimitExceeded } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'lightning-deals', { limit: 20, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters with NaN protection (consistent with /api/deals)
        const page = Math.min(Math.max(parseInt(searchParams.get('page') || '0', 10) || 0, 0), 19); // Max 20 pages (0-19)
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '48', 10) || 48, 1), 100);
        const minPercentOff = Math.max(parseInt(searchParams.get('minPercentOff') || '0', 10) || 0, 0);
        const maxPercentOff = Math.min(parseInt(searchParams.get('maxPercentOff') || '100', 10) || 100, 100);
        const rawMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const rawMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const minPrice = rawMinPrice !== undefined && Number.isFinite(rawMinPrice) && rawMinPrice >= 0 ? rawMinPrice : undefined;
        const maxPrice = rawMaxPrice !== undefined && Number.isFinite(rawMaxPrice) && rawMaxPrice > 0 ? rawMaxPrice : undefined;
        const validSortOptions = ['newest', 'percentOff', 'price-low', 'price-high'] as const;
        const rawSort = searchParams.get('sortBy');
        const sortBy = (validSortOptions.includes(rawSort as typeof validSortOptions[number]) ? rawSort : 'percentOff') as typeof validSortOptions[number];
        const search = searchParams.get('search')?.toLowerCase().trim() || undefined;

        // getLightningDeals already has 4-hour file cache, no additional caching needed
        // Fetch all deals (the API costs 500 tokens regardless of limit, so get them all)
        const result = await getLightningDeals({
            state: 'AVAILABLE',
            minPercentOff: 15, // Base filter at API level
            minRating: 3.0,
            minReviews: 5,
            limit: 500, // Get all available deals
        });

        // Apply filters server-side (all data is cached, so this is fast)
        let filteredDeals = result.deals.filter((deal: DealPingProduct) => {
            // Percent off filter
            if (deal.percentOff < minPercentOff || deal.percentOff > maxPercentOff) {
                return false;
            }
            // Price filters
            if (minPrice !== undefined && deal.currentPrice < minPrice) {
                return false;
            }
            if (maxPrice !== undefined && deal.currentPrice > maxPrice) {
                return false;
            }
            // Search filter (title search)
            if (search && !deal.name.toLowerCase().includes(search)) {
                return false;
            }
            return true;
        });

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                filteredDeals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'percentOff':
                filteredDeals.sort((a, b) => b.percentOff - a.percentOff);
                break;
            case 'price-low':
                filteredDeals.sort((a, b) => a.currentPrice - b.currentPrice);
                break;
            case 'price-high':
                filteredDeals.sort((a, b) => b.currentPrice - a.currentPrice);
                break;
        }

        // Paginate results
        const totalFiltered = filteredDeals.length;
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        const paginatedDeals = filteredDeals.slice(startIndex, endIndex);
        const hasMore = endIndex < totalFiltered && page < 19;

        return NextResponse.json({
            success: true,
            deals: paginatedDeals,
            total: totalFiltered,
            page,
            limit,
            hasMore,
            tokensLeft: result.tokensLeft,
        });
    } catch (error) {
        console.error('Error fetching lightning deals:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch lightning deals',
                deals: [],
                total: 0,
                hasMore: false,
            },
            { status: 500 }
        );
    }
}
