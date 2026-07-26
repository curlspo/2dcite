import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://2dcite.com";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/terms", "/privacy", "/disclaimer", "/login", "/signup"],
      disallow: ["/admin", "/api/", "/dashboard", "/jobs", "/assignments"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
