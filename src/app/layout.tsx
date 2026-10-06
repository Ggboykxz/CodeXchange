import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRegister } from "@/components/sw-register";

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CodeXchange — La plateforme des développeurs africains",
  description:
    "CodeXchange réunit les développeurs africains et de la diaspora : forum, jobs, projets, mentorat, tutos, events et annuaire. Par les devs, pour les devs.",
  keywords: [
    "CodeXchange",
    "développeurs africains",
    "dev Afrique",
    "forum tech Afrique",
    "jobs dev Afrique",
    "mentorat dev",
    "annuaire développeurs",
  ],
  authors: [{ name: "CodeXchange" }],
  icons: {
    icon: "/logo.svg",
    apple: "/icons/icon-192.png",
  },
  // PWA (A6) — manifest installable
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CodeXchange",
  },
  openGraph: {
    title: "CodeXchange — La plateforme des développeurs africains",
    description:
      "Forum, jobs, projets, mentorat, tutos, events et annuaire — par les devs, pour les devs.",
    siteName: "CodeXchange",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeXchange",
    description: "La plateforme des développeurs africains.",
  },
};

// `themeColor` dans `metadata` est déprécié depuis Next 14 : il vit dans
// `viewport` (émet <meta name="theme-color">, requis pour l'installation PWA).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0D0C" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${mono.variable} antialiased bg-background text-foreground font-mono`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
        <SWRegister />
      </body>
    </html>
  );
}
