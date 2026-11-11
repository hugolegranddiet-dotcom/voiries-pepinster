// Outils géométriques simples, sans dépendance externe.
// Coordonnées au format GeoJSON : [longitude, latitude] en WGS84.
// À l'échelle d'une commune, un calcul « plan » en degrés suffit pour les
// intersections et l'appartenance à un polygone ; les longueurs utilisent la
// formule de haversine.
//
// RÈGLE : aucune fonction ne modifie ni n'arrondit une coordonnée OSM.
// La seule coordonnée nouvelle possible est l'intersection exacte entre une
// voie et la limite communale (découpe décidée en D6), toujours signalée.

export type Coord = [number, number];
export type Anneau = Coord[]; // fermé : premier point = dernier point

const RAYON_TERRE_M = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceM(a: Coord, b: Coord): number {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function longueurM(ligne: ReadonlyArray<Coord>): number {
  let total = 0;
  for (let i = 1; i < ligne.length; i++) total += distanceM(ligne[i - 1], ligne[i]);
  return total;
}

/** Point dans un anneau (lancer de rayon). */
function dansAnneau(p: Coord, anneau: Anneau): boolean {
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      dedans = !dedans;
    }
  }
  return dedans;
}

/** Polygone = [anneau extérieur, ...trous]. */
export type Polygone = Anneau[];

export function dansMultiPolygone(p: Coord, polygones: ReadonlyArray<Polygone>): boolean {
  return polygones.some(
    ([exterieur, ...trous]) => dansAnneau(p, exterieur) && !trous.some((t) => dansAnneau(p, t)),
  );
}

/** Intersection de deux segments [a,b] et [c,d] : paramètre t sur [a,b] et point, ou null. */
function intersection(a: Coord, b: Coord, c: Coord, d: Coord): { t: number; p: Coord } | null {
  const r0 = b[0] - a[0];
  const r1 = b[1] - a[1];
  const s0 = d[0] - c[0];
  const s1 = d[1] - c[1];
  const denom = r0 * s1 - r1 * s0;
  if (denom === 0) return null; // parallèles
  const t = ((c[0] - a[0]) * s1 - (c[1] - a[1]) * s0) / denom;
  const u = ((c[0] - a[0]) * r1 - (c[1] - a[1]) * r0) / denom;
  if (t <= 0 || t >= 1 || u < 0 || u > 1) return null;
  return { t, p: [a[0] + t * r0, a[1] + t * r1] };
}

/** Index en grille des arêtes de la limite, pour accélérer les recherches. */
export class IndexAretes {
  private readonly cellules = new Map<string, Array<[Coord, Coord]>>();
  constructor(
    anneaux: ReadonlyArray<Anneau>,
    private readonly taille = 0.004,
  ) {
    for (const anneau of anneaux) {
      for (let i = 1; i < anneau.length; i++) this.ajouter(anneau[i - 1], anneau[i]);
    }
  }
  private cles(a: Coord, b: Coord): string[] {
    const x0 = Math.floor(Math.min(a[0], b[0]) / this.taille);
    const x1 = Math.floor(Math.max(a[0], b[0]) / this.taille);
    const y0 = Math.floor(Math.min(a[1], b[1]) / this.taille);
    const y1 = Math.floor(Math.max(a[1], b[1]) / this.taille);
    const cles: string[] = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cles.push(`${x}:${y}`);
    return cles;
  }
  private ajouter(a: Coord, b: Coord) {
    for (const k of this.cles(a, b)) {
      const liste = this.cellules.get(k);
      if (liste) liste.push([a, b]);
      else this.cellules.set(k, [[a, b]]);
    }
  }
  aretesProches(a: Coord, b: Coord): Array<[Coord, Coord]> {
    const vues = new Set<[Coord, Coord]>();
    for (const k of this.cles(a, b)) for (const e of this.cellules.get(k) ?? []) vues.add(e);
    return [...vues];
  }
}

export interface Morceau {
  coords: Coord[];
  /** Indices (dans coords) des points calculés à la limite communale. */
  pointsCalcules: number[];
}

export interface ResultatDecoupe {
  morceaux: Morceau[];
  /** true si la voie a été coupée à la limite. */
  coupee: boolean;
}

/**
 * Garde la partie d'une ligne située dans la commune (décision D6).
 * Les coordonnées d'origine sont conservées telles quelles ; seuls les points
 * d'intersection avec la limite sont ajoutés, et ils sont signalés.
 */
export function decouperALaLimite(
  ligne: ReadonlyArray<Coord>,
  commune: ReadonlyArray<Polygone>,
  index: IndexAretes,
): ResultatDecoupe {
  // 1. Insérer les points d'intersection dans la ligne.
  const points: Array<{ c: Coord; calcule: boolean }> = [{ c: ligne[0], calcule: false }];
  let intersections = 0;
  for (let i = 1; i < ligne.length; i++) {
    const a = ligne[i - 1];
    const b = ligne[i];
    const coupures: Array<{ t: number; p: Coord }> = [];
    for (const [c, d] of index.aretesProches(a, b)) {
      const x = intersection(a, b, c, d);
      if (x) coupures.push(x);
    }
    coupures.sort((m, n) => m.t - n.t);
    for (const x of coupures) points.push({ c: x.p, calcule: true });
    intersections += coupures.length;
    points.push({ c: b, calcule: false });
  }

  // 2. Cas simple : aucune intersection → la ligne est entièrement dedans ou dehors.
  if (intersections === 0) {
    const milieu: Coord =
      ligne.length > 1
        ? [(ligne[0][0] + ligne[1][0]) / 2, (ligne[0][1] + ligne[1][1]) / 2]
        : ligne[0];
    const dedans = dansMultiPolygone(milieu, commune);
    return {
      morceaux: dedans ? [{ coords: [...ligne], pointsCalcules: [] }] : [],
      coupee: !dedans,
    };
  }

  // 3. Garder les troncons dont le milieu est dans la commune.
  const morceaux: Morceau[] = [];
  let courant: Morceau | null = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const milieu: Coord = [(a.c[0] + b.c[0]) / 2, (a.c[1] + b.c[1]) / 2];
    if (dansMultiPolygone(milieu, commune)) {
      if (!courant) {
        courant = { coords: [a.c], pointsCalcules: a.calcule ? [0] : [] };
      }
      courant.coords.push(b.c);
      if (b.calcule) courant.pointsCalcules.push(courant.coords.length - 1);
    } else if (courant) {
      morceaux.push(courant);
      courant = null;
    }
  }
  if (courant) morceaux.push(courant);
  return { morceaux: morceaux.filter((m) => m.coords.length >= 2), coupee: true };
}

/** Assemble les ways d'une relation en anneaux fermés (jointure par extrémités identiques). */
export function assemblerAnneaux(troncons: ReadonlyArray<Coord[]>): Anneau[] {
  const egal = (p: Coord, q: Coord) => p[0] === q[0] && p[1] === q[1];
  const restants = troncons.map((t) => [...t]);
  const anneaux: Anneau[] = [];
  while (restants.length) {
    const anneau = restants.shift()!;
    let progres = true;
    while (!egal(anneau[0], anneau[anneau.length - 1]) && progres) {
      progres = false;
      const fin = anneau[anneau.length - 1];
      for (let i = 0; i < restants.length; i++) {
        const t = restants[i];
        if (egal(t[0], fin)) {
          anneau.push(...t.slice(1));
        } else if (egal(t[t.length - 1], fin)) {
          anneau.push(...[...t].reverse().slice(1));
        } else continue;
        restants.splice(i, 1);
        progres = true;
        break;
      }
    }
    if (!egal(anneau[0], anneau[anneau.length - 1])) {
      throw new Error("Limite communale : un anneau ne se referme pas (données OSM incomplètes ?).");
    }
    anneaux.push(anneau);
  }
  return anneaux;
}

/** Distance (m) d'un point à une polyligne, en projection locale équirectangulaire. */
export function distancePointLigneM(p: Coord, ligne: ReadonlyArray<Coord>): number {
  const kx = 111_320 * Math.cos(rad(p[1]));
  const ky = 110_540;
  let min = Infinity;
  for (let i = 1; i < ligne.length; i++) {
    const ax = (ligne[i - 1][0] - p[0]) * kx;
    const ay = (ligne[i - 1][1] - p[1]) * ky;
    const bx = (ligne[i][0] - p[0]) * kx;
    const by = (ligne[i][1] - p[1]) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2));
    const x = ax + t * dx;
    const y = ay + t * dy;
    min = Math.min(min, Math.hypot(x, y));
  }
  return min;
}

/** Points régulièrement espacés le long d'une ligne (pour les comparaisons). */
export function echantillonner(ligne: ReadonlyArray<Coord>, pasM = 10): Coord[] {
  const res: Coord[] = [ligne[0]];
  for (let i = 1; i < ligne.length; i++) {
    const a = ligne[i - 1];
    const b = ligne[i];
    const d = distanceM(a, b);
    const n = Math.max(1, Math.ceil(d / pasM));
    for (let k = 1; k <= n; k++) {
      res.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
  }
  return res;
}
