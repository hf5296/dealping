import { NextRequest, NextResponse } from 'next/server';
import { browseDeals, UK_CATEGORIES, PRICE_TYPES } from '@/lib/keepa';

// Cache deals for 5 minutes to save API tokens
let cachedDeals: { data: unknown; timestamp: number; key: string } | null = null;
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
            'stationery': UK_CATEGORIES.BOOKS, // Map to books as closest
            'food-drink': UK_CATEGORIES.GROCERY,
        };

        const categoryId = category ? categoryMap[category] : undefined;

        // Create cache key
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
        });

        // Check cache
        if (cachedDeals && cachedDeals.key === cacheKey && Date.now() - cachedDeals.timestamp < CACHE_DURATION_MS) {
            return NextResponse.json(cachedDeals.data);
        }

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
            dateRange: 0, // Last 24 hours for freshest deals
        });

        // Limit results
        const limitedDeals = result.deals.slice(0, limit);

        const responseData = {
            success: true,
            deals: limitedDeals,
            total: result.deals.length,
            page,
            tokensLeft: result.tokensLeft,
        };

        // Update cache
        cachedDeals = {
            data: responseData,
            timestamp: Date.now(),
            key: cacheKey,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching deals:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch deals',
                deals: [],
            },
            { status: 500 }
        );
    }
}
