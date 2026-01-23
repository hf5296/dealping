import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { categories, featuredDeals, stats } from "@/lib/sampleData";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 py-20 sm:py-28">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Gradient orbs */}
          <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Tracking 500,000+ products across 25+ UK retailers
              </div>

              {/* Headline */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Never Overpay Again.
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Find the Best UK Deals.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
                Compare prices across Amazon, Currys, Argos, Tesco, and 20+ more UK retailers.
                Set price alerts and track 5 years of price history.
              </p>

              {/* Search bar */}
              <div className="mx-auto max-w-2xl">
                <SearchBar
                  size="large"
                  placeholder="Search for any product... (e.g., iPhone 15, PS5, Air Fryer)"
                />
              </div>

              {/* Popular searches */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">Popular:</span>
                {["iPhone 15", "PS5", "Air Fryer", "MacBook", "4K TV"].map((term) => (
                  <a
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-white/10 px-3 py-1 text-gray-300 hover:bg-white/20 hover:text-white"
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/5 p-6 text-center ring-1 ring-white/10"
                >
                  <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  Browse by Category
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Find deals in your favourite categories
                </p>
              </div>
              <a
                href="/categories"
                className="hidden text-sm font-medium text-emerald-500 hover:text-emerald-600 sm:block"
              >
                View all categories →
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Featured Deals Section */}
        <section className="bg-white py-16 dark:bg-gray-800 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                  </span>
                  Updated just now
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                  Today&apos;s Best Deals
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Hand-picked deals with the biggest savings
                </p>
              </div>
              <a
                href="/deals"
                className="hidden text-sm font-medium text-emerald-500 hover:text-emerald-600 sm:block"
              >
                View all deals →
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDeals.map((deal) => (
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
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                How DealPing Works
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
                Save money in three simple steps
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Search or Browse",
                  description:
                    "Find any product using our search or browse through categories. We track prices from 25+ UK retailers.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  ),
                },
                {
                  step: "2",
                  title: "Compare Prices",
                  description:
                    "See prices from all major retailers side by side. Check 5 years of price history to know if it's a good deal.",
                  icon: (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                },
                {
                  step: "3",
                  title: "Set Alerts & Save",
                  description:
                    "Set a price alert and we'll notify you when the price drops. Never miss a deal again!",
                  icon: (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {item.icon}
                  </div>
                  <div className="mb-2 text-sm font-semibold text-emerald-500">Step {item.step}</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-emerald-600 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Start Saving?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-100">
              Join thousands of savvy UK shoppers who never overpay. Set up price alerts and get notified when prices drop.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-emerald-600 shadow-lg hover:bg-gray-100"
              >
                Create Free Account
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-8 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
