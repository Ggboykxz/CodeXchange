import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CodeXchange — La plateforme africaine des développeurs",
    template: "%s · CodeXchange",
  },
  description:
    "Forum, offres d'emploi, projets, mentorat, tutos et événements pour les développeurs en Afrique. Par les devs, pour les devs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[var(--cx-bg)] text-[var(--cx-fg)] antialiased">
        {children}
      </body>
    </html>
  );
}
