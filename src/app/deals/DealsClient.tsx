"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { DealPingProduct } from "@/lib/keepa";

const LOAD_MORE_INCREMENT = 48; // 12 rows of 4 columns

const CATEGORY_OPTIONS = [
    { slug: "", label: "All Categories" },
    { slug: "electronics", label: "Electronics" },
    { slug: "gaming", label: "Gaming" },
    { slug: "home-garden", label: "Home & Garden" },
    { slug: "health-beauty", label: "Health & Beauty" },
    { slug: "groceries", label: "Groceries" },
    { slug: "stationery", label: "Stationery" },
    { slug: "baby-kids", label: "Baby & Kids" },
    { slug: "food-drink", label: "Food & Drink" },
];

interface DealsClientProps {
    initialDeals: DealPingProduct[];
}

type SortOption = "percentOff" | "price-low" | "price-high";

export default function DealsClient({ initialDeals }: DealsClientProps) {
    const [allDeals, setAllDeals] = useState<DealPingProduct[]>(initialDeals);
    // Applied filters (used for actual filtering)
    const [sortBy, setSortBy] = useState<SortOption>("percentOff");
    const [minDiscount, setMinDiscount] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    // Pending filters (user selections before clicking Apply)
    const [pendingSortBy, setPendingSortBy] = useState<SortOption>("percentOff");
    const [pendingMinDiscount, setPendingMinDiscount] = useState<number>(0);
    const [pendingMaxPrice, setPendingMaxPrice] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const hasPendingChanges = pendingSortBy !== sortBy || pendingMinDiscount !== minDiscount || pendingMaxPrice !== maxPrice;
    const [visibleCount, setVisibleCount] = useState(LOAD_MORE_INCREMENT);
    const [apiPage, setApiPage] = useState(0);
    const [apiHasMore, setApiHasMore] = useState(initialDeals.length >= 50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter and sort deals
    const filteredDeals = useMemo(() => {
        let result = [...allDeals];

        if (minDiscount > 0) {
            result = result.filter((d) => d.percentOff >= minDiscount);
        }
        if (maxPrice > 0) {
            result = result.filter((d) => d.currentPrice <= maxPrice);
        }

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

        return result;
    }, [allDeals, sortBy, minDiscount, maxPrice]);

    const visibleDeals = filteredDeals.slice(0, visibleCount);
    const hasMoreLocal = visibleCount < filteredDeals.length;
    const canFetchMore = apiHasMore && !isLoadingMore;

    // Handle category change - fetch new data from API
    const handleCategoryChange = useCallback(async (slug: string) => {
        setSelectedCategory(slug);
        setVisibleCount(LOAD_MORE_INCREMENT);
        setApiPage(0);
        setApiHasMore(true);

        if (!slug) {
            // Back to "All" — use initial data
            setAllDeals(initialDeals);
            setApiHasMore(initialDeals.length >= 50);
            return;
        }

        setIsCategoryLoading(true);
        try {
            const response = await fetch(`/api/deals?category=${slug}&limit=150`);
            if (response.ok) {
                const data = await response.json();
                setAllDeals(data.deals || []);
                setApiHasMore(data.hasMore ?? false);
            }
        } catch (error) {
            console.error("Error fetching category deals:", error);
        } finally {
            setIsCategoryLoading(false);
        }
    }, [initialDeals]);

    // Fetch the next API page when all local data has been revealed
    const fetchNextPage = useCallback(async () => {
        if (isLoadingMore || !apiHasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = apiPage + 1;
            const categoryParam = selectedCategory ? `&category=${selectedCategory}` : "";
            const response = await fetch(`/api/deals?page=${nextPage}&limit=150${categoryParam}`);

            if (!response.ok) throw new Error("Failed to load more deals");

            const data = await response.json();

            if (data.deals && data.deals.length > 0) {
                const existingAsins = new Set(allDeals.map((d) => d.asin));
                const newDeals = data.deals.filter(
                    (d: DealPingProduct) => !existingAsins.has(d.asin)
                );
                if (newDeals.length > 0) {
                    setAllDeals((prev) => [...prev, ...newDeals]);
                    setVisibleCount((prev) => prev + LOAD_MORE_INCREMENT);
                }
                setApiPage(nextPage);
                setApiHasMore(data.hasMore ?? data.deals.length >= 50);
            } else {
                setApiHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more deals:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [apiPage, isLoadingMore, apiHasMore, allDeals, selectedCategory]);

    // Reset visible count when filter/sort changes
    useEffect(() => {
        setVisibleCount(LOAD_MORE_INCREMENT);
        setIsLoadingMore(false);
    }, [sortBy, minDiscount, maxPrice]);

    const loadMoreLocal = () => {
        setVisibleCount((prev) => prev + LOAD_MORE_INCREMENT);
    };

    const clearFilters = () => {
        setMinDiscount(0);
        setMaxPrice(0);
        setSortBy("percentOff");
        setPendingMinDiscount(0);
        setPendingMaxPrice(0);
        setPendingSortBy("percentOff");
        if (selectedCategory) {
            handleCategoryChange("");
        }
    };

    const hasActiveFilters = minDiscount > 0 || maxPrice > 0 || selectedCategory !== "";

    return (
        <>
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                {/* Deal count */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Showing {visibleDeals.length} of{" "}
                    {filteredDeals.length === allDeals.length
                        ? `${allDeals.length} deals`
                        : `${filteredDeals.length} deals (filtered from ${allDeals.length})`}
                </span>

                <div className="flex-1" />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="category" className="text-sm text-gray-500">Category:</label>
                        <select
                            id="category"
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            disabled={isCategoryLoading}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat.slug} value={cat.slug}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Min Discount Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="minDiscount" className="text-sm text-gray-500">Min discount:</label>
                        <select
                            id="minDiscount"
                            value={pendingMinDiscount}
                            onChange={(e) => setPendingMinDiscount(Number(e.target.value))}
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
                            value={pendingMaxPrice}
                            onChange={(e) => setPendingMaxPrice(Number(e.target.value))}
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
                            value={pendingSortBy}
                            onChange={(e) => setPendingSortBy(e.target.value as SortOption)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="percentOff">Biggest Discount</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={() => {
                            setSortBy(pendingSortBy);
                            setMinDiscount(pendingMinDiscount);
                            setMaxPrice(pendingMaxPrice);
                        }}
                        disabled={!hasPendingChanges}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                            hasPendingChanges
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                        }`}
                    >
                        Apply
                    </button>

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
            {isCategoryLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={`cat-skeleton-${i}`} />
                    ))}
                </div>
            ) : visibleDeals.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleDeals.map((deal, index) => (
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
                            createdAt={deal.createdAt}
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

            {/* Skeleton loading row (API fetch) */}
            {isLoadingMore && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {/* Load More button */}
            {(hasMoreLocal || canFetchMore) && visibleDeals.length > 0 && !isLoadingMore && (
                <div className="mt-8 text-center">
                    <button
                        onClick={hasMoreLocal ? loadMoreLocal : fetchNextPage}
                        className="rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                    >
                        Load More Deals
                    </button>
                </div>
            )}

            {/* End of results */}
            {filteredDeals.length > 0 && !hasMoreLocal && !apiHasMore && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        All {filteredDeals.length} deals shown
                    </p>
                </div>
            )}
        </>
    );
}
