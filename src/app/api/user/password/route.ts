import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

// POST /api/user/password - Change password
export async function POST(request: Request) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "password-change", { limit: 5, windowSeconds: 900 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "You must be signed in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "New password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (newPassword.length > 128) {
            return NextResponse.json(
                { error: "Password is too long" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        });

        if (!user?.password) {
            return NextResponse.json(
                { error: "Unable to change password" },
                { status: 400 }
            );
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
        });

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Failed to change password:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
