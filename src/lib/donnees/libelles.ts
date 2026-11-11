// Libellés affichés pour les valeurs de la base.
import type { AmpleurTravaux } from "@/lib/excel/types";
import type { CategorieFiche } from "@/lib/donnees/types";

export const LIBELLES_TRAVAUX: Record<AmpleurTravaux, string> = {
  schlammage: "Schlammage",
  enduisage: "Enduisage",
  raclage_partiel: "Raclage/pose partiel",
  raclage_complet: "Raclage/pose complet",
  reparation_ponctuelle: "Réparation ponctuelle",
  autre: "Autre",
};

export const LIBELLES_CATEGORIE: Record<CategorieFiche, string> = {
  voirie: "Voirie",
  chemin: "Chemin ou sentier",
  acces: "Accès ou parking",
  section: "Partie de rue",
};

export const LIBELLES_RISQUE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "1 — aucun risque identifié",
  2: "2 — risque faible",
  3: "3 — risque modéré",
  4: "4 — risque important",
  5: "5 — risque grave",
};

/** Nom affiché d'une voirie (les voies sans nom ont un libellé explicite). */
export function nomAffiche(f: { nom: string | null; categorie: CategorieFiche }): string {
  if (f.nom) return f.nom;
  return f.categorie === "chemin" ? "Chemin sans nom" : f.categorie === "acces" ? "Accès sans nom" : "Voie sans nom";
}
