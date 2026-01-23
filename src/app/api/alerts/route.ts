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
                        category: true,
                        prices: {
                            orderBy: { recordedAt: "desc" },
                            take: 1,
                            include: { retailer: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Transform alerts with current price info
        const transformedAlerts = alerts.map((alert) => {
            const latestPrice = alert.product.prices[0];
            return {
                id: alert.id,
                productId: alert.productId,
                productName: alert.product.name,
                productImage: alert.product.imageUrl,
                category: alert.product.category.name,
                targetPrice: alert.targetPrice,
                alertOnAnyDrop: alert.alertOnAnyDrop,
                notifyEmail: alert.notifyEmail,
                notifyPush: alert.notifyPush,
                isActive: alert.isActive,
                currentPrice: latestPrice?.price || null,
                retailer: latestPrice?.retailer.name || null,
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
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in to create alerts" },
                { status: 401 }
            );
        }

        const { productId, targetPrice, alertOnAnyDrop, notifyEmail, notifyPush } =
            await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if alert already exists for this user/product
        const existingAlert = await prisma.priceAlert.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId,
                },
            },
        });

        if (existingAlert) {
            // Update existing alert
            const updatedAlert = await prisma.priceAlert.update({
                where: { id: existingAlert.id },
                data: {
                    targetPrice: targetPrice || null,
                    alertOnAnyDrop: alertOnAnyDrop ?? true,
                    notifyEmail: notifyEmail ?? true,
                    notifyPush: notifyPush ?? true,
                    isActive: true,
                },
            });

            return NextResponse.json(updatedAlert);
        }

        // Create new alert
        const alert = await prisma.priceAlert.create({
            data: {
                userId: session.user.id,
                productId,
                targetPrice: targetPrice || null,
                alertOnAnyDrop: alertOnAnyDrop ?? true,
                notifyEmail: notifyEmail ?? true,
                notifyPush: notifyPush ?? true,
            },
        });

        return NextResponse.json(alert, { status: 201 });
    } catch (error) {
        console.error("Failed to create alert:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
