"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/");
                router.refresh();
            }
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
                        <span className="text-3xl">💰</span>
                        <span className="text-2xl font-bold gradient-text">FindADeal</span>
                    </Link>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Sign in to track prices and get alerts
                    </p>
                </div>

                {/* Sign in form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back
                    </h1>

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

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/auth/signup"
                            className="font-medium text-emerald-500 hover:text-emerald-600"
                        >
                            Sign up for free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
