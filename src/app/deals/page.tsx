import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealsClient from "./DealsClient";
import { browseDeals, PRICE_TYPES, DealPingProduct } from "@/lib/keepa";

// Revalidate every 5 minutes for fresh deals
export const revalidate = 300;

async function getDeals(): Promise<DealPingProduct[]> {
    try {
        const result = await browseDeals({
            page: 0,
            minPercentOff: 15,
            sortBy: 'percentOff',
            hasReviews: true,
            priceType: PRICE_TYPES.AMAZON,
            dateRange: 0, // All current deals (not just recent price drops)
            limit: 150, // Keepa returns up to 150 per page
            validateRRP: false, // Use Keepa's data directly
            // Anti-fake-deal filters:
            maxSalesRank: 200000, // Only popular products (top 200k)
            minRating: 35, // At least 3.5 stars
        });

        return result.deals;
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
                            Amazon UK Deals
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                            Today's Deals
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Products at their 90-day lowest price. Always verify final price on Amazon before purchasing.
                        </p>
                    </div>

                    {/* Client component handles filtering and sorting */}
                    <DealsClient initialDeals={deals} />
                </div>
            </main>

            <Footer />
        </div>
    );
}
