// Calcul du score de priorité (PLAN.md §6.2). SEULE source du calcul :
// la carte, le tableau, la fiche et le classement utilisent tous cette fonction.
// Fonction pure : mêmes entrées → même résultat, rien n'est enregistré en base.
//
//   critères connus K = critères renseignés (valeur reconnue par l'échelle)
//   couverture       = somme des poids de K / somme de tous les poids
//   score            = somme(poids × points sur K) / somme des poids de K
//
// Pas de score si : état absent, OU aucun autre critère, OU couverture < minimum.
import {
  bandeDuScore,
  CRITERES,
  type BandePriorite,
  type CritereScore,
  type ParametresScore,
} from "@/lib/priority/defaults";

/** Valeurs d'une évaluation utiles au score (colonnes de road_evaluations). */
export interface EntreeScore {
  etat_note?: number | null;
  intensite_circulation?: string | null;
  densite_habitation?: string | null;
  risque_securite?: number | null;
}

export type RaisonNonEvalue = "etat_manquant" | "aucun_autre_critere" | "couverture_insuffisante";

export const LIBELLES_RAISON: Record<RaisonNonEvalue, string> = {
  etat_manquant: "état de la chaussée non noté",
  aucun_autre_critere: "aucun autre critère renseigné",
  couverture_insuffisante: "trop peu de critères renseignés",
};

export interface DetailCritere {
  critere: CritereScore;
  /** Valeur enregistrée (clé de l'échelle), ou null si non renseignée. */
  valeur: string | null;
  /** Points de l'échelle, ou null si non renseigné / valeur inconnue. */
  points: number | null;
  poids: number;
  /** Part du score apportée par ce critère (non arrondie). */
  contribution: number | null;
  /** Valeur présente mais absente de l'échelle (hors bornes) : traitée comme manquante. */
  invalide: boolean;
}

export interface ResultatScore {
  /** Score arrondi à l'entier (null = « Non évalué »). */
  score: number | null;
  /** Couleur choisie sur le score ARRONDI. */
  bande: BandePriorite;
  /** Part des poids renseignés (0 à 1). */
  couverture: number;
  /** Vrai dès qu'un critère manque (couverture < 100 %). */
  provisoire: boolean;
  raison: RaisonNonEvalue | null;
  details: DetailCritere[];
  manquants: CritereScore[];
  version: number | null;
}

const PRECISION = 1e-9;

function valeurDe(e: EntreeScore, c: CritereScore): string | null {
  const v =
    c === "etat" ? e.etat_note : c === "intensite" ? e.intensite_circulation : c === "densite" ? e.densite_habitation : e.risque_securite;
  return v === null || v === undefined || v === "" ? null : String(v);
}

/** Arrondi à l'entier le plus proche, 0,5 vers le haut, sans piège de virgule flottante. */
export function arrondir(x: number): number {
  return Math.floor(Math.round(x * 1e6) / 1e6 + 0.5);
}

export function calculerScore(entree: EntreeScore | null | undefined, p: ParametresScore): ResultatScore {
  const e = entree ?? {};
  const poidsTotal = CRITERES.reduce((s, c) => s + Math.max(0, p.poids[c] ?? 0), 0);

  const bruts = CRITERES.map((c) => {
    const valeur = valeurDe(e, c);
    const echelle = p.echelles[c] as Record<string, number>;
    const points = valeur !== null && Object.hasOwn(echelle, valeur) ? echelle[valeur] : null;
    return { critere: c, valeur, points, poids: Math.max(0, p.poids[c] ?? 0), invalide: valeur !== null && points === null };
  });

  const connus = bruts.filter((d) => d.points !== null);
  const poidsConnus = connus.reduce((s, d) => s + d.poids, 0);
  const couverture = poidsTotal > 0 ? poidsConnus / poidsTotal : 0;
  const manquants = bruts.filter((d) => d.points === null).map((d) => d.critere);

  let raison: RaisonNonEvalue | null = null;
  if (!connus.some((d) => d.critere === "etat")) raison = "etat_manquant";
  else if (connus.length < 2) raison = "aucun_autre_critere";
  else if (poidsConnus <= 0 || couverture + PRECISION < p.couverture_min) raison = "couverture_insuffisante";

  const brut = raison === null ? connus.reduce((s, d) => s + d.poids * d.points!, 0) / poidsConnus : null;
  const details: DetailCritere[] = bruts.map((d) => ({
    ...d,
    contribution: raison === null && d.points !== null ? (d.poids * d.points) / poidsConnus : null,
  }));
  const score = brut === null ? null : arrondir(brut);

  return {
    score,
    bande: bandeDuScore(score, p.seuils),
    couverture,
    provisoire: score !== null && couverture + PRECISION < 1,
    raison,
    details,
    manquants,
    version: p.version,
  };
}
