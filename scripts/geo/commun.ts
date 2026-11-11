// Fonctions communes aux scripts géographiques.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { assemblerAnneaux, dansMultiPolygone, type Coord, type Polygone } from "@/lib/geo/outils";

export const DOSSIER_BRUT = join("data", "osm", "raw");

/** Dossier d'extraction le plus récent (data/osm/raw/AAAA-MM-JJ). */
export async function dernierDossierBrut(): Promise<string> {
  const dates = (await readdir(DOSSIER_BRUT)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!dates.length) throw new Error("Aucune extraction trouvée : lance d'abord « npm run geo:extract ».");
  return join(DOSSIER_BRUT, dates[dates.length - 1]);
}

interface MembreOsm {
  type: string;
  role: string;
  geometry?: Array<{ lat: number; lon: number } | null>;
}
interface RelationOsm {
  type: "relation";
  id: number;
  tags: Record<string, string>;
  members: MembreOsm[];
}

function polygonesDeRelation(rel: RelationOsm): Polygone[] {
  const troncons = (role: string) =>
    rel.members
      .filter((m) => m.type === "way" && m.role === role && m.geometry)
      .map((m) => m.geometry!.filter((g): g is { lat: number; lon: number } => g !== null).map((g) => [g.lon, g.lat] as Coord));
  const exterieurs = assemblerAnneaux(troncons("outer"));
  const interieurs = troncons("inner").length ? assemblerAnneaux(troncons("inner")) : [];
  return exterieurs.map((ext) => [
    ext,
    ...interieurs.filter((int) => dansMultiPolygone(int[0], [[ext]])),
  ]);
}

export interface Limite {
  commune: { id: number; tags: Record<string, string>; polygones: Polygone[] };
  sections: Array<{ id: number; nom: string; ref: string | null; polygones: Polygone[] }>;
  bbox: [number, number, number, number];
}

export async function lireLimite(fichier: string): Promise<Limite> {
  const json = JSON.parse(await readFile(fichier, "utf8")) as { elements: RelationOsm[] };
  const rels = json.elements.filter((e) => e.type === "relation");
  const communes = rels.filter((r) => r.tags.admin_level === "8");
  if (communes.length !== 1) throw new Error(`Attendu 1 commune, trouvé ${communes.length}.`);
  const commune = communes[0];
  const polygones = polygonesDeRelation(commune);
  const tous = polygones.flatMap((p) => p[0]);
  const bbox: [number, number, number, number] = [
    Math.min(...tous.map((c) => c[0])),
    Math.min(...tous.map((c) => c[1])),
    Math.max(...tous.map((c) => c[0])),
    Math.max(...tous.map((c) => c[1])),
  ];
  return {
    commune: { id: commune.id, tags: commune.tags, polygones },
    sections: rels
      .filter((r) => r.tags.admin_level === "9")
      .map((r) => ({
        id: r.id,
        nom: r.tags.name,
        ref: r.tags["ref:INS"] ?? null,
        polygones: polygonesDeRelation(r),
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    bbox,
  };
}
