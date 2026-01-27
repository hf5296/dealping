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

            </main>

            <Footer />
        </div>
    );
}
