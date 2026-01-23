/**
 * Amazon Product Advertising API Client
 * 
 * To use this, you need:
 * 1. An Amazon Associates account (UK)
 * 2. API credentials from Amazon Associates
 * 
 * Sign up at: https://affiliate-program.amazon.co.uk/
 * 
 * Note: Amazon PA API has usage limits based on your sales performance.
 * New affiliates get limited access until they generate sales.
 */

import crypto from "crypto";

const AMAZON_API_HOST = "webservices.amazon.co.uk";
const AMAZON_REGION = "eu-west-1";

export interface AmazonProduct {
    asin: string;
    title: string;
    description: string;
    price: number | null;
    originalPrice: number | null;
    currency: string;
    imageUrl: string;
    productUrl: string;
    affiliateUrl: string;
    inStock: boolean;
    category: string;
    brand: string;
    rating: number | null;
    reviewCount: number;
}

export interface AmazonSearchParams {
    keywords: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "Price:LowToHigh" | "Price:HighToLow" | "AvgCustomerReviews" | "Relevance";
    itemPage?: number;
}

class AmazonPAClient {
    private accessKey: string | null = null;
    private secretKey: string | null = null;
    private partnerTag: string | null = null;

    constructor() {
        this.accessKey = process.env.AMAZON_ACCESS_KEY || null;
        this.secretKey = process.env.AMAZON_SECRET_KEY || null;
        this.partnerTag = process.env.AMAZON_PARTNER_TAG || null;
    }

    isConfigured(): boolean {
        return !!(this.accessKey && this.secretKey && this.partnerTag);
    }

    /**
     * Search for products on Amazon UK
     */
    async searchProducts(params: AmazonSearchParams): Promise<AmazonProduct[]> {
        if (!this.isConfigured()) {
            console.log("📦 [DEV] Amazon PA API not configured - returning empty results");
            return [];
        }

        const payload = {
            Keywords: params.keywords,
            Resources: [
                "ItemInfo.Title",
                "ItemInfo.Features",
                "Offers.Listings.Price",
                "Offers.Listings.SavingBasis",
                "Images.Primary.Large",
                "BrowseNodeInfo.BrowseNodes",
            ],
            ItemCount: 10,
            ItemPage: params.itemPage || 1,
            PartnerTag: this.partnerTag,
            PartnerType: "Associates",
            Marketplace: "www.amazon.co.uk",
        };

        if (params.category) {
            Object.assign(payload, { SearchIndex: params.category });
        }

        if (params.minPrice || params.maxPrice) {
            Object.assign(payload, {
                MinPrice: params.minPrice ? Math.round(params.minPrice * 100) : undefined,
                MaxPrice: params.maxPrice ? Math.round(params.maxPrice * 100) : undefined,
            });
        }

        if (params.sortBy) {
            Object.assign(payload, { SortBy: params.sortBy });
        }

        try {
            const response = await this.signedRequest("SearchItems", payload);
            return this.transformSearchResults(response);
        } catch (error) {
            console.error("Amazon PA API error:", error);
            return [];
        }
    }

    /**
     * Get product details by ASIN
     */
    async getProduct(asin: string): Promise<AmazonProduct | null> {
        if (!this.isConfigured()) {
            console.log("📦 [DEV] Amazon PA API not configured");
            return null;
        }

        const payload = {
            ItemIds: [asin],
            Resources: [
                "ItemInfo.Title",
                "ItemInfo.Features",
                "ItemInfo.ByLineInfo",
                "Offers.Listings.Price",
                "Offers.Listings.SavingBasis",
                "Offers.Listings.Availability.Type",
                "Images.Primary.Large",
                "BrowseNodeInfo.BrowseNodes",
                "CustomerReviews.StarRating",
                "CustomerReviews.Count",
            ],
            PartnerTag: this.partnerTag,
            PartnerType: "Associates",
            Marketplace: "www.amazon.co.uk",
        };

        try {
            const response = await this.signedRequest("GetItems", payload);
            const products = this.transformSearchResults(response);
            return products[0] || null;
        } catch (error) {
            console.error("Amazon PA API error:", error);
            return null;
        }
    }

    /**
     * Generate Amazon affiliate link
     */
    generateAffiliateLink(asin: string): string {
        if (!this.partnerTag) {
            return `https://www.amazon.co.uk/dp/${asin}`;
        }
        return `https://www.amazon.co.uk/dp/${asin}?tag=${this.partnerTag}`;
    }

    private async signedRequest(operation: string, payload: object): Promise<any> {
        const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
        const date = timestamp.slice(0, 10).replace(/-/g, "");

        const headers: Record<string, string> = {
            "content-type": "application/json; charset=UTF-8",
            "host": AMAZON_API_HOST,
            "x-amz-date": timestamp,
            "x-amz-target": `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
        };

        const body = JSON.stringify(payload);

        // Create signature (AWS Signature Version 4)
        const signature = this.createSignature(
            "POST",
            "/paapi5/searchitems",
            headers,
            body,
            timestamp,
            date
        );

        headers["Authorization"] = signature;

        const response = await fetch(`https://${AMAZON_API_HOST}/paapi5/searchitems`, {
            method: "POST",
            headers,
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Amazon API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    private createSignature(
        method: string,
        path: string,
        headers: Record<string, string>,
        body: string,
        timestamp: string,
        date: string
    ): string {
        const algorithm = "AWS4-HMAC-SHA256";
        const service = "ProductAdvertisingAPI";
        const scope = `${date}/${AMAZON_REGION}/${service}/aws4_request`;

        // Create canonical request
        const signedHeaders = Object.keys(headers).sort().join(";").toLowerCase();
        const canonicalHeaders = Object.entries(headers)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k.toLowerCase()}:${v}`)
            .join("\n") + "\n";

        const hashedPayload = crypto.createHash("sha256").update(body).digest("hex");
        const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, hashedPayload].join("\n");

        // Create string to sign
        const hashedCanonicalRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex");
        const stringToSign = [algorithm, timestamp, scope, hashedCanonicalRequest].join("\n");

        // Create signing key
        const kDate = crypto.createHmac("sha256", `AWS4${this.secretKey}`).update(date).digest();
        const kRegion = crypto.createHmac("sha256", kDate).update(AMAZON_REGION).digest();
        const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
        const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

        // Create signature
        const signatureValue = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

        return `${algorithm} Credential=${this.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signatureValue}`;
    }

    private transformSearchResults(response: any): AmazonProduct[] {
        const items = response?.SearchResult?.Items || response?.ItemsResult?.Items || [];

        return items.map((item: any): AmazonProduct => {
            const listing = item.Offers?.Listings?.[0];
            const price = listing?.Price?.Amount;
            const originalPrice = listing?.SavingBasis?.Amount;

            return {
                asin: item.ASIN,
                title: item.ItemInfo?.Title?.DisplayValue || "",
                description: item.ItemInfo?.Features?.DisplayValues?.join(" ") || "",
                price: price || null,
                originalPrice: originalPrice || null,
                currency: "GBP",
                imageUrl: item.Images?.Primary?.Large?.URL || "",
                productUrl: item.DetailPageURL,
                affiliateUrl: this.generateAffiliateLink(item.ASIN),
                inStock: listing?.Availability?.Type === "Now",
                category: item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || "",
                brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "",
                rating: item.CustomerReviews?.StarRating?.Value || null,
                reviewCount: item.CustomerReviews?.Count || 0,
            };
        });
    }
}

// Singleton instance
export const amazonClient = new AmazonPAClient();
