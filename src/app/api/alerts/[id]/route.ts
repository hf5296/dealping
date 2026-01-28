import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rateLimit";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/alerts/[id] - Update an alert
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        // Rate limit: 10 req/min for PATCH
        const rl = checkRateLimit(session.user.id, "alerts-patch", { limit: 10, windowSeconds: 60 });
        if (!rl.allowed) return rateLimitExceeded(rl);

        // Verify ownership
        const existingAlert = await prisma.priceAlert.findUnique({
            where: { id },
        });

        if (!existingAlert) {
            return NextResponse.json(
                { error: "Alert not found" },
                { status: 404 }
            );
        }

        if (existingAlert.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 403 }
            );
        }

        const updates = await request.json();

        // Validate targetPrice if provided
        if (updates.targetPrice !== undefined && updates.targetPrice !== null) {
            if (typeof updates.targetPrice !== 'number' || updates.targetPrice <= 0) {
                return NextResponse.json(
                    { error: "Invalid target price" },
                    { status: 400 }
                );
            }
        }

        // Whitelist allowed fields
        const data: Record<string, unknown> = {};
        if (updates.targetPrice !== undefined) data.targetPrice = updates.targetPrice;
        if (typeof updates.alertOnAnyDrop === 'boolean') data.alertOnAnyDrop = updates.alertOnAnyDrop;
        if (typeof updates.notifyEmail === 'boolean') data.notifyEmail = updates.notifyEmail;
        if (typeof updates.notifyPush === 'boolean') data.notifyPush = updates.notifyPush;
        if (typeof updates.isActive === 'boolean') data.isActive = updates.isActive;

        const updatedAlert = await prisma.priceAlert.update({
            where: { id },
            data,
        });

        return NextResponse.json(updatedAlert);
    } catch (error) {
        console.error("Failed to update alert:", error);
        return NextResponse.json(
            { error: "Failed to update alert" },
            { status: 500 }
        );
    }
}

// DELETE /api/alerts/[id] - Delete an alert
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        // Rate limit: 10 req/min for DELETE
        const rl = checkRateLimit(session.user.id, "alerts-delete", { limit: 10, windowSeconds: 60 });
        if (!rl.allowed) return rateLimitExceeded(rl);

        // Verify ownership
        const existingAlert = await prisma.priceAlert.findUnique({
            where: { id },
        });

        if (!existingAlert) {
            return NextResponse.json(
                { error: "Alert not found" },
                { status: 404 }
            );
        }

        if (existingAlert.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 403 }
            );
        }

        await prisma.priceAlert.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete alert:", error);
        return NextResponse.json(
            { error: "Failed to delete alert" },
            { status: 500 }
        );
    }
}
