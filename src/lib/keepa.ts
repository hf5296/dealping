/**
 * Keepa API Client for DealPing
 * Provides access to Amazon UK product deals, search, and price data
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { consumeTokenBudget } from './keepaBudget';
import { recordTokenUsage } from './keepaAnalytics';

const KEEPA_API_BASE = 'https://api.keepa.com';
const KEEPA_API_KEY = process.env.KEEPA_API_KEY;
const AMAZON_DOMAIN_UK = 2; // Amazon UK domain ID
const AMAZON_ASSOCIATE_TAG = 'dealping0d-21';

// File-based cache directory (persists across server restarts)
const CACHE_DIR = path.join(process.cwd(), '.cache');
const LIGHTNING_DEALS_CACHE_FILE = path.join(CACHE_DIR, 'lightning-deals.json');
const PRODUCTS_CACHE_DIR = path.join(CACHE_DIR, 'products');
const BROWSE_DEALS_CACHE_DIR = path.join(CACHE_DIR, 'browse-deals');
const SEARCH_CACHE_DIR = path.join(CACHE_DIR, 'search');

// Cache durations
const PRODUCT_CACHE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour for product data (prices change frequently!)
const PRICE_HISTORY_CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours for price history
const BROWSE_DEALS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for browse deals
const SEARCH_CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours for search results

// Ensure cache directory exists
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

// Read cache from file
function readCacheFile<T>(filePath: string): T | null {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as T;
        }
    } catch (error) {
        console.error(`[Cache] Error reading ${filePath}:`, error);
    }
    return null;
}

// Write cache to file atomically with restricted permissions
function writeCacheFile<T>(filePath: string, data: T): void {
    try {
        ensureCacheDir();
        // Ensure parent directory exists for nested cache dirs
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Write to temp file then rename for atomic operation
        const tmpPath = `${filePath}.${process.pid}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(data), { encoding: 'utf-8', mode: 0o600 });
        fs.renameSync(tmpPath, filePath);
    } catch (error) {
        console.error(`[Cache] Error writing ${filePath}:`, error);
    }
}

// Product cache interface
interface ProductCacheEntry {
    product: DealPingProduct;
    priceHistory: PriceHistoryData | null;
    timestamp: number;
}

// Ensure products cache directory exists
function ensureProductsCacheDir() {
    if (!fs.existsSync(PRODUCTS_CACHE_DIR)) {
        fs.mkdirSync(PRODUCTS_CACHE_DIR, { recursive: true });
    }
}

// Get product cache file path
function getProductCachePath(asin: string): string {
    return path.join(PRODUCTS_CACHE_DIR, `${asin}.json`);
}

// Read product from cache
function readProductCache(asin: string): ProductCacheEntry | null {
    try {
        const filePath = getProductCachePath(asin);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const cached = JSON.parse(data) as ProductCacheEntry;
            return cached;
        }
    } catch (error) {
        console.error(`[ProductCache] Error reading cache for ${asin}:`, error);
    }
    return null;
}

// Write product to cache
function writeProductCache(asin: string, entry: ProductCacheEntry): void {
    try {
        ensureProductsCacheDir();
        const filePath = getProductCachePath(asin);
        fs.writeFileSync(filePath, JSON.stringify(entry), { encoding: 'utf-8', mode: 0o600 });
        console.log(`[ProductCache] Cached product ${asin}`);
    } catch (error) {
        console.error(`[ProductCache] Error writing cache for ${asin}:`, error);
    }
}

// --- Browse Deals Cache ---
interface BrowseDealsCacheEntry {
    deals: DealPingProduct[];
    tokensLeft: number;
    hasMore: boolean;
    timestamp: number;
}

function getBrowseDealsCachePath(key: string): string {
    // Create a safe filename from the cache key
    const safeKey = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
    return path.join(BROWSE_DEALS_CACHE_DIR, `${safeKey}.json`);
}

function readBrowseDealsCache(key: string): BrowseDealsCacheEntry | null {
    try {
        const filePath = getBrowseDealsCachePath(key);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const cached = JSON.parse(data) as BrowseDealsCacheEntry;
            const age = Date.now() - cached.timestamp;
            if (age < BROWSE_DEALS_CACHE_DURATION_MS) {
                return cached;
            }
        }
    } catch (error) {
        console.error('[BrowseDealsCache] Read error:', error);
    }
    return null;
}

function writeBrowseDealsCache(key: string, entry: BrowseDealsCacheEntry): void {
    try {
        if (!fs.existsSync(BROWSE_DEALS_CACHE_DIR)) {
            fs.mkdirSync(BROWSE_DEALS_CACHE_DIR, { recursive: true });
        }
        const filePath = getBrowseDealsCachePath(key);
        fs.writeFileSync(filePath, JSON.stringify(entry), { encoding: 'utf-8', mode: 0o600 });
    } catch (error) {
        console.error('[BrowseDealsCache] Write error:', error);
    }
}

// --- Search Cache ---
interface SearchCacheEntry {
    products: DealPingProduct[];
    tokensLeft: number;
    timestamp: number;
}

function getSearchCachePath(key: string): string {
    const safeKey = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
    return path.join(SEARCH_CACHE_DIR, `${safeKey}.json`);
}

function readSearchCache(key: string): SearchCacheEntry | null {
    try {
        const filePath = getSearchCachePath(key);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const cached = JSON.parse(data) as SearchCacheEntry;
            const age = Date.now() - cached.timestamp;
            if (age < SEARCH_CACHE_DURATION_MS) {
                return cached;
            }
        }
    } catch (error) {
        console.error('[SearchCache] Read error:', error);
    }
    return null;
}

function writeSearchCache(key: string, entry: SearchCacheEntry): void {
    try {
        if (!fs.existsSync(SEARCH_CACHE_DIR)) {
            fs.mkdirSync(SEARCH_CACHE_DIR, { recursive: true });
        }
        const filePath = getSearchCachePath(key);
        fs.writeFileSync(filePath, JSON.stringify(entry), { encoding: 'utf-8', mode: 0o600 });
    } catch (error) {
        console.error('[SearchCache] Write error:', error);
    }
}

// --- Cache Cleanup ---
// Throttle: run at most once per hour
let lastCacheCleanup = 0;
const CACHE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanOldCacheFiles(dir: string, maxAgeMs: number = CACHE_MAX_AGE_MS): void {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        const now = Date.now();
        let cleaned = 0;
        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            } catch {
                // Skip files we can't stat/delete
            }
        }
        if (cleaned > 0) {
            console.log(`[CacheCleanup] Removed ${cleaned} expired files from ${dir}`);
        }
    } catch (error) {
        console.error(`[CacheCleanup] Error cleaning ${dir}:`, error);
    }
}

function maybeCleanCaches(): void {
    const now = Date.now();
    if (now - lastCacheCleanup < CACHE_CLEANUP_INTERVAL_MS) return;
    lastCacheCleanup = now;
    cleanOldCacheFiles(BROWSE_DEALS_CACHE_DIR);
    cleanOldCacheFiles(SEARCH_CACHE_DIR);
    cleanOldCacheFiles(PRODUCTS_CACHE_DIR);
}

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
    AMAZING: 50, // 50%+ off = amazing deal
    GREAT: 30,   // 30-49% off = great deal
    // Below 30% = good deal (all deals are at least good)
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
    dealScore: 'amazing' | 'great' | 'good' | null;
    affiliateUrl: string;
    category?: string;
    rating?: number;
    salesRank?: number;
    isLowestEver?: boolean;
    isLowest90Days?: boolean;
    // Lightning deal specific
    isLightningDeal?: boolean;
    percentClaimed?: number;    // 0-100, how much of the deal stock is claimed
    dealEndTime?: number;       // Keepa time when deal expires
    // Price source tracking - 'list' = RRP, 'avg90' = 90-day average, 'deal' = deal API data
    priceSource?: 'list' | 'avg90' | 'deal';
    // 90-day average price (for product page deal validation)
    avg90Price?: number;
    // When the deal was first posted (unix timestamp ms)
    createdAt?: number;
}

/**
 * Price history data point
 */
export interface PriceHistoryPoint {
    date: string;
    timestamp: number;
    price: number;
}

/**
 * Price history response
 */
export interface PriceHistoryData {
    history: PriceHistoryPoint[];
    currentPrice: number;
    averagePrice: number;
    allTimeLow: number;
    allTimeHigh: number;
    lowestDate?: string;
    highestDate?: string;
}

/**
 * Convert Keepa timestamp to JavaScript Date
 * Keepa uses minutes since 2011-01-01
 */
function keepaTimeToDate(keepaTime: number): Date {
    const keepaEpoch = new Date('2011-01-01T00:00:00Z').getTime();
    return new Date(keepaEpoch + keepaTime * 60 * 1000);
}

/**
 * Convert Keepa price (in cents) to pounds
 */
function keepaPriceToPounds(price: number): number {
    if (price <= 0 || !Number.isFinite(price)) return 0;
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
function calculateDealScore(percentOff: number): 'amazing' | 'great' | 'good' | null {
    if (percentOff <= 0) return null;
    if (percentOff >= DEAL_SCORE_THRESHOLDS.AMAZING) return 'amazing';
    if (percentOff >= DEAL_SCORE_THRESHOLDS.GREAT) return 'great';
    return 'good';
}

/**
 * Generate affiliate URL from ASIN
 */
export function generateAffiliateUrl(asin: string): string {
    if (!/^[A-Z0-9]{10}$/i.test(asin)) return '#';
    return `https://www.amazon.co.uk/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Lightning Deals Cache
 * Since Lightning Deals API costs 500 tokens per call, we cache aggressively
 * Cache duration: 24 hours (refreshed once daily via cron job at midnight)
 *
 * IMPORTANT: Uses file-based caching to persist across server restarts!
 * This prevents burning 500 tokens every time the dev server restarts.
 */
interface LightningDealsCache {
    deals: DealPingProduct[];
    tokensLeft: number;
    timestamp: number;
}

// In-memory cache (fast access)
let lightningDealsCache: LightningDealsCache | null = null;

const LIGHTNING_DEALS_CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours - refresh 6x/day (3000 tokens)

/**
 * Check if a lightning deal has expired based on its end time
 */
function isLightningDealExpired(dealEndTime: number | undefined): boolean {
    if (!dealEndTime) return true; // No end time = consider expired
    const keepaEpoch = new Date('2011-01-01T00:00:00Z').getTime();
    const endDate = new Date(keepaEpoch + dealEndTime * 60 * 1000);
    return endDate < new Date(); // Deal has ended
}

/**
 * Load Lightning Deals cache from file (if not already in memory)
 */
function loadLightningDealsCache(): LightningDealsCache | null {
    // If already in memory, return it
    if (lightningDealsCache) {
        return lightningDealsCache;
    }

    // Try to load from file
    const fileCache = readCacheFile<LightningDealsCache>(LIGHTNING_DEALS_CACHE_FILE);
    if (fileCache) {
        // Check if file cache is still valid
        const cacheAge = Date.now() - fileCache.timestamp;
        if (cacheAge < LIGHTNING_DEALS_CACHE_DURATION_MS) {
            console.log(`[getLightningDeals] Loaded cache from file (age: ${Math.round(cacheAge / 60000)} minutes)`);
            lightningDealsCache = fileCache;
            return lightningDealsCache;
        } else {
            console.log('[getLightningDeals] File cache expired');
        }
    }

    return null;
}

/**
 * Save Lightning Deals cache to both memory and file
 */
function saveLightningDealsCache(cache: LightningDealsCache): void {
    lightningDealsCache = cache;
    writeCacheFile(LIGHTNING_DEALS_CACHE_FILE, cache);
    console.log(`[getLightningDeals] Cache saved to file (${cache.deals.length} deals)`);
}

/**
 * Lightning Deal from Keepa API
 * These are Amazon's official time-limited deals with GUARANTEED strikethrough pricing
 */
interface KeepaLightningDeal {
    asin: string;
    currentPrice: number;      // Regular price in cents
    dealPrice: number;         // Lightning deal price in cents
    dealId: string;
    dealState: 'AVAILABLE' | 'WAITLIST' | 'SOLDOUT' | 'WAITLISTFULL' | 'EXPIRED' | 'SUPPRESSED';
    domainId: number;
    endTime: number;           // Keepa time
    startTime: number;         // Keepa time
    image: string;             // Image filename
    isFulfilledByAmazon: boolean;
    isPrimeEarlyAccess: boolean;
    isPrimeEligible: boolean;
    lastUpdate: number;
    percentClaimed: number;    // 0-100
    percentOff: number;        // Amazon's calculated discount
    rating: number;            // Rating * 10 (e.g., 45 = 4.5 stars)
    sellerId: string;
    sellerName: string | null;
    title: string;
    totalReviews: number;
    variation: string | null;
}

interface KeepaLightningDealsResponse {
    lightningDeals: KeepaLightningDeal[];
    tokensLeft: number;
}

/**
 * Get Lightning Deals from Amazon UK
 * Token cost: 500 for all deals (regardless of limit parameter!)
 *
 * Lightning Deals are Amazon's official time-limited promotions with
 * GUARANTEED strikethrough pricing - no guessing required!
 *
 * IMPORTANT: This function uses aggressive caching (2 hours) to minimize
 * token usage since each API call costs 500 tokens.
 */
export async function getLightningDeals(options: {
    state?: 'AVAILABLE' | 'WAITLIST' | 'SOLDOUT' | 'WAITLISTFULL' | 'EXPIRED' | 'SUPPRESSED';
    minPercentOff?: number;
    minRating?: number;
    minReviews?: number;
    limit?: number;
    skipCache?: boolean; // Force refresh (use sparingly!)
    userFacing?: boolean; // If true, enforce token budget
}): Promise<{ deals: DealPingProduct[]; tokensLeft: number; fromCache?: boolean }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const {
        state = 'AVAILABLE',
        minPercentOff = 15,
        minRating = 3.5,
        minReviews = 10,
        limit = 20,
        skipCache = false,
    } = options;

    // Check cache first (memory + file, unless skipCache is true)
    if (!skipCache) {
        const cachedData = loadLightningDealsCache();
        if (cachedData) {
            const cacheAge = Date.now() - cachedData.timestamp;
            if (cacheAge < LIGHTNING_DEALS_CACHE_DURATION_MS) {
                // Filter out expired deals and apply other filters
                const filteredDeals = cachedData.deals
                    .filter(deal => !isLightningDealExpired(deal.dealEndTime)) // Remove expired deals!
                    .filter(deal => deal.percentOff >= minPercentOff)
                    .slice(0, limit);

                // If all cached deals have expired (their dealEndTime passed), force a refresh.
                // But if the API originally returned 0 deals, respect the cache — don't re-fetch.
                if (filteredDeals.length === 0 && cachedData.deals.length > 0) {
                    console.log('[getLightningDeals] All cached deals expired, fetching fresh data');
                } else {
                    console.log(`[getLightningDeals] Returning cached data (age: ${Math.round(cacheAge / 60000)} minutes, ${filteredDeals.length} active deals)`);
                    return {
                        deals: filteredDeals,
                        tokensLeft: cachedData.tokensLeft,
                        fromCache: true,
                    };
                }
            }
        }
    }

    console.log('[getLightningDeals] Cache miss or expired, fetching from Keepa API (500 tokens)');

    // Budget check — lightning deals costs 500 tokens (after cache check)
    consumeTokenBudget(500, options.userFacing ?? false);
    recordTokenUsage('getLightningDeals', 500);

const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        state,
    });

    const response = await fetch(`${KEEPA_API_BASE}/lightningdeal?${params.toString()}`, {
        headers: { 'Accept-Encoding': 'gzip' },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[getLightningDeals] API error ${response.status}: ${errorText}`);

        // If API fails (rate limit, server error, etc.) but we have cache, return non-expired deals
        const cachedData = loadLightningDealsCache();
        if (cachedData && cachedData.deals.length > 0) {
            console.log('[getLightningDeals] API failed, returning stale cache');
            const filteredDeals = cachedData.deals
                .filter(deal => !isLightningDealExpired(deal.dealEndTime)) // Remove expired!
                .filter(deal => deal.percentOff >= minPercentOff)
                .slice(0, limit);
            if (filteredDeals.length > 0) {
                return {
                    deals: filteredDeals,
                    tokensLeft: 0,
                    fromCache: true,
                };
            }
        }
        throw new Error(`Keepa API error: ${response.status} - ${errorText}`);
    }

    const data: KeepaLightningDealsResponse = await response.json();

    console.log('[getLightningDeals] Got', data.lightningDeals?.length || 0, 'lightning deals from Keepa');

    // Transform ALL deals for caching (we'll filter when serving)
    const allDeals = (data.lightningDeals || [])
        .filter(deal => {
            // Basic validation - keep all valid deals in cache
            if (!deal.dealPrice || deal.dealPrice <= 0) return false;
            if (!deal.currentPrice || deal.currentPrice <= 0) return false;
            if (deal.percentOff < 5) return false; // Minimum 5% for cache
            return true;
        })
        .map((deal): DealPingProduct => {
            const currentPrice = deal.dealPrice / 100;  // Convert cents to pounds
            let originalPrice = deal.currentPrice / 100;
            let percentOff: number;

            if (originalPrice > currentPrice && originalPrice > 0) {
                // We have distinct deal vs regular prices — calculate percentOff from them
                percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
            } else if (deal.percentOff > 0 && deal.percentOff < 100 && currentPrice > 0) {
                // Keepa reports a discount but currentPrice == dealPrice (no separate regular price).
                // Back-calculate the original price from Keepa's percentOff.
                const safePercentOff = Math.min(deal.percentOff, 99);
                originalPrice = Math.round((currentPrice / (1 - safePercentOff / 100)) * 100) / 100;
                percentOff = safePercentOff;
            } else {
                percentOff = 0;
            }

            return {
                id: deal.asin,
                asin: deal.asin,
                name: deal.title || 'Unknown Product',
                imageUrl: deal.image
                    ? `https://m.media-amazon.com/images/I/${deal.image}`
                    : '/placeholder-product.png',
                currentPrice,
                originalPrice,
                percentOff,
                retailer: 'Amazon UK',
                dealScore: calculateDealScore(percentOff),
                affiliateUrl: generateAffiliateUrl(deal.asin),
                rating: deal.rating / 10,
                // Lightning deal specific info
                isLightningDeal: true,
                percentClaimed: deal.percentClaimed,
                dealEndTime: deal.endTime,
                createdAt: deal.startTime ? keepaTimeToDate(deal.startTime).getTime() : undefined,
            };
        });

    // Update cache with ALL deals (both memory and file)
    saveLightningDealsCache({
        deals: allDeals,
        tokensLeft: data.tokensLeft,
        timestamp: Date.now(),
    });

    // Apply request-specific filters and limit
    const filteredDeals = allDeals
        .filter(deal => {
            if (deal.percentOff < minPercentOff) return false;
            // Rating and review filters
            if (deal.rating && deal.rating < minRating) return false;
            return true;
        })
        .slice(0, limit);

    return {
        deals: filteredDeals,
        tokensLeft: data.tokensLeft,
        fromCache: false,
    };
}

/**
 * Look up an ASIN in the Lightning Deals cache
 * Returns the cached deal data if found, null otherwise
 */
export function getLightningDealFromCache(asin: string): DealPingProduct | null {
    const cache = loadLightningDealsCache();
    if (!cache) return null;
    return cache.deals.find(d => d.asin === asin && !isLightningDealExpired(d.dealEndTime)) || null;
}

/**
 * Clear the Lightning Deals cache (useful for testing or forcing refresh)
 */
export function clearLightningDealsCache(): void {
    lightningDealsCache = null;
    // Also remove the file cache
    try {
        if (fs.existsSync(LIGHTNING_DEALS_CACHE_FILE)) {
            fs.unlinkSync(LIGHTNING_DEALS_CACHE_FILE);
        }
    } catch (error) {
        console.error('[clearLightningDealsCache] Error deleting file:', error);
    }
    console.log('[clearLightningDealsCache] Cache cleared (memory + file)');
}

/**
 * Product price data from Keepa for validation
 */
interface ProductPriceData {
    currentPrice: number;
    listPrice: number;      // Manufacturer RRP
    avg90Price: number;     // 90-day average (often used by Amazon for "Was" price)
    avg30Price: number;     // 30-day average
}

/**
 * Batch fetch products by ASINs to get accurate pricing data
 * Token cost: 1 per ASIN (up to 100 ASINs per request)
 */
async function batchFetchProducts(asins: string[]): Promise<Map<string, ProductPriceData>> {
    if (!KEEPA_API_KEY || asins.length === 0) {
        return new Map();
    }

// Keepa allows up to 100 ASINs per batch request
    const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        asin: asins.slice(0, 100).join(','),
        stats: '90',
        history: '0',
    });

    try {
        const response = await fetch(`${KEEPA_API_BASE}/product?${params.toString()}`, {
            headers: { 'Accept-Encoding': 'gzip' },
        });

        if (!response.ok) {
            console.error(`[batchFetchProducts] Keepa API error ${response.status} - RRP validation will be skipped for ${asins.length} ASINs`);
            return new Map();
        }

        const data: KeepaProductResponse = await response.json();
        const priceMap = new Map<string, ProductPriceData>();

        for (const product of data.products || []) {
            const stats = product.stats;
            if (!stats) continue;

            const currentPriceCents =
                stats.current?.[CSV_PRICE_INDICES.AMAZON] ??
                stats.current?.[CSV_PRICE_INDICES.BUY_BOX] ??
                stats.current?.[CSV_PRICE_INDICES.LIGHTNING] ??
                stats.current?.[CSV_PRICE_INDICES.NEW_FBA] ??
                stats.current?.[CSV_PRICE_INDICES.NEW] ??
                -1;
            const listPriceCents = stats.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
            const avg90PriceCents = stats.avg90?.[CSV_PRICE_INDICES.AMAZON] ?? -1;
            const avg30PriceCents = stats.avg30?.[CSV_PRICE_INDICES.AMAZON] ?? -1;

            if (currentPriceCents > 0) {
                priceMap.set(product.asin, {
                    currentPrice: keepaPriceToPounds(currentPriceCents),
                    listPrice: listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0,
                    avg90Price: avg90PriceCents > 0 ? keepaPriceToPounds(avg90PriceCents) : 0,
                    avg30Price: avg30PriceCents > 0 ? keepaPriceToPounds(avg30PriceCents) : 0,
                });
            }
        }

        return priceMap;
    } catch (error) {
        console.error(`[batchFetchProducts] Network error - RRP validation will be skipped for ${asins.length} ASINs:`, error);
        return new Map();
    }
}

/**
 * Browse deals from Keepa
 * Token cost: 5 per 150 deals + 1 per ASIN for RRP validation (optional)
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
    isLowest90?: boolean; // Price is at 90-day low (stronger signal of real deal)
    maxSalesRank?: number; // Filter out obscure products (lower rank = more popular)
    minRating?: number; // Minimum product rating (0-50, e.g. 40 = 4.0 stars)
    priceType?: number;
    dateRange?: number;
    excludeKindle?: boolean;
    validateRRP?: boolean; // If true, fetch actual LIST_PRICE for accurate RRP
    limit?: number; // Limit deals to validate (to control token cost)
    userFacing?: boolean; // If true, enforce token budget
}): Promise<{ deals: DealPingProduct[]; tokensLeft: number; hasMore: boolean }> {
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
        isLowest90 = false,
        maxSalesRank,
        minRating,
        priceType = PRICE_TYPES.AMAZON,
        dateRange = 0,
        excludeKindle = true,
        validateRRP = false,
        limit = 150,
    } = options;

    // Periodically clean expired cache files
    maybeCleanCaches();

    // Check file-based cache first
    const cacheKey = JSON.stringify({
        page, category, minPercentOff, maxPercentOff, minPrice, maxPrice,
        sortBy, titleSearch, hasReviews, isLowest, isLowest90, maxSalesRank,
        minRating, priceType, dateRange, excludeKindle, validateRRP, limit,
    });

    const cached = readBrowseDealsCache(cacheKey);
    if (cached) {
        const ageMin = Math.round((Date.now() - cached.timestamp) / 60000);
        console.log(`[browseDeals] Cache hit (age: ${ageMin}min, ${cached.deals.length} deals)`);
        return { deals: cached.deals, tokensLeft: cached.tokensLeft, hasMore: cached.hasMore };
    }

    console.log(`[browseDeals] Cache miss, fetching from Keepa API`);

    // Budget check — browse deals costs 5 tokens (after cache check)
    consumeTokenBudget(5, options.userFacing ?? false);
    recordTokenUsage('browseDeals', 5);

// Category IDs to exclude (Books, Kindle, Media tend to have inflated RRP discounts)
    // Only exclude these when browsing ALL deals, not when a specific category is requested
    const EXCLUDED_CATEGORIES = [
        266239,     // Books UK
        341677031,  // Kindle Store UK
        362168031,  // Kindle eBooks
        341689031,  // Kindle eBooks > Fiction
        283926,     // Music UK
        300703,     // DVD & Blu-ray UK
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

    // Exclude Books, Kindle, and Media categories (tend to have inflated RRP discounts)
    // Only apply exclusions when browsing ALL deals, not category-specific browsing
    if (excludeKindle && !category) {
        queryJSON.excludeCategories = EXCLUDED_CATEGORIES;
    }

    if (category) {
        queryJSON.includeCategories = [category];
    }

    if (titleSearch) {
        queryJSON.titleSearch = titleSearch;
    }

    if (isLowest) {
        queryJSON.isLowest = true;
    }

    if (isLowest90) {
        queryJSON.isLowest90 = true;
    }

    // Filter by sales rank - lower rank = more popular product = more likely legit deal
    if (maxSalesRank) {
        queryJSON.salesRankRange = [0, maxSalesRank];
    }

    // Filter by minimum rating
    if (minRating) {
        queryJSON.minRating = minRating;
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

    console.log('[browseDeals] Got', data.deals?.dr?.length || 0, 'deals from Keepa');

    // Keywords that indicate Kindle/digital editions
    const KINDLE_KEYWORDS = ['kindle', 'ebook', 'e-book', 'digital edition', 'kindle edition'];

    // First pass: filter out invalid deals
    const validDeals = (data.deals?.dr || []).filter((deal) => {
        const currentPriceCents = deal.current?.[0];
        if (!currentPriceCents || currentPriceCents <= 0) return false;

        const currentPrice = keepaPriceToPounds(currentPriceCents);
        if (currentPrice < 2) return false; // Skip very cheap items

        const title = deal.title?.toLowerCase() || '';
        if (KINDLE_KEYWORDS.some(keyword => title.includes(keyword))) return false;

        return true;
    });

    // Limit deals for RRP validation to control token costs
    const dealsToValidate = validDeals.slice(0, limit);

    // If validateRRP is enabled, batch fetch product details for accurate pricing
    let priceMap = new Map<string, ProductPriceData>();
    if (validateRRP && dealsToValidate.length > 0) {
        const asins = dealsToValidate.map(deal => deal.asin);
        priceMap = await batchFetchProducts(asins);
    }

    // Transform Keepa deals to DealPing format
    const rawDeals = dealsToValidate
        .map((deal) => {
            const currentPriceCents = deal.current?.[0];
            const currentPrice = keepaPriceToPounds(currentPriceCents);

            // Get validated price data if available
            const validatedPrices = priceMap.get(deal.asin);

            let originalPrice: number;
            let percentOff: number;
            let isValidDeal = false;

            if (validatedPrices) {
                const actualCurrentPrice = validatedPrices.currentPrice || currentPrice;
                const listPrice = validatedPrices.listPrice;
                const avg90Price = validatedPrices.avg90Price;

                // VALIDATION STRATEGY:
                // 1. We need BOTH a LIST_PRICE AND a 90-day average for validation
                // 2. If LIST_PRICE is much higher than avg90 (>50% above), it's likely stale
                //    and Amazon isn't showing that strikethrough - use avg90 instead
                // 3. The current price must be below BOTH to be a real deal

                if (listPrice <= 0 && avg90Price <= 0) {
                    return null;
                }

                // Determine which "Was" price to use
                let referencePrice = 0;

                // First, check if the discount from avg90 is too extreme (>70%)
                // This usually indicates a pricing anomaly that won't show a strikethrough
                if (avg90Price > 0) {
                    const avgDiscount = ((avg90Price - actualCurrentPrice) / avg90Price) * 100;
                    if (avgDiscount > 70) {
                        return null;
                    }
                }

                if (listPrice > 0 && listPrice > actualCurrentPrice) {
                    // LIST_PRICE exists and is above current price
                    if (avg90Price > 0) {
                        // Sanity check: if LIST_PRICE is >30% above avg90, it's probably stale
                        // Amazon likely isn't showing that inflated strikethrough
                        if (listPrice > avg90Price * 1.3) {
                            if (avg90Price > actualCurrentPrice) {
                                referencePrice = avg90Price;
                            } else {
                                return null;
                            }
                        } else {
                            // LIST_PRICE seems reasonable - use it
                            referencePrice = listPrice;
                        }
                    } else {
                        // No avg90 to validate, but LIST_PRICE exists
                        // Only use if discount isn't extreme (>60% is suspicious without validation)
                        const tentativeDiscount = ((listPrice - actualCurrentPrice) / listPrice) * 100;
                        if (tentativeDiscount > 60) {
                            return null;
                        }
                        referencePrice = listPrice;
                    }
                } else if (avg90Price > 0 && avg90Price > actualCurrentPrice) {
                    // No valid LIST_PRICE but there's an avg90 discount
                    // Only use if the discount is substantial (indicates a real price drop)
                    const avgDiscount = ((avg90Price - actualCurrentPrice) / avg90Price) * 100;
                    if (avgDiscount >= 30) {
                        referencePrice = avg90Price;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }

                originalPrice = referencePrice;
                if (originalPrice <= 0) return null;
                percentOff = Math.round(((originalPrice - actualCurrentPrice) / originalPrice) * 100);

                // Only show if discount meets minimum threshold
                isValidDeal = percentOff >= minPercentOff;

            } else {
                // No validated prices - use Keepa's deal data directly
                // Keepa's deltaPercent contains their calculated discount
                const keepaPercentOff = deal.deltaPercent?.[0]?.[0];

                if (!keepaPercentOff || keepaPercentOff < minPercentOff) {
                    return null;
                }

                // Use the avg90 from the deal data if available
                const avg90Cents = deal.avg90?.[0]?.[0];
                if (avg90Cents && avg90Cents > 0) {
                    originalPrice = keepaPriceToPounds(avg90Cents);
                    if (originalPrice <= 0) return null;
                    percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

                    // Sanity check - if our calculated discount differs too much from Keepa's, skip
                    if (Math.abs(percentOff - keepaPercentOff) > 20) {
                        // Use Keepa's percent and calculate back
                        percentOff = keepaPercentOff;
                        if (percentOff >= 100) percentOff = 99;
                        originalPrice = currentPrice / (1 - percentOff / 100);
                    }
                } else {
                    // Fall back to Keepa's percentage
                    percentOff = keepaPercentOff;
                    if (percentOff >= 100) percentOff = 99;
                    originalPrice = currentPrice / (1 - percentOff / 100);
                }

                isValidDeal = percentOff >= minPercentOff && percentOff <= 80; // Cap at 80% to avoid anomalies
            }

            if (!isValidDeal) {
                return null;
            }

            // Convert image byte array to string
            const imageId = deal.image ? String.fromCharCode(...deal.image) : '';

            const result: DealPingProduct = {
                id: deal.asin,
                asin: deal.asin,
                name: deal.title || 'Unknown Product',
                imageUrl: imageId ? `https://m.media-amazon.com/images/I/${imageId}` : '/placeholder-product.png',
                currentPrice: validatedPrices?.currentPrice || currentPrice,
                originalPrice: Math.round(originalPrice * 100) / 100,
                percentOff: Math.round(percentOff),
                retailer: 'Amazon UK',
                dealScore: calculateDealScore(percentOff),
                affiliateUrl: generateAffiliateUrl(deal.asin),
                salesRank: deal.salesRank,
                isLowestEver: deal.isLowest,
                isLowest90Days: deal.isLowest90,
                createdAt: deal.creationDate ? keepaTimeToDate(deal.creationDate).getTime() : undefined,
            };
            return result;
        })
        .filter((deal): deal is DealPingProduct => deal !== null && deal.currentPrice > 0 && deal.percentOff >= minPercentOff);

    // Check if there are more deals available (Keepa returns up to 150 deals per page)
    const hasMore = (data.deals?.dr?.length || 0) >= 150;

    const result = {
        deals: rawDeals,
        tokensLeft: data.tokensLeft,
        hasMore,
    };

    // Cache the result
    writeBrowseDealsCache(cacheKey, { ...result, timestamp: Date.now() });
    console.log(`[browseDeals] Cached ${rawDeals.length} deals`);

    return result;
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
        userFacing?: boolean;
    } = {}
): Promise<{ products: DealPingProduct[]; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const { page = 0, stats = 90 } = options;

    // Periodically clean expired cache files
    maybeCleanCaches();

    // Check search cache first
    const searchCacheKey = JSON.stringify({ term, page, stats });
    const cachedSearch = readSearchCache(searchCacheKey);
    if (cachedSearch) {
        const ageMin = Math.round((Date.now() - cachedSearch.timestamp) / 60000);
        console.log(`[searchProducts] Cache hit for "${term}" page ${page} (age: ${ageMin}min)`);
        return { products: cachedSearch.products, tokensLeft: cachedSearch.tokensLeft };
    }

    console.log(`[searchProducts] Cache miss for "${term}" page ${page}, fetching from Keepa API`);

    // Budget check — search costs 10 tokens (after cache check)
    consumeTokenBudget(10, options.userFacing ?? false);
    recordTokenUsage('searchProducts', 10);

const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        type: 'product',
        term: term,
        page: page.toString(),
        stats: stats.toString(),
        history: '0',
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

    // ONLY return products with REAL deals - must be below LIST_PRICE
    // Amazon's strikethrough is typically based on the LIST_PRICE (manufacturer RRP)
    const products = (data.products || [])
        .map((product): DealPingProduct | null => {
            const stats = product.stats;

            // Get current price - try multiple sources for better coverage
            const currentPriceCents =
                stats?.current?.[CSV_PRICE_INDICES.AMAZON] ??
                stats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ??
                stats?.current?.[CSV_PRICE_INDICES.LIGHTNING] ??
                stats?.current?.[CSV_PRICE_INDICES.NEW_FBA] ??
                stats?.current?.[CSV_PRICE_INDICES.NEW] ??
                -1;
            const currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

            if (currentPrice <= 0) return null;

            // Get LIST PRICE (RRP) - this is what Amazon uses for strikethrough
            const listPriceCents = stats?.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
            const listPrice = listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0;

            // REQUIRE LIST_PRICE - if there's no RRP, we can't reliably show a discount
            if (listPrice <= 0 || listPrice <= currentPrice) {
                return null; // No discount from RRP
            }

            // Calculate percent off from the list price (RRP)
            const percentOff = Math.round(((listPrice - currentPrice) / listPrice) * 100);

            // Skip if discount is too small (less than 15%)
            // Higher threshold ensures more accurate/visible discounts on Amazon
            if (percentOff < 15) {
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
                retailer: 'Amazon UK' as const,
                dealScore: calculateDealScore(percentOff),
                affiliateUrl: generateAffiliateUrl(product.asin),
                category: product.categoryTree?.[0]?.name,
                rating: product.rating ? product.rating / 10 : undefined,
                salesRank: product.salesRankReference,
            };
        })
        .filter((p): p is DealPingProduct => p !== null);

    const searchResult = { products, tokensLeft: data.tokensLeft };

    // Cache the result (including empty results to prevent repeated API calls)
    writeSearchCache(searchCacheKey, { ...searchResult, timestamp: Date.now() });
    console.log(`[searchProducts] Cached ${products.length} results for "${term}"`);

    return searchResult;
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
        userFacing?: boolean;
    } = {}
): Promise<{ product: DealPingProduct | null; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    const { stats = 90, history = false } = options;

    // Budget check — product lookup costs 1 token
    consumeTokenBudget(1, options.userFacing ?? false);
    recordTokenUsage('getProduct', 1);

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

    // Get current price - try multiple sources for better coverage
    const currentPriceCents =
        productStats?.current?.[CSV_PRICE_INDICES.AMAZON] ??
        productStats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ??
        productStats?.current?.[CSV_PRICE_INDICES.LIGHTNING] ??
        productStats?.current?.[CSV_PRICE_INDICES.NEW_FBA] ??
        productStats?.current?.[CSV_PRICE_INDICES.NEW] ??
        -1;
    let currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

    // Get LIST PRICE (RRP) and 90-day average
    const listPriceCents = productStats?.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
    const listPrice = listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0;

    const avg90PriceCents = productStats?.avg90?.[CSV_PRICE_INDICES.AMAZON] ?? -1;
    const avg90Price = avg90PriceCents > 0 ? keepaPriceToPounds(avg90PriceCents) : 0;

    // Determine strikethrough price - match what Amazon actually displays
    let originalPrice = currentPrice;
    let getProductPriceSource: 'list' | 'avg90' | 'deal' | undefined;

    if (listPrice > 0 && listPrice > currentPrice) {
        if (listPrice <= currentPrice * 3) {
            originalPrice = listPrice;
            getProductPriceSource = 'list';
        } else if (avg90Price > 0 && avg90Price > currentPrice) {
            originalPrice = avg90Price;
            getProductPriceSource = 'avg90';
        }
    } else if (avg90Price > 0 && avg90Price > currentPrice) {
        originalPrice = avg90Price;
        getProductPriceSource = 'avg90';
    }

    // Calculate percent off
    let percentOff = originalPrice > currentPrice && currentPrice > 0
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    // Check lightning deals cache for better pricing data
    let isLightningDeal = false;
    let percentClaimed: number | undefined;
    let dealEndTime: number | undefined;
    let getProductCreatedAt: number | undefined;

    const cachedLightningDeal = getLightningDealFromCache(asin);
    if (cachedLightningDeal) {
        // Active lightning deal - always use its pricing as source of truth.
        // The product API returns the regular Amazon price, not the deal price.
        isLightningDeal = true;
        percentClaimed = cachedLightningDeal.percentClaimed;
        dealEndTime = cachedLightningDeal.dealEndTime;
        getProductCreatedAt = cachedLightningDeal.createdAt;

        currentPrice = cachedLightningDeal.currentPrice;
        originalPrice = cachedLightningDeal.originalPrice;
        percentOff = cachedLightningDeal.percentOff;
        getProductPriceSource = 'deal';
    }

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
            isLightningDeal,
            percentClaimed,
            dealEndTime,
            priceSource: getProductPriceSource,
            createdAt: getProductCreatedAt,
        },
        tokensLeft: data.tokensLeft,
    };
}

/**
 * Get product with price history - CACHED VERSION
 * This is the main function to use for product pages.
 * Caches results for 24 hours to minimize API token usage.
 *
 * Token cost: 2 tokens per ASIN (only when cache is missed)
 */
export async function getProductWithHistory(
    asin: string,
    options: {
        skipCache?: boolean;
        historyDays?: number;
        userFacing?: boolean;
    } = {}
): Promise<{
    product: DealPingProduct | null;
    priceHistory: PriceHistoryData | null;
    tokensLeft: number;
    fromCache: boolean;
}> {
    const { skipCache = false, historyDays = 1825 } = options;

    // Check cache first
    if (!skipCache) {
        const cached = readProductCache(asin);
        if (cached) {
            const cacheAge = Date.now() - cached.timestamp;
            // Use product cache for 24 hours, price history for 6 hours
            if (cacheAge < PRODUCT_CACHE_DURATION_MS) {
                console.log(`[getProductWithHistory] Cache hit for ${asin} (age: ${Math.round(cacheAge / 60000)} minutes)`);
                return {
                    product: cached.product,
                    priceHistory: cached.priceHistory,
                    tokensLeft: -1, // Unknown from cache
                    fromCache: true,
                };
            } else {
                console.log(`[getProductWithHistory] Cache expired for ${asin}`);
            }
        }
    }

    console.log(`[getProductWithHistory] Fetching ${asin} from Keepa API`);

    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    // Budget check — product with history costs 2 tokens (after cache check)
    consumeTokenBudget(2, options.userFacing ?? false);
    recordTokenUsage('getProductWithHistory', 2);

// Fetch product with history in one API call
    const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        asin: asin,
        stats: '365',
        history: '1', // Include price history
    });

    const url = `${KEEPA_API_BASE}/product?${params.toString()}`;

    const response = await fetch(url, {
        headers: { 'Accept-Encoding': 'gzip' },
    });

    if (!response.ok) {
        // If API fails but we have stale cache, use it
        const staleCache = readProductCache(asin);
        if (staleCache) {
            console.log(`[getProductWithHistory] API failed, using stale cache for ${asin}`);
            return {
                product: staleCache.product,
                priceHistory: staleCache.priceHistory,
                tokensLeft: 0,
                fromCache: true,
            };
        }
        const errorText = await response.text();
        throw new Error(`Keepa API error: ${response.status} - ${errorText}`);
    }

    const data: KeepaProductResponse = await response.json();

    if (!data.products || data.products.length === 0) {
        return { product: null, priceHistory: null, tokensLeft: data.tokensLeft, fromCache: false };
    }

    const rawProduct = data.products[0];
    const productStats = rawProduct.stats;

    // Build product data
    // Try multiple price sources in priority order:
    // 1. Amazon direct price
    // 2. Buy Box price (most relevant for customers)
    // 3. Lightning deal price
    // 4. New FBA price (marketplace sellers fulfilled by Amazon)
    // 5. New marketplace price
    const currentPriceCents =
        productStats?.current?.[CSV_PRICE_INDICES.AMAZON] ??
        productStats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ??
        productStats?.current?.[CSV_PRICE_INDICES.LIGHTNING] ??
        productStats?.current?.[CSV_PRICE_INDICES.NEW_FBA] ??
        productStats?.current?.[CSV_PRICE_INDICES.NEW] ??
        -1;
    const currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

    const listPriceCents = productStats?.current?.[CSV_PRICE_INDICES.LIST_PRICE] ?? -1;
    const listPrice = listPriceCents > 0 ? keepaPriceToPounds(listPriceCents) : 0;

    const avg90PriceCents = productStats?.avg90?.[CSV_PRICE_INDICES.AMAZON] ?? -1;
    const avg90Price = avg90PriceCents > 0 ? keepaPriceToPounds(avg90PriceCents) : 0;

    // Determine strikethrough price
    // Prefer avg90 as the most honest "was" price since it reflects actual selling price.
    // Only use LIST_PRICE (RRP) if avg90 is unavailable or not above current price,
    // and the LIST_PRICE passes sanity checks.
    let originalPrice = currentPrice;
    let priceSource: 'list' | 'avg90' | 'deal' | undefined;
    if (avg90Price > 0 && avg90Price > currentPrice) {
        // 90-day average is the most reliable "was" price
        originalPrice = avg90Price;
        priceSource = 'avg90';
    } else if (listPrice > 0 && listPrice > currentPrice) {
        // Fall back to LIST_PRICE (RRP) with sanity check
        // If RRP is more than 2x the current price, it's likely stale/inflated
        if (listPrice <= currentPrice * 2) {
            originalPrice = listPrice;
            priceSource = 'list';
        }
    }

    const percentOff = originalPrice > currentPrice && currentPrice > 0
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    // If no current price from the product API, check lightning deals cache
    // Lightning deals have their own pricing that may not appear in stats.current
    let finalCurrentPrice = currentPrice;
    let finalOriginalPrice = originalPrice;
    let finalPercentOff = percentOff;
    let isLightningDeal = false;
    let lightningPercentClaimed: number | undefined;
    let lightningDealEndTime: number | undefined;
    let lightningCreatedAt: number | undefined;
    let isLowestEver = false;
    let isLowest90Days = false;

    const cachedLightningDeal = getLightningDealFromCache(asin);

    if (cachedLightningDeal) {
        // This is an active lightning deal - always use its pricing
        // The product API returns the regular Amazon price, but during a lightning deal
        // the customer pays the deal price. Use lightning deal prices as the source of truth.
        isLightningDeal = true;
        lightningPercentClaimed = cachedLightningDeal.percentClaimed;
        lightningDealEndTime = cachedLightningDeal.dealEndTime;
        lightningCreatedAt = cachedLightningDeal.createdAt;

        finalCurrentPrice = cachedLightningDeal.currentPrice;
        finalOriginalPrice = cachedLightningDeal.originalPrice;
        finalPercentOff = cachedLightningDeal.percentOff;
        priceSource = 'deal';
    } else if (finalCurrentPrice <= 0) {
        // Not a lightning deal and no price - try to extract from CSV history as last resort
        const csv = rawProduct.csv;
        if (csv && csv[CSV_PRICE_INDICES.AMAZON]) {
            const amazonPrices = csv[CSV_PRICE_INDICES.AMAZON];
            // Get the most recent valid price from history
            for (let i = amazonPrices.length - 2; i >= 0; i -= 2) {
                const priceCents = amazonPrices[i + 1];
                if (priceCents > 0) {
                    finalCurrentPrice = keepaPriceToPounds(priceCents);
                    break;
                }
            }
        }
    }

    const product: DealPingProduct = {
        id: rawProduct.asin,
        asin: rawProduct.asin,
        name: rawProduct.title || 'Unknown Product',
        imageUrl: getImageUrl(rawProduct.imagesCSV),
        currentPrice: finalCurrentPrice,
        originalPrice: Math.round(finalOriginalPrice * 100) / 100,
        percentOff: finalPercentOff,
        retailer: 'Amazon UK',
        dealScore: calculateDealScore(finalPercentOff),
        affiliateUrl: generateAffiliateUrl(rawProduct.asin),
        category: rawProduct.categoryTree?.[0]?.name,
        rating: rawProduct.rating ? rawProduct.rating / 10 : undefined,
        salesRank: rawProduct.salesRankReference,
        isLightningDeal,
        percentClaimed: lightningPercentClaimed,
        dealEndTime: lightningDealEndTime,
        isLowestEver,
        isLowest90Days,
        priceSource,
        avg90Price: avg90Price > 0 ? Math.round(avg90Price * 100) / 100 : undefined,
        createdAt: lightningCreatedAt,
    };

    // Build price history data
    let priceHistory: PriceHistoryData | null = null;
    const csv = rawProduct.csv;

    // Try multiple CSV price sources, picking the first with meaningful data
    // AMAZON may be empty (only 2 entries = 1 data point) for marketplace products
    const csvCandidates = [
        csv?.[CSV_PRICE_INDICES.AMAZON],
        csv?.[CSV_PRICE_INDICES.BUY_BOX],
        csv?.[CSV_PRICE_INDICES.NEW],
        csv?.[CSV_PRICE_INDICES.NEW_FBA],
    ];
    const priceCSV = csvCandidates.find(arr => arr && arr.length >= 4) ?? null;

    if (priceCSV) {
        const amazonPrices = priceCSV;
        const history: PriceHistoryPoint[] = [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - historyDays);

        let allTimeLow = Infinity;
        let allTimeHigh = 0;
        let lowestDate = '';
        let highestDate = '';
        let priceSum = 0;
        let priceCount = 0;

        // Ensure even number of elements (pairs of [time, price])
        const histLen = amazonPrices.length - (amazonPrices.length % 2);
        for (let i = 0; i < histLen; i += 2) {
            const keepaTime = amazonPrices[i];
            const priceCents = amazonPrices[i + 1];

            if (priceCents <= 0) continue;

            const date = keepaTimeToDate(keepaTime);
            const price = keepaPriceToPounds(priceCents);

            // Skip invalid prices
            if (!Number.isFinite(price) || price <= 0) continue;

            // Skip invalid dates
            if (isNaN(date.getTime())) continue;

            if (price < allTimeLow) {
                allTimeLow = price;
                lowestDate = date.toISOString().split('T')[0];
            }
            if (price > allTimeHigh) {
                allTimeHigh = price;
                highestDate = date.toISOString().split('T')[0];
            }
            priceSum += price;
            priceCount++;

            if (date >= cutoffDate) {
                const now = new Date();
                const isOlderThanThisYear = date.getFullYear() < now.getFullYear();
                const dateFormat: Intl.DateTimeFormatOptions = isOlderThanThisYear
                    ? { month: 'short', day: 'numeric', year: '2-digit' }
                    : { month: 'short', day: 'numeric' };

                history.push({
                    date: date.toLocaleDateString('en-GB', dateFormat),
                    timestamp: date.getTime(),
                    price: Math.round(price * 100) / 100,
                });
            }
        }

        const averagePrice = priceCount > 0 ? Math.round((priceSum / priceCount) * 100) / 100 : finalCurrentPrice;
        history.sort((a, b) => a.timestamp - b.timestamp);

        // Append today's price so the chart extends to the current date
        const now = new Date();
        const lastPoint = history[history.length - 1];
        const todayPrice = (Number.isFinite(finalCurrentPrice) && finalCurrentPrice > 0)
            ? Math.round(finalCurrentPrice * 100) / 100
            : (lastPoint?.price ?? 0);
        if (todayPrice > 0 && Number.isFinite(todayPrice)) {
            const todayFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            // Only add if the last point isn't already from today
            if (!lastPoint || now.getTime() - lastPoint.timestamp > 24 * 60 * 60 * 1000) {
                history.push({
                    date: now.toLocaleDateString('en-GB', todayFormat),
                    timestamp: now.getTime(),
                    price: todayPrice,
                });
            }
        }

        // Sample data for chart performance, always preserving min/max price points
        const maxPoints = Math.min(120, Math.max(60, Math.floor(historyDays / 15)));
        let sampledHistory = history;
        if (history.length > maxPoints) {
            const step = Math.ceil(history.length / maxPoints);
            // Find indices of the actual min and max price points
            let minIdx = 0, maxIdx = 0;
            for (let i = 1; i < history.length; i++) {
                if (history[i].price < history[minIdx].price) minIdx = i;
                if (history[i].price > history[maxIdx].price) maxIdx = i;
            }
            sampledHistory = history.filter((_, index) => index % step === 0 || index === minIdx || index === maxIdx);
            if (sampledHistory[sampledHistory.length - 1] !== history[history.length - 1]) {
                sampledHistory.push(history[history.length - 1]);
            }
        }

        if (sampledHistory.length > 0) {
            priceHistory = {
                history: sampledHistory,
                currentPrice: Math.round(finalCurrentPrice * 100) / 100,
                averagePrice,
                allTimeLow: allTimeLow === Infinity ? (currentPrice || averagePrice) : Math.round(allTimeLow * 100) / 100,
                allTimeHigh: allTimeHigh === 0 ? currentPrice : Math.round(allTimeHigh * 100) / 100,
                lowestDate,
                highestDate,
            };
        }
    }

    // Only cache products with valid prices (avoid caching £0.00 products)
    if (product.currentPrice > 0) {
        writeProductCache(asin, {
            product,
            priceHistory,
            timestamp: Date.now(),
        });
    }

    return {
        product,
        priceHistory,
        tokensLeft: data.tokensLeft,
        fromCache: false,
    };
}

/**
 * Get price history for a product
 * Token cost: 1-2 per ASIN (with history=1)
 *
 * @param asin - Amazon product ASIN
 * @param days - Number of days of history to return (default 90)
 */
export async function getPriceHistory(
    asin: string,
    days: number = 90,
    options: { userFacing?: boolean } = {}
): Promise<{ data: PriceHistoryData | null; tokensLeft: number }> {
    if (!KEEPA_API_KEY) {
        throw new Error('KEEPA_API_KEY is not configured');
    }

    // Budget check — price history costs 2 tokens
    consumeTokenBudget(2, options.userFacing ?? false);
    recordTokenUsage('getPriceHistory', 2);

const params = new URLSearchParams({
        key: KEEPA_API_KEY,
        domain: AMAZON_DOMAIN_UK.toString(),
        asin: asin,
        stats: '365', // Get stats for the full year
        history: '1', // Include price history CSV
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

    const apiData: KeepaProductResponse = await response.json();

    if (!apiData.products || apiData.products.length === 0) {
        return { data: null, tokensLeft: apiData.tokensLeft };
    }

    const product = apiData.products[0];
    const csv = product.csv;

    // Try multiple CSV price sources, picking the first with meaningful data
    const csvCandidates = [
        csv?.[CSV_PRICE_INDICES.AMAZON],
        csv?.[CSV_PRICE_INDICES.BUY_BOX],
        csv?.[CSV_PRICE_INDICES.NEW],
        csv?.[CSV_PRICE_INDICES.NEW_FBA],
    ];
    const priceCSVData = csvCandidates.find(arr => arr && arr.length >= 4) ?? null;

    if (!priceCSVData) {
        // No price history available
        return { data: null, tokensLeft: apiData.tokensLeft };
    }

    // Parse price history
    // CSV format: [time1, price1, time2, price2, ...]
    const amazonPrices = priceCSVData;
    const history: PriceHistoryPoint[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let allTimeLow = Infinity;
    let allTimeHigh = 0;
    let lowestDate = '';
    let highestDate = '';
    let priceSum = 0;
    let priceCount = 0;

    // Ensure even number of elements (pairs of [time, price])
    const priceLen = amazonPrices.length - (amazonPrices.length % 2);
    for (let i = 0; i < priceLen; i += 2) {
        const keepaTime = amazonPrices[i];
        const priceCents = amazonPrices[i + 1];

        // Skip invalid prices (-1 means out of stock)
        if (priceCents <= 0) continue;

        const date = keepaTimeToDate(keepaTime);
        const price = keepaPriceToPounds(priceCents);

        // Skip invalid prices or dates
        if (!Number.isFinite(price) || price <= 0) continue;
        if (isNaN(date.getTime())) continue;

        // Track all-time stats (regardless of date filter)
        if (price < allTimeLow) {
            allTimeLow = price;
            lowestDate = date.toISOString().split('T')[0];
        }
        if (price > allTimeHigh) {
            allTimeHigh = price;
            highestDate = date.toISOString().split('T')[0];
        }
        priceSum += price;
        priceCount++;

        // Only include points within the requested date range
        if (date >= cutoffDate) {
            // Format date - include year if older than current year
            const now = new Date();
            const isOlderThanThisYear = date.getFullYear() < now.getFullYear();
            const dateFormat: Intl.DateTimeFormatOptions = isOlderThanThisYear
                ? { month: 'short', day: 'numeric', year: '2-digit' }
                : { month: 'short', day: 'numeric' };

            history.push({
                date: date.toLocaleDateString('en-GB', dateFormat),
                timestamp: date.getTime(),
                price: Math.round(price * 100) / 100,
            });
        }
    }

    // Get current price from stats - try multiple sources
    const currentPriceCents =
        product.stats?.current?.[CSV_PRICE_INDICES.AMAZON] ??
        product.stats?.current?.[CSV_PRICE_INDICES.BUY_BOX] ??
        product.stats?.current?.[CSV_PRICE_INDICES.LIGHTNING] ??
        product.stats?.current?.[CSV_PRICE_INDICES.NEW_FBA] ??
        product.stats?.current?.[CSV_PRICE_INDICES.NEW] ??
        -1;
    const currentPrice = currentPriceCents > 0 ? keepaPriceToPounds(currentPriceCents) : 0;

    // Calculate average price
    const averagePrice = priceCount > 0 ? Math.round((priceSum / priceCount) * 100) / 100 : currentPrice;

    // Sort history by timestamp
    history.sort((a, b) => a.timestamp - b.timestamp);

    // Append today's price so the chart extends to the current date
    const now = new Date();
    const lastPoint = history[history.length - 1];
    const todayPrice = (Number.isFinite(currentPrice) && currentPrice > 0)
        ? Math.round(currentPrice * 100) / 100
        : (lastPoint?.price ?? 0);
    if (todayPrice > 0 && Number.isFinite(todayPrice)) {
        const todayFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        if (!lastPoint || now.getTime() - lastPoint.timestamp > 24 * 60 * 60 * 1000) {
            history.push({
                date: now.toLocaleDateString('en-GB', todayFormat),
                timestamp: now.getTime(),
                price: todayPrice,
            });
        }
    }

    // Sample the data if there are too many points (for chart performance)
    // Use more points for longer histories to maintain detail
    const maxPoints = Math.min(120, Math.max(60, Math.floor(days / 15)));
    let sampledHistory = history;
    if (history.length > maxPoints) {
        const step = Math.ceil(history.length / maxPoints);
        // Find indices of the actual min and max price points
        let minIdx = 0, maxIdx = 0;
        for (let i = 1; i < history.length; i++) {
            if (history[i].price < history[minIdx].price) minIdx = i;
            if (history[i].price > history[maxIdx].price) maxIdx = i;
        }
        sampledHistory = history.filter((_, index) => index % step === 0 || index === minIdx || index === maxIdx);
        // Always include the last point
        if (sampledHistory[sampledHistory.length - 1] !== history[history.length - 1]) {
            sampledHistory.push(history[history.length - 1]);
        }
    }

    return {
        data: {
            history: sampledHistory,
            currentPrice: Math.round(currentPrice * 100) / 100,
            averagePrice,
            allTimeLow: allTimeLow === Infinity ? (currentPrice || averagePrice) : Math.round(allTimeLow * 100) / 100,
            allTimeHigh: allTimeHigh === 0 ? currentPrice : Math.round(allTimeHigh * 100) / 100,
            lowestDate,
            highestDate,
        },
        tokensLeft: apiData.tokensLeft,
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
