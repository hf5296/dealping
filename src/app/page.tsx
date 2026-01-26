import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/sampleData";
import { browseDeals, DealPingProduct, PRICE_TYPES } from "@/lib/keepa";

// Revalidate every 5 minutes
export const revalidate = 300;

async function getTodaysBestDeals(): Promise<DealPingProduct[]> {
  try {
    // Use Browse Deals API - more efficient and designed for this purpose
    const result = await browseDeals({
      page: 0,
      minPercentOff: 20,
      sortBy: 'percentOff',
      hasReviews: true,
      priceType: PRICE_TYPES.AMAZON,
      dateRange: 0, // Last 24 hours
    });

    // Filter for valid products and return top 8
    return result.deals
      .filter(d => d.currentPrice > 0 && d.percentOff >= 20)
      .slice(0, 8);
  } catch (error) {
    console.error('Error fetching deals from Keepa:', error);
    return [];
  }
}

export default async function Home() {
  const todaysDeals = await getTodaysBestDeals();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      <main>
        {/* Hero Section - Clean & Professional */}
        <section className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="text-center">
              {/* Main headline */}
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
                Find the Best Deals on Amazon UK
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Track prices, compare deals, and save money. We monitor thousands of products so you don&apos;t have to.
              </p>

              {/* Search bar */}
              <div className="mx-auto mt-8 max-w-xl">
                <SearchBar
                  size="large"
                  placeholder="Search for any product..."
                />
              </div>

              {/* Popular searches */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Popular:</span>
                {["iPhone 15", "PS5", "Air Fryer", "MacBook", "Dyson"].map((term) => (
                  <a
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Today's Best Deals */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Today&apos;s Best Deals
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Price drops from the last 24 hours
                </p>
              </div>
              <a
                href="/deals"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all →
              </a>
            </div>

            {todaysDeals.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {todaysDeals.map((deal) => (
                  <ProductCard
                    key={deal.id}
                    id={deal.id}
                    name={deal.name}
                    imageUrl={deal.imageUrl}
                    currentPrice={deal.currentPrice}
                    originalPrice={deal.originalPrice}
                    retailer={deal.retailer}
                    dealScore={deal.dealScore}
                    percentOff={deal.percentOff}
                    affiliateUrl={deal.affiliateUrl}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Loading today&apos;s deals...
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-gray-100 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Browse by Category
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Find deals in your favourite categories
                </p>
              </div>
              <a
                href="/categories"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                All categories →
              </a>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
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
          </div>
        </section>

        {/* How It Works - Simple */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Search</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Search for any product or browse categories
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Compare</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  See price history and check if it&apos;s a real deal
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Save</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Set price alerts and get notified when prices drop
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Minimal */}
        <section className="border-t border-gray-100 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Never miss a deal
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Create a free account to set price alerts and track your favourite products.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Create Free Account
              </a>
              <a
                href="/deals"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Browse Deals
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
