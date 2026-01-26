import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DealPing - UK Amazon Deals & Price Tracker",
    template: "%s | DealPing",
  },
  description: "Find the best Amazon UK deals with real-time price tracking. Discover lightning deals, price drops, and verified discounts. Save money with DealPing.",
  keywords: "UK deals, Amazon deals, price tracker, deal finder, UK shopping, price alerts, dealping, amazon uk, lightning deals",
  authors: [{ name: "DealPing" }],
  creator: "DealPing",
  metadataBase: new URL("https://dealping.co.uk"),
  openGraph: {
    title: "DealPing - UK Amazon Deals & Price Tracker",
    description: "Find the best Amazon UK deals with real-time price tracking. Discover lightning deals, price drops, and verified discounts.",
    url: "https://dealping.co.uk",
    siteName: "DealPing",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DealPing - UK Amazon Deals & Price Tracker",
    description: "Find the best Amazon UK deals with real-time price tracking.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="pb-16 sm:pb-0">{children}</div>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}

