import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

export async function POST(request: Request) {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, "forgot-password", { limit: 3, windowSeconds: 60 });
    if (!rateLimit.allowed) {
        return rateLimitExceeded(rateLimit);
    }

    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Always return success to prevent email enumeration
        const successResponse = NextResponse.json({
            message: "If an account with that email exists, we've sent a password reset link.",
        });

        // Find user - only credentials users (those with a password) can reset
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
            return successResponse;
        }

        // Delete any existing tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { identifier: email.toLowerCase() },
        });

        // Generate token — store SHA-256 hash in DB, send raw token to user
        const rawToken = crypto.randomBytes(48).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store hashed token (if DB is breached, raw tokens can't be recovered)
        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token: tokenHash,
                expires,
            },
        });

        // Send raw token to user via email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail({
            userEmail: email,
            userName: user.name || undefined,
            resetUrl,
        });

        return successResponse;
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
