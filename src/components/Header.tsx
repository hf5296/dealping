import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Header() {
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
                    <div className="hidden flex-1 max-w-xl mx-8 lg:block">
                        <SearchBar placeholder="Search products across UK retailers..." />
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-2">
                        <Link
                            href="/categories"
                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 
                dark:text-gray-300 dark:hover:bg-gray-800 sm:block"
                        >
                            Categories
                        </Link>
                        <Link
                            href="/deals"
                            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 
                dark:text-gray-300 dark:hover:bg-gray-800 sm:block"
                        >
                            Hot Deals
                        </Link>
                        <Link
                            href="/alerts"
                            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 
                dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                            {/* Notification badge */}
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                                3
                            </span>
                        </Link>
                        <Link
                            href="/auth/signin"
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white 
                hover:bg-emerald-600"
                        >
                            Sign In
                        </Link>
                    </nav>
                </div>

                {/* Mobile search - shown only on mobile */}
                <div className="pb-3 lg:hidden">
                    <SearchBar placeholder="Search products..." />
                </div>
            </div>
        </header>
    );
}
