"use client";

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
  "rounded-lg border border-cx-border px-3 py-1.5 text-sm font-medium hover:border-cx-accent";
const CLASSES_DESACTIVE =
  "cursor-not-allowed rounded-lg border border-cx-muted/30 px-3 py-1.5 text-sm font-medium text-cx-muted-fg opacity-90";

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

      <span className="text-sm text-cx-muted-fg">
        Page {pageActuelle} sur {totalPages}
      </span>
      <form
        className="hidden items-center gap-1 sm:flex"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const lien = buildHref(props, Number(formData.get("page")));
          window.location.assign(lien);
        }}
      >
        <input
          name="page"
          type="number"
          min={1}
          max={totalPages}
          defaultValue={pageActuelle}
          className="w-14 rounded-md border border-cx-border bg-cx-card px-2 py-1 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
        />
        <button type="submit" className={CLASSES_LIEN}>
          Aller
        </button>
      </form>

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