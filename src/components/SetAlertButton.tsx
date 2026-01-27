"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SetAlertButtonProps {
    asin: string;
    productName: string;
    imageUrl: string;
    currentPrice: number;
}

export default function SetAlertButton({
    asin,
    productName,
    imageUrl,
    currentPrice,
}: SetAlertButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [targetPrice, setTargetPrice] = useState("");
    const [alertOnAnyDrop, setAlertOnAnyDrop] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!session?.user) {
            router.push(`/auth/signin?callbackUrl=/product/${asin}`);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    asin,
                    productName,
                    imageUrl,
                    currentPrice,
                    targetPrice: targetPrice ? parseFloat(targetPrice) : null,
                    alertOnAnyDrop: !targetPrice || alertOnAnyDrop,
                    notifyEmail: true,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create alert");
            }

            setSuccess(true);
            setShowForm(false);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Alert set! We&apos;ll email you when the price drops.
            </div>
        );
    }

    if (!showForm) {
        return (
            <button
                onClick={() => {
                    if (!session?.user) {
                        router.push(`/auth/signin?callbackUrl=/product/${asin}`);
                        return;
                    }
                    setShowForm(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Set Price Alert
            </button>
        );
    }

    return (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-900/10">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Set Price Alert
                </h4>
                <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Target price (optional)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={`e.g. ${(currentPrice * 0.8).toFixed(2)}`}
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {targetPrice
                            ? `Alert when price drops below £${parseFloat(targetPrice).toFixed(2)}`
                            : "Leave empty to get alerted on any price drop"}
                    </p>
                </div>

                {targetPrice && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                            type="checkbox"
                            checked={alertOnAnyDrop}
                            onChange={(e) => setAlertOnAnyDrop(e.target.checked)}
                            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        Also alert on any price drop
                    </label>
                )}

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                    {loading ? "Setting alert..." : "Confirm Alert"}
                </button>
            </div>
        </div>
    );
}
