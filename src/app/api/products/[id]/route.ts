import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/[id] - Get single product with full price history
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                prices: {
                    orderBy: { recordedAt: "desc" },
                    include: {
                        retailer: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Get all prices for this product to calculate stats
        const allPrices = product.prices.map((p) => p.price);
        const currentLowestPrice = Math.min(...allPrices);
        const allTimeHigh = Math.max(...allPrices);
        const allTimeLow = Math.min(...allPrices);
        const averagePrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

        // Calculate deal score
        let dealScore: "good" | "average" | "bad" = "average";
        const percentFromAverage = ((averagePrice - currentLowestPrice) / averagePrice) * 100;
        if (percentFromAverage > 10) dealScore = "good";
        else if (percentFromAverage < -5) dealScore = "bad";

        // Group prices by retailer (latest only for comparison table)
        const retailerPrices = new Map();
        product.prices.forEach((p) => {
            if (!retailerPrices.has(p.retailer.id)) {
                retailerPrices.set(p.retailer.id, {
                    name: p.retailer.name,
                    slug: p.retailer.slug,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    inStock: p.inStock,
                    url: p.url,
                    affiliateUrl: p.affiliateUrl,
                    lastChecked: p.recordedAt,
                });
            }
        });

        // Sort retailers by price (lowest first)
        const sortedRetailers = Array.from(retailerPrices.values()).sort(
            (a, b) => a.price - b.price
        );

        // Generate price history (group by date for chart)
        const priceHistory = product.prices.map((p) => ({
            date: p.recordedAt.toISOString().split("T")[0],
            price: p.price,
            retailer: p.retailer.name,
        }));

        return NextResponse.json({
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            category: product.category,
            currentPrice: currentLowestPrice,
            averagePrice,
            allTimeLow,
            allTimeHigh,
            dealScore,
            retailers: sortedRetailers,
            priceHistory,
        });
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}
