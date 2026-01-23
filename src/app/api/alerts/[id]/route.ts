import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

        const updatedAlert = await prisma.priceAlert.update({
            where: { id },
            data: {
                targetPrice: updates.targetPrice,
                alertOnAnyDrop: updates.alertOnAnyDrop,
                notifyEmail: updates.notifyEmail,
                notifyPush: updates.notifyPush,
                isActive: updates.isActive,
            },
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
