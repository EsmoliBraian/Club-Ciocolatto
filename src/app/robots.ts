import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/registro", "/explorar"],
      disallow: ["/admin", "/empleado", "/inicio", "/misiones", "/qr", "/canjear", "/perfil", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
