// Styles des tracés sur la carte. Phase 2 : aucune évaluation n'existe encore,
// toutes les voiries sont donc grises (« Non évalué »). La couleur de
// priorité arrivera en phase 6, toujours une seule couleur par voirie logique.
import type { PathOptions } from "leaflet";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { SegmentProps } from "@/lib/geo/types";

export const COULEUR_SELECTION = "#0d6b69";
export const COULEUR_LIMITE = "#12262f";

const BASE: Record<CategorieVoie, PathOptions> = {
  voirie: { color: "#6b777c", weight: 3.5, opacity: 0.95 },
  chemin: { color: "#8f9a9e", weight: 2, opacity: 0.85 },
  acces: { color: "#a9b1b4", weight: 1.5, opacity: 0.8 },
};

/** Trait en pointillés = indice « réseau régional SPW » (jamais une couleur). */
const POINTILLE_SPW = "8 6";

export function styleSegment(p: SegmentProps, selectionne: boolean): PathOptions {
  const base = BASE[p.cat];
  if (selectionne) {
    return {
      ...base,
      color: COULEUR_SELECTION,
      weight: Math.max(6, (base.weight ?? 2) + 3),
      opacity: 1,
      dashArray: p.spw ? POINTILLE_SPW : undefined,
    };
  }
  return { ...base, dashArray: p.spw ? POINTILLE_SPW : undefined };
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
