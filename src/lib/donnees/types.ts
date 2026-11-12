// Données de l'application, telles que renvoyées par /api/carte et partagées
// entre la carte et le tableau (une seule source : la base).
import type { FeatureCollection, LineString, MultiPolygon } from "geojson";
import type {
  DensiteHabitation,
  Gestionnaire,
  IntensiteCirculation,
  MentionEtatSource,
  Note1a5,
  StatutFiche,
} from "@/lib/domaine";
import type { AmpleurTravaux } from "@/lib/excel/types";
import type { DonneesVoiries, SegmentProps } from "@/lib/geo/types";
import type { ParametresScore } from "@/lib/priority/defaults";

/** Une version des paramètres du score enregistrée en base. */
export interface VersionParametres extends ParametresScore {
  version: number;
  actif: boolean;
  creeLe: string;
  /** false si la ligne en base n'a pas pu être relue (valeurs par défaut affichées). */
  lisible: boolean;
}

/** Ligne de la table road_evaluations (noms de colonnes de la base). */
export interface Evaluation {
  road_id: string;
  etat_note: Note1a5 | null;
  etat_note_suggeree: Note1a5 | null;
  etat_note_suggeree_origine: string | null;
  mention_etat_source: MentionEtatSource;
  type_habitat_brut: string | null;
  type_habitat: string | null;
  type_voirie_source: string | null;
  intensite_circulation: IntensiteCirculation | null;
  densite_habitation: DensiteHabitation | null;
  ampleur_travaux_brut: string | null;
  ampleur_travaux: AmpleurTravaux | null;
  echeance_brute: string | null;
  annee_prevue: number | null;
  annee_realisation: number | null;
  echeance_estimee: number | null;
  echeance_estimee_regle: string | null;
  mobilite_note: string | null;
  risque_securite: Note1a5 | null;
  particularites: string | null;
  /** Priorité forcée à la main par le père (0 à 100), sinon null. */
  priorite_manuelle: number | null;
  /** Raison de la priorité forcée (obligatoire si elle est fixée). */
  priorite_manuelle_motif: string | null;
  etiquettes: string[];
  statut_validation: "non_valide" | "partiellement_valide" | "valide" | "conflit_a_resoudre";
  source_excel_ligne: number | null;
  updated_at: string;
}

/** Valeurs d'origine d'une ligne de l'Excel (contexte, jamais modifié). */
export interface OrigineExcel {
  ligne: number;
  nomExcel: string;
  etat: string | null;
  couleurEtat: string | null;
  typeHabitat: string | null;
  typeVoire: string | null;
  ampleurTravaux: string | null;
  densite: string | null;
  echeance: string | null;
  securisation: string | null;
  particularite: string | null;
}

export type CategorieFiche = "voirie" | "chemin" | "acces" | "section";

/** Tout ce qu'il faut savoir d'une voirie pour la fiche et le tableau. */
export interface FicheVoirie {
  id: string;
  nom: string | null;
  categorie: CategorieFiche;
  /** Voirie « mère » d'une section (partie de rue). */
  parentId: string | null;
  gestionnaire: Gestionnaire;
  gestionnaireDetail: string | null;
  statutFiche: StatutFiche;
  anciennesCommunes: string[];
  longueurM: number | null;
  /** false pour une section dont le tracé n'est pas encore défini. */
  aTrace: boolean;
  evaluation: Evaluation | null;
  origineExcel: OrigineExcel[];
  /** Identifiants des sections rattachées à cette voirie. */
  sousSections: string[];
  /** Pour une partie de rue : morceaux (segments OSM) de la rue mère choisis par le père. */
  segmentsSection: string[];
}

export interface DonneesApp {
  limite: FeatureCollection<MultiPolygon, { type: "commune" | "section"; nom: string }>;
  voies: FeatureCollection<LineString, SegmentProps>;
  /** Informations géographiques (OSM) des voiries tracées. */
  voiries: DonneesVoiries;
  /** Fiches de TOUTES les voiries, sections comprises. */
  fiches: Record<string, FicheVoirie>;
  /** Paramètres ACTIFS du score (ou valeurs par défaut, voir l'avertissement). */
  parametres: ParametresScore;
  parametresAvertissement: null | "aucune_version" | "version_illisible";
  versionsParametres: VersionParametres[];
}
