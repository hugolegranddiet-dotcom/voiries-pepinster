// Regroupement des segments OSM en « voiries logiques » (une fiche, une couleur).
// Règles (PLAN.md §4.2) :
// - même nom normalisé ET segments reliés par un nœud OSM commun → même voirie ;
// - même nom mais groupes non reliés → voiries SÉPARÉES, signalées pour
//   vérification manuelle (homonymes ou trou dans OSM) ; jamais fusionnées ;
// - voie sans nom → une voirie par way OSM.

import { distanceM, longueurM, type Coord } from "@/lib/geo/outils";
import { normaliserNom } from "@/lib/geo/noms";

export type CategorieVoie = "voirie" | "chemin" | "acces";

const TYPES_CARROSSABLES = new Set([
  "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified",
  "residential", "living_street", "pedestrian", "road",
]);
const TYPES_CHEMINS = new Set(["track", "path", "footway", "bridleway", "cycleway", "steps"]);

export function typeDeBase(highway: string): string {
  return highway.replace(/_link$/, "");
}

/**
 * Catégorie d'affichage :
 * - `voirie` : voie carrossable (ou `service` portant un nom) ;
 * - `chemin` : chemins agricoles, sentiers, pistes (visibles, décision D6) ;
 * - `acces` : accès et parkings `service` sans nom (masqués par défaut).
 */
export function categorieVoie(highway: string, nom: string | null): CategorieVoie {
  const t = typeDeBase(highway);
  if (TYPES_CHEMINS.has(t)) return "chemin";
  if (TYPES_CARROSSABLES.has(t)) return "voirie";
  return nom ? "voirie" : "acces";
}

export interface WayOsm {
  id: number;
  nodes: number[];
  coords: Coord[];
  tags: Record<string, string>;
}

export type AlerteVoirie = "meme_nom_non_relie" | "trou_possible";

export interface GroupeVoirie {
  roadId: string;
  nom: string | null;
  nomNormalise: string | null;
  wayIds: number[];
  /** Pour un nom porté par plusieurs groupes non reliés. */
  partie: { numero: number; total: number } | null;
  alerte: AlerteVoirie | null;
  /** Distance (m) au plus proche autre groupe de même nom. */
  distanceAutreGroupeM: number | null;
}

class UnionFind {
  private parent = new Map<number, number>();
  trouver(x: number): number {
    let p = this.parent.get(x) ?? x;
    if (p !== x) {
      p = this.trouver(p);
      this.parent.set(x, p);
    }
    return p;
  }
  unir(a: number, b: number) {
    const ra = this.trouver(a);
    const rb = this.trouver(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

function distanceEntreGroupes(a: WayOsm[], b: WayOsm[]): number {
  let min = Infinity;
  for (const wa of a) for (const pa of wa.coords) for (const wb of b) for (const pb of wb.coords) {
    const d = distanceM(pa, pb);
    if (d < min) min = d;
  }
  return min;
}

/** Seuil sous lequel deux groupes de même nom font penser à un trou dans OSM. */
export const SEUIL_TROU_M = 50;

export function regrouperEnVoiries(ways: ReadonlyArray<WayOsm>): GroupeVoirie[] {
  const groupes: GroupeVoirie[] = [];
  const parNom = new Map<string, WayOsm[]>();

  for (const w of ways) {
    const nom = w.tags.name?.trim();
    if (!nom) {
      groupes.push({
        roadId: `w${w.id}`,
        nom: null,
        nomNormalise: null,
        wayIds: [w.id],
        partie: null,
        alerte: null,
        distanceAutreGroupeM: null,
      });
      continue;
    }
    const cle = normaliserNom(nom);
    const liste = parNom.get(cle);
    if (liste) liste.push(w);
    else parNom.set(cle, [w]);
  }

  for (const [cle, liste] of parNom) {
    // Composantes connexes : deux ways sont reliés s'ils partagent un nœud OSM.
    const uf = new UnionFind();
    const premierWayDuNoeud = new Map<number, number>();
    for (const w of liste) {
      uf.trouver(w.id);
      for (const n of w.nodes) {
        const autre = premierWayDuNoeud.get(n);
        if (autre === undefined) premierWayDuNoeud.set(n, w.id);
        else uf.unir(w.id, autre);
      }
    }
    const composantes = new Map<number, WayOsm[]>();
    for (const w of liste) {
      const r = uf.trouver(w.id);
      const c = composantes.get(r);
      if (c) c.push(w);
      else composantes.set(r, [w]);
    }
    // Ordre stable : par plus petit identifiant de way.
    const triees = [...composantes.values()]
      .map((c) => c.sort((a, b) => a.id - b.id))
      .sort((a, b) => a[0].id - b[0].id);

    triees.forEach((comp, i) => {
      let distance: number | null = null;
      if (triees.length > 1) {
        distance = Math.min(
          ...triees.filter((_, j) => j !== i).map((autre) => distanceEntreGroupes(comp, autre)),
        );
      }
      const nom = comp[0].tags.name.trim();
      groupes.push({
        roadId: triees.length > 1 ? `n:${cle}#${i + 1}` : `n:${cle}`,
        nom,
        nomNormalise: cle,
        wayIds: comp.map((w) => w.id),
        partie: triees.length > 1 ? { numero: i + 1, total: triees.length } : null,
        alerte:
          triees.length > 1
            ? distance !== null && distance < SEUIL_TROU_M
              ? "trou_possible"
              : "meme_nom_non_relie"
            : null,
        distanceAutreGroupeM: distance === null ? null : Math.round(distance),
      });
    });
  }

  return groupes.sort((a, b) => a.roadId.localeCompare(b.roadId));
}

export { longueurM };
