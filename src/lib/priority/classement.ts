// Classement des voiries par score (écran Priorités), à partir de calculerScore.
import type { Gestionnaire } from "@/lib/domaine";
import { nomAffiche } from "@/lib/donnees/libelles";
import type { FicheVoirie } from "@/lib/donnees/types";
import type { ParametresScore } from "@/lib/priority/defaults";
import { calculerScore, type ResultatScore } from "@/lib/priority/score";

export interface LigneClassement {
  id: string;
  nom: string;
  gestionnaire: Gestionnaire;
  resultat: ResultatScore;
}

export interface Classement {
  /** Voiries avec un score, de la plus prioritaire à la moins prioritaire. */
  classees: Array<LigneClassement & { rang: number }>;
  /** Voiries évaluées en partie (une donnée au moins), sans score. */
  nonEvaluees: LigneClassement[];
  /** Voiries d'un autre gestionnaire, mises de côté (si l'exclusion est cochée). */
  horsClassement: LigneClassement[];
}

/** Le gestionnaire « inconnu » reste dans le classement : il est à confirmer, pas à exclure. */
export function dansClassementCommunal(g: Gestionnaire, p: ParametresScore): boolean {
  return g === "inconnu" || p.gestionnaires_classement.includes(g);
}

const comparerNom = new Intl.Collator("fr", { sensitivity: "base", numeric: true }).compare;

export function classer(
  fiches: Iterable<FicheVoirie>,
  p: ParametresScore,
  options: { exclureHorsCommune: boolean },
): Classement {
  const classees: LigneClassement[] = [];
  const nonEvaluees: LigneClassement[] = [];
  const horsClassement: LigneClassement[] = [];

  for (const f of fiches) {
    // Les voiries disparues ou hors commune ne sont jamais classées.
    if (f.statutFiche === "n_existe_plus" || f.statutFiche === "hors_commune") continue;
    const ligne: LigneClassement = { id: f.id, nom: nomAffiche(f), gestionnaire: f.gestionnaire, resultat: calculerScore(f.evaluation, p) };
    if (options.exclureHorsCommune && !dansClassementCommunal(f.gestionnaire, p)) {
      if (f.evaluation) horsClassement.push(ligne);
    } else if (ligne.resultat.score !== null) classees.push(ligne);
    else if (f.evaluation) nonEvaluees.push(ligne);
  }

  // Score décroissant ; à égalité, le plus mauvais état d'abord, puis le nom.
  const pointsEtat = (l: LigneClassement) => l.resultat.details.find((d) => d.critere === "etat")?.points ?? -1;
  classees.sort((a, b) => b.resultat.score! - a.resultat.score! || pointsEtat(b) - pointsEtat(a) || comparerNom(a.nom, b.nom));
  nonEvaluees.sort((a, b) => comparerNom(a.nom, b.nom));
  horsClassement.sort((a, b) => (b.resultat.score ?? -1) - (a.resultat.score ?? -1) || comparerNom(a.nom, b.nom));

  // Rang « sportif » : deux scores égaux partagent le même rang.
  let rang = 0;
  const avecRang = classees.map((l, i) => {
    if (i === 0 || l.resultat.score !== classees[i - 1].resultat.score) rang = i + 1;
    return { ...l, rang };
  });
  return { classees: avecRang, nonEvaluees, horsClassement };
}
