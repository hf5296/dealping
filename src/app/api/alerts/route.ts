import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rateLimit";

// GET /api/alerts - Get user's price alerts
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in to view alerts" },
                { status: 401 }
            );
        }

        // Rate limit: 30 req/min for GET
        const rl = checkRateLimit(session.user.id, "alerts-get", { limit: 30, windowSeconds: 60 });
        if (!rl.allowed) return rateLimitExceeded(rl);

        const alerts = await prisma.priceAlert.findMany({
            where: { userId: session.user.id },
            include: {
                product: {
                    include: {
                        prices: {
                            orderBy: { recordedAt: "desc" },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const transformedAlerts = alerts.map((alert) => {
            const latestPrice = alert.product.prices[0];
            return {
                id: alert.id,
                productId: alert.productId,
                productName: alert.product.name,
                productImage: alert.product.imageUrl,
                asin: alert.product.asin,
                targetPrice: alert.targetPrice,
                alertOnAnyDrop: alert.alertOnAnyDrop,
                notifyEmail: alert.notifyEmail,
                notifyPush: alert.notifyPush,
                isActive: alert.isActive,
                currentPrice: latestPrice?.price || null,
                lastNotified: alert.lastNotified,
                createdAt: alert.createdAt,
            };
        });

        return NextResponse.json(transformedAlerts);
    } catch (error) {
        console.error("Failed to fetch alerts:", error);
        return NextResponse.json(
            { error: "Failed to fetch alerts" },
            { status: 500 }
        );
    }
}

// POST /api/alerts - Create a new price alert
// Accepts ASIN + product info, auto-creates Product in DB
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in to create alerts" },
                { status: 401 }
            );
        }

        // Rate limit: 10 req/min for POST
        const rl = checkRateLimit(session.user.id, "alerts-post", { limit: 10, windowSeconds: 60 });
        if (!rl.allowed) return rateLimitExceeded(rl);

        const body = await request.json();
        const {
            asin,
            productName,
            imageUrl,
            currentPrice,
            targetPrice,
            alertOnAnyDrop = true,
            notifyEmail = true,
            notifyPush = false,
        } = body;

        if (!asin) {
            return NextResponse.json(
                { error: "Product ASIN is required" },
                { status: 400 }
            );
        }

        // Validate targetPrice if provided
        if (targetPrice !== undefined && targetPrice !== null) {
            if (typeof targetPrice !== 'number' || !Number.isFinite(targetPrice) || targetPrice <= 0) {
                return NextResponse.json(
                    { error: "Invalid target price" },
                    { status: 400 }
                );
            }
        }

        // Validate at least one trigger condition is set
        if (!targetPrice && !alertOnAnyDrop) {
            return NextResponse.json(
                { error: "Please set a target price or enable alert on any drop" },
                { status: 400 }
            );
        }

        // Upsert the product by ASIN (avoids race condition with concurrent requests)
        const product = await prisma.product.upsert({
            where: { asin },
            update: {},
            create: {
                asin,
                name: productName || "Unknown Product",
                imageUrl: imageUrl || null,
            },
        });

        // Store initial price record if we have a price (skip if one exists today)
        if (currentPrice && currentPrice > 0) {
            const retailer = await prisma.retailer.upsert({
                where: { slug: "amazon-uk" },
                update: {},
                create: {
                    name: "Amazon UK",
                    slug: "amazon-uk",
                    affiliateNetwork: "amazon",
                    affiliateId: "dealping0d-21",
                },
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingRecord = await prisma.priceRecord.findFirst({
                where: {
                    productId: product.id,
                    retailerId: retailer.id,
                    recordedAt: { gte: today },
                },
            });

            if (!existingRecord) {
                await prisma.priceRecord.create({
                    data: {
                        productId: product.id,
                        retailerId: retailer.id,
                        price: currentPrice,
                        url: `https://www.amazon.co.uk/dp/${asin}`,
                        affiliateUrl: `https://www.amazon.co.uk/dp/${asin}?tag=dealping0d-21`,
                    },
                });
            }
        }

        // Upsert alert — atomically creates or updates
        const alert = await prisma.priceAlert.upsert({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id,
                },
            },
            update: {
                targetPrice: targetPrice || null,
                alertOnAnyDrop: alertOnAnyDrop,
                notifyEmail: notifyEmail,
                notifyPush: notifyPush,
                isActive: true,
            },
            create: {
                userId: session.user.id,
                productId: product.id,
                targetPrice: targetPrice || null,
                alertOnAnyDrop: alertOnAnyDrop,
                notifyEmail: notifyEmail,
                notifyPush: notifyPush,
            },
        });

        return NextResponse.json({ alert }, { status: 201 });
    } catch (error) {
        console.error("Failed to create alert:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
