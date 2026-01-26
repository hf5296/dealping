import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceHistoryLoader from "@/components/PriceHistoryLoader";
import ShareButtons from "@/components/ShareButtons";
import { getProductWithHistory } from "@/lib/keepa";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;

    try {
        // Get product data (uses 24hr file cache, so subsequent calls are free)
        const result = await getProductWithHistory(id);
        const product = result.product;

        if (!product) {
            return {
                title: "Product Not Found | DealPing",
                description: "The requested product could not be found.",
            };
        }

        const title = `${product.name} - ${product.percentOff}% Off | DealPing`;
        const description = `Save £${(product.originalPrice - product.currentPrice).toFixed(2)} on ${product.name}. Now £${product.currentPrice.toFixed(2)} (was £${product.originalPrice.toFixed(2)}). ${product.percentOff}% off at Amazon UK.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [product.imageUrl],
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [product.imageUrl],
            },
        };
    } catch {
        return {
            title: "Product | DealPing",
            description: "Find the best deals on Amazon UK with DealPing.",
        };
    }
}

const dealScoreConfig = {
    amazing: {
        label: "Amazing Deal",
        description: "This is an exceptional price - one of the best we've seen!",
        className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    great: {
        label: "Great Deal",
        description: "This price is significantly lower than usual - excellent time to buy!",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    good: {
        label: "Good Deal",
        description: "This is a solid deal - a good time to buy!",
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
};

// Revalidate every hour for product pages
export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;

    // Fetch product data with caching (24hr file cache prevents token waste)
    // First visit: ~2 tokens, subsequent visits: 0 tokens (from cache)
    const { product } = await getProductWithHistory(id);

    if (!product) {
        notFound();
    }

    const scoreConfig = dealScoreConfig[product.dealScore];
    const savings = product.originalPrice - product.currentPrice;
    const percentOff = product.percentOff;

    // JSON-LD structured data for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.imageUrl,
        description: `${product.name} - ${product.percentOff}% off at Amazon UK`,
        sku: product.asin,
        brand: {
            "@type": "Brand",
            name: "Various",
        },
        offers: {
            "@type": "Offer",
            url: product.affiliateUrl,
            priceCurrency: "GBP",
            price: product.currentPrice.toFixed(2),
            priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            availability: "https://schema.org/InStock",
            seller: {
                "@type": "Organization",
                name: "Amazon UK",
            },
        },
        ...(product.rating && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating.toFixed(1),
                bestRating: "5",
                worstRating: "1",
            },
        }),
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
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
                                href="/deals"
                                className="text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                            >
                                Deals
                            </a>
                        </li>
                        {product.category && (
                            <>
                                <li className="text-gray-400">/</li>
                                <li className="text-gray-500 dark:text-gray-400">
                                    {product.category}
                                </li>
                            </>
                        )}
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
                            unoptimized={product.imageUrl.includes('amazon.com')}
                        />
                        {/* Discount badge */}
                        {percentOff > 0 && (
                            <div className="absolute left-4 top-4">
                                <span className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-lg font-bold text-white">
                                    -{percentOff}% OFF
                                </span>
                            </div>
                        )}
                        {/* Lightning deal badge */}
                        {product.isLightningDeal && (
                            <div className="absolute right-4 top-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-bold text-white">
                                    <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                                    Lightning Deal
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

                        {/* Rating */}
                        {product.rating && (
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            className={`h-5 w-5 ${
                                                star <= Math.round(product.rating!)
                                                    ? "text-amber-400"
                                                    : "text-gray-300"
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {product.rating.toFixed(1)} stars
                                </span>
                            </div>
                        )}

                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                            ASIN: {product.asin}
                        </p>

                        {/* Price display */}
                        <div className="mb-6 rounded-xl bg-white p-6 dark:bg-gray-800">
                            {product.currentPrice > 0 ? (
                                <>
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
                                </>
                            ) : (
                                <div>
                                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                        Price unavailable
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        This product may be out of stock or only available from third-party sellers.
                                        Check Amazon for current pricing.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lightning deal progress */}
                        {product.isLightningDeal && product.percentClaimed !== undefined && (
                            <div className="mb-6 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-amber-700 dark:text-amber-400">
                                        Deal claimed
                                    </span>
                                    <span className="font-bold text-amber-700 dark:text-amber-400">
                                        {product.percentClaimed}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
                                    <div
                                        className="h-full rounded-full bg-amber-500 transition-all"
                                        style={{ width: `${product.percentClaimed}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                                    Limited quantity available - act fast!
                                </p>
                            </div>
                        )}


                        {/* Lowest price indicators */}
                        {(product.isLowestEver || product.isLowest90Days) && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                {product.isLowestEver && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        All-Time Low Price
                                    </span>
                                )}
                                {product.isLowest90Days && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        90-Day Low Price
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Buy button */}
                        <a
                            href={product.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-xl bg-emerald-500 py-4 text-center text-lg font-semibold text-white hover:bg-emerald-600 transition-colors"
                        >
                            View on Amazon UK
                        </a>

                        {/* Share buttons */}
                        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <ShareButtons
                                title={product.name}
                                url={`https://dealping.co.uk/product/${product.asin}`}
                                price={product.currentPrice}
                                percentOff={product.percentOff}
                            />
                        </div>

                    </div>
                </div>

                {/* Price History - Lazy Loaded to Save API Tokens */}
                <div className="mb-8">
                    <PriceHistoryLoader
                        asin={product.asin}
                        currentPrice={product.currentPrice}
                    />
                </div>

            </main>

            <Footer />
        </div>
    );
}
