/**
 * Mini-rendu markdown maison (Task 8) — **aucune dépendance ajoutée**.
 *
 * Réglé sur les besoins des tutos (spec) : titres `#`/`##`, **gras**, `code`,
 * blocs de code ```…```, listes `- `, paragraphes et liens `[texte](url)`.
 *
 * Règle de sécurité (Review Focus n°3) : **tout le HTML d'entrée est échappé
 * avant toute interprétation**. `<script>` s'affiche textuel, un `javascript:`
 * n'est jamais émis en `href` — la sortie peut donc être injectée avec
 * `dangerouslySetInnerHTML` sans filtre supplémentaire.
 */

/** Entités HTML émises à l'échappement (ordre : `&` d'abord, en un seul passage). */
const ENTITES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Échappe tout balisage HTML et neutralise les caractères de contrôle (placeholders). */
export function echapper(texte: string): string {
  return texte.replace(/\u0000/g, "").replace(/[&<>"']/g, (caractere) => ENTITES[caractere]);
}

/** URL de lien : `http(s)://…` uniquement (javascript:, data:, vbscript: refusés). */
function estUrlDeLien(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Formats en ligne, dans l'ordre : code inline d'abord (mis en réserve pour ne
 * pas être réinterprété), puis liens, puis gras.
 */
function enLigne(texte: string): string {
  const codes: string[] = [];
  let sortie = texte.replace(/`([^`\n]+)`/g, (_trou, contenu: string) => {
    codes.push(contenu);
    return `\u0000${codes.length - 1}\u0000`;
  });

  sortie = sortie.replace(
    /\[([^\]\n]+)\]\(([^()\s]+)\)/g,
    (_trou, libelle: string, url: string) => {
      if (!estUrlDeLien(url)) return libelle; // protocole dangereux → simple texte
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${libelle}</a>`;
    },
  );

  sortie = sortie.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  sortie = sortie.replace(/\u0000(\d+)\u0000/g, (_trou, index: string) => {
    return `<code>${codes[Number(index)] ?? ""}</code>`;
  });
  return sortie;
}

/**
 * Rend une source markdown en HTML **toujours échappée** : le balisage d'entrée
 * n'apparaît jamais comme balise, il s'affiche textuel.
 */
export function renderMarkdown(source: string): string {
  const lignes = echapper(source).split(/\r?\n/);
  const blocs: string[] = [];

  let para: string[] = [];
  let puces: string[] = [];
  let code: string[] | null = null;

  const fermerPara = () => {
    if (para.length > 0) {
      blocs.push(`<p>${enLigne(para.join(" "))}</p>`);
      para = [];
    }
  };
  const fermerPuces = () => {
    if (puces.length > 0) {
      blocs.push(`<ul>${puces.map((puce) => `<li>${enLigne(puce)}</li>`).join("")}</ul>`);
      puces = [];
    }
  };

  for (const ligne of lignes) {
    // Bloc de code : le contenu est tel quel (déjà échappé), sans interprétation.
    if (code !== null) {
      if (ligne.startsWith("```")) {
        blocs.push(`<pre><code>${code.join("\n")}</code></pre>`);
        code = null;
      } else {
        code.push(ligne);
      }
      continue;
    }

    if (ligne.startsWith("```")) {
      fermerPara();
      fermerPuces();
      code = [];
      continue;
    }

    const titre = ligne.match(/^(#{1,6})\s+(.*)$/);
    if (titre) {
      fermerPara();
      fermerPuces();
      const niveau = titre[1].length;
      blocs.push(`<h${niveau}>${enLigne(titre[2])}</h${niveau}>`);
      continue;
    }

    const puce = ligne.match(/^\s*-\s+(.*)$/);
    if (puce) {
      fermerPara();
      puces.push(puce[1]);
      continue;
    }

    if (ligne.trim() === "") {
      fermerPara();
      fermerPuces();
      continue;
    }

    fermerPuces();
    para.push(ligne.trim());
  }

  if (code !== null) blocs.push(`<pre><code>${code.join("\n")}</code></pre>`); // fence non fermé
  fermerPara();
  fermerPuces();

  return blocs.join("\n");
}
