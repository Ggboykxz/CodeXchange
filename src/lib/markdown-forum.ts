/**
 * Rendu Markdown des sujets et réponses du forum — **sûr par construction**.
 *
 * Règle de sécurité : tout le HTML d'entrée est échappé avant l'interprétation
 * (`echapperHtml`). Les liens et images ne sont émis que pour `http(s)://`.
 * La sortie est un arbre de nœuds React-ready (pas de HTML string),
 * éliminant le besoin de `dangerouslySetInnerHTML`.
 *
 * Les fonctions sont pures et testables sans DOM.
 */

const ENTITES: Record<string, string> = {
  "&": "\u0026", // &
  "<": "\u003C", // <
  ">": "\u003E", // >
  '"': "\u0022", // "
  "'": "\u0027", // '
};

/**
 * Échappe tout balisage et retire les caractères de contrôle, notamment ceux
 * utilisés comme placeholders internes (`\u0000`-`\u0002`).
 */
export function echapperHtml(texte: string): string {
  return texte
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[&<>"']/g, (caractere) => ENTITES[caractere]);
}

function estUrlSure(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Nœuds de l'AST de rendu (React-ready). */
export type NoeudEnLigne =
  | { type: "texte"; contenu: string }
  | { type: "code"; contenu: string }
  | { type: "lien"; url: string; libelle: string }
  | { type: "image"; url: string; alt: string }
  | { type: "hashtag"; tag: string }
  | { type: "mention"; slug: string }
  | { type: "gras"; contenu: string }
  | { type: "italique"; contenu: string };

export type BlocMarkdown =
  | { type: "code"; langage: string; code: string }
  | { type: "titre"; niveau: number; enfants: NoeudEnLigne[] }
  | { type: "citation"; enfants: NoeudEnLigne[] }
  | { type: "liste"; ordonnee: boolean; items: NoeudEnLigne[][] }
  | { type: "paragraphe"; enfants: NoeudEnLigne[] };

/**
 * Parse une ligne/bloc en nœuds inline (code, images, liens, hashtags, mentions, gras, italique).
 * Retourne un tableau de nœuds structurés (pas de HTML string).
 * Exporté pour les tests.
 */
export function parserEnLigne(source: string): NoeudEnLigne[] {
  const codes: string[] = [];
  const images: { alt: string; url: string }[] = [];
  const liens: { url: string; libelle: string }[] = [];

  // Étape 1: protéger le code inline
  let sortie = echapperHtml(source);
  sortie = sortie.replace(/`([^`\n]+)`/g, (_m, contenu: string) => {
    codes.push(contenu);
    return `\u0000${codes.length - 1}\u0000`;
  });

  // Étape 2: protéger les images
  sortie = sortie.replace(
    /!\[([^\]\n]*)\]\(([^()\s]+)\)/g,
    (_m, alt: string, url: string) => {
      if (!estUrlSure(url)) return alt;
      images.push({ alt, url });
      return `\u0001${images.length - 1}\u0001`;
    },
  );

  // Étape 3: protéger les liens
  sortie = sortie.replace(
    /\[([^\]\n]+)\]\(([^()\s]+)\)/g,
    (_m, libelle: string, url: string) => {
      if (!estUrlSure(url)) return libelle;
      liens.push({ url, libelle });
      return `\u0002${liens.length - 1}\u0002`;
    },
  );

  // Étape 4: hashtags et mentions (sur le texte déjà échappé)
  const noeuds: NoeudEnLigne[] = [];

  function analyserSegment(segment: string): NoeudEnLigne[] {
    const resultat: NoeudEnLigne[] = [];
    let dernierIndex = 0;

    // Regex combinée pour hashtags, mentions, gras, italique
    const regex = /(^|[\s(])#([\p{L}\p{N}_]{2,40})|(^|[\s(])@([a-z0-9][a-z0-9-]{1,39})|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/gu;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(segment)) !== null) {
      // Texte avant le match
      if (match.index > dernierIndex) {
        resultat.push({ type: "texte", contenu: segment.slice(dernierIndex, match.index) });
      }

      if (match[1] !== undefined) {
        // Hashtag: match[1] = préfixe, match[2] = tag
        if (match[1]) resultat.push({ type: "texte", contenu: match[1] });
        resultat.push({ type: "hashtag", tag: match[2] });
      } else if (match[3] !== undefined) {
        // Mention: match[3] = préfixe, match[4] = slug
        if (match[3]) resultat.push({ type: "texte", contenu: match[3] });
        resultat.push({ type: "mention", slug: match[4] });
      } else if (match[5] !== undefined) {
        // Gras: match[5] = contenu
        resultat.push({ type: "gras", contenu: match[5] });
      } else if (match[6] !== undefined) {
        // Italique: match[6] = contenu
        resultat.push({ type: "italique", contenu: match[6] });
      }

      dernierIndex = regex.lastIndex;
    }

    // Texte restant
    if (dernierIndex < segment.length) {
      resultat.push({ type: "texte", contenu: segment.slice(dernierIndex) });
    }

    return resultat;
  }

  // Découper par placeholders protégés
  const parties = sortie.split(/(\u0000\d+\u0000|\u0001\d+\u0001|\u0002\d+\u0002)/);

  for (const partie of parties) {
    if (partie.match(/^\u0000\d+\u0000$/)) {
      const index = Number(partie.slice(1, -1));
      if (codes[index] !== undefined) {
        noeuds.push({ type: "code", contenu: codes[index] });
      }
    } else if (partie.match(/^\u0001\d+\u0001$/)) {
      const index = Number(partie.slice(1, -1));
      const image = images[index];
      if (image) {
        noeuds.push({ type: "image", url: image.url, alt: image.alt });
      }
    } else if (partie.match(/^\u0002\d+\u0002$/)) {
      const index = Number(partie.slice(1, -1));
      const lien = liens[index];
      if (lien) {
        noeuds.push({ type: "lien", url: lien.url, libelle: lien.libelle });
      }
    } else if (partie) {
      noeuds.push(...analyserSegment(partie));
    }
  }

  return noeuds;
}

function estDebutDeBloc(ligne: string): boolean {
  return (
    /^\s*```/.test(ligne) ||
    /^\s{0,3}#{1,6}\s+/.test(ligne) ||
    /^\s*>\s?/.test(ligne) ||
    /^\s*[-*+]\s+/.test(ligne) ||
    /^\s*\d+[.)]\s+/.test(ligne)
  );
}

/**
 * Découpe une source Markdown en blocs affichables dans l'ordre :
 * titres, citations, listes, blocs de code et paragraphes.
 * Retourne un AST structuré (pas de HTML).
 */
export function decouperMarkdown(source: string): BlocMarkdown[] {
  const lignes = source.replace(/\r\n?/g, "\n").split("\n");
  const blocs: BlocMarkdown[] = [];
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];

    if (ligne.trim() === "") {
      i++;
      continue;
    }

    // Bloc de code : ```langage … ```
    const ouverture = ligne.match(/^\s*```(.*)$/);
    if (ouverture) {
      const langage = (ouverture[1].trim().split(/\s+/)[0] ?? "")
        .toLowerCase()
        .slice(0, 16);
      i++;
      const code: string[] = [];
      while (i < lignes.length && !/^\s*```/.test(lignes[i])) {
        code.push(lignes[i]);
        i++;
      }
      if (i < lignes.length) i++; // ferme le bloc
      blocs.push({
        type: "code",
        langage,
        code: code.join("\n").replace(/\s+$/, ""),
      });
      continue;
    }

    // Titre : # → h3 (le h1 de la page reste le titre du sujet), ## → h4…
    const titre = ligne.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (titre) {
      blocs.push({
        type: "titre",
        niveau: Math.min(6, titre[1].length + 2),
        enfants: parserEnLigne(titre[2]),
      });
      i++;
      continue;
    }

    // Citation : lignes consécutives `> …`
    if (/^\s*>\s?/.test(ligne)) {
      const contenu: string[] = [];
      while (i < lignes.length && /^\s*>\s?/.test(lignes[i])) {
        contenu.push(lignes[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocs.push({ type: "citation", enfants: parserEnLigne(contenu.join("\n")) });
      continue;
    }

    // Liste à puces : - / * / +
    if (/^\s*[-*+]\s+/.test(ligne)) {
      const items: NoeudEnLigne[][] = [];
      while (i < lignes.length && /^\s*[-*+]\s+/.test(lignes[i])) {
        items.push(parserEnLigne(lignes[i].replace(/^\s*[-*+]\s+/, "").trim()));
        i++;
      }
      blocs.push({ type: "liste", ordonnee: false, items });
      continue;
    }

    // Liste numérotée : 1. / 1)
    if (/^\s*\d+[.)]\s+/.test(ligne)) {
      const items: NoeudEnLigne[][] = [];
      while (i < lignes.length && /^\s*\d+[.)]\s+/.test(lignes[i])) {
        items.push(parserEnLigne(lignes[i].replace(/^\s*\d+[.)]\s+/, "").trim()));
        i++;
      }
      blocs.push({ type: "liste", ordonnee: true, items });
      continue;
    }

    // Paragraphe : lignes consécutives jusqu'à une ligne vide ou un autre bloc.
    const paragraphe: string[] = [];
    while (
      i < lignes.length &&
      lignes[i].trim() !== "" &&
      !estDebutDeBloc(lignes[i])
    ) {
      paragraphe.push(lignes[i].trim());
      i++;
    }
    blocs.push({ type: "paragraphe", enfants: parserEnLigne(paragraphe.join("\n")) });
  }

  return blocs;
}