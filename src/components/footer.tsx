import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-cx-border bg-cx-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row">
        <p className="text-sm text-cx-muted-fg">
          © {new Date().getFullYear()} CodeXchange — La plateforme africaine des devs, par les devs.
        </p>
        <nav className="flex gap-4 text-sm text-cx-muted-fg">
          <Link href="/forum" className="hover:text-cx-fg">
            Forum
          </Link>
          <Link href="/jobs" className="hover:text-cx-fg">
            Emplois
          </Link>
          <Link href="/tutos" className="hover:text-cx-fg">
            Tutos
          </Link>
          <Link href="https://github.com/Ggboykxz/CodeXchange" className="hover:text-cx-fg">
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  );
}
