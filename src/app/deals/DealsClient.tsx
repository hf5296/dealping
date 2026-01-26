"use client";

import { useState, useMemo, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { DealPingProduct } from "@/lib/keepa";

interface DealsClientProps {
    initialDeals: DealPingProduct[];
}

type SortOption = "percentOff" | "price-low" | "price-high" | "rating";

export default function DealsClient({ initialDeals }: DealsClientProps) {
    const [deals, setDeals] = useState<DealPingProduct[]>(initialDeals);
    const [sortBy, setSortBy] = useState<SortOption>("percentOff");
    const [minDiscount, setMinDiscount] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no limit
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialDeals.length >= 50);

    // Filter and sort deals
    const filteredDeals = useMemo(() => {
        let result = [...deals];

        // Apply filters
        if (minDiscount > 0) {
            result = result.filter((d) => d.percentOff >= minDiscount);
        }
        if (maxPrice > 0) {
            result = result.filter((d) => d.currentPrice <= maxPrice);
        }

        // Apply sorting
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
            case "rating":
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }

        return result;
    }, [deals, sortBy, minDiscount, maxPrice]);

    const loadMore = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const response = await fetch(`/api/deals?page=${nextPage}&limit=50`);

            if (!response.ok) {
                throw new Error("Failed to load more deals");
            }

            const data = await response.json();

            if (data.deals && data.deals.length > 0) {
                setDeals((prev) => [...prev, ...data.deals]);
                setPage(nextPage);
                setHasMore(data.hasMore ?? data.deals.length >= 50);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more deals:", error);
        } finally {
            setLoading(false);
        }
    }, [page, loading]);

    const clearFilters = () => {
        setMinDiscount(0);
        setMaxPrice(0);
        setSortBy("percentOff");
    };

    const hasActiveFilters = minDiscount > 0 || maxPrice > 0;

    return (
        <>
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                {/* Deal count */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredDeals.length === deals.length
                        ? `${deals.length} deals`
                        : `${filteredDeals.length} of ${deals.length} deals`}
                </span>

                <div className="flex-1" />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Min Discount Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="minDiscount" className="text-sm text-gray-500">Min discount:</label>
                        <select
                            id="minDiscount"
                            value={minDiscount}
                            onChange={(e) => setMinDiscount(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value={0}>Any</option>
                            <option value={20}>20%+</option>
                            <option value={30}>30%+</option>
                            <option value={40}>40%+</option>
                            <option value={50}>50%+</option>
                        </select>
                    </div>

                    {/* Max Price Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="maxPrice" className="text-sm text-gray-500">Max price:</label>
                        <select
                            id="maxPrice"
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
                        <label htmlFor="sortBy" className="text-sm text-gray-500">Sort:</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="percentOff">Biggest Discount</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
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

            {/* Deals Grid */}
            {filteredDeals.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredDeals.map((deal, index) => (
                        <ProductCard
                            key={`${deal.id}-${index}`}
                            id={deal.id}
                            name={deal.name}
                            imageUrl={deal.imageUrl}
                            currentPrice={deal.currentPrice}
                            originalPrice={deal.originalPrice}
                            retailer={deal.retailer}
                            dealScore={deal.dealScore}
                            percentOff={deal.percentOff}
                            affiliateUrl={deal.affiliateUrl}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl bg-white p-12 text-center dark:bg-gray-800">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <svg
                            className="h-8 w-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        No deals match your filters
                    </h3>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                        Try adjusting your filters to see more deals.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Load more button */}
            {hasMore && filteredDeals.length > 0 && !hasActiveFilters && (
                <div className="mt-8 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Loading...
                            </>
                        ) : (
                            "Load More Deals"
                        )}
                    </button>
                </div>
            )}

            {/* Info section */}
            {deals.length > 0 && !hasMore && !hasActiveFilters && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        All {deals.length} deals loaded
                    </p>
                </div>
            )}
        </>
    );
}
