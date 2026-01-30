"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";

import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { DealPingProduct } from "@/lib/keepa";

const VISIBLE_INCREMENT = 20;

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
    const [appliedCategory, setAppliedCategory] = useState<string>("");
    const [appliedDateRange, setAppliedDateRange] = useState<string>("0");
    // Pending filters (user selections before clicking Apply)
    const [pendingSortBy, setPendingSortBy] = useState<SortOption>("percentOff");
    const [pendingMinDiscount, setPendingMinDiscount] = useState<number>(0);
    const [pendingMaxPrice, setPendingMaxPrice] = useState<number>(0);
    const [pendingCategory, setPendingCategory] = useState<string>("");
    const [pendingDateRange, setPendingDateRange] = useState<string>("0");
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const hasPendingChanges = pendingSortBy !== sortBy || pendingMinDiscount !== minDiscount || pendingMaxPrice !== maxPrice || pendingCategory !== appliedCategory || pendingDateRange !== appliedDateRange;
    const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);
    const [apiPage, setApiPage] = useState(0);
    const [apiHasMore, setApiHasMore] = useState(initialDeals.length >= 100);
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
        }

        return result;
    }, [allDeals, sortBy, minDiscount, maxPrice]);

    const visibleDeals = filteredDeals.slice(0, visibleCount);
    const hasMoreLocal = visibleCount < filteredDeals.length;
    const canFetchMore = apiHasMore && !isLoadingMore;

    // Apply all pending filters
    const applyFilters = useCallback(async () => {
        const newCategory = pendingCategory;
        const newDateRange = pendingDateRange;
        const needsApiFetch = newCategory !== appliedCategory || newDateRange !== appliedDateRange;

        // Apply local filters immediately
        setSortBy(pendingSortBy);
        setMinDiscount(pendingMinDiscount);
        setMaxPrice(pendingMaxPrice);
        setAppliedCategory(newCategory);
        setAppliedDateRange(newDateRange);

        if (!needsApiFetch) return;

        // API filters changed — fetch new data
        setVisibleCount(VISIBLE_INCREMENT);
        setApiPage(0);
        setApiHasMore(true);

        if (!newCategory && newDateRange === "0") {
            // "All Categories" + "Today" — use initial SSR data
            setAllDeals(initialDeals);
            setApiHasMore(initialDeals.length >= 100);
            loadingRef.current = true;
            setTimeout(() => { loadingRef.current = false; }, 400);
            return;
        }

        setIsFilterLoading(true);
        loadingRef.current = true;
        try {
            const categoryParam = newCategory ? `&category=${newCategory}` : "";
            const response = await fetch(`/api/deals?dateRange=${newDateRange}${categoryParam}&limit=150`);
            if (response.ok) {
                const data = await response.json();
                setAllDeals(data.deals || []);
                setApiHasMore(data.hasMore ?? false);
            }
        } catch (error) {
            console.error("Error fetching deals:", error);
        } finally {
            setIsFilterLoading(false);
            // Prevent the IntersectionObserver from immediately firing
            // after the skeleton hides and the sentinel becomes visible
            setTimeout(() => { loadingRef.current = false; }, 400);
        }
    }, [initialDeals, pendingSortBy, pendingMinDiscount, pendingMaxPrice, pendingCategory, pendingDateRange, appliedCategory, appliedDateRange]);

    // Fetch the next API page when all local data has been revealed
    const fetchNextPage = useCallback(async () => {
        if (isLoadingMore || !apiHasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = apiPage + 1;
            const categoryParam = appliedCategory ? `&category=${appliedCategory}` : "";
            const response = await fetch(`/api/deals?page=${nextPage}&limit=150&dateRange=${appliedDateRange}${categoryParam}`);

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
                setApiHasMore(data.hasMore ?? data.deals.length >= 100);
            } else {
                setApiHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more deals:", error);
        } finally {
            setIsLoadingMore(false);
            loadingRef.current = false;
        }
    }, [apiPage, isLoadingMore, apiHasMore, allDeals, appliedCategory, appliedDateRange]);

    // Reveal local data with a short delay so skeletons are visible
    const revealLocalBatch = useCallback(() => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + VISIBLE_INCREMENT);
            setIsLoadingMore(false);
            loadingRef.current = false;
        }, 400 + Math.random() * 600);
    }, []);

    // Infinite scroll for local data only — API pages require manual "Load More" click
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingRef.current && hasMoreLocal) {
                    loadingRef.current = true;
                    revealLocalBatch();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreLocal, revealLocalBatch, visibleCount]);

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
        setPendingMinDiscount(0);
        setPendingMaxPrice(0);
        setPendingSortBy("percentOff");
        setPendingCategory("");
        setPendingDateRange("0");
        const needsRefetch = appliedCategory !== "" || appliedDateRange !== "0";
        setAppliedCategory("");
        setAppliedDateRange("0");
        if (needsRefetch) {
            // Reset to initial SSR data
            setAllDeals(initialDeals);
            setApiHasMore(initialDeals.length >= 100);
            setVisibleCount(VISIBLE_INCREMENT);
            setApiPage(0);
        }
    };

    const hasActiveFilters = minDiscount > 0 || maxPrice > 0 || appliedCategory !== "" || appliedDateRange !== "0";

    return (
        <>
            {/* Page Header */}
            <div className="mb-8">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                    </span>
                    Amazon UK Deals
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    {appliedDateRange === "0" ? "Today's Deals" : "This Week's Deals"}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Products at their 90-day lowest price. Always verify final price on Amazon before purchasing.
                </p>
            </div>

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
                    {/* Time Range Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="dateRange" className="text-sm text-gray-500">Time:</label>
                        <select
                            id="dateRange"
                            value={pendingDateRange}
                            onChange={(e) => setPendingDateRange(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="0">Today</option>
                            <option value="1">Last 7 Days</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="category" className="text-sm text-gray-500">Category:</label>
                        <select
                            id="category"
                            value={pendingCategory}
                            onChange={(e) => setPendingCategory(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                        onClick={applyFilters}
                        disabled={!hasPendingChanges || isFilterLoading}
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
            {isFilterLoading ? (
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

            {/* Skeleton loading row */}
            {isLoadingMore && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {/* Scroll sentinel — only for revealing local data */}
            {hasMoreLocal && visibleDeals.length > 0 && (
                <div ref={sentinelRef} className="h-1" />
            )}

            {/* Load More button — only shown when local data exhausted but more API pages available */}
            {!hasMoreLocal && canFetchMore && visibleDeals.length > 0 && !isLoadingMore && (
                <div className="mt-8 text-center">
                    <button
                        onClick={fetchNextPage}
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
