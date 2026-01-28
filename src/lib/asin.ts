/**
 * Extract an ASIN from an Amazon URL or raw ASIN input.
 * Returns the uppercase ASIN or null if not found.
 */
export function extractAsin(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Direct ASIN input (10 alphanumeric characters)
    if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
        return trimmed.toUpperCase();
    }

    // Amazon URL patterns: /dp/ASIN, /gp/product/ASIN, /gp/aw/d/ASIN
    const match = trimmed.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
}
