import { Plus_Jakarta_Sans } from "next/font/google";

// Paire retenue par ui-ux-pro-max (style « developer community SaaS ») :
// Plus Jakarta Sans — Friendly, moderne, propre, professionnel. Une seule
// famille fait titre et texte : plus léger à charger et cohérent.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
