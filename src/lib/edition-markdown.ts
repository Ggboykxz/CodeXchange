// Opérations pures de mise en forme Markdown sur une zone de texte.
//
// Séparées du composant pour être testables sans DOM : chaque fonction reçoit
// le texte complet et la sélection courante, et renvoie le nouveau texte ainsi
// que la sélection à restaurer. Aucune dépendance, aucun accès au navigateur.

export type ActionFormat =
  | "gras"
  | "italique"
  | "code"
  | "bloc-code"
  | "lien"
  | "citation"
  | "liste";

export type ResultatFormat = {
  texte: string;
  /** Début de la sélection à restaurer dans le textarea. */
  debut: number;
  /** Fin de la sélection à restaurer dans le textarea. */
  fin: number;
};

const MARQUEURS: Record<"gras" | "italique" | "code", string> = {
  gras: "**",
  italique: "*",
  code: "`",
};

/** Borne une sélection aux limites du texte et garantit debut <= fin. */
function normaliser(texte: string, debut: number, fin: number) {
  const d = Math.max(0, Math.min(debut, fin, texte.length));
  const f = Math.max(0, Math.min(Math.max(debut, fin), texte.length));
  return { debut: d, fin: f, selection: texte.slice(d, f) };
}

function entourer(
  texte: string,
  debut: number,
  fin: number,
  selection: string,
  marqueur: string,
): ResultatFormat {
  const avant = texte.slice(0, debut);
  const apres = texte.slice(fin);

  // Sélection déjà entourée par les marqueurs → on les retire (bascule).
  if (
    selection.length >= marqueur.length * 2 &&
    selection.startsWith(marqueur) &&
    selection.endsWith(marqueur)
  ) {
    const interieur = selection.slice(marqueur.length, selection.length - marqueur.length);
    return {
      texte: avant + interieur + apres,
      debut,
      fin: debut + interieur.length,
    };
  }

  // Marqueurs collés de part et d'autre de la sélection → on les retire.
  if (
    texte.slice(Math.max(0, debut - marqueur.length), debut) === marqueur &&
    texte.slice(fin, fin + marqueur.length) === marqueur
  ) {
    return {
      texte:
        texte.slice(0, debut - marqueur.length) +
        selection +
        texte.slice(fin + marqueur.length),
      debut: debut - marqueur.length,
      fin: fin - marqueur.length,
    };
  }

  return {
    texte: avant + marqueur + selection + marqueur + apres,
    debut: debut + marqueur.length,
    fin: fin + marqueur.length,
  };
}

/** Préfixe chaque ligne non vide d'un bloc (citation, liste). */
function prefixerLignes(
  texte: string,
  debut: number,
  fin: number,
  prefixe: string,
): ResultatFormat {
  const debutLigne = texte.lastIndexOf("\n", Math.max(0, debut - 1)) + 1;
  const finLigneBrute = texte.indexOf("\n", fin);
  const finLigne = finLigneBrute === -1 ? texte.length : finLigneBrute;
  const bloc = texte.slice(debutLigne, finLigne);
  const lignes = bloc.split("\n");
  const nonVides = lignes.filter((l) => l.trim() !== "");
  const dejaPrefixees =
    nonVides.length > 0 && nonVides.every((l) => l.startsWith(prefixe));

  const modifiees = lignes.map((l) => {
    if (l.trim() === "") return l;
    return dejaPrefixees ? l.slice(prefixe.length) : prefixe + l;
  });
  const nouveauBloc = modifiees.join("\n");
  const avant = texte.slice(0, debutLigne);
  const apres = texte.slice(finLigne);

  // Sans sélection, on garde le curseur à sa place relative dans la ligne.
  if (debut === fin) {
    const ligneVide = lignes.length === 1 && lignes[0].trim() === "";
    const decalage = dejaPrefixees
      ? -prefixe.length
      : ligneVide
        ? 0
        : prefixe.length;
    const position = Math.max(debutLigne, debut + decalage);
    return { texte: avant + nouveauBloc + apres, debut: position, fin: position };
  }

  return {
    texte: avant + nouveauBloc + apres,
    debut: debutLigne,
    fin: debutLigne + nouveauBloc.length,
  };
}

/**
 * Applique une action de mise en forme à une sélection.
 *
 * Les actions en ligne (`gras`, `italique`, `code`) fonctionnent comme un
 * interrupteur : reappliquer sur un texte déjà formaté retire les marqueurs.
 */
export function appliquerFormat(
  texte: string,
  debut: number,
  fin: number,
  action: ActionFormat,
): ResultatFormat {
  const { debut: d, fin: f, selection } = normaliser(texte, debut, fin);

  if (action === "gras" || action === "italique" || action === "code") {
    return entourer(texte, d, f, selection, MARQUEURS[action]);
  }

  if (action === "bloc-code") {
    const avant = texte.slice(0, d);
    const apres = texte.slice(f);
    return {
      texte: `${avant}\`\`\`\n${selection}\n\`\`\`${apres}`,
      debut: d + 4,
      fin: d + 4 + selection.length,
    };
  }

  if (action === "lien") {
    if (selection === "") {
      const lien = "[texte](https://)";
      return { texte: texte.slice(0, d) + lien + texte.slice(f), debut: d + 1, fin: d + 6 };
    }
    const lien = `[${selection}](https://)`;
    const debutUrl = d + 1 + selection.length + 2;
    return {
      texte: texte.slice(0, d) + lien + texte.slice(f),
      debut: debutUrl,
      fin: debutUrl + "https://".length,
    };
  }

  if (action === "citation") {
    return prefixerLignes(texte, d, f, "> ");
  }

  return prefixerLignes(texte, d, f, "- ");
}
