import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryDealsClient from "./CategoryDealsClient";
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
            dateRange: 0, // All current deals (not just recent price drops)
            limit: 150, // Keepa returns up to 150 per page
            validateRRP: false, // Use Keepa's data directly
            // Anti-fake-deal filters (slightly relaxed for niche categories):
            isLowest90: true, // Price must be at 90-day low
            maxSalesRank: 200000, // Top 200k (more lenient for niche categories)
            minRating: 35, // At least 3.5 stars
        });

        return result.deals;
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
                                Find the best {category.name.toLowerCase()} deals on Amazon UK
                            </p>
                        </div>
                    </div>
                </div>

                {/* Client component handles filtering, sorting, and load more */}
                <CategoryDealsClient
                    initialDeals={deals}
                    categorySlug={slug}
                    categoryName={category.name}
                />
            </main>

            <Footer />
        </div>
    );
}
