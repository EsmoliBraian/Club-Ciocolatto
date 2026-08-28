import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Club Ciocolatto",
    short_name: "Club Ciocolatto",
    description: "Más que clientes, fanáticos. El programa de fidelización de Ciocolatto.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#faf3e4",
    theme_color: "#1c4328",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
