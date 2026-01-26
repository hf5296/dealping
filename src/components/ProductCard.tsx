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
    dealScore?: "amazing" | "great" | "good";
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
    dealScore = "good",
    percentOff,
    affiliateUrl,
}: ProductCardProps) {
    const scoreColors = {
        amazing: "bg-purple-500",
        great: "bg-emerald-500",
        good: "bg-emerald-400",
    };

    const scoreLabels = {
        amazing: "Amazing Deal",
        great: "Great Deal",
        good: "Good Deal",
    };

    // Product detail page link
    const productPageUrl = `/product/${id}`;

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

            {/* Product Image - links to product detail page */}
            <Link
                href={productPageUrl}
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
            </Link>

            {/* Product Info */}
            <div className="p-4">
                {/* Retailer */}
                <div className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {retailer}
                </div>

                {/* Product Name - links to product detail page */}
                <Link href={productPageUrl}>
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
                        {name}
                    </h3>
                </Link>

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

                {/* Buttons */}
                <div className="mt-3 flex gap-2">
                    {/* View Details button - goes to product page */}
                    <Link
                        href={productPageUrl}
                        className="flex-1 rounded-lg bg-gray-100 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        Details
                    </Link>

                    {/* Buy button - goes to Amazon */}
                    {affiliateUrl && (
                        <a
                            href={affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="flex-1 rounded-lg bg-emerald-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Buy Now
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
