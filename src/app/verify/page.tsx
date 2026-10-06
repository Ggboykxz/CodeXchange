import type { Metadata } from "next";
import { VerifyCard } from "./verify-card";

export const metadata: Metadata = {
  title: "Vérification de l'e-mail — CodeXchange",
  description:
    "Confirme l'adresse e-mail de ton compte CodeXchange pour obtenir le badge « profil vérifié ».",
  robots: { index: false },
};

/**
 * Cible du lien de vérification (B1).
 *
 * `searchParams` est une promesse depuis Next 15 : on l'attend côté serveur
 * et on ne passe que la valeur au composant client — pas de
 * `useSearchParams()`, donc pas de frontière `<Suspense>` à poser pour que
 * la page se pré-rendende au build.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyCard token={token ?? null} />;
}
