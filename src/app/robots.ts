import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/apply", "/auth", "/onboarding", "/pg-review"],
      },
    ],
    // Google and Bing accept an RSS feed as a sitemap; it surfaces new articles faster.
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/feed.xml`],
  };
}
