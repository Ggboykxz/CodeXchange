import PanneauNav from "@/components/panneau-nav";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { localeCourante } from "@/lib/i18n";
import { themeCourant } from "@/lib/theme";
import { topHashtags } from "@/lib/hashtags";

/**
 * Navigation latérale façon X (serveur) : récupère session, profil (avatar
 * pour le bloc utilisateur), langue, thème et communautés en tendance, puis
 * délègue le rendu et le drawer au client.
 */
export default async function NavigationGauche() {
  const [userId, locale, theme, communautes] = await Promise.all([
    getSessionUserId(),
    localeCourante(),
    themeCourant(),
    topHashtags(7),
  ]);
  const me =
    userId !== null
      ? await prisma.user.findUnique({ where: { id: userId }, select: { nom: true, slug: true, avatar: true } })
      : null;
  return (
    <PanneauNav
      locale={locale}
      theme={theme}
      communautes={communautes}
      connecte={userId !== null}
      me={me}
    />
  );
}
