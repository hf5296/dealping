"use client";

import { useState, useCallback, useMemo } from "react";
import ProductCard from "@/components/ProductCard";

interface Product {
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
    rating?: number;
}

interface SearchResultsClientProps {
    initialProducts: Product[];
    query: string;
    initialHasMore: boolean;
}

type SortOption = "relevance" | "percentOff" | "price-low" | "price-high";

const MAX_PAGES = 10; // Max 100 results (10 per page)
const RATE_LIMIT_MS = 2000; // 2 seconds between requests

export default function SearchResultsClient({
    initialProducts,
    query,
    initialHasMore,
}: SearchResultsClientProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState(0);
    const [rateLimitError, setRateLimitError] = useState(false);

    // Filtering and sorting state
    const [sortBy, setSortBy] = useState<SortOption>("relevance");
    const [minDiscount, setMinDiscount] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);

    // Filter and sort products client-side
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Apply filters
        if (minDiscount > 0) {
            result = result.filter((p) => p.percentOff >= minDiscount);
        }
        if (maxPrice > 0) {
            result = result.filter((p) => p.currentPrice <= maxPrice);
        }

        // Apply sorting (relevance keeps original order)
        if (sortBy !== "relevance") {
            switch (sortBy) {
                case "percentOff":
                    result.sort((a, b) => b.percentOff - a.percentOff);
                    break;
                case "price-low":
                    result.sort((a, b) => a.currentPrice - b.currentPrice);
                    break;
                case "price-high":
                    result.sort((a, b) => b.currentPrice - a.currentPrice);
                    break;
            }
        }

        return result;
    }, [products, sortBy, minDiscount, maxPrice]);

    const clearFilters = () => {
        setMinDiscount(0);
        setMaxPrice(0);
        setSortBy("relevance");
    };

    const hasActiveFilters = minDiscount > 0 || maxPrice > 0;

    const loadMore = useCallback(async () => {
        // Check rate limit
        const now = Date.now();
        if (now - lastRequestTime < RATE_LIMIT_MS) {
            setRateLimitError(true);
            setTimeout(() => setRateLimitError(false), 2000);
            return;
        }

        // Check max pages
        if (page >= MAX_PAGES - 1) {
            setHasMore(false);
            return;
        }

        setLoading(true);
        setRateLimitError(false);
        setLastRequestTime(now);

        try {
            const nextPage = page + 1;
            const response = await fetch(
                `/api/keepa/search?q=${encodeURIComponent(query)}&page=${nextPage}`
            );

            if (!response.ok) {
                throw new Error('Failed to load more results');
            }

            const data = await response.json();

            if (data.products && data.products.length > 0) {
                setProducts(prev => [...prev, ...data.products]);
                setPage(nextPage);
                setHasMore(data.products.length >= 10 && nextPage < MAX_PAGES - 1);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more:', error);
        } finally {
            setLoading(false);
        }
    }, [page, query, lastRequestTime]);

    if (products.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    No deals found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    We couldn&apos;t find any deals matching &quot;{query}&quot;. Try a different search term.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                {/* Results count */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredProducts.length === products.length
                        ? `${products.length} results`
                        : `${filteredProducts.length} of ${products.length} results`}
                </span>

                <div className="flex-1" />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Min Discount Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Min discount:</label>
                        <select
                            value={minDiscount}
                            onChange={(e) => setMinDiscount(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value={0}>Any</option>
                            <option value={15}>15%+</option>
                            <option value={25}>25%+</option>
                            <option value={40}>40%+</option>
                            <option value={50}>50%+</option>
                        </select>
                    </div>

                    {/* Max Price Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Max price:</label>
                        <select
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value={0}>Any</option>
                            <option value={25}>Under £25</option>
                            <option value={50}>Under £50</option>
                            <option value={100}>Under £100</option>
                            <option value={200}>Under £200</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Sort:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="relevance">Relevance</option>
                            <option value="percentOff">Biggest Discount</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProducts.map((product, index) => (
                        <ProductCard
                            key={`${product.id}-${index}`}
                            id={product.id}
                            name={product.name}
                            imageUrl={product.imageUrl}
                            currentPrice={product.currentPrice}
                            originalPrice={product.originalPrice}
                            retailer={product.retailer}
                            dealScore={product.dealScore}
                            percentOff={product.percentOff}
                            affiliateUrl={product.affiliateUrl}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        No results match your filters
                    </h3>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                        Try adjusting your filters to see more results.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Load more section */}
            <div className="mt-8 flex flex-col items-center gap-2">
                {rateLimitError && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        Please wait a moment before loading more results
                    </p>
                )}

                {hasMore && (
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </button>
                )}

                {!hasMore && products.length > 0 && filteredProducts.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing all {products.length} results
                    </p>
                )}

                {page >= MAX_PAGES - 1 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Maximum results reached. Try a more specific search.
                    </p>
                )}
            </div>
        </div>
    );
}
