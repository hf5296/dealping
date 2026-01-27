"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { DealPingProduct } from "@/lib/keepa";

const VISIBLE_INCREMENT = 20;

interface DealsClientProps {
    initialDeals: DealPingProduct[];
}

type SortOption = "percentOff" | "price-low" | "price-high" | "rating";

export default function DealsClient({ initialDeals }: DealsClientProps) {
    const [allDeals, setAllDeals] = useState<DealPingProduct[]>(initialDeals);
    const [sortBy, setSortBy] = useState<SortOption>("percentOff");
    const [minDiscount, setMinDiscount] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no limit
    const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);
    const [apiPage, setApiPage] = useState(0);
    const [apiHasMore, setApiHasMore] = useState(initialDeals.length >= 50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

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
            case "rating":
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }

        return result;
    }, [allDeals, sortBy, minDiscount, maxPrice]);

    const visibleDeals = filteredDeals.slice(0, visibleCount);
    const hasMoreLocal = visibleCount < filteredDeals.length;
    const canFetchMore = apiHasMore && !isLoadingMore;

    // Fetch the next API page when all local data has been revealed
    const fetchNextPage = useCallback(async () => {
        if (isLoadingMore || !apiHasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = apiPage + 1;
            const response = await fetch(`/api/deals?page=${nextPage}&limit=150`);

            if (!response.ok) throw new Error("Failed to load more deals");

            const data = await response.json();

            if (data.deals && data.deals.length > 0) {
                const existingAsins = new Set(allDeals.map((d) => d.asin));
                const newDeals = data.deals.filter(
                    (d: DealPingProduct) => !existingAsins.has(d.asin)
                );
                if (newDeals.length > 0) {
                    setAllDeals((prev) => [...prev, ...newDeals]);
                    setVisibleCount((prev) => prev + VISIBLE_INCREMENT);
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
            loadingRef.current = false;
        }
    }, [apiPage, isLoadingMore, apiHasMore, allDeals]);

    // Reveal local data with a delay so skeletons are visible
    const revealLocalBatch = useCallback(() => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + VISIBLE_INCREMENT);
            setIsLoadingMore(false);
            loadingRef.current = false;
        }, 1000);
    }, []);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingRef.current) {
                    loadingRef.current = true;
                    if (hasMoreLocal) {
                        revealLocalBatch();
                    } else if (canFetchMore) {
                        fetchNextPage();
                    } else {
                        loadingRef.current = false;
                    }
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreLocal, canFetchMore, fetchNextPage, revealLocalBatch]);

    // Reset visible count when filter/sort changes
    useEffect(() => {
        setVisibleCount(VISIBLE_INCREMENT);
        setIsLoadingMore(false);
        loadingRef.current = false;
    }, [sortBy, minDiscount, maxPrice]);

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
                    Showing {visibleDeals.length} of{" "}
                    {filteredDeals.length === allDeals.length
                        ? `${allDeals.length} deals`
                        : `${filteredDeals.length} deals (filtered from ${allDeals.length})`}
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
            {visibleDeals.length > 0 ? (
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

            {/* Skeleton loading row */}
            {isLoadingMore && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {/* Scroll sentinel */}
            {(hasMoreLocal || canFetchMore) && visibleDeals.length > 0 && (
                <div ref={sentinelRef} className="h-1" />
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
