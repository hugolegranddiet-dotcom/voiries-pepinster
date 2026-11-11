// Interroge le service public « Réseau routier régional » du SPW (Géoportail
// de la Wallonie) pour l'emprise de Pepinster, afin d'IDENTIFIER les routes
// régionales — l'usage prévu par ce service (consultation, recherche,
// identification).
//
// Les tracés reçus sont gardés dans un cache LOCAL non versionné
// (data/spw/.cache/, exclu de Git). Seul le résultat du recoupement
// (quelles voies OSM se superposent au réseau régional) est conservé dans
// le projet, avec la mention de la source « SPW ».

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dernierDossierBrut, lireLimite } from "./commun";

const SERVICE =
  "https://geoservices.wallonie.be/arcgis/rest/services/MOBILITE/RES_ROUTIER_REGIONAL/MapServer";
const COUCHES = [
  { id: 4, nom: "Autoroutes" },
  { id: 5, nom: "Rings" },
  { id: 6, nom: "Nationales" },
];

async function main() {
  const dossier = await dernierDossierBrut();
  const { bbox } = await lireLimite(join(dossier, "limite.json"));
  const marge = 0.005;
  const enveloppe = [bbox[0] - marge, bbox[1] - marge, bbox[2] + marge, bbox[3] + marge].join(",");

  const features: unknown[] = [];
  for (const couche of COUCHES) {
    const params = new URLSearchParams({
      where: "1=1",
      geometry: enveloppe,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      outSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "CODE_ROUTE,NUMERO_ROUTE,NOM_ROUTE,TYPE_DESC",
      returnGeometry: "true",
      f: "geojson",
    });
    const reponse = await fetch(`${SERVICE}/${couche.id}/query?${params}`);
    if (!reponse.ok) throw new Error(`SPW ${couche.nom} : ${reponse.status}`);
    const json = (await reponse.json()) as { features?: unknown[] };
    console.log(`✓ ${couche.nom} : ${json.features?.length ?? 0} tronçons`);
    features.push(...(json.features ?? []));
  }

  const cache = join("data", "spw", ".cache");
  await mkdir(cache, { recursive: true });
  const sortie = join(cache, "reseau_regional.geojson");
  await writeFile(
    sortie,
    JSON.stringify({
      type: "FeatureCollection",
      source: "SPW — Réseau routier régional (geoservices.wallonie.be)",
      consulte_le: new Date().toISOString(),
      features,
    }),
  );
  // Vérification de lecture
  JSON.parse(await readFile(sortie, "utf8"));
  console.log(`\n✅ Cache local écrit : ${sortie} (non versionné)`);
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
