import { NextRequest, NextResponse } from 'next/server';
import { browseDeals, UK_CATEGORIES, PRICE_TYPES } from '@/lib/keepa';

// Cache deals per page/category for 5 minutes to save API tokens
const dealsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '0', 10);
        const category = searchParams.get('category');
        const minPercentOff = parseInt(searchParams.get('minPercentOff') || '15', 10);
        const maxPercentOff = parseInt(searchParams.get('maxPercentOff') || '100', 10);
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
        const sortBy = (searchParams.get('sortBy') as 'newest' | 'percentOff' | 'salesRank') || 'percentOff';
        const search = searchParams.get('search') || undefined;
        const isLowest = searchParams.get('isLowest') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50', 10);

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

        // Create cache key that includes ALL parameters
        const cacheKey = JSON.stringify({
            page,
            categoryId,
            minPercentOff,
            maxPercentOff,
            minPrice,
            maxPrice,
            sortBy,
            search,
            isLowest,
            limit,
        });

        // Check cache
        const cached = dealsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            console.log(`[/api/deals] Cache hit for page ${page}, category ${category || 'all'}`);
            return NextResponse.json(cached.data);
        }

        console.log(`[/api/deals] Fetching page ${page} for category ${category || 'all'}`);

        // Fetch deals from Keepa
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
            dateRange: 1, // Last 7 days for more deals
            limit,
        });

        // Limit results
        const limitedDeals = result.deals.slice(0, limit);

        const responseData = {
            success: true,
            deals: limitedDeals,
            total: result.deals.length,
            page,
            hasMore: result.hasMore && limitedDeals.length >= limit,
            tokensLeft: result.tokensLeft,
        };

        // Update cache
        dealsCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now(),
        });

        // Clean up old cache entries (keep last 50)
        if (dealsCache.size > 50) {
            const entries = Array.from(dealsCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < entries.length - 50; i++) {
                dealsCache.delete(entries[i][0]);
            }
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching deals:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch deals',
                deals: [],
                hasMore: false,
            },
            { status: 500 }
        );
    }
}
