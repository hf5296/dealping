/**
 * Awin Affiliate Network API Client
 * 
 * Awin provides API access to many UK retailers including:
 * - Currys
 * - Argos
 * - John Lewis
 * - AO.com
 * - Very
 * - Tesco
 * - Sainsbury's
 * - And many more
 * 
 * To use this, you need:
 * 1. An Awin publisher account (free to join)
 * 2. API token from your Awin dashboard
 * 3. Approved relationships with advertisers
 * 
 * Sign up at: https://www.awin.com/gb/publishers
 */

const AWIN_API_BASE = "https://api.awin.com";

export interface AwinProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    merchantName: string;
    merchantId: number;
    categoryName: string;
    imageUrl: string;
    productUrl: string;
    affiliateUrl: string;
    rrp?: number;  // Recommended retail price (original price)
    inStock: boolean;
    lastUpdated: string;
}

export interface AwinSearchParams {
    keyword?: string;
    merchantId?: number;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    limit?: number;
    offset?: number;
}

export interface AwinSearchResult {
    products: AwinProduct[];
    totalCount: number;
    hasMore: boolean;
}

class AwinClient {
    private apiToken: string | null = null;
    private publisherId: string | null = null;

    constructor() {
        this.apiToken = process.env.AWIN_API_TOKEN || null;
        this.publisherId = process.env.AWIN_PUBLISHER_ID || null;
    }

    isConfigured(): boolean {
        return !!(this.apiToken && this.publisherId);
    }

    private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        if (!this.isConfigured()) {
            throw new Error("Awin API not configured. Set AWIN_API_TOKEN and AWIN_PUBLISHER_ID in .env");
        }

        const url = new URL(`${AWIN_API_BASE}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString(), {
            headers: {
                "Authorization": `Bearer ${this.apiToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Awin API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Search for products across all connected merchants
     */
    async searchProducts(params: AwinSearchParams): Promise<AwinSearchResult> {
        const queryParams: Record<string, string> = {
            publisherId: this.publisherId!,
        };

        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.merchantId) queryParams.advertiserId = String(params.merchantId);
        if (params.categoryId) queryParams.categoryId = String(params.categoryId);
        if (params.minPrice) queryParams.minPrice = String(params.minPrice);
        if (params.maxPrice) queryParams.maxPrice = String(params.maxPrice);
        if (params.inStock !== undefined) queryParams.inStock = params.inStock ? "true" : "false";
        if (params.limit) queryParams.limit = String(params.limit);
        if (params.offset) queryParams.offset = String(params.offset);

        const data = await this.request<{
            products: any[];
            totalCount: number;
        }>("/publishers/v1/products", queryParams);

        return {
            products: data.products.map((p) => this.transformProduct(p)),
            totalCount: data.totalCount,
            hasMore: (params.offset || 0) + (params.limit || 20) < data.totalCount,
        };
    }

    /**
     * Get a specific product by its Awin product ID
     */
    async getProduct(productId: string): Promise<AwinProduct | null> {
        try {
            const data = await this.request<any>(`/publishers/v1/products/${productId}`, {
                publisherId: this.publisherId!,
            });
            return this.transformProduct(data);
        } catch {
            return null;
        }
    }

    /**
     * Get list of connected advertisers (merchants)
     */
    async getAdvertisers(): Promise<{ id: number; name: string; category: string }[]> {
        const data = await this.request<any[]>(`/publishers/${this.publisherId}/programmes`, {});
        return data.map((a) => ({
            id: a.advertiser.id,
            name: a.advertiser.name,
            category: a.advertiser.primarySector,
        }));
    }

    /**
     * Generate an affiliate link for a product URL
     */
    generateAffiliateLink(productUrl: string, advertiserId: number): string {
        if (!this.isConfigured()) {
            return productUrl; // Return original if not configured
        }

        // Awin deep linking format
        const encodedUrl = encodeURIComponent(productUrl);
        return `https://www.awin1.com/cread.php?awinmid=${advertiserId}&awinaffid=${this.publisherId}&ued=${encodedUrl}`;
    }

    private transformProduct(p: any): AwinProduct {
        return {
            id: p.id || p.productId,
            name: p.productName || p.name,
            description: p.description || "",
            price: parseFloat(p.searchPrice || p.price || 0),
            currency: p.currency || "GBP",
            merchantName: p.merchantName || p.advertiserName,
            merchantId: p.merchantId || p.advertiserId,
            categoryName: p.merchantCategory || p.category || "",
            imageUrl: p.merchantImageUrl || p.imageUrl || "",
            productUrl: p.merchantProductUrl || p.productUrl,
            affiliateUrl: p.awi || this.generateAffiliateLink(p.merchantProductUrl || p.productUrl, p.merchantId),
            rrp: p.rrp ? parseFloat(p.rrp) : undefined,
            inStock: p.inStock !== false,
            lastUpdated: p.lastUpdated || new Date().toISOString(),
        };
    }
}

// Singleton instance
export const awinClient = new AwinClient();

// UK Retailer Merchant IDs on Awin (you'll get these from your Awin dashboard)
export const AWIN_MERCHANT_IDS = {
    currys: 1599,      // Example - get real IDs from your Awin dashboard
    argos: 1960,
    johnLewis: 2170,
    aocom: 6041,
    very: 3090,
    // Add more as you join programs
} as const;
