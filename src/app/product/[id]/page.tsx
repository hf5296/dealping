import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import { getProductById, generatePriceHistory } from "@/lib/productUtils";

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

const dealScoreConfig = {
    good: {
        label: "Great Deal",
        description: "This price is lower than the average - good time to buy!",
        className: "deal-good",
    },
    average: {
        label: "Average Price",
        description: "This is close to the typical price for this product.",
        className: "deal-average",
    },
    bad: {
        label: "High Price",
        description: "Consider waiting for a price drop.",
        className: "deal-bad",
    },
};

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const product = getProductById(id);
    const priceHistory = generatePriceHistory(product.averagePrice);

    const scoreConfig = dealScoreConfig[product.dealScore];
    const savings = product.originalPrice - product.currentPrice;
    const percentOff = Math.round(
        ((product.originalPrice - product.currentPrice) / product.originalPrice) *
        100
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm">
                    <ol className="flex items-center gap-2">
                        <li>
                            <a
                                href="/"
                                className="text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                            >
                                Home
                            </a>
                        </li>
                        <li className="text-gray-400">/</li>
                        <li>
                            <a
                                href={`/categories/${product.category.toLowerCase()}`}
                                className="text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                            >
                                {product.category}
                            </a>
                        </li>
                        <li className="text-gray-400">/</li>
                        <li className="text-gray-900 dark:text-white">{product.name}</li>
                    </ol>
                </nav>

                {/* Product header */}
                <div className="mb-8 grid gap-8 lg:grid-cols-2">
                    {/* Product image */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain p-8"
                            priority
                        />
                        {/* Discount badge */}
                        {percentOff > 0 && (
                            <div className="absolute left-4 top-4">
                                <span className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-lg font-bold text-white">
                                    -{percentOff}% OFF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Product info */}
                    <div>
                        {/* Deal score badge */}
                        <div className="mb-4">
                            <span
                                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${scoreConfig.className}`}
                            >
                                {scoreConfig.label}
                            </span>
                        </div>

                        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            {product.name}
                        </h1>

                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            {product.description}
                        </p>

                        {/* Price display */}
                        <div className="mb-6 rounded-xl bg-white p-6 dark:bg-gray-800">
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold text-emerald-600">
                                    £{product.currentPrice.toFixed(2)}
                                </span>
                                {product.originalPrice > product.currentPrice && (
                                    <span className="text-xl font-medium text-red-500 line-through">
                                        £{product.originalPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            {savings > 0 && (
                                <p className="mt-2 text-sm font-medium text-emerald-600">
                                    You save £{savings.toFixed(2)} ({percentOff}%)
                                </p>
                            )}
                            <p className="mt-3 text-sm text-gray-500">{scoreConfig.description}</p>
                        </div>

                        {/* Quick stats */}
                        <div className="mb-6 grid grid-cols-3 gap-4">
                            <div className="rounded-xl bg-white p-4 text-center dark:bg-gray-800">
                                <p className="text-xs font-medium uppercase text-gray-500">
                                    All-Time Low
                                </p>
                                <p className="mt-1 text-lg font-bold text-emerald-600">
                                    £{product.allTimeLow.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-4 text-center dark:bg-gray-800">
                                <p className="text-xs font-medium uppercase text-gray-500">
                                    Average
                                </p>
                                <p className="mt-1 text-lg font-bold text-gray-700 dark:text-gray-300">
                                    £{product.averagePrice.toFixed(2)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-4 text-center dark:bg-gray-800">
                                <p className="text-xs font-medium uppercase text-gray-500">
                                    All-Time High
                                </p>
                                <p className="mt-1 text-lg font-bold text-red-500">
                                    £{product.allTimeHigh.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Set alert button */}
                        <button className="pulse-green w-full rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-white hover:bg-emerald-600">
                            🔔 Set Price Alert
                        </button>
                    </div>
                </div>

                {/* Price history chart */}
                <div className="mb-8">
                    <PriceHistoryChart
                        data={priceHistory}
                        currentPrice={product.currentPrice}
                        averagePrice={product.averagePrice}
                        allTimeLow={product.allTimeLow}
                        allTimeHigh={product.allTimeHigh}
                    />
                </div>

                {/* Retailer comparison */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Compare Prices Across Retailers
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Prices last updated: Today at{" "}
                            {new Date().toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {product.retailers.map((retailer, idx) => (
                            <div
                                key={retailer.name}
                                className={`flex items-center justify-between p-6 ${idx === 0 ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Best price badge */}
                                    {idx === 0 && (
                                        <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                                            BEST PRICE
                                        </span>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {retailer.name}
                                        </p>
                                        <p className="text-sm text-gray-500">{retailer.deliveryInfo}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Stock status */}
                                    <div className="text-right">
                                        {retailer.inStock ? (
                                            <span className="text-sm font-medium text-emerald-600">
                                                ✓ In Stock
                                            </span>
                                        ) : (
                                            <span className="text-sm font-medium text-red-500">
                                                ✗ Out of Stock
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-emerald-600">
                                            £{retailer.price.toFixed(2)}
                                        </p>
                                        {retailer.originalPrice && (
                                            <p className="text-sm font-medium text-red-500 line-through">
                                                £{retailer.originalPrice.toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    {/* CTA button */}
                                    <a
                                        href="#"
                                        className={`rounded-xl px-6 py-3 text-sm font-semibold ${retailer.inStock
                                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                : "cursor-not-allowed bg-gray-200 text-gray-400"
                                            }`}
                                    >
                                        View Deal
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
