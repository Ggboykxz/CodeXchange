import PanneauNav from "@/components/panneau-nav";
import { getSessionUserId } from "@/lib/session";
import { localeCourante } from "@/lib/i18n";
import { themeCourant } from "@/lib/theme";
import { topHashtags } from "@/lib/hashtags";

/**
 * Navigation latérale façon Reddit (serveur) : récupère session, langue, thème
 * et communautés en tendance, puis délègue le rendu et le drawer au client.
 */
export default async function NavigationGauche() {
  const [userId, locale, theme, communautes] = await Promise.all([
    getSessionUserId(),
    localeCourante(),
    themeCourant(),
    topHashtags(7),
  ]);
  return (
    <PanneauNav
      locale={locale}
      theme={theme}
      communautes={communautes}
      connecte={userId !== null}
    />
  );
}
