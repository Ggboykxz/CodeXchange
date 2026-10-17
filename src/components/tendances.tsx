import Link from "next/link";
import { topHashtags } from "@/lib/hashtags";
import { localeCourante, t } from "@/lib/i18n";

/**
 * Widget « Tendances » (hashtags populaires), compact, à accrocher dans une
 * colonne latérale ou en tête de fil — façon sidebar de réseau social.
 */
export default async function Tendances({ limite = 8 }: { limite?: number }) {
  const [hashtags, locale] = await Promise.all([topHashtags(limite), localeCourante()]);
  if (hashtags.length === 0) return null;
  return (
    <aside className="rounded-xl border border-cx-border bg-cx-card px-5 py-4 text-sm">
      <h2 className="font-semibold">{t(locale, "trending.title")}</h2>
      <ol className="mt-3 flex flex-col gap-2">
        {hashtags.map((h, i) => (
          <li key={h.tag} className="flex items-baseline justify-between gap-2">
            <Link href={`/forum?tag=${encodeURIComponent(h.tag)}`} className="group min-w-0">
              <span className="mr-2 text-xs tabular-nums text-cx-muted-fg">{i + 1}</span>
              <span className="font-medium text-cx-primary group-hover:underline">#{h.tag}</span>
            </Link>
            <span className="shrink-0 text-xs text-cx-muted-fg">
              {h.count} {h.count > 1 ? t(locale, "trending.posts_many") : t(locale, "trending.posts_one")}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
