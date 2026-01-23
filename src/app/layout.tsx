import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DealPing - UK Price Comparison & Deal Finder",
  description: "Find the best prices across UK retailers. Track prices, get deal alerts, and never overpay again. Compare prices from Amazon, Currys, Argos, Tesco, and 20+ more stores.",
  keywords: "UK deals, price comparison, price tracker, deal finder, UK shopping, price alerts, dealping",
  openGraph: {
    title: "DealPing - UK Price Comparison & Deal Finder",
    description: "Find the best prices across UK retailers. Track prices, get deal alerts, and never overpay again.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

