import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/sampleData";
import { browseDeals, DealPingProduct, UK_CATEGORIES, PRICE_TYPES } from "@/lib/keepa";
import { notFound } from "next/navigation";

// Revalidate every 5 minutes
export const revalidate = 300;

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

// Map category slugs to Keepa category IDs
const CATEGORY_MAP: Record<string, number> = {
    'electronics': UK_CATEGORIES.ELECTRONICS,
    'computers': UK_CATEGORIES.COMPUTERS,
    'home-garden': UK_CATEGORIES.HOME_KITCHEN,
    'home-kitchen': UK_CATEGORIES.HOME_KITCHEN,
    'health-beauty': UK_CATEGORIES.HEALTH_BEAUTY,
    'groceries': UK_CATEGORIES.GROCERY,
    'toys': UK_CATEGORIES.TOYS,
    'baby-kids': UK_CATEGORIES.BABY,
    'sports': UK_CATEGORIES.SPORTS,
    'gaming': UK_CATEGORIES.VIDEO_GAMES,
    'books': UK_CATEGORIES.BOOKS,
    'food-drink': UK_CATEGORIES.GROCERY,
    'stationery': UK_CATEGORIES.BOOKS,
    'clothing': UK_CATEGORIES.CLOTHING,
};

async function getCategoryDeals(categoryId: number): Promise<DealPingProduct[]> {
    try {
        const result = await browseDeals({
            page: 0,
            category: categoryId,
            minPercentOff: 15,
            sortBy: 'percentOff',
            hasReviews: true,
            priceType: PRICE_TYPES.AMAZON,
            dateRange: 0,
        });

        return result.deals.slice(0, 24); // Show up to 24 deals
    } catch (error) {
        console.error('Error fetching category deals:', error);
        return [];
    }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    // Find the category
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        notFound();
    }

    // Get Keepa category ID
    const keepaCategoryId = CATEGORY_MAP[slug];

    // Fetch deals for this category
    const deals = keepaCategoryId ? await getCategoryDeals(keepaCategoryId) : [];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Category header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                            style={{ backgroundColor: `${category.color}15` }}
                        >
                            {category.icon}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {category.name} Deals
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {deals.length > 0
                                    ? `${deals.length} deals found`
                                    : 'Loading deals...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {["All Deals", "20%+ Off", "50%+ Off", "Under £25", "Under £50"].map(
                        (filter, idx) => (
                            <button
                                key={filter}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${idx === 0
                                        ? "bg-emerald-600 text-white"
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    }`}
                            >
                                {filter}
                            </button>
                        )
                    )}
                </div>

                {/* Products grid */}
                {deals.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">
                            No deals found for this category right now. Check back later!
                        </p>
                    </div>
                )}

                {/* Info section */}
                {deals.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {deals.length} deals • Updated every 5 minutes
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
