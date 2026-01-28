import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/auth/", "/coming-soon"],
        },
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://dealping.co.uk"}/sitemap.xml`,
    };
}
