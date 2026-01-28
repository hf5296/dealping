"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    Invalid Reset Link
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    This password reset link is invalid. Please request a new one.
                </p>
                <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-emerald-500 hover:text-emerald-600"
                >
                    Request new reset link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (res.status === 429) {
                setError("Too many attempts. Please try again later.");
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    Password Reset
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Link
                    href="/auth/signin"
                    className="inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Set new password
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        New password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        maxLength={128}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900
                         focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                         dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Confirm new password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        maxLength={128}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900
                         focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                         dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-white
                     hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                     disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link
                    href="/auth/signin"
                    className="font-medium text-emerald-500 hover:text-emerald-600"
                >
                    Back to sign in
                </Link>
            </div>
        </>
    );
}

export default function ResetPasswordPage() {
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
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <Suspense>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
