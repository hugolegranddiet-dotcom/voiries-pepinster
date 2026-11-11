// Lecture des données de la carte depuis la base (sous RLS : il faut être administrateur).
// Le résultat garde les formats déjà utilisés par la carte (phases 2 et 3).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureCollection, LineString, MultiPolygon } from "geojson";
import type { FicheExcel } from "@/lib/excel/types";
import type { DonneesVoiries, SegmentProps, VoirieLogique } from "@/lib/geo/types";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { DonneesExcelCarte } from "@/lib/matching/decisions";

export interface DonneesCarte {
  limite: FeatureCollection<MultiPolygon, { type: "commune" | "section"; nom: string }>;
  voies: FeatureCollection<LineString, SegmentProps>;
  voiries: DonneesVoiries;
  excel: DonneesExcelCarte;
  notes: Record<string, { particularites: string | null; majLe: string }>;
}

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
  categorie: CategorieVoie | "section";
  parent_road_id: string | null;
  gestionnaire: FicheExcel["gestionnaire"];
  gestionnaire_detail: string | null;
  traverse_limite: boolean;
  sections: string[];
  longueur_m: number | null;
  types_osm: string[];
  ways_osm: number[];
  indice_spw: VoirieLogique["indiceSpw"] | null;
  refs_spw: string[];
  partie: VoirieLogique["partie"];
  alerte: VoirieLogique["alerte"];
  distance_autre_groupe_m: number | null;
}

interface LigneEvaluation {
  road_id: string;
  etat_note: FicheExcel["etatNote"];
  etat_note_suggeree: FicheExcel["etatNoteSuggeree"];
  etat_note_suggeree_origine: string | null;
  mention_etat_source: FicheExcel["mentionEtatSource"];
  type_habitat_brut: string | null;
  type_voirie_source: string | null;
  intensite_circulation: FicheExcel["intensite"];
  densite_habitation: FicheExcel["densite"];
  ampleur_travaux_brut: string | null;
  ampleur_travaux: FicheExcel["ampleurTravaux"];
  echeance_brute: string | null;
  annee_prevue: number | null;
  annee_realisation: number | null;
  echeance_estimee: number | null;
  echeance_estimee_regle: string | null;
  mobilite_note: string | null;
  risque_securite: FicheExcel["risqueSecurite"];
  particularites: string | null;
  etiquettes: string[];
  statut_validation: string;
  source_excel_ligne: number | null;
  updated_at: string;
}

export async function lireDonneesCarte(supabase: SupabaseClient): Promise<DonneesCarte> {
  const { data: snap, error: e1 } = await supabase
    .from("geo_snapshots")
    .select("date_donnees, extrait_le, licence, relation_commune, code_ins, sha256, limite")
    .order("extrait_le", { ascending: false })
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!snap) throw new Error("base_vide");

  const [roads, segments, evaluations, lignesExcel] = await Promise.all([
    toutLire<LigneRoad>((a, b) =>
      supabase
        .from("roads")
        .select("id, nom, nom_normalise, categorie, parent_road_id, gestionnaire, gestionnaire_detail, traverse_limite, sections, longueur_m, types_osm, ways_osm, indice_spw, refs_spw, partie, alerte, distance_autre_groupe_m")
        .order("id")
        .range(a, b),
    ),
    toutLire<{ id: string; road_id: string; osm_way_id: number; highway: string; categorie: CategorieVoie; coupe_limite: boolean; indice_spw: boolean; geometry: LineString }>((a, b) =>
      supabase.from("road_segments").select("id, road_id, osm_way_id, highway, categorie, coupe_limite, indice_spw, geometry").order("id").range(a, b),
    ),
    toutLire<LigneEvaluation>((a, b) => supabase.from("road_evaluations").select("*").order("road_id").range(a, b)),
    toutLire<{ excel_ligne: number; road_id: string | null; normalise: FicheExcel; statut_correspondance: string }>((a, b) =>
      supabase
        .from("import_rows")
        .select("excel_ligne, road_id, normalise, statut_correspondance")
        .in("statut_correspondance", ["valide", "section_a_definir"])
        .order("excel_ligne")
        .range(a, b),
    ),
  ]);

  const segmentsParRoad = new Map<string, string[]>();
  for (const s of segments) segmentsParRoad.set(s.road_id, [...(segmentsParRoad.get(s.road_id) ?? []), s.id]);
  const evaluationParRoad = new Map(evaluations.map((e) => [e.road_id, e]));
  const roadParId = new Map(roads.map((r) => [r.id, r]));

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

  // Données Excel : l'évaluation en base fait foi ; la ligne d'import donne le contexte.
  const excel: DonneesExcelCarte = {
    meta: { sha256Excel: "", genereLe: new Date().toISOString(), aValider: 0, validees: 0 },
    parVoirie: {},
  };
  const entree = (id: string) => (excel.parVoirie[id] ??= { validees: [], sections: [], propositions: [] });
  for (const l of lignesExcel) {
    if (!l.road_id) continue;
    const road = roadParId.get(l.road_id);
    if (l.statut_correspondance === "section_a_definir" && road?.parent_road_id) {
      entree(road.parent_road_id).sections.push({ ligne: l.excel_ligne, nom: l.normalise.nomNettoye });
      continue;
    }
    const ev = evaluationParRoad.get(l.road_id);
    const fiche: FicheExcel = { ...l.normalise, journal: [] };
    if (ev && ev.statut_validation !== "conflit_a_resoudre") {
      Object.assign(fiche, {
        etatNote: ev.etat_note,
        etatNoteSuggeree: ev.etat_note_suggeree,
        intensite: ev.intensite_circulation,
        densite: ev.densite_habitation,
        ampleurTravaux: ev.ampleur_travaux,
        echeanceBrute: ev.echeance_brute,
        anneePrevue: ev.annee_prevue,
        mobiliteNote: ev.mobilite_note,
        risqueSecurite: ev.risque_securite,
        particularites: ev.particularites,
        etiquettes: ev.etiquettes,
      });
    }
    if (road) Object.assign(fiche, { gestionnaire: road.gestionnaire === "inconnu" ? fiche.gestionnaire : road.gestionnaire });
    entree(l.road_id).validees.push(fiche);
    excel.meta.validees++;
  }

  const notes: DonneesCarte["notes"] = {};
  for (const e of evaluations) notes[e.road_id] = { particularites: e.particularites, majLe: e.updated_at };

  return {
    limite: snap.limite as DonneesCarte["limite"],
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
    excel,
    notes,
  };
}
