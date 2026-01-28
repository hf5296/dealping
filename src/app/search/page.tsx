import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { searchProducts, DealPingProduct } from "@/lib/keepa";
import SearchResultsClient from "./SearchResultsClient";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

async function getInitialResults(query: string): Promise<{
    products: DealPingProduct[];
    hasMore: boolean;
    error?: string;
}> {
    if (!query || query.trim().length < 2) {
        return { products: [], hasMore: false };
    }

    try {
        const result = await searchProducts(query, { page: 0, stats: 90 });
        return {
            products: result.products,
            hasMore: result.products.length >= 10, // Keepa returns max 10 per page
        };
    } catch (error) {
        console.error('Search error:', error);
        return {
            products: [],
            hasMore: false,
            error: 'Unable to search products. Please try again.',
        };
    }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || "";

    const { products, hasMore, error } = await getInitialResults(query);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Search header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        {query ? (
                            <>
                                Results for &quot;<span className="text-emerald-600">{query}</span>&quot;
                            </>
                        ) : (
                            "Search Products"
                        )}
                    </h1>
                    {query && !error && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {products.length > 0
                                ? `Found ${products.length}+ products from Amazon UK`
                                : "No products found"}
                        </p>
                    )}
                </div>

                {/* No query state */}
                {!query && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Enter a search term to find products
                        </p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Results - Client component handles load more and rate limiting */}
                {query && !error && (
                    <SearchResultsClient
                        key={query}
                        initialProducts={products}
                        query={query}
                        initialHasMore={hasMore}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}
