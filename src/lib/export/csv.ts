// Export CSV des voiries, lisible directement par Excel en français :
// séparateur « ; », virgule décimale, accents conservés (BOM UTF-8), fins de ligne Windows.
// Fonction pure : testée, et la même pour la liste, le classement et la sauvegarde.
import { LIBELLES_DENSITE, LIBELLES_ETAT, LIBELLES_GESTIONNAIRE, LIBELLES_INTENSITE, LIBELLES_STATUT } from "@/lib/domaine";
import { LIBELLES_CATEGORIE, LIBELLES_RISQUE, LIBELLES_TRAVAUX, nomAffiche } from "@/lib/donnees/libelles";
import type { FicheVoirie } from "@/lib/donnees/types";
import { LIBELLES_BANDES, type ParametresScore } from "@/lib/priority/defaults";
import { calculerScore, LIBELLES_RAISON } from "@/lib/priority/score";

const SEPARATEUR = ";";
const FIN_DE_LIGNE = "\r\n";
const BOM = "﻿";

/**
 * Une cellule CSV sûre :
 * - entre guillemets si elle contient « ; », un guillemet ou un retour à la ligne ;
 * - précédée d'une apostrophe si elle commence par = + - @ (sinon Excel pourrait
 *   l'exécuter comme une formule : « injection de formule »).
 */
export function cellule(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  let t = typeof v === "number" ? String(v).replace(".", ",") : typeof v === "boolean" ? (v ? "oui" : "non") : v;
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

const lib = <K extends string>(table: Record<K, string>, cle: string | number | null | undefined) =>
  cle === null || cle === undefined ? null : ((table as Record<string, string>)[String(cle)] ?? String(cle));

export interface OptionsExport {
  parametres: ParametresScore;
  /** Pour une section : nom de sa voirie mère. */
  nomParent?: (id: string) => string | null;
  /** Rang dans le classement (export du classement). */
  rang?: (id: string) => number | null;
}

const ENTETES = [
  "Identifiant",
  "Nom",
  "Type",
  "Partie de",
  "Anciennes communes",
  "Gestionnaire",
  "Précision gestionnaire",
  "Statut de la fiche",
  "État (1 à 5)",
  "État (libellé)",
  "Circulation",
  "Densité d'habitation",
  "Risque sécurité",
  "Travaux",
  "Échéance (texte)",
  "Année prévue",
  "Année de réalisation",
  "Échéance estimée",
  "Sécurisation / mobilité",
  "Particularités",
  "Score",
  "Priorité",
  "Provisoire",
  "Critères renseignés (%)",
  "Pourquoi pas de score",
  "Version des paramètres",
  "Longueur (m)",
  "Dernière modification",
];

export function versCsv(fiches: readonly FicheVoirie[], o: OptionsExport): string {
  const avecRang = Boolean(o.rang);
  const lignes = [(avecRang ? ["Rang", ...ENTETES] : ENTETES).map(cellule).join(SEPARATEUR)];
  for (const f of fiches) {
    const e = f.evaluation;
    const r = calculerScore(e, o.parametres);
    const valeurs: Array<string | number | boolean | null | undefined> = [
      f.id,
      nomAffiche(f),
      LIBELLES_CATEGORIE[f.categorie],
      f.parentId ? (o.nomParent?.(f.parentId) ?? f.parentId) : null,
      f.anciennesCommunes.join(", "),
      LIBELLES_GESTIONNAIRE[f.gestionnaire],
      f.gestionnaireDetail,
      LIBELLES_STATUT[f.statutFiche],
      e?.etat_note ?? null,
      lib(LIBELLES_ETAT, e?.etat_note),
      lib(LIBELLES_INTENSITE, e?.intensite_circulation),
      lib(LIBELLES_DENSITE, e?.densite_habitation),
      lib(LIBELLES_RISQUE, e?.risque_securite),
      lib(LIBELLES_TRAVAUX, e?.ampleur_travaux),
      e?.echeance_brute,
      e?.annee_prevue,
      e?.annee_realisation,
      e?.echeance_estimee,
      e?.mobilite_note,
      e?.particularites,
      r.score,
      r.score === null ? LIBELLES_BANDES.gris : LIBELLES_BANDES[r.bande],
      r.score === null ? null : r.provisoire,
      Math.round(r.couverture * 100),
      r.raison ? LIBELLES_RAISON[r.raison] : null,
      r.version,
      f.longueurM,
      e?.updated_at ? e.updated_at.slice(0, 10) : null,
    ];
    lignes.push((avecRang ? [o.rang!(f.id), ...valeurs] : valeurs).map(cellule).join(SEPARATEUR));
  }
  return BOM + lignes.join(FIN_DE_LIGNE) + FIN_DE_LIGNE;
}

/** Nom de fichier daté, par exemple « voiries-pepinster-2026-11-11.csv ». */
export function nomFichier(prefixe: string, date = new Date()): string {
  const j = (n: number) => String(n).padStart(2, "0");
  return `${prefixe}-${date.getFullYear()}-${j(date.getMonth() + 1)}-${j(date.getDate())}.csv`;
}
