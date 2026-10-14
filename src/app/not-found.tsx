import Link from "next/link";
import { localeCourante, t } from "@/lib/i18n";

/** 404 française et soignée : le membre ou la page demandé(e) n'existe pas (plus). */
export default async function NotFound() {
  const locale = await localeCourante();
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-7xl font-black tracking-tight text-[var(--cx-accent)]">404</p>
      <h1 className="text-2xl font-bold leading-snug">{t(locale, "status.404_title")}</h1>
      <p className="text-sm text-cx-muted-fg">
        {t(locale, "status.404_desc")}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 text-sm font-medium"
        >
          {t(locale, "common.back_home")}
        </Link>
        <Link
          href="/annuaire"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-cx-accent-fg"
        >
          {t(locale, "nav.directory")}
        </Link>
      </div>
    </div>
  );
}
