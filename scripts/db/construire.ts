// Préparation des lignes à importer en base, sans aucun accès réseau.
// Séparé de l'envoi (seed.ts) pour pouvoir être testé sur le vrai schéma (PGlite).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExcelBrut, FicheExcel } from "@/lib/excel/types";
import type { DonneesVoiries, SegmentProps } from "@/lib/geo/types";
import type { Proposition } from "@/lib/matching/apparier";
import type { Correspondance, Decision } from "@/lib/matching/decisions";
import {
  COUVERTURE_MINIMALE,
  ECHELLES_PAR_DEFAUT,
  GESTIONNAIRES_CLASSEMENT,
  POIDS_PAR_DEFAUT,
  SEUILS_PAR_DEFAUT,
} from "@/lib/priority/defaults";

const lire = async <T>(racine: string, ...p: string[]): Promise<T> =>
  JSON.parse(await readFile(join(racine, ...p), "utf8")) as T;

export type Ligne = Record<string, unknown>;

export interface DonneesImport {
  snapshot: Ligne;
  roads: Ligne[];
  sections: Ligne[];
  segments: Ligne[]; // sans snapshot_id (connu après insertion)
  lot: Ligne;
  lignesExcel: Ligne[]; // sans batch_id
  decisions: Array<Ligne & { excel_ligne: number }>; // sans import_row_id
  evaluations: Ligne[];
  gestionnaires: Array<{ ids: string[]; valeurs: Ligne }>;
  parametres: Ligne;
}

export async function construireDonnees(racine = "."): Promise<DonneesImport> {
  const geo = await lire<DonneesVoiries>(racine, "data", "geo", "voiries.json");
  const limite = await lire<unknown>(racine, "data", "geo", "limite.geojson");
  const voies = await lire<{ features: Array<{ properties: SegmentProps; geometry: unknown }> }>(racine, "data", "geo", "voies.geojson");
  const brut = await lire<ExcelBrut>(racine, "data", "excel", "feuil1_raw.json");
  const fiches = await lire<FicheExcel[]>(racine, "data", "excel", "feuil1_normalise.json");
  const propositions = await lire<Proposition[]>(racine, "data", "matching", "propositions.json");
  const correspondances = await lire<Correspondance[]>(racine, "data", "matching", "correspondances.json");
  const decisions = await lire<Decision[]>(racine, "data", "matching", "decisions.json");

  const corr = new Map(correspondances.map((c) => [c.ligne, c]));
  const brutParLigne = new Map(brut.lignes.map((l) => [l.ligne, l]));
  const prop = new Map(propositions.map((p) => [p.ligne, p]));
  const dec = new Map(decisions.map((d) => [d.ligne, d]));

  const roadDeLigne = (f: FicheExcel): string | null => {
    const c = corr.get(f.ligne)!;
    if (c.statut === "valide") return c.voirieId;
    if (c.statut === "section_a_definir") return `s:${f.ligne}`;
    return null;
  };

  const lignesParRoad = new Map<string, FicheExcel[]>();
  for (const f of fiches) {
    const r = roadDeLigne(f);
    if (r) lignesParRoad.set(r, [...(lignesParRoad.get(r) ?? []), f]);
  }

  const evaluationVide = {
    etat_note: null, etat_note_suggeree: null, etat_note_suggeree_origine: null, mention_etat_source: "vide",
    type_habitat_brut: null, type_habitat: null, type_voirie_source: null, intensite_circulation: null,
    densite_habitation: null, ampleur_travaux_brut: null, ampleur_travaux: null, echeance_brute: null,
    annee_prevue: null, annee_realisation: null, echeance_estimee: null, echeance_estimee_regle: null,
    mobilite_note: null, risque_securite: null, particularites: null, etiquettes: [], source_excel_ligne: null,
  };

  const groupes = new Map<string, string[]>();
  for (const [roadId, liste] of lignesParRoad) {
    if (roadId.startsWith("s:")) continue;
    const cle = JSON.stringify([liste[0].gestionnaire, liste[0].gestionnaireDetail]);
    groupes.set(cle, [...(groupes.get(cle) ?? []), roadId]);
  }

  return {
    snapshot: {
      source: "OpenStreetMap (Overpass API)",
      date_donnees: geo.meta.dateDonneesOsm,
      extrait_le: geo.meta.dateExtraction,
      licence: geo.meta.sourceOsm,
      sha256: geo.meta.sha256Voies,
      relation_commune: geo.meta.relationCommune,
      code_ins: geo.meta.codeIns,
      limite,
      stats: { voiries: geo.voiries.length, segments: voies.features.length },
    },
    roads: geo.voiries.map((v) => ({
      id: v.id,
      nom: v.nom,
      nom_normalise: v.nomNormalise,
      categorie: v.categorie,
      traverse_limite: v.traverseLimite,
      sections: v.sections,
      longueur_m: v.longueurM,
      types_osm: v.types,
      ways_osm: v.ways,
      indice_spw: v.indiceSpw,
      refs_spw: v.refsSpw,
      partie: v.partie,
      alerte: v.alerte,
      distance_autre_groupe_m: v.distanceAutreGroupeM,
    })),
    sections: fiches
      .filter((f) => corr.get(f.ligne)?.statut === "section_a_definir")
      .map((f) => ({
        id: `s:${f.ligne}`,
        nom: f.nomNettoye,
        categorie: "section",
        parent_road_id: corr.get(f.ligne)!.voirieId,
        statut_geo: "sans_trace",
        statut_fiche: "importe_excel",
        gestionnaire: f.gestionnaire,
        gestionnaire_source: "excel",
      })),
    segments: voies.features.map((f) => ({
      id: f.properties.sid,
      road_id: f.properties.rid,
      osm_way_id: f.properties.w,
      highway: f.properties.hw,
      categorie: f.properties.cat,
      coupe_limite: f.properties.clip,
      indice_spw: f.properties.spw,
      geometry: f.geometry,
    })),
    lot: {
      fichier: brut.source.fichier,
      sha256: brut.source.sha256,
      feuille: brut.source.feuille,
      plage: brut.source.plage,
      lignes_attendues: 180,
      lignes_importees: brut.lignes.length,
    },
    lignesExcel: fiches.map((f) => {
      const { journal, ...normalise } = f;
      return {
        excel_ligne: f.ligne,
        bloc: f.bloc,
        brut: brutParLigne.get(f.ligne)!.cellules,
        normalise,
        journal,
        road_id: roadDeLigne(f),
        statut_correspondance: corr.get(f.ligne)!.statut,
      };
    }),
    decisions: fiches.map((f) => {
      const p = prop.get(f.ligne)!;
      const d = dec.get(f.ligne);
      return {
        excel_ligne: f.ligne,
        methode: p.methode,
        confiance: p.confiance,
        candidats: p.candidats,
        propose_road_id: p.propositionId,
        decision: d?.decision ?? null,
        decided_road_id: corr.get(f.ligne)!.voirieId,
        statut: corr.get(f.ligne)!.statut,
        source: d?.source ?? null,
        commentaire: d?.commentaire ?? null,
        decide_le: d?.date || null,
      };
    }),
    evaluations: [...lignesParRoad.entries()].map(([roadId, liste]) => {
      if (liste.length > 1) {
        // O10 : plusieurs lignes validées pour une voirie → aucune donnée n'est choisie.
        return { road_id: roadId, ...evaluationVide, statut_validation: "conflit_a_resoudre" };
      }
      const f = liste[0];
      return {
        road_id: roadId,
        ...evaluationVide,
        etat_note_suggeree: f.etatNoteSuggeree,
        etat_note_suggeree_origine: f.etatNoteSuggereeOrigine,
        mention_etat_source: f.mentionEtatSource,
        type_habitat_brut: f.typeHabitatBrut,
        type_habitat: f.typeHabitat,
        type_voirie_source: f.typeVoirieSource,
        intensite_circulation: f.intensite,
        densite_habitation: f.densite,
        ampleur_travaux_brut: f.ampleurTravauxBrut,
        ampleur_travaux: f.ampleurTravaux,
        echeance_brute: f.echeanceBrute,
        annee_prevue: f.anneePrevue,
        annee_realisation: f.anneeRealisation,
        echeance_estimee: f.echeanceEstimee,
        echeance_estimee_regle: f.echeanceEstimeeRegle,
        mobilite_note: f.mobiliteNote,
        particularites: f.particularites,
        etiquettes: f.etiquettes,
        statut_validation: "non_valide",
        source_excel_ligne: f.ligne,
      };
    }),
    gestionnaires: [...groupes.entries()].map(([cle, ids]) => {
      const [gestionnaire, detail] = JSON.parse(cle) as [string, string | null];
      return {
        ids,
        valeurs: { gestionnaire, gestionnaire_detail: detail, gestionnaire_source: "excel", statut_fiche: "importe_excel" },
      };
    }),
    parametres: {
      version: 1,
      actif: true,
      poids: POIDS_PAR_DEFAUT,
      echelles: ECHELLES_PAR_DEFAUT,
      seuils: SEUILS_PAR_DEFAUT,
      couverture_min: COUVERTURE_MINIMALE,
      gestionnaires_classement: [...GESTIONNAIRES_CLASSEMENT],
    },
  };
}
