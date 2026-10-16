import Link from "next/link";
import { localeCourante, t } from "@/lib/i18n";

/** 404 française et soignée : le membre ou la page demandé(e) n'existe pas (plus). */
export default async function NotFound() {
  const locale = await localeCourante();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-7xl font-black tracking-tight text-cx-accent">404</p>
      <h1 className="text-2xl font-bold leading-snug">{t(locale, "status.404_title")}</h1>
      <p className="text-sm text-cx-muted-fg">
        {t(locale, "status.404_desc")}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="min-h-[44px] rounded-lg border border-cx-border px-4 py-2.5 text-sm font-medium transition hover:bg-cx-muted active:scale-[0.97]"
        >
          {t(locale, "common.back_home")}
        </Link>
        <Link
          href="/inscription"
          className="min-h-[44px] rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg transition active:scale-[0.97]"
        >
          {t(locale, "nav.join")}
        </Link>
      </div>
    </div>
  );
}
