"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <div className="text-center">
                <div className="mb-6 text-6xl">
                    <span role="img" aria-label="Warning">⚠️</span>
                </div>
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Something went wrong
                </h1>
                <p className="mb-8 text-gray-600 dark:text-gray-400">
                    We encountered an error while loading this page.
                    <br />
                    Please try again or go back to the homepage.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <button
                        onClick={reset}
                        className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
