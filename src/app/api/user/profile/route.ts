import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/profile - Fetch user profile
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                _count: {
                    select: {
                        alerts: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            activeAlerts: user._count.alerts,
        });
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// PATCH /api/user/profile - Update user name
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name } = body;

        if (typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        if (name.trim().length > 100) {
            return NextResponse.json(
                { error: "Name must be 100 characters or less" },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Failed to update profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
