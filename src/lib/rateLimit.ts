/**
 * Simple in-memory rate limiter for API endpoints
 * 
 * For production with multiple instances, use Redis-based rate limiting instead.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Check if a request is rate limited
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param endpoint - The API endpoint being accessed
 * @param options - Rate limit configuration
 */
export function checkRateLimit(
    identifier: string,
    endpoint: string,
    options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;

    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetTime < now) {
        // First request or window expired
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            allowed: true,
            remaining: options.limit - 1,
            resetIn: options.windowSeconds,
        };
    }

    if (existing.count >= options.limit) {
        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((existing.resetTime - now) / 1000),
        };
    }

    // Increment count
    existing.count++;
    return {
        allowed: true,
        remaining: options.limit - existing.count,
        resetIn: Math.ceil((existing.resetTime - now) / 1000),
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
    // Check various headers for the real IP
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    // Fallback (won't be accurate behind proxy)
    return "unknown";
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
    return {
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetIn),
    };
}

/**
 * Rate limit error response
 */
export function rateLimitExceeded(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            error: "Too many requests",
            retryAfter: result.resetIn,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(result.resetIn),
                ...rateLimitHeaders(result),
            },
        }
    );
}
