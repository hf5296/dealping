import { NextRequest, NextResponse } from 'next/server';
import { browseDeals, UK_CATEGORIES, PRICE_TYPES } from '@/lib/keepa';
import { checkRateLimit, getClientIp, getSessionId, sessionCookieHeader, rateLimitExceeded } from '@/lib/rateLimit';
import { BudgetExhaustedError } from '@/lib/keepaBudget';

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'deals', { limit: 3, windowSeconds: 60 });
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

        // Parse query parameters with NaN protection
        const page = Math.min(Math.max(parseInt(searchParams.get('page') || '0', 10) || 0, 0), 9); // Max 10 pages (0-9)
        const category = searchParams.get('category');
        const minPercentOff = Math.max(parseInt(searchParams.get('minPercentOff') || '15', 10) || 15, 0);
        const maxPercentOff = Math.min(parseInt(searchParams.get('maxPercentOff') || '100', 10) || 100, 100);
        const rawMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const rawMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const minPrice = rawMinPrice !== undefined && Number.isFinite(rawMinPrice) && rawMinPrice >= 0 ? rawMinPrice : undefined;
        const maxPrice = rawMaxPrice !== undefined && Number.isFinite(rawMaxPrice) && rawMaxPrice > 0 ? rawMaxPrice : undefined;
        const validSortOptions = ['newest', 'percentOff', 'salesRank'] as const;
        const rawSort = searchParams.get('sortBy');
        const sortBy = (validSortOptions.includes(rawSort as typeof validSortOptions[number]) ? rawSort : 'percentOff') as typeof validSortOptions[number];
        const search = searchParams.get('search') || undefined;
        const isLowest = searchParams.get('isLowest') === 'true';
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 150);

        // Map category slug to Keepa category ID
        const categoryMap: Record<string, number> = {
            'electronics': UK_CATEGORIES.ELECTRONICS,
            'computers': UK_CATEGORIES.COMPUTERS,
            'home-garden': UK_CATEGORIES.HOME_KITCHEN,
            'home-kitchen': UK_CATEGORIES.HOME_KITCHEN,
            'garden': UK_CATEGORIES.GARDEN,
            'health-beauty': UK_CATEGORIES.HEALTH_BEAUTY,
            'groceries': UK_CATEGORIES.GROCERY,
            'grocery': UK_CATEGORIES.GROCERY,
            'toys': UK_CATEGORIES.TOYS,
            'baby-kids': UK_CATEGORIES.BABY,
            'baby': UK_CATEGORIES.BABY,
            'sports': UK_CATEGORIES.SPORTS,
            'clothing': UK_CATEGORIES.CLOTHING,
            'gaming': UK_CATEGORIES.VIDEO_GAMES,
            'video-games': UK_CATEGORIES.VIDEO_GAMES,
            'books': UK_CATEGORIES.BOOKS,
            'stationery': UK_CATEGORIES.BOOKS,
            'food-drink': UK_CATEGORIES.GROCERY,
        };

        const categoryId = category ? categoryMap[category] : undefined;
        const rawDateRange = parseInt(searchParams.get('dateRange') || '', 10);
        const dateRange = [0, 1].includes(rawDateRange) ? rawDateRange : (categoryId ? 1 : 0);

        // browseDeals has its own file-based cache (30 min), so no need for in-memory cache here
        const result = await browseDeals({
            page,
            category: categoryId,
            minPercentOff,
            maxPercentOff,
            minPrice,
            maxPrice,
            sortBy,
            titleSearch: search,
            isLowest,
            priceType: PRICE_TYPES.AMAZON,
            dateRange,
            limit: Math.min(limit, 150),
            validateRRP: false,
            userFacing: true,
            // Anti-fake-deal filters:
            maxSalesRank: 200000, // Only popular products (top 200k)
            minRating: 35,
        });

        // Limit results
        const limitedDeals = result.deals.slice(0, limit);

        const res = NextResponse.json({
            success: true,
            deals: limitedDeals,
            total: result.deals.length,
            page,
            hasMore: result.hasMore && limitedDeals.length >= limit && page < 9,
            tokensLeft: result.tokensLeft,
        });
        res.headers.set('Set-Cookie', sessionCookieHeader(sessionId));
        return res;
    } catch (error) {
        if (error instanceof BudgetExhaustedError) {
            return NextResponse.json(
                { success: false, error: 'Service temporarily unavailable. Please try again later.', deals: [], hasMore: false },
                { status: 503, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
            );
        }
        console.error('Error fetching deals:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch deals',
                deals: [],
                hasMore: false,
            },
            { status: 500 }
        );
    }
}
