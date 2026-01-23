import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🌱 Seeding database...");

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: "electronics" },
            update: {},
            create: { name: "Electronics", slug: "electronics", icon: "💻", color: "#3b82f6" },
        }),
        prisma.category.upsert({
            where: { slug: "gaming" },
            update: {},
            create: { name: "Gaming", slug: "gaming", icon: "🎮", color: "#8b5cf6" },
        }),
        prisma.category.upsert({
            where: { slug: "home-garden" },
            update: {},
            create: { name: "Home & Garden", slug: "home-garden", icon: "🏠", color: "#10b981" },
        }),
        prisma.category.upsert({
            where: { slug: "fashion" },
            update: {},
            create: { name: "Fashion", slug: "fashion", icon: "👕", color: "#ec4899" },
        }),
        prisma.category.upsert({
            where: { slug: "groceries" },
            update: {},
            create: { name: "Groceries", slug: "groceries", icon: "🛒", color: "#f59e0b" },
        }),
        prisma.category.upsert({
            where: { slug: "sports-outdoors" },
            update: {},
            create: { name: "Sports & Outdoors", slug: "sports-outdoors", icon: "⚽", color: "#06b6d4" },
        }),
        prisma.category.upsert({
            where: { slug: "health-beauty" },
            update: {},
            create: { name: "Health & Beauty", slug: "health-beauty", icon: "💄", color: "#f43f5e" },
        }),
        prisma.category.upsert({
            where: { slug: "diy-tools" },
            update: {},
            create: { name: "DIY & Tools", slug: "diy-tools", icon: "🔧", color: "#84cc16" },
        }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create retailers
    const retailers = await Promise.all([
        prisma.retailer.upsert({
            where: { slug: "amazon-uk" },
            update: {},
            create: { name: "Amazon UK", slug: "amazon-uk", affiliateNetwork: "amazon" },
        }),
        prisma.retailer.upsert({
            where: { slug: "currys" },
            update: {},
            create: { name: "Currys", slug: "currys", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "argos" },
            update: {},
            create: { name: "Argos", slug: "argos", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "john-lewis" },
            update: {},
            create: { name: "John Lewis", slug: "john-lewis", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "tesco" },
            update: {},
            create: { name: "Tesco", slug: "tesco", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "sainsburys" },
            update: {},
            create: { name: "Sainsbury's", slug: "sainsburys", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "asda" },
            update: {},
            create: { name: "Asda", slug: "asda", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "ao-com" },
            update: {},
            create: { name: "AO.com", slug: "ao-com", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "very" },
            update: {},
            create: { name: "Very", slug: "very", affiliateNetwork: "awin" },
        }),
        prisma.retailer.upsert({
            where: { slug: "ebay-uk" },
            update: {},
            create: { name: "eBay UK", slug: "ebay-uk", affiliateNetwork: "ebay" },
        }),
    ]);

    console.log(`✅ Created ${retailers.length} retailers`);

    // Create sample products
    const electronicsCategory = categories.find(c => c.slug === "electronics");
    const gamingCategory = categories.find(c => c.slug === "gaming");

    if (electronicsCategory && gamingCategory) {
        const products = await Promise.all([
            prisma.product.upsert({
                where: { id: "macbook-air-m3" },
                update: {},
                create: {
                    id: "macbook-air-m3",
                    name: "Apple MacBook Air 13\" M3 Chip 256GB - Space Grey",
                    description: "The MacBook Air with M3 chip brings even more capabilities to the world's most popular laptop.",
                    imageUrl: "https://picsum.photos/seed/macbook/400/400",
                    categoryId: electronicsCategory.id,
                },
            }),
            prisma.product.upsert({
                where: { id: "ps5-digital" },
                update: {},
                create: {
                    id: "ps5-digital",
                    name: "Sony PlayStation 5 Digital Edition Console",
                    description: "Experience lightning-fast loading with an ultra-high speed SSD.",
                    imageUrl: "https://picsum.photos/seed/ps5/400/400",
                    categoryId: gamingCategory.id,
                },
            }),
            prisma.product.upsert({
                where: { id: "samsung-tv-55" },
                update: {},
                create: {
                    id: "samsung-tv-55",
                    name: "Samsung 55\" QLED 4K Smart TV QE55Q60D",
                    description: "Quantum Dot technology delivers over a billion shades of colour.",
                    imageUrl: "https://picsum.photos/seed/samsung-tv/400/400",
                    categoryId: electronicsCategory.id,
                },
            }),
            prisma.product.upsert({
                where: { id: "dyson-v15" },
                update: {},
                create: {
                    id: "dyson-v15",
                    name: "Dyson V15 Detect Cordless Vacuum Cleaner",
                    description: "Reveals invisible dust with a precisely-angled laser.",
                    imageUrl: "https://picsum.photos/seed/dyson/400/400",
                    categoryId: electronicsCategory.id,
                },
            }),
        ]);

        console.log(`✅ Created ${products.length} products`);

        // Create price records for each product
        const amazonRetailer = retailers.find(r => r.slug === "amazon-uk");
        const currysRetailer = retailers.find(r => r.slug === "currys");
        const argosRetailer = retailers.find(r => r.slug === "argos");
        const johnLewisRetailer = retailers.find(r => r.slug === "john-lewis");

        if (amazonRetailer && currysRetailer && argosRetailer && johnLewisRetailer) {
            // MacBook prices
            await prisma.priceRecord.createMany({
                data: [
                    { productId: "macbook-air-m3", retailerId: amazonRetailer.id, price: 899, originalPrice: 999, url: "https://amazon.co.uk", inStock: true },
                    { productId: "macbook-air-m3", retailerId: currysRetailer.id, price: 929, originalPrice: 999, url: "https://currys.co.uk", inStock: true },
                    { productId: "macbook-air-m3", retailerId: johnLewisRetailer.id, price: 949, url: "https://johnlewis.com", inStock: true },
                    { productId: "macbook-air-m3", retailerId: argosRetailer.id, price: 959, url: "https://argos.co.uk", inStock: false },
                ],
            });

            // PS5 prices
            await prisma.priceRecord.createMany({
                data: [
                    { productId: "ps5-digital", retailerId: currysRetailer.id, price: 389, originalPrice: 449, url: "https://currys.co.uk", inStock: true },
                    { productId: "ps5-digital", retailerId: amazonRetailer.id, price: 399, url: "https://amazon.co.uk", inStock: true },
                    { productId: "ps5-digital", retailerId: argosRetailer.id, price: 399, url: "https://argos.co.uk", inStock: true },
                ],
            });

            console.log("✅ Created price records");
        }
    }

    console.log("🎉 Database seeded successfully!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
