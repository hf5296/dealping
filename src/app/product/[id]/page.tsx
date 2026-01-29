import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceHistoryLoader from "@/components/PriceHistoryLoader";
import ShareButtons from "@/components/ShareButtons";
import SetAlertButton from "@/components/SetAlertButton";
import { getProductWithHistory } from "@/lib/keepa";
import { formatTimeAgo } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rateLimit";

// Map Keepa/Amazon category names to app category slug + display name
const CATEGORY_NAME_MAP: Record<string, { slug: string; name: string }> = {
    "Electronics & Photo": { slug: "electronics", name: "Electronics" },
    "Computers & Accessories": { slug: "electronics", name: "Electronics" },
    "Home & Kitchen": { slug: "home-garden", name: "Home & Garden" },
    "Garden & Outdoors": { slug: "home-garden", name: "Home & Garden" },
    "Health & Personal Care": { slug: "health-beauty", name: "Health & Beauty" },
    "Beauty": { slug: "health-beauty", name: "Health & Beauty" },
    "Grocery": { slug: "groceries", name: "Groceries" },
    "Toys & Games": { slug: "baby-kids", name: "Baby & Kids" },
    "Baby Products": { slug: "baby-kids", name: "Baby & Kids" },
"Video Games": { slug: "gaming", name: "Gaming" },
    "PC & Video Games": { slug: "gaming", name: "Gaming" },
    "Stationery & Office Supplies": { slug: "stationery", name: "Stationery" },
    "Food & Drink": { slug: "food-drink", name: "Food & Drink" },
    "Clothing": { slug: "health-beauty", name: "Health & Beauty" },
};

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
        description: "This price is significantly below its historical average.",
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

    // Rate limit SSR product fetches to protect Keepa tokens
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim()
        || headersList.get('x-real-ip')
        || 'ssr-unknown';
    const rl = checkRateLimit(ip, 'ssr-product', { limit: 15, windowSeconds: 60 });
    if (!rl.allowed) {
        notFound();
    }

    // Fetch product data with caching (24hr file cache prevents token waste)
    // First visit: ~2 tokens, subsequent visits: 0 tokens (from cache)
    const { product } = await getProductWithHistory(id);

    if (!product) {
        notFound();
    }

    // If the current price is at or above the 90-day average, this isn't really a deal
    const isAboveAverage = product.avg90Price != null && product.avg90Price > 0 && product.currentPrice >= product.avg90Price;
    const scoreConfig = isAboveAverage || !product.dealScore ? null : dealScoreConfig[product.dealScore];
    const savings = product.originalPrice > product.currentPrice ? product.originalPrice - product.currentPrice : 0;
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
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
                                href="/categories"
                                className="text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                            >
                                Categories
                            </a>
                        </li>
                        {product.category && (
                            <>
                                <li className="text-gray-400">/</li>
                                <li>
                                    {CATEGORY_NAME_MAP[product.category] ? (
                                        <a
                                            href={`/categories/${CATEGORY_NAME_MAP[product.category].slug}`}
                                            className="text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                                        >
                                            {CATEGORY_NAME_MAP[product.category].name}
                                        </a>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {product.category}
                                        </span>
                                    )}
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
                        {/* Rating overlay */}
                        {product.rating && (
                            <div className="absolute bottom-4 right-4">
                                <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:bg-gray-800/90">
                                    <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {product.rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product info */}
                    <div>
                        {/* Deal score badge */}
                        {scoreConfig && (
                            <div className="mb-4">
                                <span
                                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${scoreConfig.className}`}
                                >
                                    {scoreConfig.label}
                                </span>
                            </div>
                        )}

                        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            {product.name}
                        </h1>

                        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>ASIN: {product.asin}</span>
                            {product.createdAt && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Posted {formatTimeAgo(product.createdAt)}
                                </span>
                            )}
                        </div>

                        {/* Price display */}
                        <div className="mb-6 rounded-xl bg-white p-6 dark:bg-gray-800">
                            {product.currentPrice > 0 ? (
                                <>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-4xl font-bold text-emerald-600">
                                            £{product.currentPrice.toFixed(2)}
                                        </span>
                                        {product.originalPrice > product.currentPrice && !isAboveAverage && (
                                            <span className="text-xl font-medium text-red-500 line-through">
                                                £{product.originalPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    {savings > 0 && !isAboveAverage && (
                                        <p className="mt-2 text-sm font-medium text-emerald-600">
                                            You save £{savings.toFixed(2)} ({percentOff}%)
                                        </p>
                                    )}
                                    {isAboveAverage ? (
                                        <p className="mt-3 text-sm text-gray-500">
                                            We were unable to verify if this is a deal. Please check the price history chart below.
                                        </p>
                                    ) : scoreConfig ? (
                                        <p className="mt-3 text-sm text-gray-500">{scoreConfig.description}</p>
                                    ) : null}
                                    {product.isLightningDeal && savings > 0 ? (
                                        <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                <strong>Note:</strong> The &quot;was&quot; price we show is the regular selling price before the deal started.
                                                Amazon may advertise a larger discount based on an older or inflated RRP.
                                                Check the price history chart below to verify.
                                            </p>
                                        </div>
                                    ) : product.priceSource === 'avg90' && savings > 0 ? (
                                        <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                <strong>Note:</strong> The &quot;was&quot; price shown here is based on the 90-day average, not a listed RRP.
                                                This is because we have calculated that Amazon may not display a strikethrough price for this product.
                                                Check the price history chart below to verify.
                                            </p>
                                        </div>
                                    ) : product.priceSource === 'list' && savings > 0 ? (
                                        <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                <strong>Note:</strong> The &quot;was&quot; price is the manufacturer&apos;s list price (RRP).
                                                Amazon may not display this as a strikethrough.
                                                Check the price history chart below to verify.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs text-gray-400">
                                            Prices may vary. Always verify final price on Amazon.
                                        </p>
                                    )}
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

                        {/* Price alert button */}
                        <div className="mt-3">
                            <SetAlertButton
                                asin={product.asin}
                                productName={product.name}
                                imageUrl={product.imageUrl}
                                currentPrice={product.currentPrice}
                            />
                        </div>

                        {/* Share buttons */}
                        <div className="mt-4">
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
