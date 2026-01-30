import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getLightningDeals, DealPingProduct } from '@/lib/keepa';
import LightningDealsClient from './LightningDealsClient';

export const metadata: Metadata = {
    title: 'Lightning Deals - DealPing',
    description: 'Limited-time lightning deals from Amazon UK. Get the best prices on flash sales before they expire.',
    openGraph: {
        title: 'Lightning Deals - DealPing',
        description: 'Limited-time lightning deals from Amazon UK. Get the best prices on flash sales before they expire.',
    },
};

// Force dynamic rendering so time-sensitive deals are never stale
export const dynamic = 'force-dynamic';

async function getInitialDeals(): Promise<DealPingProduct[]> {
    try {
        const result = await getLightningDeals({
            state: 'AVAILABLE',
            minPercentOff: 15,
            minRating: 3.0,
            minReviews: 5,
            limit: 500, // Get all available deals
        });
        return result.deals;
    } catch (error) {
        console.error('Error fetching lightning deals:', error);
        return [];
    }
}

export default async function LightningDealsPage() {
    const allDeals = await getInitialDeals();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="mb-8">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600"></span>
                        </span>
                        Live Deals
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                        Lightning Deals
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Limited-time offers from Amazon UK with verified discounts. These deals have a countdown timer and limited stock.
                    </p>
                </div>

                <LightningDealsClient initialDeals={allDeals} />
            </main>

            <Footer />
        </div>
    );
}
