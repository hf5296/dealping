import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

// GET /api/products - List all products with their latest prices
export async function GET(request: Request) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "products", { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 100);
        const page = Math.min(Math.max(parseInt(searchParams.get("page") || "1") || 1, 1), 1000);

        const where = category
            ? { category: { slug: category } }
            : {};

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                prices: {
                    orderBy: { recordedAt: "desc" },
                    take: 5,
                    include: {
                        retailer: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        const total = await prisma.product.count({ where });

        // Transform products to include computed fields
        const transformedProducts = products.map((product) => {
            const latestPrices = product.prices;
            const lowestPrice = latestPrices.length > 0
                ? Math.min(...latestPrices.map((p) => p.price))
                : null;
            const highestPrice = latestPrices.length > 0
                ? Math.max(...latestPrices.map((p) => p.price))
                : null;
            const averagePrice = latestPrices.length > 0
                ? latestPrices.reduce((sum, p) => sum + p.price, 0) / latestPrices.length
                : null;

            // Calculate deal score
            let dealScore: "good" | "average" | "bad" = "average";
            if (lowestPrice && averagePrice) {
                const percentOff = ((averagePrice - lowestPrice) / averagePrice) * 100;
                if (percentOff > 10) dealScore = "good";
                else if (percentOff < 0) dealScore = "bad";
            }

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                category: product.category,
                currentPrice: lowestPrice,
                originalPrice: highestPrice,
                dealScore,
                retailers: latestPrices.map((p) => ({
                    name: p.retailer.name,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    inStock: p.inStock,
                    url: p.url,
                })),
            };
        });

        return NextResponse.json({
            products: transformedProducts,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
