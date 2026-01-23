"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            // Create account
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create account");
                return;
            }

            // Sign in automatically
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Account created but failed to sign in. Please sign in manually.");
                router.push("/auth/signin");
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
                        Create an account to start saving
                    </p>
                </div>

                {/* Sign up form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                        Create your account
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Name (optional)
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 
                         focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                         dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                placeholder="Your name"
                            />
                        </div>

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
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 
                         focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                         dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                placeholder="Re-enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-white 
                       hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                       disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{" "}
                        <Link
                            href="/auth/signin"
                            className="font-medium text-emerald-500 hover:text-emerald-600"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Terms */}
                <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
