import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

export async function POST(request: Request) {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, "reset-password", { limit: 5, windowSeconds: 300 });
    if (!rateLimit.allowed) {
        return rateLimitExceeded(rateLimit);
    }

    try {
        const { token, password } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Reset token is required" },
                { status: 400 }
            );
        }

        if (!password || typeof password !== "string") {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (password.length > 128) {
            return NextResponse.json(
                { error: "Password is too long" },
                { status: 400 }
            );
        }

        // Hash the provided token to match against stored hash
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // Find token by hash
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token: tokenHash },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset link. Please request a new one." },
                { status: 400 }
            );
        }

        // Check expiry — return same error as "not found" to prevent token enumeration
        if (verificationToken.expires < new Date()) {
            await prisma.verificationToken.delete({
                where: { token: tokenHash },
            });
            return NextResponse.json(
                { error: "Invalid or expired reset link. Please request a new one." },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired reset link. Please request a new one." },
                { status: 400 }
            );
        }

        // Hash new password and update user
        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
        });

        // Delete all tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { identifier: verificationToken.identifier },
        });

        return NextResponse.json({
            message: "Password has been reset successfully. You can now sign in.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
