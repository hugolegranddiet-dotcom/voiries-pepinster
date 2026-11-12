// Lecture de toutes les données de l'application depuis la base
// (sous RLS : il faut être administrateur).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LineString } from "geojson";
import type { Gestionnaire, StatutFiche } from "@/lib/domaine";
import type { CelluleBrute, FicheExcel } from "@/lib/excel/types";
import type { VoirieLogique } from "@/lib/geo/types";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { CategorieFiche, DonneesApp, Evaluation, FicheVoirie, OrigineExcel, VersionParametres } from "@/lib/donnees/types";
import { PARAMETRES_PAR_DEFAUT } from "@/lib/priority/defaults";
import { lireParametres } from "@/lib/priority/parametres";

const PAGE = 1000;

/** Lit toutes les lignes d'une requête, par pages (la base renvoie 1000 lignes au plus). */
async function toutLire<T>(requete: (de: number, a: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const resultat: T[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await requete(de, de + PAGE - 1);
    if (error) throw new Error(error.message);
    resultat.push(...(data ?? []));
    if (!data || data.length < PAGE) return resultat;
  }
}

interface LigneRoad {
  id: string;
  nom: string | null;
  nom_normalise: string | null;
  categorie: CategorieFiche;
  parent_road_id: string | null;
  gestionnaire: Gestionnaire;
  gestionnaire_detail: string | null;
  statut_fiche: StatutFiche;
  statut_geo: "trace_osm" | "sans_trace";
  traverse_limite: boolean;
  sections: string[];
  /** Absent tant que la migration du 12/11/2026 n'est pas appliquée. */
  segments_section?: string[] | null;
  longueur_m: number | null;
  types_osm: string[];
  ways_osm: number[];
  indice_spw: VoirieLogique["indiceSpw"] | null;
  refs_spw: string[];
  partie: VoirieLogique["partie"];
  alerte: VoirieLogique["alerte"];
  distance_autre_groupe_m: number | null;
}

interface LigneParametres {
  version: number;
  actif: boolean;
  poids: unknown;
  echelles: unknown;
  seuils: unknown;
  couverture_min: unknown;
  gestionnaires_classement: unknown;
  created_at: string;
}

const texte = (c: CelluleBrute | undefined) =>
  c?.valeur === null || c?.valeur === undefined ? null : String(c.valeur).trim() || null;

function origine(ligne: number, normalise: FicheExcel, brut: Record<string, CelluleBrute>): OrigineExcel {
  return {
    ligne,
    nomExcel: normalise.nomNettoye,
    etat: texte(brut.B),
    couleurEtat: brut.B?.fond ?? null,
    typeHabitat: texte(brut.C),
    typeVoire: texte(brut.D),
    ampleurTravaux: texte(brut.E),
    densite: texte(brut.F),
    echeance: texte(brut.G),
    securisation: texte(brut.H),
    particularite: texte(brut.I),
  };
}

export async function lireDonneesApp(supabase: SupabaseClient): Promise<DonneesApp> {
  const { data: snap, error: e1 } = await supabase
    .from("geo_snapshots")
    .select("date_donnees, extrait_le, licence, relation_commune, code_ins, sha256, limite")
    .order("extrait_le", { ascending: false })
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!snap) throw new Error("base_vide");

  const [roads, segments, evaluations, lignesExcel, reglages] = await Promise.all([
    toutLire<LigneRoad>((a, b) =>
      supabase
        .from("roads")
        // « * » : la base peut avoir des colonnes plus récentes que ce code (et inversement).
        .select("*")
        .order("id")
        .range(a, b),
    ),
    toutLire<{ id: string; road_id: string; osm_way_id: number; highway: string; categorie: CategorieVoie; coupe_limite: boolean; indice_spw: boolean; geometry: LineString }>((a, b) =>
      supabase.from("road_segments").select("id, road_id, osm_way_id, highway, categorie, coupe_limite, indice_spw, geometry").order("id").range(a, b),
    ),
    toutLire<Evaluation>((a, b) => supabase.from("road_evaluations").select("*").order("road_id").range(a, b)),
    toutLire<{ excel_ligne: number; road_id: string | null; normalise: FicheExcel; brut: Record<string, CelluleBrute> }>((a, b) =>
      supabase
        .from("import_rows")
        .select("excel_ligne, road_id, normalise, brut")
        .in("statut_correspondance", ["valide", "section_a_definir"])
        .order("excel_ligne")
        .range(a, b),
    ),
    toutLire<LigneParametres>((a, b) =>
      supabase
        .from("priority_settings")
        .select("version, actif, poids, echelles, seuils, couverture_min, gestionnaires_classement, created_at")
        .order("version")
        .range(a, b),
    ),
  ]);

  // Paramètres du score : la version active, sinon les valeurs par défaut (signalé à l'écran).
  const active = reglages.find((r) => r.actif);
  const lus = active ? lireParametres(active) : null;
  const versionsParametres: VersionParametres[] = reglages.map((r) => ({
    ...(lireParametres(r) ?? PARAMETRES_PAR_DEFAUT),
    version: r.version,
    actif: r.actif,
    creeLe: r.created_at,
    lisible: lireParametres(r) !== null,
  }));

  const segmentsParRoad = new Map<string, string[]>();
  for (const s of segments) segmentsParRoad.set(s.road_id, [...(segmentsParRoad.get(s.road_id) ?? []), s.id]);
  const evaluationParRoad = new Map(evaluations.map((e) => [e.road_id, e]));
  const originesParRoad = new Map<string, OrigineExcel[]>();
  for (const l of lignesExcel) {
    if (!l.road_id) continue;
    originesParRoad.set(l.road_id, [...(originesParRoad.get(l.road_id) ?? []), origine(l.excel_ligne, l.normalise, l.brut)]);
  }
  const enfants = new Map<string, string[]>();
  for (const r of roads) if (r.parent_road_id) enfants.set(r.parent_road_id, [...(enfants.get(r.parent_road_id) ?? []), r.id]);

  const fiches: Record<string, FicheVoirie> = {};
  for (const r of roads) {
    // Morceaux d'une partie de rue : seulement ceux qui appartiennent encore à la rue mère
    // (après une resynchronisation OSM, un morceau disparu est simplement ignoré).
    const possibles = new Set(r.parent_road_id ? (segmentsParRoad.get(r.parent_road_id) ?? []) : []);
    const segmentsSection = (r.segments_section ?? []).filter((id) => possibles.has(id));
    fiches[r.id] = {
      id: r.id,
      nom: r.nom,
      categorie: r.categorie,
      parentId: r.parent_road_id,
      gestionnaire: r.gestionnaire,
      gestionnaireDetail: r.gestionnaire_detail,
      statutFiche: r.statut_fiche,
      anciennesCommunes: r.sections,
      longueurM: r.longueur_m,
      aTrace: r.categorie === "section" ? segmentsSection.length > 0 : r.statut_geo === "trace_osm" && (segmentsParRoad.get(r.id)?.length ?? 0) > 0,
      evaluation: evaluationParRoad.get(r.id) ?? null,
      origineExcel: originesParRoad.get(r.id) ?? [],
      sousSections: enfants.get(r.id) ?? [],
      segmentsSection,
    };
  }
  // Une section hérite des anciennes communes de sa voirie mère (pour le tableau).
  for (const f of Object.values(fiches)) {
    if (f.parentId && !f.anciennesCommunes.length) f.anciennesCommunes = fiches[f.parentId]?.anciennesCommunes ?? [];
  }

  const voiries: VoirieLogique[] = roads
    .filter((r) => r.categorie !== "section")
    .map((r) => ({
      id: r.id,
      nom: r.nom,
      nomNormalise: r.nom_normalise,
      categorie: r.categorie as CategorieVoie,
      types: r.types_osm,
      segments: segmentsParRoad.get(r.id) ?? [],
      ways: r.ways_osm,
      longueurM: r.longueur_m ?? 0,
      traverseLimite: r.traverse_limite,
      sections: r.sections,
      partie: r.partie,
      alerte: r.alerte,
      distanceAutreGroupeM: r.distance_autre_groupe_m,
      refOsm: [],
      indiceSpw: r.indice_spw ?? "inconnu",
      refsSpw: r.refs_spw,
    }));

  return {
    limite: snap.limite as DonneesApp["limite"],
    voies: {
      type: "FeatureCollection",
      features: segments.map((s) => ({
        type: "Feature",
        properties: { sid: s.id, rid: s.road_id, w: s.osm_way_id, hw: s.highway, cat: s.categorie, clip: s.coupe_limite, spw: s.indice_spw },
        geometry: s.geometry,
      })),
    },
    voiries: {
      meta: {
        sourceOsm: snap.licence,
        dateDonneesOsm: snap.date_donnees,
        dateExtraction: snap.extrait_le,
        relationCommune: snap.relation_commune,
        codeIns: snap.code_ins,
        sha256Voies: snap.sha256,
        sourceSpw: null,
        seuilSpwM: 15,
      },
      voiries,
    },
    fiches,
    parametres: lus ?? PARAMETRES_PAR_DEFAUT,
    parametresAvertissement: lus ? null : active ? "version_illisible" : "aucune_version",
    versionsParametres,
  };
}
