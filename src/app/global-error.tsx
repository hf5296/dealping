"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
                    <div className="text-center">
                        <div className="mb-6 text-6xl">
                            <span role="img" aria-label="Error">💥</span>
                        </div>
                        <h1 className="mb-4 text-2xl font-bold text-gray-900">
                            Something went very wrong
                        </h1>
                        <p className="mb-8 text-gray-600">
                            A critical error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={reset}
                            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
