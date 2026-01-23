// Category type
export interface Category {
    id: string;
    name: string;
    icon: string;
    slug: string;
    productCount: number;
    color: string;
}

// Retailer type
export interface Retailer {
    id: string;
    name: string;
    logo: string;
    affiliateNetwork: string;
}

// Price record
export interface PriceRecord {
    id: string;
    retailer: Retailer;
    price: number;
    originalPrice?: number;
    url: string;
    affiliateUrl: string;
    inStock: boolean;
    lastChecked: Date;
}

// Deal score enum
export type DealScore = 'good' | 'average' | 'bad';

// Product type
export interface Product {
    id: string;
    name: string;
    description: string;
    category: Category;
    imageUrl: string;
    currentLowestPrice: number;
    averagePrice: number;
    allTimeLow: number;
    allTimeHigh: number;
    dealScore: DealScore;
    prices: PriceRecord[];
    priceHistory: {
        date: Date;
        price: number;
        retailer: string;
    }[];
}

// User alert type
export interface PriceAlert {
    id: string;
    userId: string;
    productId: string;
    targetPrice?: number;
    alertOnAnyDrop: boolean;
    notifyEmail: boolean;
    notifyPush: boolean;
    createdAt: Date;
}

// Search result type
export interface SearchResult {
    products: Product[];
    totalCount: number;
    page: number;
    pageSize: number;
}
