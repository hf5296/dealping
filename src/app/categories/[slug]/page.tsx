import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { categories, featuredDeals } from "@/lib/sampleData";
import { notFound } from "next/navigation";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    // Find the category
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        notFound();
    }

    // In production, this would fetch products for this category
    // For now, use sample data
    const products = featuredDeals;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Category header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                            style={{ backgroundColor: `${category.color}20` }}
                        >
                            {category.icon}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                                {category.name}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                {category.productCount.toLocaleString()} products tracked
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subcategories */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {["All", "Best Deals", "Under £50", "Under £100", "Popular"].map(
                        (sub, idx) => (
                            <button
                                key={sub}
                                className={`rounded-full px-4 py-2 text-sm font-medium ${idx === 0
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
                                    }`}
                            >
                                {sub}
                            </button>
                        )
                    )}
                </div>

                {/* Sort and filter bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sort by:
                        </span>
                        <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                            <option>Best Deal</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Biggest Discount</option>
                            <option>Most Popular</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Showing {products.length} results
                        </span>
                    </div>
                </div>

                {/* Products grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.name}
                            imageUrl={product.imageUrl}
                            currentPrice={product.currentPrice}
                            originalPrice={product.originalPrice}
                            retailer={product.retailer}
                            dealScore={product.dealScore}
                            percentOff={product.percentOff}
                        />
                    ))}
                </div>

                {/* Load more */}
                <div className="mt-8 text-center">
                    <button className="rounded-xl bg-gray-100 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                        Load More Products
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
