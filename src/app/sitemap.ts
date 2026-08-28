import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/explorar`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/registro`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
