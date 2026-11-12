// Calcul du score de priorité (PLAN.md §6.2). SEULE source du calcul :
// la carte, le tableau, la fiche, le classement et l'export utilisent tous ce fichier.
// Fonctions pures : mêmes entrées → même résultat, rien n'est enregistré en base.
//
//   critères comptés K = critères renseignés (valeur reconnue) ET de poids > 0
//   couverture         = somme des poids de K / somme de tous les poids
//   score              = somme(poids × points sur K) / somme des poids de K
//
// Pas de score si : état absent, OU aucun autre critère compté, OU couverture < minimum.
// Le père peut aussi FORCER la priorité d'une voirie (avec un motif) : voir prioriteEffective.
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
  ampleur_travaux?: string | null;
  annee_prevue?: number | null;
  echeance_estimee?: number | null;
  priorite_manuelle?: number | null;
  priorite_manuelle_motif?: string | null;
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
  /** Précision affichée (ex. « année prévue 2027 »). */
  precision: string | null;
  /** Points de l'échelle, ou null si non renseigné / valeur inconnue. */
  points: number | null;
  poids: number;
  /** Part du score apportée par ce critère (non arrondie). */
  contribution: number | null;
  /** Valeur présente mais absente de l'échelle (hors bornes) : traitée comme manquante. */
  invalide: boolean;
}

export interface ResultatScore {
  /** Score arrondi à l'entier (null = « Non évalué »). Priorité forcée comprise. */
  score: number | null;
  /** Couleur choisie sur le score ARRONDI. */
  bande: BandePriorite;
  /** Part des poids renseignés (0 à 1). */
  couverture: number;
  /** Vrai dès qu'un critère utilisé manque (couverture < 100 %). Jamais pour une priorité forcée. */
  provisoire: boolean;
  raison: RaisonNonEvalue | null;
  details: DetailCritere[];
  /** Critères utilisés (poids > 0) non renseignés. */
  manquants: CritereScore[];
  version: number | null;
  /** Priorité fixée à la main par le père (le score calculé reste visible à côté). */
  manuel: boolean;
  motif: string | null;
  /** Score calculé par la formule (identique à score si rien n'est forcé). */
  scoreCalcule: number | null;
  bandeCalculee: BandePriorite;
}

const PRECISION = 1e-9;

/**
 * Échéance comptée depuis l'année en cours, à partir de champs STRUCTURÉS
 * uniquement : l'année prévue (saisie) ou, à défaut, l'échéance estimée (D5).
 * Jamais à partir du texte libre.
 */
export function cleEcheance(e: EntreeScore, anneeCourante: number): { cle: string | null; precision: string | null } {
  const annee = e.annee_prevue ?? e.echeance_estimee ?? null;
  if (annee === null || annee === undefined) return { cle: null, precision: null };
  const ecart = annee - anneeCourante;
  const cle = ecart <= 0 ? "cette_annee" : ecart === 1 ? "1_an" : ecart <= 3 ? "2_3_ans" : ecart <= 5 ? "4_5_ans" : "plus_5_ans";
  return { cle, precision: e.annee_prevue != null ? `année prévue ${annee}` : `échéance estimée ${annee}` };
}

function valeurDe(e: EntreeScore, c: CritereScore, anneeCourante: number): { valeur: string | null; precision: string | null } {
  if (c === "echeance") {
    const r = cleEcheance(e, anneeCourante);
    return { valeur: r.cle, precision: r.precision };
  }
  const v =
    c === "etat"
      ? e.etat_note
      : c === "intensite"
        ? e.intensite_circulation
        : c === "densite"
          ? e.densite_habitation
          : c === "risque"
            ? e.risque_securite
            : e.ampleur_travaux;
  return { valeur: v === null || v === undefined || v === "" ? null : String(v), precision: null };
}

/** Arrondi à l'entier le plus proche, 0,5 vers le haut, sans piège de virgule flottante. */
export function arrondir(x: number): number {
  return Math.floor(Math.round(x * 1e6) / 1e6 + 0.5);
}

/** Score CALCULÉ par la formule (ne tient pas compte d'une priorité forcée). */
export function calculerScore(
  entree: EntreeScore | null | undefined,
  p: ParametresScore,
  anneeCourante: number = new Date().getFullYear(),
): ResultatScore {
  const e = entree ?? {};
  const poidsTotal = CRITERES.reduce((s, c) => s + Math.max(0, p.poids[c] ?? 0), 0);

  const bruts = CRITERES.map((c) => {
    const { valeur, precision } = valeurDe(e, c, anneeCourante);
    const echelle = (p.echelles[c] ?? {}) as Record<string, number>;
    const points = valeur !== null && Object.hasOwn(echelle, valeur) ? echelle[valeur] : null;
    return { critere: c, valeur, precision, points, poids: Math.max(0, p.poids[c] ?? 0), invalide: valeur !== null && points === null };
  });

  // Un critère de poids 0 est affiché mais ne compte pas.
  const comptes = bruts.filter((d) => d.points !== null && d.poids > 0);
  const poidsConnus = comptes.reduce((s, d) => s + d.poids, 0);
  const couverture = poidsTotal > 0 ? poidsConnus / poidsTotal : 0;
  const manquants = bruts.filter((d) => d.points === null && d.poids > 0).map((d) => d.critere);

  let raison: RaisonNonEvalue | null = null;
  if (!comptes.some((d) => d.critere === "etat")) raison = "etat_manquant";
  else if (comptes.length < 2) raison = "aucun_autre_critere";
  else if (poidsConnus <= 0 || couverture + PRECISION < p.couverture_min) raison = "couverture_insuffisante";

  const brut = raison === null ? comptes.reduce((s, d) => s + d.poids * d.points!, 0) / poidsConnus : null;
  const details: DetailCritere[] = bruts.map((d) => ({
    ...d,
    contribution: raison === null && d.points !== null && d.poids > 0 ? (d.poids * d.points) / poidsConnus : null,
  }));
  const score = brut === null ? null : arrondir(brut);
  const bande = bandeDuScore(score, p.seuils);

  return {
    score,
    bande,
    couverture,
    provisoire: score !== null && couverture + PRECISION < 1,
    raison,
    details,
    manquants,
    version: p.version,
    manuel: false,
    motif: null,
    scoreCalcule: score,
    bandeCalculee: bande,
  };
}

/**
 * Priorité réellement utilisée (carte, liste, classement, export) :
 * la priorité forcée par le père si elle existe, sinon le score calculé.
 */
export function prioriteEffective(
  entree: EntreeScore | null | undefined,
  p: ParametresScore,
  anneeCourante: number = new Date().getFullYear(),
): ResultatScore {
  const calcule = calculerScore(entree, p, anneeCourante);
  const force = entree?.priorite_manuelle;
  if (force === null || force === undefined || !Number.isInteger(force) || force < 0 || force > 100) return calcule;
  return {
    ...calcule,
    score: force,
    bande: bandeDuScore(force, p.seuils),
    provisoire: false,
    raison: null,
    manuel: true,
    motif: entree?.priorite_manuelle_motif ?? null,
  };
}
