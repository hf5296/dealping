/**
 * Unified Affiliate Service
 * 
 * Provides a single interface for:
 * - Searching products across multiple affiliate networks
 * - Generating affiliate links for any supported retailer
 * - Syncing prices from affiliate feeds
 */

import { awinClient, AWIN_MERCHANT_IDS, type AwinProduct } from "./awin";
import { amazonClient, type AmazonProduct } from "./amazon";
import { prisma } from "@/lib/prisma";

export interface UnifiedProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    currency: string;
    retailer: string;
    retailerSlug: string;
    imageUrl: string;
    productUrl: string;
    affiliateUrl: string;
    inStock: boolean;
    source: "awin" | "amazon";
}

export interface SearchOptions {
    keyword: string;
    retailers?: string[];
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
}

/**
 * Search products across all configured affiliate networks
 */
export async function searchAffiliateProducts(options: SearchOptions): Promise<UnifiedProduct[]> {
    const results: UnifiedProduct[] = [];
    const limit = options.limit || 20;

    // Search Amazon if configured
    if (amazonClient.isConfigured()) {
        try {
            const amazonProducts = await amazonClient.searchProducts({
                keywords: options.keyword,
                minPrice: options.minPrice,
                maxPrice: options.maxPrice,
            });

            results.push(...amazonProducts.map((p) => transformAmazonProduct(p)));
        } catch (error) {
            console.error("Amazon search error:", error);
        }
    }

    // Search Awin if configured
    if (awinClient.isConfigured()) {
        try {
            const awinResult = await awinClient.searchProducts({
                keyword: options.keyword,
                minPrice: options.minPrice,
                maxPrice: options.maxPrice,
                limit,
            });

            results.push(...awinResult.products.map((p) => transformAwinProduct(p)));
        } catch (error) {
            console.error("Awin search error:", error);
        }
    }

    // If no APIs configured, log for development
    if (!amazonClient.isConfigured() && !awinClient.isConfigured()) {
        console.log("📦 [DEV] No affiliate APIs configured. Set environment variables to enable.");
    }

    return results.slice(0, limit);
}

/**
 * Generate an affiliate link for a given retailer and product URL
 */
export function generateAffiliateUrl(retailerSlug: string, productUrl: string): string {
    // Amazon
    if (retailerSlug === "amazon-uk" && productUrl.includes("amazon.co.uk")) {
        const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})/i);
        if (asinMatch) {
            return amazonClient.generateAffiliateLink(asinMatch[1]);
        }
    }

    // Awin retailers
    const awinMerchantId = AWIN_MERCHANT_IDS[retailerSlug as keyof typeof AWIN_MERCHANT_IDS];
    if (awinMerchantId && awinClient.isConfigured()) {
        return awinClient.generateAffiliateLink(productUrl, awinMerchantId);
    }

    // Return original URL if no affiliate network configured
    return productUrl;
}

/**
 * Sync prices from affiliate networks into the database
 * This would typically be run as a scheduled job
 */
export async function syncPricesFromAffiliates(): Promise<{
    updated: number;
    errors: string[];
}> {
    const result = { updated: 0, errors: [] as string[] };

    // Get all products that need price updates
    const products = await prisma.product.findMany({
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
                take: 1,
                include: { retailer: true },
            },
        },
    });

    console.log(`📦 Syncing prices for ${products.length} products...`);

    for (const product of products) {
        try {
            // Search for product in affiliate networks
            const affiliateProducts = await searchAffiliateProducts({
                keyword: product.name,
                limit: 10,
            });

            // Match and update prices
            for (const ap of affiliateProducts) {
                // Find matching retailer
                const retailer = await prisma.retailer.findUnique({
                    where: { slug: ap.retailerSlug },
                });

                if (retailer) {
                    // Create new price record
                    await prisma.priceRecord.create({
                        data: {
                            productId: product.id,
                            retailerId: retailer.id,
                            price: ap.price,
                            originalPrice: ap.originalPrice,
                            url: ap.productUrl,
                            affiliateUrl: ap.affiliateUrl,
                            inStock: ap.inStock,
                        },
                    });

                    result.updated++;
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            result.errors.push(`${product.name}: ${errorMsg}`);
        }
    }

    console.log(`✅ Synced ${result.updated} prices. Errors: ${result.errors.length}`);
    return result;
}

function transformAmazonProduct(p: AmazonProduct): UnifiedProduct {
    return {
        id: `amazon-${p.asin}`,
        name: p.title,
        description: p.description,
        price: p.price || 0,
        originalPrice: p.originalPrice || undefined,
        currency: p.currency,
        retailer: "Amazon UK",
        retailerSlug: "amazon-uk",
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        affiliateUrl: p.affiliateUrl,
        inStock: p.inStock,
        source: "amazon",
    };
}

function transformAwinProduct(p: AwinProduct): UnifiedProduct {
    const retailerSlug = getRetailerSlug(p.merchantName);

    return {
        id: `awin-${p.id}`,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.rrp,
        currency: p.currency,
        retailer: p.merchantName,
        retailerSlug,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        affiliateUrl: p.affiliateUrl,
        inStock: p.inStock,
        source: "awin",
    };
}

function getRetailerSlug(merchantName: string): string {
    const name = merchantName.toLowerCase();

    if (name.includes("currys")) return "currys";
    if (name.includes("argos")) return "argos";
    if (name.includes("john lewis")) return "john-lewis";
    if (name.includes("ao")) return "ao-com";
    if (name.includes("very")) return "very";
    if (name.includes("tesco")) return "tesco";
    if (name.includes("sainsbury")) return "sainsburys";
    if (name.includes("asda")) return "asda";
    if (name.includes("ebay")) return "ebay-uk";

    return merchantName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
