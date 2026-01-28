"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SearchBar from "./SearchBar";

export default function Header() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <header className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                            <svg
                                className="h-5 w-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Deal<span className="text-emerald-500">Ping</span>
                        </span>
                    </Link>

                    {/* Search bar - hidden on mobile, shown on larger screens */}
                    <div className="hidden flex-1 max-w-xl mx-8 md:block">
                        <SearchBar placeholder="Search deals on Amazon UK..." />
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-2 sm:flex">
                        <Link
                            href="/categories"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Categories
                        </Link>
                        <Link
                            href="/deals"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Hot Deals
                        </Link>
                        <Link
                            href="/alerts"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Alerts
                        </Link>

                        {session?.user ? (
                            /* User dropdown */
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                                        {userInitial}
                                    </div>
                                    <span className="hidden lg:inline">{userName}</span>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href="/alerts"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            My Alerts
                                        </Link>
                                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                signOut({ callbackUrl: "/" });
                                            }}
                                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile menu button */}
                    <div className="flex items-center gap-2 sm:hidden">
                        <Link
                            href="/alerts"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Alerts
                        </Link>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile search - shown only on mobile */}
                <div className="pb-3 md:hidden">
                    <SearchBar placeholder="Search products..." />
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-gray-200 pb-4 dark:border-gray-700 sm:hidden">
                        <nav className="flex flex-col gap-1 pt-2">
                            <Link
                                href="/deals"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Hot Deals
                            </Link>
                            <Link
                                href="/categories"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Categories
                            </Link>
                            <Link
                                href="/alerts"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Price Alerts
                            </Link>

                            {session?.user ? (
                                <>
                                    <Link
                                        href="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        Profile
                                    </Link>
                                    <div className="mt-2 px-4">
                                        <button
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                signOut({ callbackUrl: "/" });
                                            }}
                                            className="block w-full rounded-xl bg-red-100 py-3 text-center text-base font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-2 flex gap-2 px-4">
                                    <Link
                                        href="/auth/signin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block flex-1 rounded-xl border border-gray-200 py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block flex-1 rounded-xl bg-emerald-500 py-3 text-center text-base font-semibold text-white hover:bg-emerald-600"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
