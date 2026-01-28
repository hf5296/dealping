"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.status === 429) {
                setError("Too many requests. Please try again later.");
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                return;
            }

            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">Deal<span className="text-emerald-500">Ping</span></span>
                    </Link>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Reset your password
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {submitted ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                                Check your email
                            </h2>
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                                If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox and spam folder.
                            </p>
                            <Link
                                href="/auth/signin"
                                className="text-sm font-medium text-emerald-500 hover:text-emerald-600"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                                Forgot password?
                            </h1>
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900
                                         focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                                         dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-white
                                     hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                                     disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                Remember your password?{" "}
                                <Link
                                    href="/auth/signin"
                                    className="font-medium text-emerald-500 hover:text-emerald-600"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
