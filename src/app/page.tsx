import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/lib/sampleData";
import { getLightningDeals, DealPingProduct } from "@/lib/keepa";

// Static page - deals are refreshed once daily via cron job at midnight
// The cron job calls /api/cron/refresh-deals which revalidates this page
export const revalidate = false; // Fully static until revalidated

async function getLightningDealsForHomepage(): Promise<DealPingProduct[]> {
  try {
    // Lightning Deals only - Amazon's official promotions with GUARANTEED
    // strikethrough pricing. No fallback to avoid showing misleading discounts.
    // Max 12 deals for homepage preview, refreshed every 4 hours (3000 tokens/day)
    const result = await getLightningDeals({
      state: 'AVAILABLE',
      minPercentOff: 15,
      minRating: 3.0,
      minReviews: 5,
      limit: 12,
    });

    return result.deals;
  } catch (error) {
    console.error('Error fetching lightning deals from Keepa:', error);
    return [];
  }
}

export default async function Home() {
  const lightningDeals = await getLightningDealsForHomepage();

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
                    Lightning Deals
                  </h2>
                  {lightningDeals.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Live
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Limited-time Amazon deals with verified discounts
                </p>
              </div>
              <a
                href="/lightning-deals"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                View all →
              </a>
            </div>

            {lightningDeals.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {lightningDeals.map((deal) => (
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
                    createdAt={deal.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                  No Lightning Deals Right Now
                </h3>
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                  Lightning deals are time-limited promotions from Amazon. Check back soon or browse our{' '}
                  <a href="/deals" className="font-medium underline hover:no-underline">
                    deals page
                  </a>{' '}
                  for more savings.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Browse by Category
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Find deals in your favourite categories
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
