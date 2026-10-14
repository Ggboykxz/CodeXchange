import type { Metadata } from "next";
import { jakarta } from "@/lib/fonts";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeScript } from "@/components/theme-script";
import { ToastProvider } from "@/components/toast";
import RaccourciRecherche from "@/components/raccourci-recherche";
import RetourHaut from "@/components/retour-haut";
import { themeCourant } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeXchange — La plateforme africaine des développeurs",
    template: "%s · CodeXchange",
  },
  description:
    "Forum, offres d'emploi, projets, mentorat, tutos et événements pour les développeurs en Afrique. Par les devs, pour les devs.",
  metadataBase: new URL("https://github.com/Ggboykxz/CodeXchange"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await themeCourant();

  return (
    <html lang="fr" className={jakarta.variable} data-theme={theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="min-h-screen bg-cx-bg font-sans text-cx-fg antialiased">
        {/* Skip to content */}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-cx-primary focus:px-4 focus:py-2 focus:text-white">Aller au contenu</a>
        <ToastProvider>
          <RaccourciRecherche />
          <RetourHaut />
          <Header />
          <main id="main" className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
