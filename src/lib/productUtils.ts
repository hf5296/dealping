// Generate sample price history data for the past 5 years
export function generatePriceHistory(
    basePrice: number,
    years: number = 5
): { date: string; price: number; retailer: string }[] {
    const data: { date: string; price: number; retailer: string }[] = [];
    const retailers = ["Amazon UK", "Currys", "Argos", "John Lewis", "eBay UK"];
    const now = new Date();

    // Generate monthly data points
    for (let i = years * 12; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);

        // Add some realistic price variation
        const seasonalFactor = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;
        const randomFactor = (Math.random() - 0.5) * 0.2;
        const trendFactor = (i / (years * 12)) * 0.15; // Prices tend to decrease over time for tech

        const price =
            basePrice * (1 + seasonalFactor + randomFactor + trendFactor);

        data.push({
            date: date.toLocaleDateString("en-GB", {
                month: "short",
                year: "2-digit",
            }),
            price: Math.round(price * 100) / 100,
            retailer: retailers[Math.floor(Math.random() * retailers.length)],
        });
    }

    return data;
}

// Get sample product data by ID
export function getProductById(id: string) {
    const products: Record<
        string,
        {
            id: string;
            name: string;
            description: string;
            category: string;
            imageUrl: string;
            currentPrice: number;
            originalPrice: number;
            averagePrice: number;
            allTimeLow: number;
            allTimeHigh: number;
            dealScore: "good" | "average" | "bad";
            retailers: {
                name: string;
                price: number;
                originalPrice?: number;
                inStock: boolean;
                deliveryInfo: string;
            }[];
        }
    > = {
        p1: {
            id: "p1",
            name: "Apple MacBook Air 13\" M3 Chip 256GB - Space Grey",
            description:
                "The MacBook Air with M3 chip brings even more capabilities to the world's most popular and versatile laptop. Powered by the incredibly efficient M3 chip, MacBook Air is supercharged — built for Apple Intelligence and designed for the things you do most. With up to 18 hours of battery life, a stunningly portable design and a brilliant Liquid Retina display, you can take MacBook Air anywhere and Icons get more done than ever.",
            category: "Electronics",
            imageUrl: "https://picsum.photos/seed/macbook/600/600",
            currentPrice: 899,
            originalPrice: 999,
            averagePrice: 949,
            allTimeLow: 849,
            allTimeHigh: 1099,
            dealScore: "good",
            retailers: [
                {
                    name: "Amazon UK",
                    price: 899,
                    originalPrice: 999,
                    inStock: true,
                    deliveryInfo: "Free delivery by tomorrow",
                },
                {
                    name: "Currys",
                    price: 929,
                    originalPrice: 999,
                    inStock: true,
                    deliveryInfo: "Free delivery in 2-3 days",
                },
                {
                    name: "John Lewis",
                    price: 949,
                    inStock: true,
                    deliveryInfo: "Free click & collect",
                },
                {
                    name: "Argos",
                    price: 959,
                    inStock: false,
                    deliveryInfo: "Out of stock",
                },
            ],
        },
        p2: {
            id: "p2",
            name: "Sony PlayStation 5 Digital Edition Console",
            description:
                "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.",
            category: "Gaming",
            imageUrl: "https://picsum.photos/seed/ps5/600/600",
            currentPrice: 389,
            originalPrice: 449,
            averagePrice: 419,
            allTimeLow: 359,
            allTimeHigh: 499,
            dealScore: "good",
            retailers: [
                {
                    name: "Currys",
                    price: 389,
                    originalPrice: 449,
                    inStock: true,
                    deliveryInfo: "Free delivery in 1-2 days",
                },
                {
                    name: "Amazon UK",
                    price: 399,
                    inStock: true,
                    deliveryInfo: "Free delivery by Friday",
                },
                {
                    name: "Argos",
                    price: 399,
                    inStock: true,
                    deliveryInfo: "Click & collect today",
                },
                {
                    name: "Very",
                    price: 419,
                    inStock: true,
                    deliveryInfo: "Free delivery",
                },
            ],
        },
    };

    // Return product or a default one
    return products[id] || products["p1"];
}
