import { NextRequest, NextResponse } from 'next/server';
import { browseDeals, UK_CATEGORIES, PRICE_TYPES } from '@/lib/keepa';

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

        // browseDeals has its own file-based cache (10 min), so no need for in-memory cache here
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
            dateRange: 0, // All current deals (not just recent price drops)
            limit: Math.min(limit, 150),
            validateRRP: false,
            // Anti-fake-deal filters:
            maxSalesRank: 100000,
            minRating: 35,
        });

        // Limit results
        const limitedDeals = result.deals.slice(0, limit);

        return NextResponse.json({
            success: true,
            deals: limitedDeals,
            total: result.deals.length,
            page,
            hasMore: result.hasMore && limitedDeals.length >= limit,
            tokensLeft: result.tokensLeft,
        });
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
