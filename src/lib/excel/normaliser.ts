// Normalisation d'une ligne Excel, avec journal de chaque transformation.
// Règles : DATA_AUDIT.md §7 et décisions D1–D11 (PLAN.md §9.1).
// - La valeur brute est toujours conservée à côté de la valeur normalisée.
// - Une valeur absente reste null : rien n'est inventé.
// - `etatNote` reste null : la couleur ne donne qu'une SUGGESTION (validation requise).

import couleursEtat from "../../../data/mappings/couleurs_etat.json";
import typeHabitatMap from "../../../data/mappings/type_habitat.json";
import intensiteMap from "../../../data/mappings/intensite.json";
import densiteMap from "../../../data/mappings/densite.json";
import ampleurMap from "../../../data/mappings/ampleur_travaux.json";
import casParticuliers from "../../../data/mappings/cas_particuliers.json";
import type {
  DensiteHabitation,
  Gestionnaire,
  IntensiteCirculation,
  Note1a5,
  StatutFiche,
} from "@/lib/domaine";
import type { AmpleurTravaux, EntreeJournal, FicheExcel, LigneBrute, TypeHabitat } from "@/lib/excel/types";

/** Les délais relatifs comptent depuis mai 2025 (décision D5). */
export const ANNEE_REFERENCE_DELAIS = 2025;
const ANNEE_COURANTE = 2026;

const TYPES = "(Rue|Route|Avenue|Ruelle|Ruelles|Venelle|Val|Chemin|Place|Quai|Impasse|Voie|Clos|Cité)";
const INVERSE = new RegExp(`^(?<nom>.+?)\\s+(?<type>${TYPES})(?:\\s+(?<part>de la|de l'|du|des|de|d'))?$`);

const texte = (v: string | number | null): string | null => {
  if (v === null) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return s === "" ? null : s;
};

/** Propose l'ordre « Type particule Nom » pour un nom écrit à l'envers. */
export function proposerOrdre(nom: string): string | null {
  const m = INVERSE.exec(nom);
  if (!m?.groups) return null;
  const { nom: n, type, part } = m.groups;
  if (part === "de l'" || part === "d'") return `${type} ${part}${n}`;
  return [type, part, n].filter(Boolean).join(" ");
}

export function normaliserLigne(l: LigneBrute): FicheExcel {
  const j: EntreeJournal[] = [];
  const c = l.cellules;
  const trace = (champ: string, avant: string | number | null, apres: string | number | null, regle: string) => {
    if (avant !== apres) j.push({ champ, avant, apres, regle });
  };

  // Nom
  const nomBrut = String(c.A.valeur);
  const nomNettoye = texte(c.A.valeur)!;
  trace("nom", nomBrut, nomNettoye, "espaces superflus retirés");
  const nomPropose = proposerOrdre(nomNettoye);
  if (nomPropose) trace("nom_propose", nomNettoye, nomPropose, "ordre « Type + nom » proposé (non appliqué)");

  // État et gestionnaire
  const etatBrut = texte(c.B.valeur);
  const mentionEtatSource = etatBrut === "RAS" ? "RAS" : etatBrut === "SPW" ? "SPW" : etatBrut ? "autre" : "vide";
  let gestionnaire: Gestionnaire = "commune";
  let gestionnaireDetail: string | null = null;
  if (l.bloc === "B_spw" || etatBrut === "SPW") {
    gestionnaire = "spw";
    trace("gestionnaire", etatBrut, "spw", "« SPW » = gestionnaire, pas un état");
  }
  let statut: StatutFiche = "importe_excel";
  const etiquettes: string[] = [];

  let etatNoteSuggeree: Note1a5 | null = null;
  let etatNoteSuggereeOrigine: string | null = null;
  const couleur = c.B.fond;
  if (l.bloc === "A_communal" && couleur && couleur in couleursEtat) {
    const regle = couleursEtat[couleur as keyof typeof couleursEtat] as { note: Note1a5; origine: string };
    etatNoteSuggeree = regle.note;
    etatNoteSuggereeOrigine = `${regle.origine} (${couleur})`;
    trace("etat_note_suggeree", couleur, regle.note, regle.origine);
  }

  // Cas particuliers (D7)
  const cas = (casParticuliers as unknown as Record<string, { statut?: StatutFiche; etiquette?: string; gestionnaire?: Gestionnaire; gestionnaireDetail?: string; regle: string }>)[String(l.ligne)];
  if (cas) {
    if (cas.statut) {
      trace("statut", statut, cas.statut, cas.regle);
      statut = cas.statut;
    }
    if (cas.gestionnaire) {
      trace("gestionnaire", gestionnaire, cas.gestionnaire, cas.regle);
      gestionnaire = cas.gestionnaire;
      gestionnaireDetail = cas.gestionnaireDetail ?? null;
    }
    if (cas.etiquette) {
      etiquettes.push(cas.etiquette);
      trace("etiquettes", null, cas.etiquette, cas.regle);
    }
  }

  // Type d'habitat (hors score)
  const typeHabitatBrut = texte(c.C.valeur);
  let typeHabitat: TypeHabitat | null = null;
  if (typeHabitatBrut) {
    const cle = String(c.C.valeur).trim().toLowerCase();
    typeHabitat = ((typeHabitatMap as Record<string, string>)[cle] ?? "autre") as TypeHabitat;
    trace("type_habitat", typeHabitatBrut, typeHabitat, "table data/mappings/type_habitat.json");
  }

  // Circulation
  const typeVoirieSource = texte(c.D.valeur);
  const intensite = typeVoirieSource
    ? (((intensiteMap as Record<string, string>)[typeVoirieSource] ?? null) as IntensiteCirculation | null)
    : null;
  if (typeVoirieSource) {
    trace("intensite", typeVoirieSource, intensite, typeVoirieSource === "Lotissement" ? "Lotissement = faible (D3)" : "table data/mappings/intensite.json");
  }

  // Densité
  const densiteBrut = texte(c.F.valeur);
  const densite = densiteBrut
    ? (((densiteMap as Record<string, string>)[densiteBrut] ?? null) as DensiteHabitation | null)
    : null;
  if (densiteBrut) trace("densite", densiteBrut, densite, "table data/mappings/densite.json");

  // Ampleur des travaux (hors score)
  const ampleurTravauxBrut = typeof c.E.valeur === "string" ? c.E.valeur : null;
  let ampleurTravaux: AmpleurTravaux | null = null;
  if (ampleurTravauxBrut && texte(ampleurTravauxBrut)) {
    const regle = (ampleurMap as unknown as Record<string, { valeur: string; etiquette?: string; note?: string }>)[ampleurTravauxBrut.trim()];
    ampleurTravaux = (regle?.valeur ?? "autre") as AmpleurTravaux;
    trace("ampleur_travaux", ampleurTravauxBrut, ampleurTravaux, regle?.note ?? "table data/mappings/ampleur_travaux.json");
    if (regle?.etiquette) {
      etiquettes.push(regle.etiquette);
      trace("etiquettes", null, regle.etiquette, "ampleur combinée");
    }
  }

  // Échéance (D5)
  const echeanceBrute = c.G.valeur === null ? null : String(c.G.valeur).trim();
  let anneePrevue: number | null = null;
  let anneeRealisation: number | null = null;
  let echeanceEstimee: number | null = null;
  let echeanceEstimeeRegle: string | null = null;
  if (typeof c.G.valeur === "number") {
    if (c.G.valeur < ANNEE_COURANTE) {
      anneeRealisation = c.G.valeur;
      trace("annee_realisation", c.G.valeur, anneeRealisation, "année passée = année de réalisation (D5)");
    } else {
      anneePrevue = c.G.valeur;
      trace("annee_prevue", c.G.valeur, anneePrevue, "année explicite courante ou future");
    }
  } else if (echeanceBrute) {
    const relatif = /^(\d+)\s*ans$/i.exec(echeanceBrute);
    if (relatif) {
      echeanceEstimee = ANNEE_REFERENCE_DELAIS + Number(relatif[1]);
      echeanceEstimeeRegle = `${relatif[1]} ans depuis 05/${ANNEE_REFERENCE_DELAIS} (estimée, D5)`;
      trace("echeance_estimee", echeanceBrute, echeanceEstimee, echeanceEstimeeRegle);
    } else if (/^\+\s*de\s*(\d+)\s*ans$/i.test(echeanceBrute)) {
      const n = Number(/(\d+)/.exec(echeanceBrute)![1]);
      echeanceEstimeeRegle = `après ${ANNEE_REFERENCE_DELAIS + n} (estimée, D5)`;
      trace("echeance_estimee", echeanceBrute, null, echeanceEstimeeRegle);
    }
    // Plages (« 2025-2026 ») et mentions (« urgent ») : conservées en brut uniquement.
  }

  return {
    ligne: l.ligne,
    bloc: l.bloc,
    nomBrut,
    nomNettoye,
    nomPropose,
    gestionnaire,
    gestionnaireDetail,
    statut,
    mentionEtatSource,
    couleurEtat: couleur,
    etatNote: null,
    etatNoteSuggeree,
    etatNoteSuggereeOrigine,
    typeHabitatBrut,
    typeHabitat,
    typeVoirieSource,
    intensite,
    densiteBrut,
    densite,
    ampleurTravauxBrut,
    ampleurTravaux,
    echeanceBrute,
    anneePrevue,
    anneeRealisation,
    echeanceEstimee,
    echeanceEstimeeRegle,
    mobiliteNote: texte(c.H.valeur),
    risqueSecurite: null,
    particularites: texte(c.I.valeur),
    etiquettes,
    journal: j,
  };
}
