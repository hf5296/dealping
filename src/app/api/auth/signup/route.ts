import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded } from "@/lib/rateLimit";

export async function POST(request: Request) {
    // Strict rate limit for signup: 5 requests per minute per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip, "signup", { limit: 5, windowSeconds: 60 });
    if (!rateLimit.allowed) {
        return rateLimitExceeded(rateLimit);
    }

    try {
        const { name, email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Validate name field
        if (name !== undefined && name !== null) {
            if (typeof name !== 'string' || name.trim().length > 100) {
                return NextResponse.json(
                    { error: "Name must be 100 characters or less" },
                    { status: 400 }
                );
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
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

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            // Return generic error to prevent email enumeration
            return NextResponse.json(
                { error: "Unable to create account. Please try again or sign in." },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: name ? name.trim() : null,
                email: normalizedEmail,
                password: hashedPassword,
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        );
    }
}
