// Styles des tracés sur la carte.
// Règle : UNE apparence par voirie logique, calculée à partir de sa fiche et du
// score (calculerScore) ; tous les segments d'une même voirie reçoivent donc
// toujours la même couleur.
import type { PathOptions } from "leaflet";
import type { FicheVoirie } from "@/lib/donnees/types";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { SegmentProps } from "@/lib/geo/types";
import type { BandePriorite, ParametresScore } from "@/lib/priority/defaults";
import { calculerScore } from "@/lib/priority/score";

export const COULEUR_LIMITE = "#12262f";
/** Contour sombre de la voirie sélectionnée (sa couleur de priorité reste visible). */
export const COULEUR_SELECTION = "#12262f";

/**
 * Couleurs de priorité. Choisies pour rester distinctes pour la plupart des
 * personnes daltoniennes (le vert tire vers le bleu, le rouge est foncé, le
 * jaune clair) ; le score est de toute façon toujours écrit en chiffres.
 */
export const COULEURS_BANDE: Record<BandePriorite, string> = {
  vert: "#1b9e77",
  jaune: "#e0a800",
  orange: "#e66101",
  rouge: "#b2182b",
  gris: "#8a9499",
};

export interface ApparenceVoirie {
  bande: BandePriorite;
  /** SPW ou autre gestionnaire : trait en pointillés (jamais une couleur forcée). */
  pointille: boolean;
}

/** Apparence d'une voirie, d'après sa fiche, le score, et l'indice SPW si le gestionnaire est inconnu. */
export function apparenceDe(fiche: FicheVoirie | undefined, indiceSpwSegment: boolean, p: ParametresScore): ApparenceVoirie {
  const gestion = fiche?.gestionnaire ?? "inconnu";
  return {
    bande: calculerScore(fiche?.evaluation, p).bande,
    pointille: gestion === "spw" || gestion === "autre" || (gestion === "inconnu" && indiceSpwSegment),
  };
}

const EPAISSEUR: Record<CategorieVoie, number> = { voirie: 3.5, chemin: 2, acces: 1.5 };
const POINTILLE = "8 6";

export function styleSegment(p: SegmentProps, a: ApparenceVoirie): PathOptions {
  const evaluee = a.bande !== "gris";
  return {
    color: COULEURS_BANDE[a.bande],
    // Une voirie évaluée est un peu plus épaisse que les voies non évaluées.
    weight: EPAISSEUR[p.cat] + (evaluee ? 1.5 : 0),
    opacity: evaluee ? 1 : p.cat === "voirie" ? 0.9 : 0.75,
    dashArray: a.pointille ? POINTILLE : undefined,
  };
}

/** Voirie sélectionnée : un contour sombre (dessous) + sa propre couleur (dessus). */
export function stylesSelection(p: SegmentProps, a: ApparenceVoirie): { contour: PathOptions; trait: PathOptions } {
  const base = styleSegment(p, a);
  const epaisseur = Math.max(5, (base.weight ?? 3) + 2);
  return {
    contour: { color: COULEUR_SELECTION, weight: epaisseur + 5, opacity: 0.9, interactive: false, lineCap: "round" },
    trait: { ...base, weight: epaisseur, opacity: 1, interactive: false },
  };
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
