import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

// GET /api/search?q=query - Search products
export async function GET(request: Request) {
    // Rate limit: 30 requests per minute per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, "search", { limit: 30, windowSeconds: 60 });
    if (!rateLimit.allowed) {
        return rateLimitExceeded(rateLimit);
    }

    try {
        const { searchParams } = new URL(request.url);
        const query = (searchParams.get("q") || "").slice(0, 200).trim();
        const category = searchParams.get("category");
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 100);
        const page = Math.min(Math.max(parseInt(searchParams.get("page") || "1") || 1, 1), 100);
        const sortBy = searchParams.get("sort") || "relevance";

        // Build where clause
        const where: Record<string, unknown> = {};

        if (query) {
            where.OR = [
                { name: { contains: query } },
                { description: { contains: query } },
            ];
        }

        if (category) {
            where.category = { slug: category };
        }

        // Determine sort order
        let orderBy: Record<string, string> = { createdAt: "desc" };
        if (sortBy === "name") orderBy = { name: "asc" };
        else if (sortBy === "newest") orderBy = { createdAt: "desc" };

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
            orderBy,
        });

        const total = await prisma.product.count({ where });

        // Transform products
        const transformedProducts = products.map((product) => {
            const latestPrices = product.prices;
            const lowestPrice = latestPrices.length > 0
                ? Math.min(...latestPrices.map((p) => p.price))
                : null;
            const highestOriginalPrice = latestPrices
                .filter((p) => p.originalPrice)
                .map((p) => p.originalPrice as number);
            const originalPrice = highestOriginalPrice.length > 0
                ? Math.max(...highestOriginalPrice)
                : lowestPrice;

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

            // Calculate percent off
            const percentOff = originalPrice && lowestPrice && originalPrice > lowestPrice
                ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
                : 0;

            return {
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                category: product.category,
                currentPrice: lowestPrice,
                originalPrice,
                percentOff,
                dealScore,
                retailer: latestPrices[0]?.retailer.name || "Unknown",
            };
        });

        return NextResponse.json({
            products: transformedProducts,
            query,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Failed to search products:", error);
        return NextResponse.json(
            { error: "Failed to search products" },
            { status: 500 }
        );
    }
}
