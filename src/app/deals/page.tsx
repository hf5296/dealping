import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { browseDeals, PRICE_TYPES, DealPingProduct } from "@/lib/keepa";

// Revalidate every 5 minutes
export const revalidate = 300;

async function getDeals(): Promise<DealPingProduct[]> {
    try {
        const result = await browseDeals({
            page: 0,
            minPercentOff: 15, // At least 15% off
            sortBy: 'percentOff', // Best discounts first
            hasReviews: true,
            priceType: PRICE_TYPES.AMAZON,
            dateRange: 0, // Last 24 hours
        });

        // Return up to 48 deals (4 rows of 4, 3 pages worth)
        return result.deals.slice(0, 48);
    } catch (error) {
        console.error('Error fetching deals from Keepa:', error);
        return [];
    }
}

export default async function DealsPage() {
    const deals = await getDeals();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                            </span>
                            Live from Amazon UK
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                            Today&apos;s Best Deals
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Real-time price drops from Amazon UK. Updated every 5 minutes.
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Showing {deals.length} deals
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort by:</span>
                            <select className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <option value="percentOff">Biggest Discount</option>
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Deals Grid */}
                    {deals.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {deals.map((deal) => (
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
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white p-12 text-center dark:bg-gray-800">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                No deals available
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Check back soon for fresh deals from Amazon UK.
                            </p>
                        </div>
                    )}

                    {/* Load More Placeholder */}
                    {deals.length >= 48 && (
                        <div className="mt-8 text-center">
                            <button className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600">
                                Load More Deals
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
