import Link from "next/link";
import { localeCourante, t } from "@/lib/i18n";

export async function Footer() {
  const locale = await localeCourante();

  return (
    <footer className="border-t border-cx-border bg-cx-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row">
        <p className="text-sm text-cx-muted-fg">
          © {new Date().getFullYear()} CodeXchange — {t(locale, "footer.tagline")}
        </p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-cx-muted-fg">
          <Link href="/forum" className="hover:text-cx-fg">
            {t(locale, "nav.forum")}
          </Link>
          <Link href="/jobs" className="hover:text-cx-fg">
            {t(locale, "nav.jobs")}
          </Link>
          <Link href="/tutos" className="hover:text-cx-fg">
            {t(locale, "nav.tutorials")}
          </Link>
          <Link href="/aide" className="hover:text-cx-fg">
            {t(locale, "help.title")}
          </Link>
          <Link href="/conditions" className="hover:text-cx-fg">
            Conditions
          </Link>
          <Link href="/confidentialite" className="hover:text-cx-fg">
            Confidentialité
          </Link>
          <Link href="https://github.com/Ggboykxz/CodeXchange" className="hover:text-cx-fg">
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  );
}
