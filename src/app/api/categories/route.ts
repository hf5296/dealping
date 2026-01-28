import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

// GET /api/categories - List all categories with product counts
export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "categories", { limit: 60, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: "asc" },
        });

        const transformedCategories = categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            color: cat.color,
            productCount: cat._count.products,
        }));

        return NextResponse.json(transformedCategories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
