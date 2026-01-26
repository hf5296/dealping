import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Breadcrumb skeleton */}
                <div className="mb-6 flex gap-2">
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Product header */}
                <div className="mb-8 grid gap-8 lg:grid-cols-2">
                    {/* Product image skeleton */}
                    <div className="aspect-square animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />

                    {/* Product info skeleton */}
                    <div>
                        {/* Deal score badge */}
                        <div className="mb-4 h-8 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

                        {/* Title */}
                        <div className="mb-4 space-y-2">
                            <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Rating */}
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                ))}
                            </div>
                            <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* ASIN */}
                        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                        {/* Price display skeleton */}
                        <div className="mb-6 rounded-xl bg-white p-6 dark:bg-gray-800">
                            <div className="flex items-baseline gap-3">
                                <div className="h-10 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>

                        {/* Quick stats skeleton */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                                <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mx-auto mt-2 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                                <div className="mx-auto h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mx-auto mt-2 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>

                        {/* Buy button skeleton */}
                        <div className="h-14 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
                        <div className="mx-auto mt-3 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>

                {/* Price history chart skeleton */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-8 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                            ))}
                        </div>
                    </div>
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
                                <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mt-2 h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        ))}
                    </div>
                    <div className="h-[300px] w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

            </main>

            <Footer />
        </div>
    );
}
