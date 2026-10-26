import Link from "next/link";

type EmptyProps = {
  titre: string;
  description?: string;
  cta?: string;
  href?: string;
};

export function EmptyState({ titre, description, cta, href }: EmptyProps) {
  return (
    <div className="rounded-xl border border-cx-border bg-cx-card px-6 py-12 text-center shadow-sm">
      <h2 className="text-xl font-bold text-cx-card-fg">{titre}</h2>
      {description ? (
        <p className="mt-3 text-sm text-cx-muted-fg">{description}</p>
      ) : null}
      {cta && href ? (
        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-1 rounded-full bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg transition hover:opacity-90 active:scale-[0.97]"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
