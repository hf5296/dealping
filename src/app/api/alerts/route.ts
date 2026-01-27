import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

        // Find or create the product by ASIN
        let product = await prisma.product.findUnique({
            where: { asin },
        });

        if (!product) {
            product = await prisma.product.create({
                data: {
                    asin,
                    name: productName || "Unknown Product",
                    imageUrl: imageUrl || null,
                },
            });

            // Store initial price record if we have a price
            if (currentPrice && currentPrice > 0) {
                // Ensure Amazon UK retailer exists
                const retailer = await prisma.retailer.upsert({
                    where: { slug: "amazon-uk" },
                    update: {},
                    create: {
                        name: "Amazon UK",
                        slug: "amazon-uk",
                        affiliateNetwork: "amazon",
                        affiliateId: "findadeal0a-21",
                    },
                });

                await prisma.priceRecord.create({
                    data: {
                        productId: product.id,
                        retailerId: retailer.id,
                        price: currentPrice,
                        url: `https://www.amazon.co.uk/dp/${asin}`,
                        affiliateUrl: `https://www.amazon.co.uk/dp/${asin}?tag=findadeal0a-21`,
                    },
                });
            }
        }

        // Check if alert already exists for this user/product
        const existingAlert = await prisma.priceAlert.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id,
                },
            },
        });

        if (existingAlert) {
            const updatedAlert = await prisma.priceAlert.update({
                where: { id: existingAlert.id },
                data: {
                    targetPrice: targetPrice || null,
                    alertOnAnyDrop: alertOnAnyDrop,
                    notifyEmail: notifyEmail,
                    notifyPush: notifyPush,
                    isActive: true,
                },
            });

            return NextResponse.json({ alert: updatedAlert, updated: true });
        }

        const alert = await prisma.priceAlert.create({
            data: {
                userId: session.user.id,
                productId: product.id,
                targetPrice: targetPrice || null,
                alertOnAnyDrop: alertOnAnyDrop,
                notifyEmail: notifyEmail,
                notifyPush: notifyPush,
            },
        });

        return NextResponse.json({ alert, created: true }, { status: 201 });
    } catch (error) {
        console.error("Failed to create alert:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
