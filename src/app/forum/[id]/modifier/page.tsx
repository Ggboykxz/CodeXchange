import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getPost } from "@/lib/forum";
import { localeCourante } from "@/lib/i18n";
import FormulaireEdition from "./formulaire-edition";

export const dynamic = "force-dynamic";

export default async function PageModifier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");
  const sujet = await getPost(postId, userId);
  if (!sujet) notFound();
  if (sujet.author.id !== userId) redirect(`/forum/${postId}`);
  const locale = await localeCourante();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={`/forum/${postId}`} className="text-sm text-cx-primary hover:underline">
        ← Retour au sujet
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Modifier le sujet</h1>
      <div className="mt-6">
        <FormulaireEdition
          postId={postId}
          titreInitial={sujet.titre}
          corpsInitial={sujet.corps}
          tagsInitial={sujet.tags}
          locale={locale}
        />
      </div>
    </div>
  );
}