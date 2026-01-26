import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CategoryLoading() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Category header skeleton */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
                        <div>
                            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                </div>

                {/* Filter pills skeleton */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="h-8 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
                            />
                        ))}
                    </div>
                    <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Results count skeleton */}
                <div className="mb-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Products grid skeleton */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                        >
                            {/* Image skeleton */}
                            <div className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />

                            {/* Content skeleton */}
                            <div className="p-4">
                                {/* Deal score badge */}
                                <div className="mb-2 h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

                                {/* Title */}
                                <div className="mb-2 space-y-1">
                                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Price */}
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Discount badge */}
                                <div className="mt-2 h-5 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
