// Paramètres de priorité PROPOSÉS (PLAN.md §6, décision D3).
// En phase 1, ils sont seulement affichés. Le moteur de calcul et la
// modification par le père arrivent en phase 6.

export type CritereScore = "etat" | "intensite" | "densite" | "risque";

export type BandePriorite = "vert" | "jaune" | "orange" | "rouge" | "gris";

export interface SeuilCouleur {
  bande: Exclude<BandePriorite, "gris">;
  min: number;
  max: number;
}

export const POIDS_PAR_DEFAUT: Record<CritereScore, number> = {
  etat: 55,
  intensite: 20,
  densite: 15,
  risque: 10,
};

export const LIBELLES_CRITERES: Record<CritereScore, string> = {
  etat: "État de la chaussée",
  intensite: "Intensité de circulation",
  densite: "Densité d'habitation",
  risque: "Risque sécurité / mobilité",
};

/** Correspondance valeur → points (0 à 100) pour chaque critère. */
export const ECHELLES_PAR_DEFAUT: Record<
  CritereScore,
  ReadonlyArray<{ valeur: string; points: number }>
> = {
  etat: [
    { valeur: "1 — RAS", points: 0 },
    { valeur: "2 — correct", points: 25 },
    { valeur: "3 — valable", points: 50 },
    { valeur: "4 — mauvais", points: 75 },
    { valeur: "5 — dégradé", points: 100 },
  ],
  intensite: [
    { valeur: "Passage faible (et Lotissement)", points: 0 },
    { valeur: "Passage moyen", points: 33 },
    { valeur: "Passage élevé", points: 67 },
    { valeur: "Transit", points: 100 },
  ],
  densite: [
    { valeur: "Nul", points: 0 },
    { valeur: "Faible", points: 25 },
    { valeur: "Moyen bas", points: 50 },
    { valeur: "Moyen élevé", points: 75 },
    { valeur: "Élevé", points: 100 },
  ],
  risque: [
    { valeur: "1 — aucun risque identifié", points: 0 },
    { valeur: "2 — risque faible", points: 25 },
    { valeur: "3 — risque modéré", points: 50 },
    { valeur: "4 — risque important", points: 75 },
    { valeur: "5 — risque grave", points: 100 },
  ],
};

export const SEUILS_PAR_DEFAUT: ReadonlyArray<SeuilCouleur> = [
  { bande: "vert", min: 0, max: 24 },
  { bande: "jaune", min: 25, max: 49 },
  { bande: "orange", min: 50, max: 74 },
  { bande: "rouge", min: 75, max: 100 },
];

/** Part minimale des poids connus pour calculer un score (70 %). */
export const COUVERTURE_MINIMALE = 0.7;

/** Gestionnaires inclus dans le classement communal (D7). */
export const GESTIONNAIRES_CLASSEMENT = ["commune"] as const;

export const LIBELLES_BANDES: Record<BandePriorite, string> = {
  vert: "Priorité faible",
  jaune: "Priorité modérée",
  orange: "Priorité élevée",
  rouge: "Priorité très élevée",
  gris: "Non évalué",
};

/**
 * Bande de couleur d'un score déjà arrondi.
 * `null` (pas de score) donne toujours « gris ».
 */
export function bandeDuScore(
  score: number | null,
  seuils: ReadonlyArray<SeuilCouleur> = SEUILS_PAR_DEFAUT,
): BandePriorite {
  if (score === null || Number.isNaN(score)) return "gris";
  const seuil = seuils.find((s) => score >= s.min && score <= s.max);
  return seuil ? seuil.bande : "gris";
}
