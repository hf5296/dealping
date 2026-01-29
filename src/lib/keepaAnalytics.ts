/**
 * Keepa Token Usage Analytics
 *
 * Tracks daily token consumption per endpoint. File-based JSON persistence
 * in .cache/token-usage.json. Auto-flushes every 5 minutes and on process exit.
 * Auto-prunes days older than 90 days.
 */

import * as fs from 'fs';
import * as path from 'path';

const USAGE_FILE = path.join(process.cwd(), '.cache', 'token-usage.json');
const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DAYS = 90;

interface UsageData {
    days: Record<string, Record<string, number>>;
}

// Use globalThis to survive hot-reload in dev without leaking timers/handlers
const ANALYTICS_KEY = '__keepaAnalytics';

interface AnalyticsState {
    data: UsageData;
    dirty: boolean;
    flushTimer: ReturnType<typeof setInterval> | null;
    loaded: boolean;
    handlersRegistered: boolean;
}

function getState(): AnalyticsState {
    if (!(globalThis as Record<string, unknown>)[ANALYTICS_KEY]) {
        (globalThis as Record<string, unknown>)[ANALYTICS_KEY] = {
            data: { days: {} },
            dirty: false,
            flushTimer: null,
            loaded: false,
            handlersRegistered: false,
        } as AnalyticsState;
    }
    return (globalThis as Record<string, unknown>)[ANALYTICS_KEY] as AnalyticsState;
}

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

function ensureCacheDir(): void {
    const dir = path.dirname(USAGE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function load(): void {
    const state = getState();
    if (state.loaded) return;
    state.loaded = true;
    try {
        if (fs.existsSync(USAGE_FILE)) {
            const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.days === 'object') {
                state.data = parsed as UsageData;
            }
        }
    } catch (error) {
        console.error('[KeepaAnalytics] Error loading usage data:', error);
    }
    startAutoFlush();
    registerExitHandlers();
}

function prune(): void {
    const state = getState();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_DAYS);
    const cutoffKey = cutoff.toISOString().split('T')[0];
    let pruned = 0;
    for (const day of Object.keys(state.data.days)) {
        if (day < cutoffKey) {
            delete state.data.days[day];
            pruned++;
        }
    }
    if (pruned > 0) {
        state.dirty = true;
        console.log(`[KeepaAnalytics] Pruned ${pruned} days older than ${MAX_DAYS} days`);
    }
}

function flush(): void {
    const state = getState();
    if (!state.dirty) return;
    try {
        ensureCacheDir();
        const tmpPath = `${USAGE_FILE}.${process.pid}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(state.data, null, 2), { encoding: 'utf-8', mode: 0o600 });
        fs.renameSync(tmpPath, USAGE_FILE);
        state.dirty = false;
    } catch (error) {
        console.error('[KeepaAnalytics] Error flushing usage data:', error);
    }
}

function startAutoFlush(): void {
    const state = getState();
    if (state.flushTimer) return;
    state.flushTimer = setInterval(() => {
        prune();
        flush();
    }, FLUSH_INTERVAL_MS);
    if (state.flushTimer && typeof state.flushTimer === 'object' && 'unref' in state.flushTimer) {
        state.flushTimer.unref();
    }
}

function registerExitHandlers(): void {
    const state = getState();
    if (state.handlersRegistered) return;
    state.handlersRegistered = true;

    if (typeof process !== 'undefined') {
        process.on('exit', () => flush());
        process.on('SIGINT', () => { flush(); process.exit(0); });
        process.on('SIGTERM', () => { flush(); process.exit(0); });
    }
}

/**
 * Record token usage for an endpoint (call on cache miss only).
 */
export function recordTokenUsage(endpoint: string, tokens: number): void {
    load();
    const state = getState();
    const today = getTodayKey();
    if (!state.data.days[today]) {
        state.data.days[today] = { total: 0 };
    }
    const day = state.data.days[today];
    day[endpoint] = (day[endpoint] || 0) + tokens;
    day.total = (day.total || 0) + tokens;
    state.dirty = true;
}

/**
 * Get usage summary with daily breakdown and computed averages.
 */
export function getUsageSummary(): {
    averagePerDay: Record<string, number>;
    today: Record<string, number>;
    daysTracked: number;
    days: Record<string, Record<string, number>>;
} {
    load();
    prune();

    const state = getState();
    const dayKeys = Object.keys(state.data.days).sort();
    const daysTracked = dayKeys.length;
    const today = getTodayKey();
    const todayData = state.data.days[today] || {};

    // Compute averages across all tracked days
    const totals: Record<string, number> = {};
    for (const dayKey of dayKeys) {
        const day = state.data.days[dayKey];
        for (const [endpoint, tokens] of Object.entries(day)) {
            totals[endpoint] = (totals[endpoint] || 0) + tokens;
        }
    }

    const averagePerDay: Record<string, number> = {};
    if (daysTracked > 0) {
        for (const [endpoint, total] of Object.entries(totals)) {
            averagePerDay[endpoint] = Math.round(total / daysTracked);
        }
    }

    return {
        averagePerDay,
        today: todayData,
        daysTracked,
        days: state.data.days,
    };
}
