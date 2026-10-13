import Link from "next/link";

export type PaginationProps = {
  page: number;
  totalPages: number;
  basePath?: string;
  params?: Record<string, string | string[] | undefined>;
  href?: (page: number) => string;
  className?: string;
};

function buildHref(props: PaginationProps, p: number): string {
  if (props.href) return props.href(p);
  const basePath = props.basePath ?? "/";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(props.params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) if (item) params.append(key, item);
    } else if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }
  if (p > 1) params.set("page", String(p));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const CLASSES_LIEN =
  "rounded-lg border border-[var(--cx-muted)]/40 px-3 py-1.5 text-sm font-medium hover:border-[var(--cx-accent)]";
const CLASSES_DESACTIVE =
  "cursor-not-allowed rounded-lg border border-[var(--cx-muted)]/20 px-3 py-1.5 text-sm font-medium opacity-40";

export function Pagination(props: PaginationProps) {
  const { page, totalPages, className } = props;
  if (totalPages <= 0) return null;
  const pageActuelle = Math.min(Math.max(1, page), totalPages);
  const precedente = pageActuelle - 1;
  const suivante = pageActuelle + 1;

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-wrap items-center justify-center gap-2 ${className ?? ""}`}
    >
      {pageActuelle <= 1 ? (
        <span className={CLASSES_DESACTIVE} aria-disabled="true">
          Précédent
        </span>
      ) : (
        <Link href={buildHref(props, precedente)} className={CLASSES_LIEN} rel="prev">
          Précédent
        </Link>
      )}

      <span className="text-sm text-[var(--cx-muted)]">
        Page {pageActuelle} sur {totalPages}
      </span>

      {pageActuelle >= totalPages ? (
        <span className={CLASSES_DESACTIVE} aria-disabled="true">
          Suivant
        </span>
      ) : (
        <Link href={buildHref(props, suivante)} className={CLASSES_LIEN} rel="next">
          Suivant
        </Link>
      )}
    </nav>
  );
}

export default Pagination;