/**
 * Rendu Markdown des sujets et réponses du forum — **sûr par construction**.
 *
 * Règle de sécurité : tout le HTML d'entrée est échappé avant l'interprétation
 * (`echapperHtml`). Les liens et images ne sont émis que pour `http(s)://`.
 * La sortie peut donc être injectée avec `dangerouslySetInnerHTML` sans filtre
 * supplémentaire — comme `src/lib/markdown.ts`, mais avec en plus les
 * citations, les listes, les titres et les blocs de code étiquetés.
 *
 * Les fonctions sont pures et testables sans DOM.
 */

const ENTITES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
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

/**
 * Met en forme une ligne (ou un bloc de lignes) : code inline, images, liens,
 * hashtags, mentions, gras et italique. Le texte est échappé en premier ;
 * les fragments déjà transformés sont mis en réserve pour ne pas être
 * réinterprétés (URL dans un `href`, contenu de code, etc.).
 */
export function enLigne(source: string): string {
  const codes: string[] = [];
  const images: { alt: string; url: string }[] = [];
  const liens: string[] = [];

  let sortie = echapperHtml(source);

  // 1. Code inline : son contenu est du texte, jamais du balisage.
  sortie = sortie.replace(/`([^`\n]+)`/g, (_m, contenu: string) => {
    codes.push(contenu);
    return `\u0000${codes.length - 1}\u0000`;
  });

  // 2. Images, avant les liens pour ne pas réécrire l'URL dans `src`.
  sortie = sortie.replace(
    /!\[([^\]\n]*)\]\(([^()\s]+)\)/g,
    (_m, alt: string, url: string) => {
      if (!estUrlSure(url)) return alt;
      images.push({ alt, url });
      return `\u0001${images.length - 1}\u0001`;
    },
  );

  // 3. Liens http(s) uniquement.
  sortie = sortie.replace(
    /\[([^\]\n]+)\]\(([^()\s]+)\)/g,
    (_m, libelle: string, url: string) => {
      if (!estUrlSure(url)) return libelle;
      liens.push(
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-cx-primary underline break-all">${libelle}</a>`,
      );
      return `\u0002${liens.length - 1}\u0002`;
    },
  );

  // 4. Hashtags et mentions : jamais dans une URL, déjà mise en réserve.
  sortie = sortie.replace(
    /(^|[\s(])#([\p{L}\p{N}_]{2,40})/gu,
    (_m, pre: string, tag: string) =>
      `${pre}<a href="/forum?tag=${encodeURIComponent(tag)}" class="font-semibold text-cx-primary hover:underline">#${tag}</a>`,
  );
  sortie = sortie.replace(
    /(^|[\s(])@([a-z0-9][a-z0-9-]{1,39})/gi,
    (_m, pre: string, slug: string) =>
      `${pre}<a href="/membres/${encodeURIComponent(slug)}" class="font-semibold text-cx-primary hover:underline">@${slug}</a>`,
  );

  sortie = sortie.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  sortie = sortie.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // 5. Restauration des fragments protégés.
  sortie = sortie.replace(/\u0001(\d+)\u0001/g, (_m, index: string) => {
    const image = images[Number(index)];
    if (!image) return "";
    return `<img src="${image.url}" alt="${image.alt}" loading="lazy" class="my-2 max-h-[480px] w-full rounded-2xl border border-cx-border object-cover" />`;
  });
  sortie = sortie.replace(
    /\u0002(\d+)\u0002/g,
    (_m, index: string) => liens[Number(index)] ?? "",
  );
  sortie = sortie.replace(
    /\u0000(\d+)\u0000/g,
    (_m, index: string) =>
      `<code class="rounded bg-cx-muted px-1 py-0.5 font-mono text-xs">${codes[Number(index)] ?? ""}</code>`,
  );

  return sortie;
}

export type BlocMarkdown =
  | { type: "code"; langage: string; code: string }
  | { type: "titre"; niveau: number; html: string }
  | { type: "citation"; html: string }
  | { type: "liste"; ordonnee: boolean; items: string[] }
  | { type: "paragraphe"; html: string };

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
        html: enLigne(titre[2]),
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
      blocs.push({ type: "citation", html: enLigne(contenu.join("\n")) });
      continue;
    }

    // Liste à puces : - / * / +
    if (/^\s*[-*+]\s+/.test(ligne)) {
      const items: string[] = [];
      while (i < lignes.length && /^\s*[-*+]\s+/.test(lignes[i])) {
        items.push(enLigne(lignes[i].replace(/^\s*[-*+]\s+/, "").trim()));
        i++;
      }
      blocs.push({ type: "liste", ordonnee: false, items });
      continue;
    }

    // Liste numérotée : 1. / 1)
    if (/^\s*\d+[.)]\s+/.test(ligne)) {
      const items: string[] = [];
      while (i < lignes.length && /^\s*\d+[.)]\s+/.test(lignes[i])) {
        items.push(enLigne(lignes[i].replace(/^\s*\d+[.)]\s+/, "").trim()));
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
    blocs.push({ type: "paragraphe", html: enLigne(paragraphe.join("\n")) });
  }

  return blocs;
}
