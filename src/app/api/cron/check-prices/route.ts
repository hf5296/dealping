import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getProduct, generateAffiliateUrl } from '@/lib/keepa';
import { sendPriceDropEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, rateLimitExceeded } from '@/lib/rateLimit';

/**
 * Price Check Cron Job
 *
 * Checks current prices for all products with active alerts.
 * Sends email notifications when prices drop below targets.
 *
 * Token cost: 1 token per unique ASIN (batched, max 100 per Keepa call)
 * Recommended schedule: every 6 hours (4x/day)
 *
 * Usage:
 *   Dev:  curl http://localhost:3000/api/cron/check-prices
 *   Prod: curl -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/check-prices
 */

const MIN_NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // Don't re-notify within 24 hours

function verifySecret(provided: string, expected: string): boolean {
    try {
        return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    // Rate limit: 6 requests per hour
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 'cron-check-prices', { limit: 6, windowSeconds: 3600 });
    if (!rl.allowed) return rateLimitExceeded(rl);

    // Auth check with timing-safe comparison
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = authHeader?.replace('Bearer ', '') || '';

    if (!cronSecret || !verifySecret(providedSecret, cronSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[cron/check-prices] Starting price check...');

        // 1. Get all active alerts with their products
        const activeAlerts = await prisma.priceAlert.findMany({
            where: { isActive: true },
            include: {
                user: { select: { id: true, email: true, name: true } },
                product: {
                    include: {
                        prices: {
                            orderBy: { recordedAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (activeAlerts.length === 0) {
            console.log('[cron/check-prices] No active alerts to check');
            return NextResponse.json({ success: true, checked: 0, notified: 0 });
        }

        // 2. Get unique ASINs to check (avoid duplicate Keepa calls)
        const asinMap = new Map<string, typeof activeAlerts>();
        for (const alert of activeAlerts) {
            const asin = alert.product.asin;
            if (!asin) continue;

            if (!asinMap.has(asin)) {
                asinMap.set(asin, []);
            }
            asinMap.get(asin)!.push(alert);
        }

        const uniqueAsins = Array.from(asinMap.keys());
        console.log(`[cron/check-prices] Checking ${uniqueAsins.length} unique ASINs for ${activeAlerts.length} alerts`);

        // 3. Fetch current prices from Keepa (1 token per ASIN)
        // Process in batches to avoid overwhelming the API
        const BATCH_SIZE = 20;
        let notifiedCount = 0;
        let checkedCount = 0;

        // Get or create Amazon UK retailer for price records
        const retailer = await prisma.retailer.upsert({
            where: { slug: 'amazon-uk' },
            update: {},
            create: {
                name: 'Amazon UK',
                slug: 'amazon-uk',
                affiliateNetwork: 'amazon',
                affiliateId: 'dealping0d-21',
            },
        });

        for (let i = 0; i < uniqueAsins.length; i += BATCH_SIZE) {
            const batch = uniqueAsins.slice(i, i + BATCH_SIZE);

            for (const asin of batch) {
                try {
                    // Fetch current price from Keepa (uses file cache - 1hr)
                    const { product: keepaProduct } = await getProduct(asin);

                    if (!keepaProduct || keepaProduct.currentPrice <= 0) {
                        console.log(`[cron/check-prices] No price for ${asin}, skipping`);
                        continue;
                    }

                    const currentPrice = keepaProduct.currentPrice;
                    checkedCount++;

                    // Store price record in DB
                    const alertsForAsin = asinMap.get(asin) || [];
                    const productId = alertsForAsin[0]?.product.id;

                    if (productId) {
                        await prisma.priceRecord.create({
                            data: {
                                productId,
                                retailerId: retailer.id,
                                price: currentPrice,
                                originalPrice: keepaProduct.originalPrice > currentPrice ? keepaProduct.originalPrice : null,
                                url: `https://www.amazon.co.uk/dp/${asin}`,
                                affiliateUrl: generateAffiliateUrl(asin),
                            },
                        });
                    }

                    // Check each alert for this ASIN
                    // Collect alerts to notify, update DB in transaction, then send emails
                    const alertsToNotify: { alert: typeof alertsForAsin[0]; referencePrice: number; percentOff: number }[] = [];

                    for (const alert of alertsForAsin) {
                        const previousPrice = alert.product.prices[0]?.price;

                        // Skip if notified recently
                        if (alert.lastNotified) {
                            const timeSinceNotification = Date.now() - new Date(alert.lastNotified).getTime();
                            if (timeSinceNotification < MIN_NOTIFICATION_INTERVAL_MS) {
                                continue;
                            }
                        }

                        let shouldNotify = false;

                        // Check target price
                        if (alert.targetPrice && currentPrice <= alert.targetPrice) {
                            shouldNotify = true;
                        }

                        // Check any drop
                        if (alert.alertOnAnyDrop && previousPrice && currentPrice < previousPrice) {
                            shouldNotify = true;
                        }

                        if (shouldNotify && alert.notifyEmail && alert.user.email) {
                            const referencePrice = previousPrice || alert.targetPrice || currentPrice;

                            const percentOff = referencePrice > currentPrice
                                ? Math.round(((referencePrice - currentPrice) / referencePrice) * 100)
                                : 0;

                            alertsToNotify.push({ alert, referencePrice, percentOff });
                        }
                    }

                    // Update lastNotified for all alerts in a single transaction
                    if (alertsToNotify.length > 0) {
                        await prisma.$transaction(
                            alertsToNotify.map(({ alert }) =>
                                prisma.priceAlert.update({
                                    where: { id: alert.id },
                                    data: { lastNotified: new Date() },
                                })
                            )
                        );

                        // Send emails after DB updates succeed
                        for (const { alert, referencePrice, percentOff } of alertsToNotify) {
                            try {
                                await sendPriceDropEmail({
                                    userEmail: alert.user.email!,
                                    userName: alert.user.name || undefined,
                                    productName: alert.product.name,
                                    productImage: alert.product.imageUrl || undefined,
                                    currentPrice,
                                    previousPrice: referencePrice,
                                    retailer: 'Amazon UK',
                                    productUrl: generateAffiliateUrl(asin),
                                    percentOff,
                                });
                                notifiedCount++;
                                console.log(`[cron/check-prices] Notified ${alert.user.email} about ${asin} (£${currentPrice})`);
                            } catch (emailErr) {
                                console.error(`[cron/check-prices] Failed to email ${alert.user.email}:`, emailErr);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`[cron/check-prices] Error checking ${asin}:`, err);
                }
            }

            // Brief pause between batches to be gentle on the API
            if (i + BATCH_SIZE < uniqueAsins.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`[cron/check-prices] Done. Checked ${checkedCount} products, sent ${notifiedCount} notifications`);

        return NextResponse.json({
            success: true,
            checked: checkedCount,
            notified: notifiedCount,
            uniqueAsins: uniqueAsins.length,
            totalAlerts: activeAlerts.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[cron/check-prices] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check prices',
            },
            { status: 500 }
        );
    }
}

// Also support POST
export async function POST(request: NextRequest) {
    return GET(request);
}
