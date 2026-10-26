"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-3xl font-black tracking-tight">
        Oops — quelque chose a cassé
      </h1>
      <p className="text-cx-muted-fg">
        {error.message || "Une erreur inattendue est survenue"} pendant le rendu. Vous pouvez
        réessayer, ou revenir à l&apos;accueil. Si ça persiste, ouvrez une issue
        sur GitHub.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-cx-muted-fg">
          référence : {error.digest}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-full bg-cx-accent px-4 py-2 text-sm font-semibold text-cx-accent-fg transition hover:opacity-90 active:scale-[0.97]"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="min-h-[44px] rounded-full border border-cx-border bg-cx-card px-4 py-2 text-sm font-semibold transition hover:bg-cx-muted active:scale-[0.97]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
