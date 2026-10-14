import Link from "next/link";

export type LienFil = { label: string; href?: string };

/** Fil d'Ariane accessible (nav aria-label + aria-current sur le dernier). */
export default function FilAriane({ items }: { items: LienFil[] }) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-cx-muted-fg">
        {items.map((item, index) => {
          const estDernier = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <span aria-hidden="true" className="text-cx-muted-fg">
                  /
                </span>
              ) : null}
              {item.href && !estDernier ? (
                <Link href={item.href} className="rounded px-1 hover:text-cx-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={estDernier ? "page" : undefined} className="px-1 font-medium text-cx-fg">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
