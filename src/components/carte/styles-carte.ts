// Styles des tracés sur la carte.
// Règle : UNE apparence par voirie logique, calculée à partir de sa fiche ;
// tous les segments d'une même voirie reçoivent donc toujours le même style.
// Phase 5 : gris = état non noté ; bleu = note d'état saisie (la couleur de
// priorité, vert → rouge, arrive en phase 6).
import type { PathOptions } from "leaflet";
import type { FicheVoirie } from "@/lib/donnees/types";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { SegmentProps } from "@/lib/geo/types";

export const COULEUR_SELECTION = "#0d6b69";
export const COULEUR_LIMITE = "#12262f";
export const COULEUR_NON_EVALUE = "#6b777c";
export const COULEUR_NOTE_SAISIE = "#3b5bdb";

export type Remplissage = "non_evalue" | "note_saisie";

export interface ApparenceVoirie {
  remplissage: Remplissage;
  /** SPW ou autre gestionnaire : trait en pointillés (jamais une couleur forcée). */
  pointille: boolean;
}

/** Apparence d'une voirie, d'après sa fiche (et l'indice SPW si le gestionnaire est inconnu). */
export function apparenceDe(fiche: FicheVoirie | undefined, indiceSpwSegment: boolean): ApparenceVoirie {
  const gestion = fiche?.gestionnaire ?? "inconnu";
  return {
    remplissage: fiche?.evaluation?.etat_note ? "note_saisie" : "non_evalue",
    pointille: gestion === "spw" || gestion === "autre" || (gestion === "inconnu" && indiceSpwSegment),
  };
}

const BASE: Record<CategorieVoie, PathOptions> = {
  voirie: { weight: 3.5, opacity: 0.95 },
  chemin: { weight: 2, opacity: 0.85 },
  acces: { weight: 1.5, opacity: 0.8 },
};
const ECLAIRCI: Record<CategorieVoie, string> = { voirie: COULEUR_NON_EVALUE, chemin: "#8f9a9e", acces: "#a9b1b4" };
const POINTILLE = "8 6";

export function styleSegment(p: SegmentProps, a: ApparenceVoirie, selectionne: boolean): PathOptions {
  const base = BASE[p.cat];
  const couleur = a.remplissage === "note_saisie" ? COULEUR_NOTE_SAISIE : ECLAIRCI[p.cat];
  if (selectionne) {
    return { ...base, color: COULEUR_SELECTION, weight: Math.max(6, (base.weight ?? 2) + 3), opacity: 1, dashArray: a.pointille ? POINTILLE : undefined };
  }
  return { ...base, color: couleur, dashArray: a.pointille ? POINTILLE : undefined };
}

export const STYLE_COMMUNE: PathOptions = {
  color: COULEUR_LIMITE,
  weight: 2.5,
  opacity: 0.9,
  fillColor: COULEUR_LIMITE,
  fillOpacity: 0.03,
  interactive: false,
};

export const STYLE_SECTION: PathOptions = {
  color: "#56676d",
  weight: 1.2,
  opacity: 0.7,
  dashArray: "2 5",
  fill: false,
  interactive: false,
};
