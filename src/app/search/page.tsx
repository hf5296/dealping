import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { featuredDeals, categories } from "@/lib/sampleData";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";

    // In production, this would be a real API call
    // For now, filter sample data based on query
    const results = query
        ? featuredDeals.filter(
            (deal) =>
                deal.name.toLowerCase().includes(query.toLowerCase()) ||
                deal.retailer.toLowerCase().includes(query.toLowerCase())
        )
        : featuredDeals;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Search header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        {query ? (
                            <>
                                Search results for &quot;<span className="text-emerald-500">{query}</span>&quot;
                            </>
                        ) : (
                            "All Products"
                        )}
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        {results.length} products found across {categories.length} categories
                    </p>
                </div>

                {/* Filters bar */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                    <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <option>Best Deal</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Biggest Discount</option>
                    </select>

                    <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                    <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <option>All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <span className="ml-4 text-sm font-medium text-gray-700 dark:text-gray-300">Deal Score:</span>
                    <div className="flex gap-2">
                        <button className="deal-good rounded-full px-3 py-1 text-xs font-semibold">
                            Great Deals
                        </button>
                        <button className="deal-average rounded-full px-3 py-1 text-xs font-semibold opacity-50 hover:opacity-100">
                            Average
                        </button>
                    </div>
                </div>

                {/* Results grid */}
                {results.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {results.map((deal) => (
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
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                            <svg
                                className="h-8 w-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                            No products found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Try adjusting your search or filters to find what you&apos;re looking for.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {results.length > 0 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Previous
                        </button>
                        <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white">
                            1
                        </button>
                        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            2
                        </button>
                        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            3
                        </button>
                        <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Next
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
