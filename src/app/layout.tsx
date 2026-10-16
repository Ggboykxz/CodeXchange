import type { Metadata } from "next";
import { jakarta } from "@/lib/fonts";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeScript } from "@/components/theme-script";
import { ToastProvider } from "@/components/toast";
import { NavProvider } from "@/components/nav-context";
import NavigationGauche from "@/components/navigation-gauche";
import RaccourciRecherche from "@/components/raccourci-recherche";
import RetourHaut from "@/components/retour-haut";
import Onboarding from "@/components/onboarding";
import { themeCourant } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeXchange — La plateforme africaine des développeurs",
    template: "%s · CodeXchange",
  },
  description:
    "Forum, offres d'emploi, projets, mentorat, tutos et événements pour les développeurs en Afrique. Par les devs, pour les devs.",
  metadataBase: new URL("https://code-x-change-seven.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr-FR",
    siteName: "CodeXchange",
    title: "CodeXchange — La plateforme africaine des développeurs",
    description:
      "Forum, offres d'emploi, projets, mentorat, tutos et événements pour les développeurs en Afrique.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeXchange — La plateforme africaine des développeurs",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
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
      <body className="min-h-dvh bg-cx-bg font-sans text-cx-fg antialiased">
        {/* Skip to content */}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-[max(0.5rem,env(safe-area-inset-top))] focus:left-[max(0.5rem,env(safe-area-inset-left))] focus:z-50 focus:rounded-lg focus:bg-cx-primary focus:px-4 focus:py-2 focus:text-cx-primary-fg active:scale-[0.97]">Aller au contenu</a>
        <ToastProvider>
          <NavProvider>
            <RaccourciRecherche />
            <RetourHaut />
            <Onboarding />
            <Header />
            {/* Navigation façon Reddit : barre latérale (drawer sur mobile) + contenu. */}
            <div className="flex">
              <NavigationGauche />
              <main id="main" className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1">
                {children}
              </main>
            </div>
            <Footer />
          </NavProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
