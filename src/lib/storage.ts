/**
 * Stockage des fichiers (avatars) avec drivers interchangeables.
 *
 * - **`db`** (défaut) : data URL base64 en colonne `User.avatar`. Simple, 0 €,
 *   suffit pour une démo — mais alourdit la base si les images sont nombreuses.
 * - **`blob`** : Vercel Blob via son API REST (`BLOB_READ_WRITE_TOKEN`) — se
 *   déclenche automatiquement quand la variable d'environnement est présente.
 *   Aucune dépendance npm requise (simple `fetch`).
 *
 * Pour tout autre backend (S3, R2, UploadThing…), ajouter un driver ici : la
 * signature `uploadFichier(chemin,bytes,mime): Promise<string>` est le contrat.
 */

const BLOB_URL = "https://blob.vercel-storage.com";

export type FichierTeleverse = { chemin: string; bytes: Buffer; mime: string };

/** Upload vers Vercel Blob, retourne l'URL publique. */
async function uploadVersBlob({ chemin, bytes, mime }: FichierTeleverse): Promise<string> {
  const jeton = process.env.BLOB_READ_WRITE_TOKEN;
  if (!jeton) throw new Error("BLOB_READ_WRITE_TOKEN manquant");
  const reponse = await fetch(`${BLOB_URL}/${chemin}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${jeton}`,
      "x-content-type": mime,
      "x-add-random-suffix": "0",
    },
    body: new Uint8Array(bytes),
  });
  if (!reponse.ok) {
    throw new Error(`Blob ${reponse.status}: ${await reponse.text()}`);
  }
  const donnees = (await reponse.json()) as { url?: string };
  if (!donnees.url) throw new Error("Blob : URL absente de la réponse");
  return donnees.url;
}

/** Vrai si un stockage distant est configuré. */
export const stockageDistantActif = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Enregistre un data URL d'image. Retourne ce qu'il faut stocker en base :
 * l'URL distante si Blob est configuré, sinon le data URL d'origine.
 */
export async function stockerImage(dataUrl: string, chemin: string): Promise<string> {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Data URL invalide");

  if (!stockageDistantActif()) return dataUrl;

  return uploadVersBlob({
    chemin,
    bytes: Buffer.from(match[2], "base64"),
    mime: match[1],
  });
}
