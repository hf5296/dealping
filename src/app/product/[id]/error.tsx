"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Product page error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 py-8">
                <div className="text-center">
                    <div className="mb-6 text-6xl">
                        <span role="img" aria-label="Package">📦</span>
                    </div>
                    <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Couldn&apos;t load product
                    </h1>
                    <p className="mb-8 text-gray-600 dark:text-gray-400">
                        We had trouble loading this product. It may be temporarily unavailable
                        <br />
                        or the link might be incorrect.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <button
                            onClick={reset}
                            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                            Try Again
                        </button>
                        <a
                            href="/deals"
                            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Browse Deals
                        </a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
