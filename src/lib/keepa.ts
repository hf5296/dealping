/**
 * Keepa API Client for DealPing
 * Provides access to Amazon UK product deals, search, and price data
 */

const KEEPA_API_BASE = 'https://api.keepa.com';
const KEEPA_API_KEY = process.env.KEEPA_API_KEY;
const AMAZON_DOMAIN_UK = 2; // Amazon UK domain ID
const AMAZON_ASSOCIATE_TAG = 'findadeal0a-21';

// Price types for deals endpoint (different from CSV indices)
export const PRICE_TYPES = {
    AMAZON: 0,
    NEW: 1,
    USED: 2,
    SALES_RANK: 3,
    LIGHTNING_DEAL: 8,
    WAREHOUSE: 9,
    BUY_BOX: 18,
} as const;

// CSV/Stats array price type indices (for product data)
// These are the indices in the stats.current, stats.avg, etc arrays
const CSV_PRICE_INDICES = {
    AMAZON: 0,          // Amazon price
    NEW: 1,             // Marketplace new
    USED: 2,            // Marketplace used
    SALES_RANK: 3,      // Sales rank (not a price)
    LIST_PRICE: 4,      // List price / RRP
    COLLECTIBLE: 5,     // Collectible price
    REFURBISHED: 6,     // Refurbished price
    NEW_FBM: 7,         // New FBM with shipping
    LIGHTNING: 8,       // Lightning deal
    WAREHOUSE: 9,       // Warehouse deal
    NEW_FBA: 10,        // New FBA
    COUNT_NEW: 11,      // Offer count new
    COUNT_USED: 12,     // Offer count used
    COUNT_REFURBISHED: 13,
    COUNT_COLLECTIBLE: 14,
    EXTRA_INFO_UPDATES: 15,
    RATING: 16,         // Product rating
    COUNT_REVIEWS: 17,  // Review count
    BUY_BOX: 18,        // Buy box price
} as const;

// Deal score thresholds
const DEAL_SCORE_THRESHOLDS = {
    GREAT: 40, // 40%+ off = great deal
    GOOD: 20,  // 20-39% off = good deal
};

export interface KeepaProduct {
    asin: string;
    title: string;
    imagesCSV: string;
    categoryTree: { catId: number; name: string }[];
    rootCategory: number;
    manufacturer?: string;
    brand?: string;
    productGroup?: string;
    stats?: {
        current: number[];
        avg: number[];
        avg30: number[];
        avg90: number[];
        avg180: number[];
        atIntervalStart: number[];
        min: number[][] | number[];
        max: number[][] | number[];
        minInInterval: number[][] | number[];
        maxInInterval: number[][] | number[];
        outOfStockPercentageInInterval: number[];
        outOfStockPercentage30: number[];
        outOfStockPercentage90: number[];
        salesRankDrops30?: number;
        salesRankDrops90?: number;
        salesRankDrops180?: number;
        lastOffersUpdate?: number;
        totalOfferCount?: number;
        lightningDealInfo?: number[];
        retrievedOfferCount?: number;
        buyBoxPrice?: number;
        buyBoxShipping?: number;
        buyBoxIsUnqualified?: boolean;
        buyBoxIsShippable?: boolean;
        buyBoxIsPreorder?: boolean;
        buyBoxIsBackorder?: boolean;
        buyBoxIsFBA?: boolean;
        buyBoxIsAmazon?: boolean;
        buyBoxIsMAP?: boolean;
        buyBoxIsUsed?: boolean;
        buyBoxMinOrderQuantity?: number;
        buyBoxMaxOrderQuantity?: number;
        buyBoxAvailabilityMessage?: string;
        isAddonItem?: boolean;
        sellerIdsLowestFBA?: string[];
        sellerIdsLowestFBM?: string[];
        offerCountFBA?: number;
        offerCountFBM?: number;
    };
    csv?: number[][];
    lastUpdate?: number;
    lastPriceChange?: number;
    trackingSince?: number;
    salesRankReference?: number;
    salesRanks?: Record<string, number[]>;
    monthlySold?: number;
    monthlySoldHistory?: number[];
    rating?: number;
    numberOfItems?: number;
    numberOfPages?: number;
    packageHeight?: number;
    packageLength?: number;
    packageWidth?: number;
    packageWeight?: number;
    packageQuantity?: number;
}

export interface KeepaDealsResponse {
    deals: {
        dr: {
            asin: string;
            title: string;
            image: number[];  // Array of byte values
            categories: number[];
            rootCat: number;
            current: number[];  // Array - index 0 is Amazon price
            avg: number[][];    // 2D array
            avg30: number[][];
            avg90: number[][];
            creationDate: number;
            lastUpdate: number;
            deltaLast: number[];
            delta: number[][];  // 2D array
            deltaPercent: number[][];  // 2D array - [0][0] is the main percent off
            salesRank: number;
            productGroup?: string;
            isLowest?: boolean;
            isLowest90?: boolean;
        }[];
        categoryIds: number[];
        categoryNames: string[];
        categoryCount: number[];
    };
    tokensLeft: number;
    refillIn: number;
    refillRate: number;
    tokensConsumed: number;
}

export interface KeepaSearchResponse {
    products: KeepaProduct[];
    tokensLeft: number;
    refillIn: number;
    refillRate: number;
    tokensConsumed: number;
}

export interface KeepaProductResponse {
    products: KeepaProduct[];
    tokensLeft: number;
    refillIn: number;
    refillRate: number;
    tokensConsumed: number;
}

export interface DealPingProduct {
    id: string;
    asin: string;
    name: string;
    imageUrl: string;
    currentPrice: number;
    originalPrice: number;
    percentOff: number;
    retailer: string;
    dealScore: 'great' | 'good' | 'average';
    affiliateUrl: string;
    category?: string;
    rating?: number;
    salesRank?: number;
    isLowestEver?: boolean;
    isLowest90Days?: boolean;
}

/**
 * Convert Keepa price (in cents) to pounds
 */
function keepaPriceToPounds(price: number): number {
    if (price <= 0) return 0;
    return price / 100;
}

/**
 * Get the primary image URL from imagesCSV
 */
function getImageUrl(imagesCSV: string | undefined): string {
    if (!imagesCSV) {
        return '/placeholder-product.png';
    }
    const images = imagesCSV.split(',');
    if (images.length === 0) {
        return '/placeholder-product.png';
    }
    // Keepa image IDs can be used to construct Amazon CDN URLs
    const imageId = images[0];
    return `https://m.media-amazon.com/images/I/${imageId}`;
}

/**
 * Get image URL from deal object
 * The image field in deals contains either a string or byte values
 */
function getDealImageUrl(image: string | number[]): string {
    if (!image) {
        return '/placeholder-product.png';
    }

    let imageId: string;

    // If image is an array of numbers (byte values), convert to string
    if (Array.isArray(image)) {
        imageId = String.fromCharCode(...image);
    } else if (typeof image === 'string') {
        // Check if it looks like comma-separated numbers (byte values as string)
        if (/^\d+(,\d+)*$/.test(image)) {
            const bytes = image.split(',').map(Number);
            imageId = String.fromCharCode(...bytes);
        } else {
            imageId = image;
        }
    } else {
        return '/placeholder-product.png';
    }

    // Clean up the image ID and construct URL
    imageId = imageId.trim();
    if (!imageId || imageId.length < 5) {
        return '/placeholder-product.png';
    }

    return `https://m.media-amazon.com/images/I/${imageId}`;
}

/**
 * Calculate deal score based on percentage off
 */
function calculateDealScore(percentOff: number): 'great' | 'good' | 'average' {
    if (percentOff >= DEAL_SCORE_THRESHOLDS.GREAT) return 'great';
    if (percentOff >= DEAL_SCORE_THRESHOLDS.GOOD) return 'good';
    return 'average';
}

/**
 * Generate affiliate URL from ASIN
 */
export function generateAffiliateUrl(asin: string): string {
    return `https://www.amazon.co.uk/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Browse deals from Keepa
 * Token cost: 5 per 150 deals
 */
export async function browseDeals(options: {
    page?: number;
    category?: number;
    minPercentOff?: number;
    maxPercentOff?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'percentOff' | 'salesRank';
    titleSearch?: string;
    hasReviews?: boolean;
    isLowest?: boolean;
    priceType?: number;
    dateRange?: number;
    excludeKindle?: boolean;
}): Promise<{ deals: DealPingProduct[]; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const {
        page = 0,
        category,
        minPercentOff = 10,
        maxPercentOff = 100,
        minPrice,
        maxPrice,
        sortBy = 'percentOff',
        titleSearch,
        hasReviews = true,
        isLowest = false,
        priceType = PRICE_TYPES.AMAZON,
        dateRange = 0, // Last 24 hours
        excludeKindle = true, // Exclude Kindle/ebook by default
    } = options;

    // Kindle Store category IDs to exclude
    const KINDLE_CATEGORIES = [
        341677031,  // Kindle Store UK
        362168031,  // Kindle eBooks
        341689031,  // Kindle eBooks > Fiction
    ];

    // Build query JSON
    const queryJSON: Record<string, unknown> = {
        page,
        domainId: AMAZON_DOMAIN_UK,
        priceTypes: [priceType],
        dateRange,
        deltaPercentRange: [minPercentOff, maxPercentOff],
        isRangeEnabled: true,
        isFilterEnabled: true,
        hasReviews,
        filterErotic: true,
        singleVariation: true,
        sortType: sortBy === 'newest' ? 1 : sortBy === 'salesRank' ? 3 : 4,
        // Set minimum price to £1.50 to filter out most Kindle editions
        currentRange: [
            minPrice ? minPrice * 100 : 150,  // At least £1.50
            maxPrice ? maxPrice * 100 : 9999900,
        ],
    };

    // Exclude Kindle categories
    if (excludeKindle) {
        queryJSON.excludeCategories = KINDLE_CATEGORIES;
    }

    if (category) {
        queryJSON.includeCategories = [category];
    }

    if (titleSearch) {
        queryJSON.titleSearch = titleSearch;
    }

    if (isLowest) {
        queryJSON.isLowest90 = true;
    }

    const url = `${KEEPA_API_BASE}/deal?key=${KEEPA_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip',
        },
        body: JSON.stringify(queryJSON),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Keepa API error: ${response.status} - ${errorText}`);
    }

    const data: KeepaDealsResponse = await response.json();

    // Keywords that indicate Kindle/digital editions
    const KINDLE_KEYWORDS = ['kindle', 'ebook', 'e-book', 'digital edition', 'kindle edition'];

    // Transform Keepa deals to DealPing format
    const rawDeals = (data.deals?.dr || [])
        .map((deal) => {
            // Current price is in current[0] (Amazon price) - skip if invalid (-1 means unavailable)
            const currentPriceCents = deal.current?.[0];
            if (!currentPriceCents || currentPriceCents <= 0) {
                return null;
            }

            const currentPrice = keepaPriceToPounds(currentPriceCents);

            // Skip very cheap items (likely Kindle editions)
            if (currentPrice < 2) {
                return null;
            }

            // Skip if title contains Kindle-related keywords
            const title = deal.title?.toLowerCase() || '';
            if (KINDLE_KEYWORDS.some(keyword => title.includes(keyword))) {
                return null;
            }

            // Get percent off from deltaPercent[0][0] (first interval, Amazon price type)
            const percentOff = Math.abs(deal.deltaPercent?.[0]?.[0] ?? 0);

            // Calculate original price from percent off
            // If current is £10 and 20% off, original was £10 / 0.8 = £12.50
            const originalPrice = percentOff > 0 && currentPrice > 0
                ? Math.round((currentPrice / (1 - percentOff / 100)) * 100) / 100
                : currentPrice;

            // Convert image byte array to string
            const imageId = deal.image ? String.fromCharCode(...deal.image) : '';

            const result: DealPingProduct = {
                id: deal.asin,
                asin: deal.asin,
                name: deal.title || 'Unknown Product',
                imageUrl: imageId ? `https://m.media-amazon.com/images/I/${imageId}` : '/placeholder-product.png',
                currentPrice,
                originalPrice,
                percentOff: Math.round(percentOff),
                retailer: 'Amazon UK',
                dealScore: calculateDealScore(percentOff),
                affiliateUrl: generateAffiliateUrl(deal.asin),
                salesRank: deal.salesRank,
                isLowestEver: deal.isLowest,
                isLowest90Days: deal.isLowest90,
            };
            return result;
        })
        .filter((deal): deal is DealPingProduct => deal !== null && deal.currentPrice > 0);

    return {
        deals: rawDeals,
        tokensLeft: data.tokensLeft,
    };
}

/**
 * Search for products on Amazon UK
 * Token cost: 10 per page (up to 10 results per page)
 */
export async function searchProducts(
    term: string,
    options: {
        page?: number;
        stats?: number;
    } = {}
): Promise<{ products: DealPingProduct[]; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const { page = 0, stats = 90 } = options;

    const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        type: 'product',
        term: term,
        page: page.toString(),
        stats: stats.toString(),
        history: '0', // Don't include full CSV history to save bandwidth
    });

    const url = `${KEEPA_API_BASE}/search?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            'Accept-Encoding': 'gzip',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Keepa API error: ${response.status} - ${errorText}`);
    }

    const data: KeepaSearchResponse = await response.json();

    // ONLY return products with REAL deals - verified via LIST_PRICE
    const products: DealPingProduct[] = (data.products || [])
        .map((product) => {
            const stats = product.stats;

            // Get current Amazon price (index 0) or Buy Box price (index 18)
            const currentPriceCents = stats?.current?.[CSV_PRICE_INDICES.AMAZON] ?? stats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ?? -1;
            const currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

            // Get LIST PRICE (RRP) - index 4 in the stats array
            // This is the actual recommended retail price from Amazon
            const listPriceCents = stats?.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
            const listPrice = listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0;

            // ONLY USE LIST PRICE - no fallback to averages which create fake discounts
            // If there's no list price OR current isn't less than list, skip this product
            if (listPrice <= 0 || currentPrice <= 0 || listPrice <= currentPrice) {
                return null; // Not a real deal
            }

            // Calculate percent off from the actual RRP
            const percentOff = Math.round(((listPrice - currentPrice) / listPrice) * 100);

            // Skip if discount is too small (less than 10%)
            if (percentOff < 10) {
                return null;
            }

            return {
                id: product.asin,
                asin: product.asin,
                name: product.title || 'Unknown Product',
                imageUrl: getImageUrl(product.imagesCSV),
                currentPrice,
                originalPrice: Math.round(listPrice * 100) / 100,
                percentOff,
                retailer: 'Amazon UK',
                dealScore: calculateDealScore(percentOff),
                affiliateUrl: generateAffiliateUrl(product.asin),
                category: product.categoryTree?.[0]?.name,
                rating: product.rating ? product.rating / 10 : undefined,
                salesRank: product.salesRankReference,
            };
        })
        .filter((p): p is DealPingProduct => p !== null);

    return {
        products,
        tokensLeft: data.tokensLeft,
    };
}

/**
 * Get detailed product information
 * Token cost: 1 per ASIN
 */
export async function getProduct(
    asin: string,
    options: {
        stats?: number;
        history?: boolean;
    } = {}
): Promise<{ product: DealPingProduct | null; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const { stats = 90, history = false } = options;

    const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        asin: asin,
        stats: stats.toString(),
        history: history ? '1' : '0',
    });

    const url = `${KEEPA_API_BASE}/product?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            'Accept-Encoding': 'gzip',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Keepa API error: ${response.status} - ${errorText}`);
    }

    const data: KeepaProductResponse = await response.json();

    if (!data.products || data.products.length === 0) {
        return { product: null, tokensLeft: data.tokensLeft };
    }

    const product = data.products[0];
    const productStats = product.stats;

    // Get current Amazon price
    const currentPriceCents = productStats?.current?.[CSV_PRICE_INDICES.AMAZON] ?? productStats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ?? -1;
    const currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

    // Get LIST PRICE (RRP) - index 4 in the stats array
    const listPriceCents = productStats?.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
    const listPrice = listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0;

    // Get 90-day average as fallback
    const avgPriceCents = productStats?.avg90?.[CSV_PRICE_INDICES.AMAZON] ?? productStats?.avg?.[CSV_PRICE_INDICES.AMAZON] ?? currentPriceCents;
    const avgPrice = avgPriceCents > 0 ? keepaPriceToPounds(avgPriceCents) : currentPrice;

    // Use list price (RRP) as original price if available, otherwise use 90-day average
    const originalPrice = listPrice > 0 ? listPrice : (avgPrice > currentPrice ? avgPrice : currentPrice);

    // Calculate percent off from the RRP or average
    const percentOff = originalPrice > currentPrice && currentPrice > 0
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    return {
        product: {
            id: product.asin,
            asin: product.asin,
            name: product.title || 'Unknown Product',
            imageUrl: getImageUrl(product.imagesCSV),
            currentPrice,
            originalPrice: Math.round(originalPrice * 100) / 100,
            percentOff,
            retailer: 'Amazon UK',
            dealScore: calculateDealScore(percentOff),
            affiliateUrl: generateAffiliateUrl(product.asin),
            category: product.categoryTree?.[0]?.name,
            rating: product.rating ? product.rating / 10 : undefined,
            salesRank: product.salesRankReference,
        },
        tokensLeft: data.tokensLeft,
    };
}

/**
 * Get token status (free, no token cost)
 */
export async function getTokenStatus(): Promise<{
    tokensLeft: number;
    refillRate: number;
    refillIn: number;
}> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const url = `${KEEPA_API_BASE}/token?key=${KEEPA_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Keepa API error: ${response.status}`);
    }

    const data = await response.json();

    return {
        tokensLeft: data.tokensLeft,
        refillRate: data.refillRate,
        refillIn: data.refillIn,
    };
}

// UK Amazon category IDs for common categories
export const UK_CATEGORIES = {
    ELECTRONICS: 560798,
    COMPUTERS: 340831031,
    HOME_KITCHEN: 11052671,
    GARDEN: 11052681,
    HEALTH_BEAUTY: 65801031,
    GROCERY: 340834031,
    TOYS: 468292,
    BABY: 60032031,
    SPORTS: 318949011,
    CLOTHING: 83450031,
    BOOKS: 266239,
    VIDEO_GAMES: 300703,
} as const;
