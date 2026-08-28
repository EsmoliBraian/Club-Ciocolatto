import type { Metadata, Viewport } from "next";
import { Geist, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headings, card titles, body emphasis — modern and highly legible.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Reserved for the "Ciocolatto" wordmark only (via the `font-logo` utility) —
// not used for regular headings, so the brand mark stays distinctive instead
// of making every heading in the app look like the logo.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Club Ciocolatto",
    template: "%s · Club Ciocolatto",
  },
  description:
    "Más que clientes, fanáticos. Sumá puntos, subí de nivel y desbloqueá beneficios en cada visita a Ciocolatto.",
  applicationName: "Club Ciocolatto",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Club Ciocolatto",
  },
  openGraph: {
    title: "Club Ciocolatto",
    description: "Más que clientes, fanáticos.",
    type: "website",
    locale: "es_AR",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1c4328",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthSessionProvider>
          <TooltipProvider delay={150}>
            {children}
            <Toaster richColors position="top-center" />
            <ServiceWorkerRegistration />
          </TooltipProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
