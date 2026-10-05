import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
