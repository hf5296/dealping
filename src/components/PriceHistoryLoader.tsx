"use client";

import { useState } from "react";
import PriceHistoryChart from "./PriceHistoryChart";

interface PriceHistoryLoaderProps {
    asin: string;
    currentPrice: number;
}

interface PriceHistoryData {
    history: {
        date: string;
        timestamp: number;
        price: number;
    }[];
    currentPrice: number;
    averagePrice: number;
    allTimeLow: number;
    allTimeHigh: number;
}

export default function PriceHistoryLoader({ asin, currentPrice }: PriceHistoryLoaderProps) {
    const [priceHistory, setPriceHistory] = useState<PriceHistoryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPriceHistory = async () => {
        if (loading || priceHistory) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/keepa/product/${asin}?history=true`);

            if (!response.ok) {
                throw new Error("Failed to load price history");
            }

            const data = await response.json();

            if (data.priceHistory) {
                setPriceHistory(data.priceHistory);
            } else {
                setError("No price history available for this product");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load price history");
        } finally {
            setLoading(false);
        }
    };

    // If already loaded, show the chart
    if (priceHistory) {
        return (
            <PriceHistoryChart
                data={priceHistory.history}
                currentPrice={priceHistory.currentPrice}
                averagePrice={priceHistory.averagePrice}
                allTimeLow={priceHistory.allTimeLow}
                allTimeHigh={priceHistory.allTimeHigh}
            />
        );
    }

    // Show load button
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Price History
                </h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    See how the price has changed over time
                </p>

                {error ? (
                    <div className="mb-4 text-sm text-red-500">{error}</div>
                ) : null}

                <button
                    onClick={loadPriceHistory}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Loading...
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Load Price History
                        </>
                    )}
                </button>

                <p className="mt-3 text-xs text-gray-400">
                    View up to 5 years of price data
                </p>
            </div>
        </div>
    );
}
