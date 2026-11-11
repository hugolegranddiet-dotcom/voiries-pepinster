import type {
  DensiteHabitation,
  Gestionnaire,
  IntensiteCirculation,
  MentionEtatSource,
  Note1a5,
  StatutFiche,
} from "@/lib/domaine";

/** Une cellule de l'Excel, telle quelle. */
export interface CelluleBrute {
  valeur: string | number | null;
  /** Couleur de fond : « #RRGGBB », « themeN±t » ou null. */
  fond: string | null;
}

export interface LigneBrute {
  ligne: number;
  bloc: "A_communal" | "B_spw" | "C_chemins";
  cellules: Record<"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I", CelluleBrute>;
}

export interface ExcelBrut {
  source: { fichier: string; sha256: string; feuille: string; plage: string; lu_le: string };
  entetes: string[];
  lignes: LigneBrute[];
}

export type TypeHabitat =
  | "campagne"
  | "campagne_forestier"
  | "village"
  | "quatre_facades"
  | "trois_facades"
  | "jointives"
  | "mixte_jointives_4f"
  | "lotissement_3f"
  | "lotissement_4f"
  | "lotissement"
  | "negligeable"
  | "autre";

export type AmpleurTravaux =
  | "schlammage"
  | "enduisage"
  | "raclage_partiel"
  | "raclage_complet"
  | "reparation_ponctuelle"
  | "autre";

/** Trace d'une normalisation : rien n'est modifié sans laisser de trace. */
export interface EntreeJournal {
  champ: string;
  avant: string | number | null;
  apres: string | number | null;
  regle: string;
}

/** Ligne Excel normalisée (avant toute correspondance avec la carte). */
export interface FicheExcel {
  ligne: number;
  bloc: LigneBrute["bloc"];
  nomBrut: string;
  nomNettoye: string;
  /** Proposition d'ordre « Type + nom » (jamais un renommage). */
  nomPropose: string | null;
  gestionnaire: Gestionnaire;
  gestionnaireDetail: string | null;
  statut: StatutFiche;
  mentionEtatSource: MentionEtatSource;
  couleurEtat: string | null;
  /** Toujours null à l'import : une note n'existe qu'après validation. */
  etatNote: Note1a5 | null;
  etatNoteSuggeree: Note1a5 | null;
  etatNoteSuggereeOrigine: string | null;
  typeHabitatBrut: string | null;
  typeHabitat: TypeHabitat | null;
  typeVoirieSource: string | null;
  intensite: IntensiteCirculation | null;
  densiteBrut: string | null;
  densite: DensiteHabitation | null;
  ampleurTravauxBrut: string | null;
  ampleurTravaux: AmpleurTravaux | null;
  echeanceBrute: string | null;
  anneePrevue: number | null;
  anneeRealisation: number | null;
  echeanceEstimee: number | null;
  echeanceEstimeeRegle: string | null;
  mobiliteNote: string | null;
  /** Saisie manuelle uniquement : jamais déduit d'un texte. */
  risqueSecurite: Note1a5 | null;
  particularites: string | null;
  etiquettes: string[];
  journal: EntreeJournal[];
}
