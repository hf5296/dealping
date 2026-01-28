"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { DealPingProduct } from "@/lib/keepa";

const VISIBLE_INCREMENT = 48;

const CATEGORY_OPTIONS = [
    { slug: "", label: "All Categories" },
    { slug: "electronics", label: "Electronics" },
    { slug: "gaming", label: "Gaming" },
    { slug: "home", label: "Home & Garden" },
    { slug: "health", label: "Health & Beauty" },
    { slug: "grocery", label: "Groceries" },
    { slug: "toys", label: "Toys" },
    { slug: "baby", label: "Baby & Kids" },
    { slug: "sports", label: "Sports" },
    { slug: "clothing", label: "Clothing" },
];

interface LightningDealsClientProps {
    initialDeals: DealPingProduct[];
}

type SortOption = "percentOff" | "price-low" | "price-high" | "newest";

export default function LightningDealsClient({ initialDeals }: LightningDealsClientProps) {
    const [sortBy, setSortBy] = useState<SortOption>("percentOff");
    const [minDiscount, setMinDiscount] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [visibleCount, setVisibleCount] = useState(VISIBLE_INCREMENT);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter and sort deals (all client-side since we have all deals)
    const filteredDeals = useMemo(() => {
        let result = [...initialDeals];

        // Filter by category (based on product name since lightning deals don't have category field)
        if (selectedCategory) {
            const categoryKeywords: Record<string, string[]> = {
                electronics: ["phone", "tablet", "laptop", "headphone", "speaker", "camera", "watch", "tv", "monitor", "keyboard", "mouse", "charger", "cable", "power bank", "echo", "fire", "kindle", "earbuds", "bluetooth"],
                gaming: ["game", "gaming", "playstation", "xbox", "nintendo", "controller", "console", "ps5", "ps4"],
                home: ["home", "kitchen", "furniture", "garden", "mattress", "pillow", "bedding", "vacuum", "cleaning", "storage", "lamp", "light", "decor"],
                health: ["health", "beauty", "skincare", "makeup", "vitamin", "supplement", "shampoo", "toothbrush", "electric", "razor", "hair"],
                grocery: ["food", "drink", "snack", "coffee", "tea", "chocolate", "protein", "organic"],
                toys: ["toy", "lego", "puzzle", "doll", "action figure", "board game", "plush"],
                baby: ["baby", "infant", "toddler", "nappy", "diaper", "stroller", "car seat", "feeding"],
                sports: ["sport", "fitness", "gym", "yoga", "running", "cycling", "outdoor", "camping", "hiking"],
                clothing: ["clothing", "shirt", "dress", "jacket", "shoe", "boot", "sneaker", "jeans", "sock"],
            };
            const keywords = categoryKeywords[selectedCategory] || [];
            if (keywords.length > 0) {
                result = result.filter(deal => {
                    const name = deal.name.toLowerCase();
                    return keywords.some(keyword => name.includes(keyword));
                });
            }
        }

        // Filter by minimum discount
        if (minDiscount > 0) {
            result = result.filter((d) => d.percentOff >= minDiscount);
        }

        // Filter by max price
        if (maxPrice > 0) {
            result = result.filter((d) => d.currentPrice <= maxPrice);
        }

        // Sort
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
            case "newest":
                result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
        }

        return result;
    }, [initialDeals, sortBy, minDiscount, maxPrice, selectedCategory]);

    const visibleDeals = filteredDeals.slice(0, visibleCount);
    const hasMore = visibleCount < filteredDeals.length;

    const loadMore = () => {
        setIsLoadingMore(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setVisibleCount((prev) => prev + VISIBLE_INCREMENT);
            setIsLoadingMore(false);
        }, 300);
    };

    const clearFilters = () => {
        setMinDiscount(0);
        setMaxPrice(0);
        setSortBy("percentOff");
        setSelectedCategory("");
        setVisibleCount(VISIBLE_INCREMENT);
    };

    const hasActiveFilters = minDiscount > 0 || maxPrice > 0 || selectedCategory !== "";

    return (
        <>
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                {/* Deal count */}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredDeals.length === initialDeals.length
                        ? `${initialDeals.length} lightning deals`
                        : `${filteredDeals.length} of ${initialDeals.length} deals`}
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
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setVisibleCount(VISIBLE_INCREMENT);
                            }}
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
                            value={minDiscount}
                            onChange={(e) => {
                                setMinDiscount(Number(e.target.value));
                                setVisibleCount(VISIBLE_INCREMENT);
                            }}
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
                            onChange={(e) => {
                                setMaxPrice(Number(e.target.value));
                                setVisibleCount(VISIBLE_INCREMENT);
                            }}
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
                            onChange={(e) => {
                                setSortBy(e.target.value as SortOption);
                                setVisibleCount(VISIBLE_INCREMENT);
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="percentOff">Best Deal First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
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
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                        <svg
                            className="h-8 w-8 text-amber-600 dark:text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        {hasActiveFilters ? "No deals match your filters" : "No Lightning Deals Right Now"}
                    </h3>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                        {hasActiveFilters
                            ? "Try adjusting your filters to see more deals."
                            : "Lightning deals are time-limited promotions from Amazon. Check back soon!"}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* Loading skeletons */}
            {isLoadingMore && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>
            )}

            {/* Load More button */}
            {hasMore && !isLoadingMore && visibleDeals.length > 0 && (
                <div className="mt-8 text-center">
                    <button
                        onClick={loadMore}
                        className="rounded-xl bg-amber-500 px-8 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                        Load More Deals
                    </button>
                </div>
            )}

            {/* End of results */}
            {!hasMore && filteredDeals.length > 0 && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        All {filteredDeals.length} lightning deals shown
                    </p>
                </div>
            )}
        </>
    );
}
