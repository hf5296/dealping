import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Get absolute path to database (it's in project root, not prisma folder)
const dbPath = path.resolve(process.cwd(), "dev.db");

// Create the Prisma adapter with the database URL
const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
});

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit due to hot reloading.
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
