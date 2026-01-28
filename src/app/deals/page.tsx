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
                    {/* Client component handles header, filtering and sorting */}
                    <DealsClient initialDeals={deals} />
                </div>
            </main>

            <Footer />
        </div>
    );
}
