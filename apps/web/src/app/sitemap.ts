import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://2dcite.com";
  const paths = [
    "",
    "/about",
    "/terms",
    "/privacy",
    "/disclaimer",
    "/accessibility",
    "/login",
    "/signup",
  ];
  return paths.map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/about" ? 0.9 : 0.5,
  }));
}
