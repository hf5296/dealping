import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Brand */}
                    <div className="md:col-span-1">
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
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Find the best deals on Amazon UK. Track prices, get alerts, and never overpay again.
                        </p>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                            Categories
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: "Electronics", slug: "electronics" },
                                { name: "Gaming", slug: "gaming" },
                                { name: "Home & Garden", slug: "home-garden" },
                                { name: "Health & Beauty", slug: "health-beauty" },
                                { name: "Groceries", slug: "groceries" },
                            ].map((cat) => (
                                <li key={cat.slug}>
                                    <Link
                                        href={`/categories/${cat.slug}`}
                                        className="text-sm text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                                    >
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: "Hot Deals", href: "/deals" },
                                { name: "All Categories", href: "/categories" },
                                { name: "Search Products", href: "/search" },
                                { name: "Price Alerts", href: "/alerts" },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-500 hover:text-emerald-500 dark:text-gray-400"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 dark:border-gray-700 sm:flex-row">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} DealPing. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-400">
                        Prices and availability are subject to change.
                    </p>
                </div>
            </div>
        </footer>
    );
}
