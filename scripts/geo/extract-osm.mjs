#!/usr/bin/env node
// Extraction UNIQUE et datée des données OpenStreetMap de Pepinster.
//
// Ce script est lancé à la main (npm run geo:extract), jamais par l'application.
// Il envoie deux requêtes à l'API Overpass :
//   1. la limite communale (admin_level=8) et ses anciennes communes (admin_level=9) ;
//   2. toutes les voies (highway=*) situées dans la commune ou qui la touchent.
// Les réponses sont enregistrées TELLES QUELLES, avec la requête, la date des
// données OSM et une empreinte SHA-256. Aucune donnée n'est modifiée ici.
//
// Données © contributeurs OpenStreetMap, licence ODbL 1.0.

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const USER_AGENT =
  "VoiriesPepinster/0.2 (application privee; extraction unique; github.com/hugolegranddiet-dotcom)";

const COMMUNE = `rel["boundary"="administrative"]["admin_level"="8"]["name"="Pepinster"]`;

const TYPES_VOIES =
  "motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|" +
  "pedestrian|road|service|track|path|footway|bridleway|cycleway|steps";

const REQUETES = {
  limite: `[out:json][timeout:120];
${COMMUNE}->.commune;
.commune out body geom;
.commune map_to_area->.zone;
rel(area.zone)["boundary"="administrative"]["admin_level"="9"];
out body geom;`,
  voies: `[out:json][timeout:180];
${COMMUNE};
map_to_area->.zone;
way(area.zone)["highway"~"^(${TYPES_VOIES})(_link)?$"];
out body geom;`,
};

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function interroger(nom, requete) {
  for (let essai = 1; essai <= 3; essai++) {
    console.log(`→ Requête « ${nom} » (essai ${essai}/3)…`);
    const reponse = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: new URLSearchParams({ data: requete }),
    });
    if (reponse.ok) return reponse.text();
    if ([429, 502, 503, 504].includes(reponse.status) && essai < 3) {
      console.log(`  Serveur occupé (${reponse.status}), nouvel essai dans 30 secondes…`);
      await pause(30_000);
      continue;
    }
    throw new Error(`Overpass a répondu ${reponse.status} ${reponse.statusText}`);
  }
  throw new Error("Overpass n'a pas répondu après 3 essais.");
}

const sha256 = (texte) => createHash("sha256").update(texte).digest("hex");

async function main() {
  const date = new Date().toISOString().slice(0, 10);
  const dossier = join(RACINE, "data", "osm", "raw", date);
  await mkdir(dossier, { recursive: true });

  const metadonnees = {
    source: "OpenStreetMap via Overpass API",
    licence: "ODbL 1.0 — © contributeurs OpenStreetMap",
    endpoint: ENDPOINT,
    extrait_le: new Date().toISOString(),
    fichiers: {},
  };

  for (const [nom, requete] of Object.entries(REQUETES)) {
    const texte = await interroger(nom, requete);
    const json = JSON.parse(texte);
    const fichier = `${nom}.json`;
    await writeFile(join(dossier, fichier), texte);
    metadonnees.fichiers[nom] = {
      fichier,
      requete,
      date_donnees_osm: json.osm3s?.timestamp_osm_base ?? null,
      elements: json.elements?.length ?? 0,
      sha256: sha256(texte),
    };
    console.log(`  ✓ ${json.elements?.length ?? 0} éléments enregistrés dans ${fichier}`);
    await pause(5_000); // politesse envers le serveur public
  }

  // Contrôle : il faut exactement UNE commune nommée Pepinster.
  const limite = JSON.parse(
    await (await import("node:fs/promises")).readFile(join(dossier, "limite.json"), "utf8"),
  );
  const communes = limite.elements.filter(
    (e) => e.type === "relation" && e.tags?.admin_level === "8",
  );
  if (communes.length !== 1) {
    throw new Error(`Attendu 1 commune « Pepinster », trouvé ${communes.length}. Extraction à vérifier.`);
  }
  metadonnees.commune = {
    osm_relation_id: communes[0].id,
    tags: communes[0].tags,
  };

  await writeFile(join(dossier, "metadata.json"), JSON.stringify(metadonnees, null, 2));
  console.log(`\n✅ Extraction terminée : ${join("data", "osm", "raw", date)}`);
  console.log(`   Commune : relation OSM ${communes[0].id} (${communes[0].tags?.name})`);
}

main().catch((erreur) => {
  console.error(`\n❌ Échec de l'extraction : ${erreur.message}`);
  console.error("   Copie ce message et envoie-le à Claude.");
  process.exit(1);
});
