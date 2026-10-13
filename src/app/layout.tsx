import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jakarta } from "@/lib/fonts";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeScript } from "@/components/theme-script";
import { estTheme, type Theme } from "@/lib/theme";
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
  const cookie = (await cookies()).get("cx_theme")?.value;
  const theme: Theme = estTheme(cookie) ? cookie : "auto";

  return (
    <html lang="fr" className={jakarta.variable} data-theme={theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-cx-bg font-sans text-cx-fg antialiased">
        <Header />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
