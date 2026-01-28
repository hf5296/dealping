"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SetAlertButton from "@/components/SetAlertButton";
import { extractAsin } from "@/lib/asin";

interface TrackedProduct {
    asin: string;
    name: string;
    imageUrl: string;
    currentPrice: number;
    originalPrice: number;
    percentOff: number;
    rating?: number;
}

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

    // Track product state
    const [trackUrl, setTrackUrl] = useState("");
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackError, setTrackError] = useState("");
    const [trackedProduct, setTrackedProduct] = useState<TrackedProduct | null>(null);

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

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setTrackError("");
        setTrackedProduct(null);

        const asin = extractAsin(trackUrl);
        if (!asin) {
            setTrackError(
                "Could not find a product ID. Paste a full Amazon UK link (e.g. amazon.co.uk/dp/B0...) or enter a 10-character ASIN."
            );
            return;
        }

        setTrackLoading(true);
        try {
            const res = await fetch(`/api/keepa/product/${asin}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                setTrackError(data.error || "Product not found. Please check the URL and try again.");
                return;
            }

            setTrackedProduct({
                asin: data.product.asin || data.product.id,
                name: data.product.name,
                imageUrl: data.product.imageUrl,
                currentPrice: data.product.currentPrice,
                originalPrice: data.product.originalPrice,
                percentOff: data.product.percentOff,
                rating: data.product.rating,
            });
        } catch {
            setTrackError("Something went wrong. Please try again.");
        } finally {
            setTrackLoading(false);
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

                {/* Track a product section */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                        Track Any Product
                    </h2>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        Paste an Amazon UK link to track its price and get notified when it drops.
                    </p>

                    <form onSubmit={handleTrack} className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                            <svg
                                className="h-4 w-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={trackUrl}
                            onChange={(e) => setTrackUrl(e.target.value)}
                            placeholder="https://www.amazon.co.uk/dp/B0... or ASIN"
                            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-24 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={trackLoading || !trackUrl.trim()}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {trackLoading ? "Looking up..." : "Track"}
                        </button>
                    </form>

                    {trackError && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {trackError}
                        </div>
                    )}

                    {trackLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        </div>
                    )}

                    {trackedProduct && !trackLoading && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
                            <div className="flex flex-col sm:flex-row">
                                {/* Image */}
                                <div className="flex items-center justify-center p-4 sm:w-40">
                                    {trackedProduct.imageUrl ? (
                                        <Image
                                            src={trackedProduct.imageUrl}
                                            alt={trackedProduct.name}
                                            width={120}
                                            height={120}
                                            className="object-contain"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600">
                                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-4 pt-0 sm:pt-4">
                                    <h3 className="mb-2 text-sm font-semibold leading-tight text-gray-900 line-clamp-2 dark:text-white">
                                        {trackedProduct.name}
                                    </h3>
                                    <div className="mb-3 flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-emerald-600">
                                            £{trackedProduct.currentPrice.toFixed(2)}
                                        </span>
                                        {trackedProduct.originalPrice > trackedProduct.currentPrice && (
                                            <span className="text-sm text-gray-400 line-through">
                                                £{trackedProduct.originalPrice.toFixed(2)}
                                            </span>
                                        )}
                                        {trackedProduct.percentOff > 0 && (
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                -{trackedProduct.percentOff}%
                                            </span>
                                        )}
                                    </div>
                                    <SetAlertButton
                                        asin={trackedProduct.asin}
                                        productName={trackedProduct.name}
                                        imageUrl={trackedProduct.imageUrl}
                                        currentPrice={trackedProduct.currentPrice}
                                    />
                                    <div className="mt-2">
                                        <Link
                                            href={`/product/${trackedProduct.asin}`}
                                            className="text-xs font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                                        >
                                            View full details & price history &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                        <p className="text-gray-500 dark:text-gray-400">
                            Track any Amazon product above or set an alert from a{" "}
                            <Link href="/deals" className="text-emerald-500 hover:text-emerald-600">deal page</Link>
                        </p>
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
                                            {alert.targetPrice && (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-emerald-500">£{alert.targetPrice.toFixed(2)}</span>
                                                    target
                                                </span>
                                            )}
                                            <span className="text-gray-300">•</span>
                                            {alert.notifyEmail && (
                                                <span className="flex items-center gap-1">
                                                    📧 Email
                                                </span>
                                            )}
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
                        <li>• You&apos;ll get an email notification when prices drop</li>
                        <li>• Set a target price or get alerted on any price drop</li>
                    </ul>
                </div>
            </main>

            <Footer />
        </div>
    );
}
