import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <div className="text-center">
                <div className="mb-6 flex items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                        <svg
                            className="h-7 w-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                        </svg>
                    </div>
                </div>
                <h1 className="mb-2 text-6xl font-bold text-gray-900 dark:text-white">
                    404
                </h1>
                <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
                    Page not found
                </h2>
                <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved. Check out today&apos;s deals instead.
                </p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/deals"
                        className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                        Browse Deals
                    </Link>
                    <Link
                        href="/"
                        className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
