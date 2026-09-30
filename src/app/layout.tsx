import type { Metadata, Viewport } from "next";
import { Lobster, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

// Body copy, headings, card titles — IBM Plex Sans, the typeface Reddit's
// web UI is set in. Used everywhere except the "Ciocolatto" wordmark below.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Reserved for the "ciocolatto" wordmark only (via the `font-logo` utility) —
// not used for regular headings, so the brand mark stays distinctive instead
// of making every heading in the app look like the logo. Lobster is a free
// stand-in for the brand's actual TAN Nimbus font, which is licensed for
// design tools (Canva) but not confirmed licensed for web embedding.
const lobster = Lobster({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: ["400"],
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
      suppressHydrationWarning
      className={`${plexSans.variable} ${lobster.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthSessionProvider>
            <TooltipProvider delay={150}>
              {children}
              <Toaster richColors position="top-center" />
              <ServiceWorkerRegistration />
            </TooltipProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
