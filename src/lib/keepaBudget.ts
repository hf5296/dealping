/**
 * Global Keepa Token Budget (Circuit Breaker)
 *
 * Models Keepa's actual token bucket: a pool that refills at a steady rate.
 * Budget checks are placed inside keepa.ts, right before actual API fetch
 * calls (after cache checks), so cached responses are never penalised.
 *
 * Two modes:
 *   - User-facing (API routes): set `userFacing: true` → enforces budget,
 *     throws BudgetExhaustedError when exhausted.
 *   - Internal (SSR, cron): omit the flag → budget is not enforced,
 *     the call goes straight to Keepa.
 */

export class BudgetExhaustedError extends Error {
    public retryAfterSeconds: number;

    constructor(retryAfterSeconds: number) {
        super('Keepa token budget exhausted');
        this.name = 'BudgetExhaustedError';
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// Keepa plan limits (configurable via env)
const MAX_TOKENS = parseInt(process.env.KEEPA_MAX_TOKENS || '1200', 10);
const REFILL_PER_MINUTE = parseInt(process.env.KEEPA_REFILL_PER_MINUTE || '20', 10);

// Reserve tokens for cron/SSR (not available to user-facing API routes)
// Default 600 = enough for 1 lightning deals refresh (500) + headroom
const RESERVE_TOKENS = parseInt(process.env.KEEPA_RESERVE_TOKENS || '600', 10);

// The budget available to user-facing API routes
const USER_BUDGET = MAX_TOKENS - RESERVE_TOKENS;

// Token bucket state
let tokens = USER_BUDGET;
let lastRefillTime = Date.now();

/**
 * Refill tokens based on elapsed time
 */
function refill(): void {
    const now = Date.now();
    const elapsedMinutes = (now - lastRefillTime) / 60_000;
    if (elapsedMinutes > 0) {
        tokens = Math.min(USER_BUDGET, tokens + elapsedMinutes * REFILL_PER_MINUTE);
        lastRefillTime = now;
    }
}

/**
 * Try to consume tokens from the user-facing budget.
 * Only deducts if `userFacing` is true. Otherwise, it's a no-op.
 *
 * @param cost - Number of Keepa tokens this API call will consume
 * @param userFacing - If true, enforce the budget (API route context)
 */
export function consumeTokenBudget(cost: number, userFacing: boolean): void {
    if (!userFacing) return; // Internal calls (SSR, cron) bypass the budget

    refill();

    if (tokens < cost) {
        const deficit = cost - tokens;
        const retryAfterSeconds = Math.ceil((deficit / REFILL_PER_MINUTE) * 60);
        console.warn(
            `[KeepaBudget] Budget exhausted (${Math.floor(tokens)}/${USER_BUDGET} available, ` +
            `need ${cost}). Retry in ${retryAfterSeconds}s.`
        );
        throw new BudgetExhaustedError(Math.max(retryAfterSeconds, 1));
    }

    tokens -= cost;
}

/**
 * Get current budget status (for monitoring/debugging)
 */
export function getBudgetStatus(): {
    available: number;
    maxBudget: number;
    reservedForCron: number;
    refillRate: number;
} {
    refill();
    return {
        available: Math.floor(tokens),
        maxBudget: USER_BUDGET,
        reservedForCron: RESERVE_TOKENS,
        refillRate: REFILL_PER_MINUTE,
    };
}
