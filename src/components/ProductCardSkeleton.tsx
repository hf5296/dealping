export default function ProductCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            {/* Image area */}
            <div className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />

            {/* Info area */}
            <div className="p-4">
                {/* Retailer */}
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                {/* Product name (2 lines) */}
                <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Buttons */}
                <div className="mt-3 flex gap-2">
                    <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
        </div>
    );
}
