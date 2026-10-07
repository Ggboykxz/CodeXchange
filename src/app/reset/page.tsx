import type { Metadata } from "next";
import { ResetForm } from "@/components/reset/reset-form";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe — CodeXchange",
  description:
    "Choisis un nouveau mot de passe pour ton compte CodeXchange.",
  robots: { index: false },
};

/**
 * Cible du lien de réinitialisation (B7).
 *
 * `searchParams` est une promesse depuis Next 15 : on l'attend
 * côté serveur et on ne passe que la valeur au composant client —
 * pas de `useSearchParams()`, donc pas de frontière `<Suspense>`
 * à poser pour que la page se pré-rendre au build. Le jeton
 * n'est ni affiché ni persisté côté client.
 */
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetForm token={token ?? null} />;
}
