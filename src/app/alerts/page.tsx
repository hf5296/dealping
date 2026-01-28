"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Alert {
    id: string;
    productId: string;
    productName: string;
    productImage: string | null;
    asin: string | null;
    targetPrice: number | null;
    alertOnAnyDrop: boolean;
    notifyEmail: boolean;
    notifyPush: boolean;
    isActive: boolean;
    currentPrice: number | null;
    lastNotified: string | null;
    createdAt: string;
}

export default function AlertsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/signin?callbackUrl=/alerts");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user) {
            fetchAlerts();
        }
    }, [session]);

    const fetchAlerts = async () => {
        try {
            setError(null);
            const res = await fetch("/api/alerts");
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            } else {
                setError("Failed to load your alerts. Please try refreshing the page.");
            }
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
            setError("Failed to load your alerts. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleAlert = async (alertId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/alerts/${alertId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (res.ok) {
                setAlerts((prev) =>
                    prev.map((a) =>
                        a.id === alertId ? { ...a, isActive: !isActive } : a
                    )
                );
            }
        } catch (error) {
            console.error("Failed to toggle alert:", error);
        }
    };

    const deleteAlert = async (alertId: string) => {
        if (!confirm("Are you sure you want to delete this alert?")) return;

        try {
            const res = await fetch(`/api/alerts/${alertId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setAlerts((prev) => prev.filter((a) => a.id !== alertId));
            }
        } catch (error) {
            console.error("Failed to delete alert:", error);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center py-32">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        🔔 Your Price Alerts
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Get notified when prices drop on products you&apos;re watching
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                {alerts.length === 0 && !error ? (
                    <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <svg
                                className="h-8 w-8 text-emerald-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                            No alerts yet
                        </h3>
                        <p className="mb-4 text-gray-500 dark:text-gray-400">
                            Browse products and click &quot;Set Price Alert&quot; to get notified of price drops
                        </p>
                        <Link
                            href="/"
                            className="inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`rounded-2xl border bg-white p-6 dark:bg-gray-800 ${alert.isActive
                                        ? "border-gray-200 dark:border-gray-700"
                                        : "border-gray-100 opacity-60 dark:border-gray-800"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Product info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {!alert.isActive && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700">
                                                    Paused
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/product/${alert.asin || alert.productId}`}
                                            className="mt-1 block text-lg font-semibold text-gray-900 hover:text-emerald-500 dark:text-white"
                                        >
                                            {alert.productName}
                                        </Link>

                                        {/* Alert settings */}
                                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                                            {alert.targetPrice ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-emerald-500">£{alert.targetPrice.toFixed(2)}</span>
                                                    target
                                                </span>
                                            ) : (
                                                <span>Alert on any drop</span>
                                            )}
                                            <span className="text-gray-300">•</span>
                                            <span className="flex items-center gap-1">
                                                {alert.notifyEmail && "📧"}
                                                {alert.notifyPush && "🔔"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Current price & actions */}
                                    <div className="text-right">
                                        {alert.currentPrice && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-400">Current price</p>
                                                <p className="text-xl font-bold text-emerald-600">
                                                    £{alert.currentPrice.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-400">Amazon UK</p>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleAlert(alert.id, alert.isActive)}
                                                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${alert.isActive
                                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    }`}
                                            >
                                                {alert.isActive ? "Pause" : "Resume"}
                                            </button>
                                            <button
                                                onClick={() => deleteAlert(alert.id)}
                                                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* Tips section */}
                <div className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-900/20">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                        💡 How alerts work
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                        <li>• We check prices on Amazon UK regularly</li>
                        <li>• You&apos;ll get an email or push notification when prices drop</li>
                        <li>• Set a target price or get alerted on any price drop</li>
                    </ul>
                </div>
            </main>

            <Footer />
        </div>
    );
}
