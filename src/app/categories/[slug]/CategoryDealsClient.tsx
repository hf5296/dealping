"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { DealPingProduct } from "@/lib/keepa";

const VISIBLE_INCREMENT = 20;

interface CategoryDealsClientProps {
    initialDeals: DealPingProduct[];
    categorySlug: string;
    categoryName: string;
}

type FilterOption = "all" | "20off" | "50off" | "under25" | "under50";
type SortOption = "percentOff" | "price-low" | "price-high";

export default function CategoryDealsClient({
    initialDeals,
    categorySlug,
    categoryName,
}: CategoryDealsClientProps) {
    const [allDeals, setAllDeals] = useState<DealPingProduct[]>(initialDeals);
    const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
    const [sortBy, setSortBy] = useState<SortOption>("percentOff");
    const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);
    const [apiPage, setApiPage] = useState(0);
    const [apiHasMore, setApiHasMore] = useState(initialDeals.length >= 50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    // Filter and sort deals
    const filteredDeals = useMemo(() => {
        let result = [...allDeals];

        switch (activeFilter) {
            case "20off":
                result = result.filter((d) => d.percentOff >= 20);
                break;
            case "50off":
                result = result.filter((d) => d.percentOff >= 50);
                break;
            case "under25":
                result = result.filter((d) => d.currentPrice < 25);
                break;
            case "under50":
                result = result.filter((d) => d.currentPrice < 50);
                break;
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
    }, [allDeals, activeFilter, sortBy]);

    const visibleDeals = filteredDeals.slice(0, visibleCount);
    const hasMoreLocal = visibleCount < filteredDeals.length;
    const canFetchMore = apiHasMore && !isLoadingMore;

    // Fetch the next API page when all local data has been revealed
    const fetchNextPage = useCallback(async () => {
        if (isLoadingMore || !apiHasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = apiPage + 1;
            const response = await fetch(
                `/api/deals?category=${categorySlug}&page=${nextPage}&limit=150`
            );

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
    }, [apiPage, categorySlug, isLoadingMore, apiHasMore, allDeals]);

    // Reveal local data with a short delay so skeletons are visible
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

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Reset visible count when filter/sort changes
    useEffect(() => {
        setVisibleCount(VISIBLE_INCREMENT);
        setIsLoadingMore(false);
        loadingRef.current = false;
    }, [activeFilter, sortBy]);

    const filters: { id: FilterOption; label: string }[] = [
        { id: "all", label: "All Deals" },
        { id: "20off", label: "20%+ Off" },
        { id: "50off", label: "50%+ Off" },
        { id: "under25", label: "Under £25" },
        { id: "under50", label: "Under £50" },
    ];

    return (
        <>
            {/* Filter pills and sort */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                activeFilter === filter.id
                                    ? "bg-emerald-600 text-white"
                                    : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="percentOff">Biggest Discount</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {visibleDeals.length} of {filteredDeals.length} deals
                    {activeFilter !== "all" && ` (filtered from ${allDeals.length})`}
                </p>
            </div>

            {/* Products grid */}
            {visibleDeals.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleDeals.map((deal) => (
                        <ProductCard
                            key={deal.id}
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
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                        {allDeals.length === 0
                            ? "No deals found for this category right now. Check back later!"
                            : "No deals match your current filter. Try a different filter."}
                    </p>
                    {activeFilter !== "all" && (
                        <button
                            onClick={() => setActiveFilter("all")}
                            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                        >
                            Show all deals
                        </button>
                    )}
                </div>
            )}

            {/* Skeleton loading row */}
            {isLoadingMore && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
