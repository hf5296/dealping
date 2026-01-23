import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/lib/sampleData";

export default function CategoriesPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                        Browse All Categories
                    </h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                        Find the best deals across all product categories
                    </p>
                </div>

                {/* Categories grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {categories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            name={category.name}
                            slug={category.slug}
                            icon={category.icon}
                            productCount={category.productCount}
                            color={category.color}
                        />
                    ))}
                </div>

                {/* Stats */}
                <div className="mt-16 rounded-2xl bg-emerald-500 p-8 text-center text-white">
                    <h2 className="text-2xl font-bold">
                        Over 500,000 Products Tracked
                    </h2>
                    <p className="mt-2 text-emerald-100">
                        We track prices from 25+ UK retailers including Amazon, Currys, Argos, Tesco, and more.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
