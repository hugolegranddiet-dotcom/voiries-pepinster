// Paramètres du score de priorité (PLAN.md §6, décision D3).
// Ce sont les valeurs PAR DÉFAUT (version 1). Le père peut les modifier dans
// l'écran Paramètres : chaque modification crée une nouvelle version en base.
import type { Gestionnaire } from "@/lib/domaine";

export type CritereScore = "etat" | "intensite" | "densite" | "risque" | "travaux" | "echeance";

/**
 * Critères du score. « travaux » et « echeance » ont été ajoutés le 11/11/2026
 * (décision D19) avec un poids de 0 : ils ne comptent que si le père les active.
 */
export const CRITERES: readonly CritereScore[] = ["etat", "intensite", "densite", "risque", "travaux", "echeance"];

export type BandePriorite = "vert" | "jaune" | "orange" | "rouge" | "gris";
export type BandeScore = Exclude<BandePriorite, "gris">;
export const BANDES: readonly BandeScore[] = ["vert", "jaune", "orange", "rouge"];

export interface SeuilCouleur {
  bande: BandeScore;
  min: number;
  max: number;
}

/** Valeurs possibles de chaque critère (clés des échelles, dans l'ordre). */
export const VALEURS_CRITERE = {
  etat: ["1", "2", "3", "4", "5"],
  intensite: ["faible", "moyen", "eleve", "transit"],
  densite: ["nul", "faible", "moyen_bas", "moyen_eleve", "eleve"],
  risque: ["1", "2", "3", "4", "5"],
  travaux: ["reparation_ponctuelle", "schlammage", "enduisage", "raclage_partiel", "raclage_complet", "autre"],
  /** Délai avant l'échéance (année prévue, sinon échéance estimée), compté depuis l'année en cours. */
  echeance: ["cette_annee", "1_an", "2_3_ans", "4_5_ans", "plus_5_ans"],
} as const satisfies Record<CritereScore, readonly string[]>;

/** Points (0 à 100) donnés à chaque valeur d'un critère. */
export type Echelles = { [C in CritereScore]: Record<(typeof VALEURS_CRITERE)[C][number], number> };

export interface ParametresScore {
  /** Version enregistrée en base (null = valeurs par défaut, rien en base). */
  version: number | null;
  poids: Record<CritereScore, number>;
  echelles: Echelles;
  seuils: SeuilCouleur[];
  /** Part minimale des poids renseignés pour calculer un score (0 à 1). */
  couverture_min: number;
  /** Gestionnaires gardés dans le classement communal quand on exclut les autres. */
  gestionnaires_classement: Gestionnaire[];
}

export const POIDS_PAR_DEFAUT: Record<CritereScore, number> = { etat: 55, intensite: 20, densite: 15, risque: 10, travaux: 0, echeance: 0 };

export const ECHELLES_PAR_DEFAUT: Echelles = {
  etat: { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 },
  intensite: { faible: 0, moyen: 33, eleve: 67, transit: 100 },
  densite: { nul: 0, faible: 25, moyen_bas: 50, moyen_eleve: 75, eleve: 100 },
  risque: { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 },
  // Plus les travaux à prévoir sont lourds, plus la route est prioritaire (proposition, modifiable).
  travaux: { reparation_ponctuelle: 20, schlammage: 40, enduisage: 50, raclage_partiel: 75, raclage_complet: 100, autre: 50 },
  // Plus l'échéance est proche, plus la route est prioritaire (proposition, modifiable).
  echeance: { cette_annee: 100, "1_an": 75, "2_3_ans": 50, "4_5_ans": 25, plus_5_ans: 0 },
};

export const SEUILS_PAR_DEFAUT: SeuilCouleur[] = [
  { bande: "vert", min: 0, max: 24 },
  { bande: "jaune", min: 25, max: 49 },
  { bande: "orange", min: 50, max: 74 },
  { bande: "rouge", min: 75, max: 100 },
];

/** Part minimale des poids connus pour calculer un score (70 %). */
export const COUVERTURE_MINIMALE = 0.7;

/** Gestionnaires inclus dans le classement communal (D7 : SPW et « autre » exclus). */
export const GESTIONNAIRES_CLASSEMENT: Gestionnaire[] = ["commune"];

export const PARAMETRES_PAR_DEFAUT: ParametresScore = {
  version: null,
  poids: POIDS_PAR_DEFAUT,
  echelles: ECHELLES_PAR_DEFAUT,
  seuils: SEUILS_PAR_DEFAUT,
  couverture_min: COUVERTURE_MINIMALE,
  gestionnaires_classement: GESTIONNAIRES_CLASSEMENT,
};

export const LIBELLES_CRITERES: Record<CritereScore, string> = {
  etat: "État de la chaussée",
  intensite: "Intensité de circulation",
  densite: "Densité d'habitation",
  risque: "Risque sécurité / mobilité",
  travaux: "Ampleur des travaux",
  echeance: "Échéance",
};

/** Libellé affiché d'une valeur de critère. */
export const LIBELLES_VALEURS: { [C in CritereScore]: Record<(typeof VALEURS_CRITERE)[C][number], string> } = {
  etat: { 1: "1 — RAS", 2: "2 — correct", 3: "3 — valable", 4: "4 — mauvais", 5: "5 — dégradé" },
  intensite: { faible: "Passage faible (et Lotissement)", moyen: "Passage moyen", eleve: "Passage élevé", transit: "Transit" },
  densite: { nul: "Nul", faible: "Faible", moyen_bas: "Moyen bas", moyen_eleve: "Moyen élevé", eleve: "Élevé" },
  risque: {
    1: "1 — aucun risque identifié",
    2: "2 — risque faible",
    3: "3 — risque modéré",
    4: "4 — risque important",
    5: "5 — risque grave",
  },
  travaux: {
    reparation_ponctuelle: "Réparation ponctuelle",
    schlammage: "Schlammage",
    enduisage: "Enduisage",
    raclage_partiel: "Raclage/pose partiel",
    raclage_complet: "Raclage/pose complet",
    autre: "Autre",
  },
  echeance: {
    cette_annee: "Cette année (ou dépassée)",
    "1_an": "Dans 1 an",
    "2_3_ans": "Dans 2 à 3 ans",
    "4_5_ans": "Dans 4 à 5 ans",
    plus_5_ans: "Dans plus de 5 ans",
  },
};

export function libelleValeur(c: CritereScore, v: string): string {
  return (LIBELLES_VALEURS[c] as Record<string, string>)[v] ?? v;
}

export const LIBELLES_BANDES: Record<BandePriorite, string> = {
  vert: "Priorité faible",
  jaune: "Priorité modérée",
  orange: "Priorité élevée",
  rouge: "Priorité très élevée",
  gris: "Non évalué",
};

/**
 * Bande de couleur d'un score DÉJÀ ARRONDI.
 * `null` (pas de score) donne toujours « gris ».
 */
export function bandeDuScore(score: number | null, seuils: ReadonlyArray<SeuilCouleur> = SEUILS_PAR_DEFAUT): BandePriorite {
  if (score === null || Number.isNaN(score)) return "gris";
  const seuil = seuils.find((s) => score >= s.min && score <= s.max);
  return seuil ? seuil.bande : "gris";
}
