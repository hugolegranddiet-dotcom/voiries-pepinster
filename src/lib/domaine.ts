// Vocabulaire métier partagé par toute l'application.
// Les valeurs reprennent DATA_MODEL.md ; `null` signifie toujours « inconnu ».

export type Gestionnaire = "commune" | "spw" | "autre" | "inconnu";

export type MentionEtatSource = "RAS" | "SPW" | "vide" | "autre";

export type IntensiteCirculation = "faible" | "moyen" | "eleve" | "transit";

export type DensiteHabitation =
  | "nul"
  | "faible"
  | "moyen_bas"
  | "moyen_eleve"
  | "eleve";

export type StatutFiche =
  | "a_completer"
  | "importe_excel"
  | "valide"
  | "n_existe_plus"
  | "hors_commune";

/** Note de 1 (bon) à 5 (pire). */
export type Note1a5 = 1 | 2 | 3 | 4 | 5;

export const LIBELLES_GESTIONNAIRE: Record<Gestionnaire, string> = {
  commune: "Commune",
  spw: "SPW",
  autre: "Autre gestionnaire",
  inconnu: "Gestionnaire inconnu",
};

export const LIBELLES_INTENSITE: Record<IntensiteCirculation, string> = {
  faible: "Passage faible",
  moyen: "Passage moyen",
  eleve: "Passage élevé",
  transit: "Transit",
};

export const LIBELLES_DENSITE: Record<DensiteHabitation, string> = {
  nul: "Nul",
  faible: "Faible",
  moyen_bas: "Moyen bas",
  moyen_eleve: "Moyen élevé",
  eleve: "Élevé",
};

export const LIBELLES_ETAT: Record<Note1a5, string> = {
  1: "1 — RAS",
  2: "2 — correct",
  3: "3 — valable",
  4: "4 — mauvais",
  5: "5 — dégradé",
};

export const LIBELLES_STATUT: Record<StatutFiche, string> = {
  a_completer: "À compléter",
  importe_excel: "Importée de l'Excel",
  valide: "Validée",
  n_existe_plus: "N'existe plus",
  hors_commune: "Hors commune",
};
