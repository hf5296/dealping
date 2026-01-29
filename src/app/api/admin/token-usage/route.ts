import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUsageSummary } from '@/lib/keepaAnalytics';
import { checkRateLimit, getClientIp, rateLimitExceeded } from '@/lib/rateLimit';

function verifySecret(provided: string, expected: string): boolean {
    const key = 'secret-compare';
    const a = crypto.createHmac('sha256', key).update(provided).digest();
    const b = crypto.createHmac('sha256', key).update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'admin-token-usage', { limit: 10, windowSeconds: 60 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifySecret(token, cronSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = getUsageSummary();

    const format = request.nextUrl.searchParams.get('format');
    if (format === 'text') {
        return new Response(formatAsText(summary), {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    return NextResponse.json(summary);
}

function formatAsText(summary: ReturnType<typeof getUsageSummary>): string {
    const lines: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    lines.push(`Keepa Token Usage (${summary.daysTracked} day${summary.daysTracked !== 1 ? 's' : ''} tracked)`);
    lines.push('');

    // Today
    lines.push(`Today (${today}):`);
    lines.push(formatSection(summary.today));

    // Averages
    lines.push('Average per day:');
    lines.push(formatSection(summary.averagePerDay));

    // Last 7 days breakdown
    const dayKeys = Object.keys(summary.days).sort().reverse();
    const recent = dayKeys.slice(0, 7);
    if (recent.length > 0) {
        lines.push(`Last ${recent.length} days:`);
        for (const day of recent) {
            const total = summary.days[day].total ?? 0;
            lines.push(`  ${day}  ${padLeft(total)} tokens`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

function formatSection(data: Record<string, number>): string {
    const entries = Object.entries(data);
    if (entries.length === 0) return '  (no data)\n';

    const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
    const lines = entries.map(([key, value]) =>
        `  ${key.padEnd(maxKeyLen)}  ${padLeft(value)}`
    );
    return lines.join('\n') + '\n';
}

function padLeft(n: number, width = 6): string {
    return String(n).padStart(width);
}
