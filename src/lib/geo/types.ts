// Formats des fichiers produits par `npm run geo:build` et lus par la carte.
import type { CategorieVoie, AlerteVoirie } from "@/lib/geo/voiries";

/** Propriétés d'un segment dans data/geo/voies.geojson (noms courts = fichier plus léger). */
export interface SegmentProps {
  /** Identifiant du segment (way OSM, ou way-partie si coupé). */
  sid: string;
  /** Identifiant de la voirie logique. */
  rid: string;
  /** Identifiant du way OSM. */
  w: number;
  /** Type OSM `highway`. */
  hw: string;
  cat: CategorieVoie;
  /** Coupé à la limite communale. */
  clip: boolean;
  /** Indice : superposé au réseau régional SPW. */
  spw: boolean;
}

export interface VoirieLogique {
  id: string;
  nom: string | null;
  nomNormalise: string | null;
  categorie: CategorieVoie;
  types: string[];
  segments: string[];
  ways: number[];
  longueurM: number;
  traverseLimite: boolean;
  sections: string[];
  partie: { numero: number; total: number } | null;
  alerte: AlerteVoirie | null;
  distanceAutreGroupeM: number | null;
  refOsm: string[];
  indiceSpw: "oui" | "partiel" | "non" | "inconnu";
  refsSpw: string[];
}

export interface DonneesVoiries {
  meta: {
    sourceOsm: string;
    dateDonneesOsm: string;
    dateExtraction: string;
    relationCommune: number;
    codeIns: string | null;
    sha256Voies: string;
    sourceSpw: string | null;
    seuilSpwM: number;
  };
  voiries: VoirieLogique[];
}
