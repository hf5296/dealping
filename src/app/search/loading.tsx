import Header from "@/components/Header";
import Footer from "@/components/Footer";

function ProductCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* Image skeleton */}
            <div className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />

            {/* Content skeleton */}
            <div className="p-4">
                {/* Deal score badge */}
                <div className="mb-2 h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

                {/* Title */}
                <div className="mb-3 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                    <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Discount badge */}
                <div className="mt-3 h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    );
}

export default function SearchLoading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Search bar skeleton */}
                    <div className="mb-8">
                        <div className="h-16 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Results header skeleton */}
                    <div className="mb-6">
                        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Filters Bar skeleton */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                        <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="flex gap-3">
                            <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                            <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                            <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>

                    {/* Products grid skeleton */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
