// Contrôle des fichiers réellement produits (public/geo) par rapport à
// l'extraction OSM brute (data/osm/raw). Garantit « aucun tracé fictif ».
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { distancePointLigneM, type Coord } from "@/lib/geo/outils";
import type { DonneesVoiries, SegmentProps } from "@/lib/geo/types";

const racine = join(__dirname, "..", "..");
const dispo = existsSync(join(racine, "public", "geo", "voies.geojson"));

describe.runIf(dispo)("données géographiques produites", () => {
  const lire = <T,>(...p: string[]) => JSON.parse(readFileSync(join(racine, ...p), "utf8")) as T;
  const voies = lire<{ features: Array<{ properties: SegmentProps; geometry: { coordinates: Coord[] } }> }>(
    "public", "geo", "voies.geojson",
  );
  const donnees = lire<DonneesVoiries>("public", "geo", "voiries.json");
  const limite = lire<{ features: Array<{ properties: { type: string }; geometry: { coordinates: Coord[][][] } }> }>(
    "public", "geo", "limite.geojson",
  );
  const dossier = join("data", "osm", "raw", donnees.meta.dateExtraction);
  const brut = lire<{ elements: Array<{ id: number; geometry: Array<{ lat: number; lon: number } | null> }> }>(
    dossier, "voies.json",
  );

  it("ne contient que des coordonnées OSM ou des points sur la limite", () => {
    const parWay = new Map(
      brut.elements.map((w) => [
        w.id,
        new Set(w.geometry.filter((g) => g).map((g) => `${g!.lon},${g!.lat}`)),
      ]),
    );
    const anneaux = limite.features
      .filter((f) => f.properties.type === "commune")
      .flatMap((f) => f.geometry.coordinates.flat());
    let horsOsm = 0;
    let invente = 0;
    for (const f of voies.features) {
      const origine = parWay.get(f.properties.w)!;
      for (const c of f.geometry.coordinates) {
        if (origine.has(`${c[0]},${c[1]}`)) continue;
        horsOsm++;
        if (!anneaux.some((a) => distancePointLigneM(c, a) < 0.05)) invente++;
      }
    }
    expect(invente).toBe(0);
    expect(horsOsm).toBeGreaterThan(0); // points calculés à la limite (D6)
  });

  it("relie chaque segment à une voirie logique, et inversement", () => {
    const ids = new Set(donnees.voiries.map((v) => v.id));
    const sids = new Set(voies.features.map((f) => f.properties.sid));
    for (const f of voies.features) expect(ids.has(f.properties.rid)).toBe(true);
    for (const v of donnees.voiries) for (const s of v.segments) expect(sids.has(s)).toBe(true);
    expect(sids.size).toBe(voies.features.length); // identifiants uniques
  });

  it("donne à chaque segment d'une voirie le même identifiant de voirie", () => {
    const ridParSid = new Map(voies.features.map((f) => [f.properties.sid, f.properties.rid]));
    for (const v of donnees.voiries) for (const s of v.segments) expect(ridParSid.get(s)).toBe(v.id);
  });

  it("concerne bien la commune de Pepinster (INS 63058)", () => {
    expect(donnees.meta.codeIns).toBe("63058");
    expect(readdirSync(join(racine, dossier))).toContain("metadata.json");
  });
});
