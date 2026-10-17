import Link from "next/link";
import { localeCourante, t } from "@/lib/i18n";

export const metadata = { title: "Aide" };

export default async function PageAide() {
  const locale = await localeCourante();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t(locale, "help.title")}</h1>
      <p className="mt-2 text-sm text-cx-muted-fg">{t(locale, "help.intro")}</p>

      <section className="mt-8 space-y-6">
        <article className="rounded-xl border border-cx-border bg-cx-card p-5">
          <h2 className="text-base font-bold">{t(locale, "help.q1")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cx-muted-fg">{t(locale, "help.a1")}</p>
        </article>
        <article className="rounded-xl border border-cx-border bg-cx-card p-5">
          <h2 className="text-base font-bold">{t(locale, "help.q2")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cx-muted-fg">{t(locale, "help.a2")}</p>
        </article>
        <article className="rounded-xl border border-cx-border bg-cx-card p-5">
          <h2 className="text-base font-bold">{t(locale, "help.q3")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cx-muted-fg">{t(locale, "help.a3")}</p>
        </article>
        <article className="rounded-xl border border-cx-border bg-cx-card p-5">
          <h2 className="text-base font-bold">{t(locale, "help.q4")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-cx-muted-fg">{t(locale, "help.a4")}</p>
        </article>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/forum/nouveau" className="rounded-full bg-cx-primary px-4 py-2 text-sm font-bold text-cx-primary-fg">
          {t(locale, "forum.poster")}
        </Link>
        <Link href="/forum" className="rounded-full border border-cx-border px-4 py-2 text-sm font-medium">
          {t(locale, "nav.forum")}
        </Link>
      </div>
    </div>
  );
}
