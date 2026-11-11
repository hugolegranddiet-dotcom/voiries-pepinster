// Construit les données de la carte à partir de l'extraction OSM la plus récente :
//   public/geo/limite.geojson   limite communale + anciennes communes
//   public/geo/voies.geojson    segments OSM (coupés à la limite, D6)
//   public/geo/voiries.json     voiries logiques (une fiche, une couleur) + métadonnées
//   COVERAGE_REPORT.md          audit de couverture
//
// Garde-fou : le script s'arrête si une coordonnée n'est ni une coordonnée OSM
// d'origine, ni un point calculé situé sur la limite communale.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dernierDossierBrut, lireLimite } from "./commun";
import {
  dansMultiPolygone,
  decouperALaLimite,
  distancePointLigneM,
  echantillonner,
  IndexAretes,
  longueurM,
  type Coord,
} from "@/lib/geo/outils";
import {
  appliquerMemeEndroit,
  categorieVoie,
  regrouperEnVoiries,
  SEUIL_MEME_ENDROIT_M,
  type CategorieVoie,
  type WayOsm,
} from "@/lib/geo/voiries";
import type { SegmentProps, VoirieLogique, DonneesVoiries } from "@/lib/geo/types";

const SEUIL_SPW_M = 15;
const PART_SPW = 0.8;

interface WayBrut {
  type: "way";
  id: number;
  nodes: number[];
  geometry: Array<{ lat: number; lon: number } | null>;
  tags: Record<string, string>;
}

const km = (m: number) => (m / 1000).toLocaleString("fr-BE", { maximumFractionDigits: 1 });
const sha256 = (t: string) => createHash("sha256").update(t).digest("hex");

async function chargerSpw(): Promise<Array<{ coords: Coord[]; ref: string; bbox: [number, number, number, number] }> | null> {
  const fichier = join("data", "spw", ".cache", "reseau_regional.geojson");
  if (!existsSync(fichier)) return null;
  const json = JSON.parse(await readFile(fichier, "utf8")) as {
    features: Array<{
      properties: Record<string, string | number | null>;
      geometry: { type: string; coordinates: Coord[] | Coord[][] } | null;
    }>;
  };
  const lignes: Array<{ coords: Coord[]; ref: string; bbox: [number, number, number, number] }> = [];
  for (const f of json.features) {
    if (!f.geometry) continue;
    const ref = String(f.properties.NUMERO_ROUTE ?? f.properties.CODE_ROUTE ?? "?");
    const parties =
      f.geometry.type === "LineString"
        ? [f.geometry.coordinates as Coord[]]
        : (f.geometry.coordinates as Coord[][]);
    for (const p of parties) {
      const xs = p.map((c) => c[0]);
      const ys = p.map((c) => c[1]);
      lignes.push({ coords: p, ref, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
    }
  }
  return lignes;
}

async function main() {
  const dossier = await dernierDossierBrut();
  const date = dossier.split(/[\\/]/).pop()!;
  const meta = JSON.parse(await readFile(join(dossier, "metadata.json"), "utf8"));
  const limite = await lireLimite(join(dossier, "limite.json"));
  const brut = JSON.parse(await readFile(join(dossier, "voies.json"), "utf8")) as {
    elements: WayBrut[];
  };

  // 1. Ways OSM (coordonnées reprises telles quelles).
  const ways: WayOsm[] = brut.elements
    .filter((e) => e.type === "way")
    .map((e) => ({
      id: e.id,
      nodes: e.nodes,
      tags: e.tags,
      coords: e.geometry.filter((g): g is { lat: number; lon: number } => g !== null).map((g) => [g.lon, g.lat] as Coord),
    }));
  const wayParId = new Map(ways.map((w) => [w.id, w]));

  // 2. Découpe à la limite communale (D6).
  const anneauxCommune = limite.commune.polygones.flat();
  const index = new IndexAretes(anneauxCommune);
  const segmentsParWay = new Map<number, Array<{ sid: string; coords: Coord[]; coupee: boolean; calcules: number[] }>>();
  let pointsCalcules = 0;
  for (const w of ways) {
    const { morceaux, coupee } = decouperALaLimite(w.coords, limite.commune.polygones, index);
    segmentsParWay.set(
      w.id,
      morceaux.map((m, k) => ({
        sid: morceaux.length === 1 && !coupee ? String(w.id) : `${w.id}-${k + 1}`,
        coords: m.coords,
        coupee,
        calcules: m.pointsCalcules,
      })),
    );
    pointsCalcules += morceaux.reduce((n, m) => n + m.pointsCalcules.length, 0);
  }

  // 3. Garde-fou « aucun tracé fictif ».
  let anomalies = 0;
  for (const w of ways) {
    const origine = new Set(w.coords.map((c) => `${c[0]},${c[1]}`));
    for (const s of segmentsParWay.get(w.id)!) {
      s.coords.forEach((c, i) => {
        if (origine.has(`${c[0]},${c[1]}`)) return;
        const surLimite =
          s.calcules.includes(i) &&
          anneauxCommune.some((a) => distancePointLigneM(c, a) < 0.05);
        if (!surLimite) anomalies++;
      });
    }
  }
  if (anomalies > 0) throw new Error(`${anomalies} coordonnée(s) non justifiée(s) : arrêt.`);

  // 4. Recoupement avec le réseau régional SPW (indice, à confirmer).
  const spw = await chargerSpw();
  const spwParSegment = new Map<string, { ratio: number; refs: string[] }>();
  if (spw) {
    for (const segs of segmentsParWay.values()) {
      for (const s of segs) {
        const echantillons = echantillonner(s.coords, 10);
        let proches = 0;
        const refs = new Map<string, number>();
        for (const p of echantillons) {
          let meilleur = Infinity;
          let ref = "";
          for (const l of spw) {
            // Marge d'environ 30 m en degrés : on ignore les lignes trop éloignées.
            if (p[0] < l.bbox[0] - 0.0005 || p[0] > l.bbox[2] + 0.0005 || p[1] < l.bbox[1] - 0.0003 || p[1] > l.bbox[3] + 0.0003) continue;
            const d = distancePointLigneM(p, l.coords);
            if (d < meilleur) {
              meilleur = d;
              ref = l.ref;
            }
          }
          if (meilleur <= SEUIL_SPW_M) {
            proches++;
            refs.set(ref, (refs.get(ref) ?? 0) + 1);
          }
        }
        spwParSegment.set(s.sid, {
          ratio: proches / echantillons.length,
          refs: [...refs.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r),
        });
      }
    }
  }

  // 5. Voiries logiques.
  // Décision D14 : « même endroit = même rue, sinon homonyme » (seuil 300 m).
  const { groupes, journal: journalD14 } = appliquerMemeEndroit(regrouperEnVoiries(ways), ways);
  const voiries: VoirieLogique[] = [];
  const features: Array<{ type: "Feature"; properties: SegmentProps; geometry: { type: "LineString"; coordinates: Coord[] } }> = [];
  let horsCommune = 0;

  for (const g of groupes) {
    const segs = g.wayIds.flatMap((id) =>
      segmentsParWay.get(id)!.map((s) => ({ ...s, way: wayParId.get(id)! })),
    );
    if (!segs.length) {
      horsCommune++;
      continue;
    }
    const categories = new Set(segs.map((s) => categorieVoie(s.way.tags.highway, g.nom)));
    const categorie: CategorieVoie = categories.has("voirie")
      ? "voirie"
      : categories.has("chemin")
        ? "chemin"
        : "acces";
    let longueur = 0;
    let longueurSpw = 0;
    const refsSpw = new Set<string>();
    const sections = new Set<string>();
    for (const s of segs) {
      const l = longueurM(s.coords);
      longueur += l;
      const info = spwParSegment.get(s.sid);
      const estSpw = !!info && info.ratio >= PART_SPW;
      if (estSpw) {
        longueurSpw += l;
        info!.refs.forEach((r) => refsSpw.add(r));
      }
      const milieu = pointAMiLongueur(s.coords);
      for (const sec of limite.sections) if (dansMultiPolygone(milieu, sec.polygones)) sections.add(sec.nom);
      features.push({
        type: "Feature",
        properties: {
          sid: s.sid,
          rid: g.roadId,
          w: s.way.id,
          hw: s.way.tags.highway,
          cat: categorieVoie(s.way.tags.highway, g.nom),
          clip: s.coupee,
          spw: estSpw,
        },
        geometry: { type: "LineString", coordinates: s.coords },
      });
    }
    const partSpw = longueur > 0 ? longueurSpw / longueur : 0;
    voiries.push({
      id: g.roadId,
      nom: g.nom,
      nomNormalise: g.nomNormalise,
      categorie,
      types: [...new Set(segs.map((s) => s.way.tags.highway))].sort(),
      segments: segs.map((s) => s.sid),
      ways: g.wayIds,
      longueurM: Math.round(longueur),
      traverseLimite: segs.some((s) => s.coupee),
      sections: [...sections].sort(),
      partie: g.partie,
      alerte: g.alerte,
      distanceAutreGroupeM: g.distanceAutreGroupeM,
      refOsm: [...new Set(segs.map((s) => s.way.tags.ref).filter((r): r is string => !!r))],
      indiceSpw: spw ? (partSpw >= PART_SPW ? "oui" : partSpw >= 0.2 ? "partiel" : "non") : "inconnu",
      refsSpw: [...refsSpw].sort(),
    });
  }

  // 6. Écriture des fichiers.
  const donnees: DonneesVoiries = {
    meta: {
      sourceOsm: meta.licence,
      dateDonneesOsm: meta.fichiers.voies.date_donnees_osm,
      dateExtraction: date,
      relationCommune: limite.commune.id,
      codeIns: limite.commune.tags["ref:INS"] ?? null,
      sha256Voies: meta.fichiers.voies.sha256,
      sourceSpw: spw ? "SPW — Réseau routier régional (Géoportail de la Wallonie), consulté pour identification" : null,
      seuilSpwM: SEUIL_SPW_M,
    },
    voiries: voiries.sort((a, b) => (a.nom ?? "~").localeCompare(b.nom ?? "~", "fr") || a.id.localeCompare(b.id)),
  };
  await mkdir(join("public", "geo"), { recursive: true });
  const limiteGeo = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { type: "commune", nom: "Pepinster", osm: limite.commune.id, ins: limite.commune.tags["ref:INS"] ?? null },
        geometry: { type: "MultiPolygon", coordinates: limite.commune.polygones },
      },
      ...limite.sections.map((s) => ({
        type: "Feature",
        properties: { type: "section", nom: s.nom, osm: s.id, ins: s.ref },
        geometry: { type: "MultiPolygon", coordinates: s.polygones },
      })),
    ],
  };
  const voiesGeo = { type: "FeatureCollection", features };
  await writeFile(join("public", "geo", "limite.geojson"), JSON.stringify(limiteGeo));
  await writeFile(join("public", "geo", "voies.geojson"), JSON.stringify(voiesGeo));
  await writeFile(join("public", "geo", "voiries.json"), JSON.stringify(donnees));

  // 7. Rapport de couverture.
  await writeFile("COVERAGE_REPORT.md", rapport({ ways, segmentsParWay, voiries, donnees, horsCommune, pointsCalcules, limite, spwDisponible: !!spw, journalD14 }));

  console.log(`✅ ${voiries.length} voiries logiques, ${features.length} segments.`);
  console.log(`   Fichiers : public/geo/*.json · COVERAGE_REPORT.md`);
  console.log(`   Empreinte voies.geojson : ${sha256(JSON.stringify(voiesGeo)).slice(0, 16)}…`);
}

function rapport(c: {
  ways: WayOsm[];
  segmentsParWay: Map<number, Array<{ sid: string; coords: Coord[]; coupee: boolean }>>;
  voiries: VoirieLogique[];
  donnees: DonneesVoiries;
  horsCommune: number;
  pointsCalcules: number;
  limite: Awaited<ReturnType<typeof lireLimite>>;
  spwDisponible: boolean;
  journalD14: ReturnType<typeof appliquerMemeEndroit>["journal"];
}): string {
  const { voiries, donnees } = c;
  const L: string[] = [];
  const parType = new Map<string, { n: number; m: number; nommes: number }>();
  for (const w of c.ways) {
    const segs = c.segmentsParWay.get(w.id)!;
    if (!segs.length) continue;
    const t = parType.get(w.tags.highway) ?? { n: 0, m: 0, nommes: 0 };
    t.n++;
    t.m += segs.reduce((s, x) => s + longueurM(x.coords), 0);
    if (w.tags.name) t.nommes++;
    parType.set(w.tags.highway, t);
  }
  const waysDedans = [...c.segmentsParWay.values()].filter((s) => s.length).length;
  const cat = (k: CategorieVoie) => voiries.filter((v) => v.categorie === k);
  const nommees = (k: CategorieVoie) => cat(k).filter((v) => v.nom);
  const kmCat = (k: CategorieVoie) => km(cat(k).reduce((s, v) => s + v.longueurM, 0));

  L.push("# COVERAGE_REPORT — Couverture géographique de Pepinster", "");
  L.push("> Phase 2 — généré automatiquement par `npm run geo:build`. Ne pas modifier à la main.", "");
  L.push("## 1. Source", "");
  L.push(`| | |`, `|---|---|`);
  L.push(`| Données | OpenStreetMap, ${donnees.meta.sourceOsm} |`);
  L.push(`| Date des données OSM | ${donnees.meta.dateDonneesOsm} |`);
  L.push(`| Extraction | ${donnees.meta.dateExtraction}, dossier \`data/osm/raw/${donnees.meta.dateExtraction}/\` |`);
  L.push(`| Commune | relation OSM ${donnees.meta.relationCommune}, code INS ${donnees.meta.codeIns} |`);
  L.push(`| Anciennes communes (admin_level 9) | ${c.limite.sections.map((s) => s.nom).join(", ")} |`);
  L.push(`| Empreinte de \`voies.json\` | \`${donnees.meta.sha256Voies.slice(0, 16)}…\` |`);
  L.push(`| Réseau régional | ${c.spwDisponible ? "SPW — Réseau routier régional, consulté pour identification uniquement (tracés non conservés)" : "non consulté"} |`, "");

  L.push("## 2. Contrôles", "");
  L.push(`- Ways OSM reçus : **${c.ways.length}** ; dans la commune (en tout ou en partie) : **${waysDedans}** ; entièrement hors commune (écartés) : **${c.ways.length - waysDedans}**.`);
  L.push(`- Ways coupés à la limite (D6) : **${[...c.segmentsParWay.values()].filter((s) => s.some((x) => x.coupee) && s.length).length}** ; points d'intersection calculés : **${c.pointsCalcules}** (tous vérifiés sur la limite).`);
  L.push(`- Coordonnées inventées : **0** (contrôle bloquant du script).`);
  L.push(`- Voiries logiques : **${voiries.length}** ; groupes de même nom entièrement hors commune : ${c.horsCommune}.`, "");

  L.push("## 3. Réseau par type OSM (partie dans la commune)", "");
  L.push("| Type `highway` | Ways | dont nommés | Longueur (km) |", "|---|---:|---:|---:|");
  for (const [t, v] of [...parType.entries()].sort((a, b) => b[1].m - a[1].m)) {
    L.push(`| ${t} | ${v.n} | ${v.nommes} | ${km(v.m)} |`);
  }
  L.push("");

  L.push("## 4. Voiries logiques par catégorie", "");
  L.push("| Catégorie | Voiries | dont nommées | sans nom | Longueur (km) | Affichage par défaut |", "|---|---:|---:|---:|---:|---|");
  L.push(`| Voiries (carrossables) | ${cat("voirie").length} | ${nommees("voirie").length} | ${cat("voirie").length - nommees("voirie").length} | ${kmCat("voirie")} | visibles |`);
  L.push(`| Chemins et sentiers | ${cat("chemin").length} | ${nommees("chemin").length} | ${cat("chemin").length - nommees("chemin").length} | ${kmCat("chemin")} | visibles (D6) |`);
  L.push(`| Accès et parkings sans nom | ${cat("acces").length} | – | ${cat("acces").length} | ${kmCat("acces")} | masqués (filtre) |`, "");

  const alertes = voiries.filter((v) => v.alerte);
  L.push("## 5. Même nom, morceaux non reliés — décision D14", "");
  L.push(`Règle validée par Hugo le 11/11/2026 : « si même endroit, même rue ; sinon homonyme ». Traduction : morceaux de même nom à moins de **${SEUIL_MEME_ENDROIT_M} m** → une seule voirie ; au-delà → homonymes séparés.`, "");
  L.push("| Nom | Morceaux | Écart max. regroupé | Décision appliquée |", "|---|---:|---:|---|");
  for (const j of c.journalD14) L.push(`| ${j.nom} | ${j.parties} | ${j.decision === "meme_rue" ? `${j.distanceMaxM} m` : "–"} | ${j.decision === "meme_rue" ? "même rue (réunie)" : "homonymes (séparés)"} |`);
  L.push("", "Homonymes restant séparés :", "");
  if (alertes.length) {
    L.push("| Nom | Partie | Alerte | Distance à l'autre partie | Longueur | Ancienne commune | Remarque |", "|---|---|---|---:|---:|---|---|");
    for (const v of alertes) {
      const remarque = v.traverseLimite && v.longueurM < 20 ? "petit morceau en limite de commune" : "";
      L.push(`| ${v.nom} | ${v.partie?.numero}/${v.partie?.total} | ${v.alerte === "trou_possible" ? "trou possible" : "même nom, non relié"} | ${v.distanceAutreGroupeM} m | ${v.longueurM} m | ${v.sections.join(", ") || "–"} | ${remarque} |`);
    }
  } else L.push("_Aucune._");
  L.push("");

  L.push("## 6. Indice « réseau régional SPW » (à confirmer)", "");
  if (c.spwDisponible) {
    L.push(`Une voie est marquée quand au moins 80 % de sa longueur est à moins de ${donnees.meta.seuilSpwM} m du réseau régional. C'est un **indice** : la comparaison avec les 17 voiries « SPW » de l'Excel se fera en phase 3.`, "");
    const spw = voiries.filter((v) => v.indiceSpw !== "non" && v.nom);
    const spwSansNom = voiries.filter((v) => v.indiceSpw !== "non" && !v.nom).length;
    L.push("| Voirie | Indice | Routes régionales proches | Réf. OSM |", "|---|---|---|---|");
    for (const v of spw) L.push(`| ${v.nom}${v.partie ? ` [${v.partie.numero}/${v.partie.total}]` : ""} | ${v.indiceSpw} | ${v.refsSpw.join(", ") || "–"} | ${v.refOsm.join(", ") || "–"} |`);
    L.push("", `Plus ${spwSansNom} voies sans nom (trottoirs, accès, bretelles…) superposées au réseau régional.`);
  } else L.push("_Réseau régional non consulté (lancer `npm run geo:spw`)._");
  L.push("");

  L.push("## 7. Voiries coupées à la limite communale", "");
  const coupees = voiries.filter((v) => v.traverseLimite && v.nom);
  L.push(coupees.map((v) => v.nom).join(" · ") || "_Aucune._", "");
  L.push(`Plus ${voiries.filter((v) => v.traverseLimite && !v.nom).length} voies sans nom coupées à la limite.`, "");

  L.push("## 8. Liste des voiries et chemins nommés, par ancienne commune", "");
  L.push("À relire avec ton père : manque-t-il une rue ? un nom est-il faux dans OSM ?", "");
  for (const sec of [...c.limite.sections.map((s) => s.nom), "(à cheval / non déterminé)"]) {
    const liste = voiries.filter((v) =>
      v.nom && (sec.startsWith("(") ? v.sections.length !== 1 : v.sections.length === 1 && v.sections[0] === sec),
    );
    if (!liste.length) continue;
    L.push(`### ${sec} (${liste.length})`, "");
    L.push(
      liste
        .map((v) => `${v.nom}${v.partie ? ` [${v.partie.numero}/${v.partie.total}]` : ""}${v.categorie === "chemin" ? " _(chemin)_" : ""}${sec.startsWith("(") ? ` — ${v.sections.join(" / ")}` : ""}`)
        .join(" · "),
      "",
    );
  }
  L.push("## 9. Limites connues", "");
  L.push("- OSM est une carte collaborative : une rue récente ou un chemin peu fréquenté peut manquer ou être mal nommé. Rien n'est ajouté à la main : les manques seront listés en phase 3 (noms de l'Excel introuvables).");
  L.push("- Les « voies sans nom » sont nombreuses (accès privés, chemins agricoles). Elles sont recensées, mais n'entreront pas dans le tableau principal.");
  L.push("- L'indice SPW est géométrique : un trottoir ou une bretelle longeant une nationale peut être marqué « partiel ».");
  return L.join("\n") + "\n";
}

/** Point situé à mi-longueur d'une ligne (plus fiable qu'un sommet pour situer une voie). */
function pointAMiLongueur(ligne: Coord[]): Coord {
  const moitie = longueurM(ligne) / 2;
  let cumul = 0;
  for (let i = 1; i < ligne.length; i++) {
    const d = longueurM([ligne[i - 1], ligne[i]]);
    if (cumul + d >= moitie && d > 0) {
      const t = (moitie - cumul) / d;
      return [ligne[i - 1][0] + t * (ligne[i][0] - ligne[i - 1][0]), ligne[i - 1][1] + t * (ligne[i][1] - ligne[i - 1][1])];
    }
    cumul += d;
  }
  return ligne[0];
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
