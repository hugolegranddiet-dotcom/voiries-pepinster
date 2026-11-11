// Décisions humaines de correspondance (validation manuelle obligatoire).
import type { FicheExcel } from "@/lib/excel/types";
import type { Proposition } from "@/lib/matching/apparier";

export const CHOIX_DECISION = ["OK", "NON", "AUTRE", "SECTION", "INTROUVABLE"] as const;
export type ChoixDecision = (typeof CHOIX_DECISION)[number];

export interface Decision {
  ligne: number;
  decision: ChoixDecision;
  /** Voirie retenue (OK : la proposition ; AUTRE : le choix ; SECTION : la voirie mère). */
  voirieId: string | null;
  commentaire: string | null;
  /** Qui a décidé et comment (fichier, conversation…). */
  source: string;
  date: string;
}

export type StatutCorrespondance =
  | "a_valider"
  | "valide"
  | "rejete"
  | "section_a_definir"
  | "introuvable_osm"
  | "n_existe_plus";

export interface Correspondance {
  ligne: number;
  statut: StatutCorrespondance;
  voirieId: string | null;
  decision: Decision | null;
}

/** Statut final d'une ligne : seule une décision humaine peut lier une ligne à une voirie. */
export function statutDe(fiche: FicheExcel, p: Proposition, d: Decision | undefined): Correspondance {
  if (!d) {
    return {
      ligne: fiche.ligne,
      statut: fiche.statut === "n_existe_plus" ? "n_existe_plus" : "a_valider",
      voirieId: null,
      decision: null,
    };
  }
  switch (d.decision) {
    case "OK":
      return { ligne: fiche.ligne, statut: "valide", voirieId: d.voirieId ?? p.propositionId, decision: d };
    case "AUTRE":
      return { ligne: fiche.ligne, statut: "valide", voirieId: d.voirieId, decision: d };
    case "SECTION":
      return { ligne: fiche.ligne, statut: "section_a_definir", voirieId: d.voirieId ?? p.propositionId, decision: d };
    case "INTROUVABLE":
      return { ligne: fiche.ligne, statut: fiche.statut === "n_existe_plus" ? "n_existe_plus" : "introuvable_osm", voirieId: null, decision: d };
    case "NON":
      return { ligne: fiche.ligne, statut: "rejete", voirieId: null, decision: d };
  }
}

/** Données transmises à la carte (lues côté serveur, jamais publiées dans public/). */
export interface DonneesExcelCarte {
  meta: { sha256Excel: string; genereLe: string; aValider: number; validees: number };
  parVoirie: Record<
    string,
    {
      validees: FicheExcel[];
      sections: Array<{ ligne: number; nom: string }>;
      propositions: Array<{ ligne: number; nomExcel: string; methode: string; confiance: string }>;
    }
  >;
}
