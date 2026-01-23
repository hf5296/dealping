"use client";

import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
    id: string;
    name: string;
    imageUrl: string;
    currentPrice: number;
    originalPrice?: number;
    retailer: string;
    dealScore?: "great" | "good" | "average";
    percentOff?: number;
    affiliateUrl?: string;
}

export default function ProductCard({
    id,
    name,
    imageUrl,
    currentPrice,
    originalPrice,
    retailer,
    dealScore = "average",
    percentOff,
    affiliateUrl,
}: ProductCardProps) {
    const scoreColors = {
        great: "bg-emerald-500",
        good: "bg-emerald-400",
        average: "bg-yellow-500",
    };

    const scoreLabels = {
        great: "Great Deal",
        good: "Good Deal",
        average: "Average",
    };

    // If we have an affiliate URL, link directly to it. Otherwise, link to product page.
    const href = affiliateUrl || `/product/${id}`;
    const isExternal = !!affiliateUrl;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg hover:ring-emerald-200 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-emerald-700">
            {/* Discount badge */}
            {percentOff && percentOff > 0 && (
                <div className="absolute left-3 top-3 z-10 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                    -{percentOff}%
                </div>
            )}

            {/* Deal score badge */}
            {dealScore && (
                <div
                    className={`absolute right-3 top-3 z-10 rounded-lg px-2 py-1 text-xs font-bold text-white shadow-md ${scoreColors[dealScore]}`}
                >
                    {scoreLabels[dealScore]}
                </div>
            )}

            {/* Product Image */}
            <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer sponsored" : undefined}
                className="block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700"
            >
                <Image
                    src={imageUrl}
                    alt={name}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                />
            </a>

            {/* Product Info */}
            <div className="p-4">
                {/* Retailer */}
                <div className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {retailer}
                </div>

                {/* Product Name */}
                <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer sponsored" : undefined}
                >
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
                        {name}
                    </h3>
                </a>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        £{currentPrice.toFixed(2)}
                    </span>
                    {originalPrice && originalPrice > currentPrice && (
                        <span className="text-sm text-gray-400 line-through">
                            £{originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Buy button */}
                <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer sponsored" : undefined}
                    className="mt-3 block w-full rounded-lg bg-emerald-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                    {isExternal ? "View Deal" : "Compare Prices"}
                </a>
            </div>
        </div>
    );
}
