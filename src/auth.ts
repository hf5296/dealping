import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = (credentials.email as string).toLowerCase().trim();
                const password = credentials.password as string;

                // Rate limit login attempts: 5 per 5 minutes per email
                const rateLimit = checkRateLimit(email, "login", { limit: 5, windowSeconds: 300 });
                if (!rateLimit.allowed) {
                    throw new Error("Too many login attempts. Please try again later.");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 3 * 24 * 60 * 60, // 3 days
    },
    pages: {
        signIn: "/auth/signin",
        newUser: "/auth/signup",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                if (!user.email) return false;

                // Find or create user for Google sign-in
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) {
                    // Check if this Google account is already linked
                    const existingAccount = await prisma.account.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        },
                    });

                    if (!existingAccount) {
                        // If the user has a password (credentials account) but no
                        // Google link yet, block auto-linking to prevent account takeover.
                        // They must sign in with their password instead.
                        if (existingUser.password) {
                            return "/auth/signin?error=EmailExists";
                        }

                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                refresh_token: account.refresh_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                            },
                        });
                    }

                    // Update name/image if missing
                    if (!existingUser.name || !existingUser.image) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: existingUser.name || user.name,
                                image: existingUser.image || user.image,
                            },
                        });
                    }

                    user.id = existingUser.id;
                } else {
                    // Create new user
                    const newUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            accounts: {
                                create: {
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    access_token: account.access_token,
                                    refresh_token: account.refresh_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                },
                            },
                        },
                    });

                    user.id = newUser.id;
                }
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;

                // On sign-in, snapshot the current passwordChangedAt into the token
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id as string },
                        select: { passwordChangedAt: true },
                    });
                    token.pwChangedAt = dbUser?.passwordChangedAt?.getTime() ?? 0;
                } catch {
                    token.pwChangedAt = 0;
                }
                token.lastPwCheck = Date.now();
            }

            // Periodically re-check passwordChangedAt (every 5 minutes)
            const RECHECK_INTERVAL = 5 * 60 * 1000;
            const lastCheck = (token.lastPwCheck as number) || 0;
            if (token.id && Date.now() - lastCheck > RECHECK_INTERVAL) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { passwordChangedAt: true },
                    });
                    const dbPwChanged = dbUser?.passwordChangedAt?.getTime() ?? 0;
                    token.lastPwCheck = Date.now();

                    // If password was changed after this token's snapshot, invalidate
                    if (dbPwChanged > (token.pwChangedAt as number)) {
                        return { ...token, invalid: true };
                    }
                } catch {
                    // DB unavailable — skip check, don't break the session
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token.invalid) {
                // Session invalidated due to password change
                return { ...session, user: undefined } as unknown as typeof session;
            }
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
