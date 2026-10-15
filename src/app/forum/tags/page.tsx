import Link from "next/link";
import { localeCourante, t } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import BoutonAbonnement from "@/components/bouton-abonnement";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communautés" };

/** Aggrège les tags du forum et les compte. */
function compresserTags(liste: { tags: string }[]) {
  const compte = new Map<string, number>();
  for (const s of liste) {
    for (const tag of s.tags.split(",")) {
      const t = tag.trim().toLowerCase();
      if (t) compte.set(t, (compte.get(t) ?? 0) + 1);
    }
  }
  return [...compte.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function PageTags() {
  const userId = await getSessionUserId();
  const locale = await localeCourante();
  const follows = userId ? await prisma.tagFollow.findMany({ where: { userId }, select: { tag: true } }) : [];
  const followsSet = new Set(follows.map((f) => f.tag));
  const postes = await prisma.post.findMany({ select: { tags: true } });
  const tags = compresserTags(postes);
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t(locale, "tags.title")}</h1>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {tags.map(([tag, nombre]) => (
          <li key={tag}>
            <div className="rounded-xl border border-cx-border bg-cx-card px-5 py-4">
              <Link href={`/forum?tag=${encodeURIComponent(tag)}`} className="block transition hover:border-cx-primary/60">
                <p className="font-semibold">#{tag}</p>
                <p className="mt-1 text-xs text-cx-muted-fg">
                  {nombre} sujet{nombre > 1 ? "s" : ""}
                </p>
              </Link>
              {userId ? <div className="mt-3"><BoutonAbonnement tag={tag} initial={followsSet.has(tag)} /></div> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
