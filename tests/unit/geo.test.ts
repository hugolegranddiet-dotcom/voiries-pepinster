// Tests du traitement géographique (phase 2).
// Les petites géométries ci-dessous sont des cas d'école pour les tests ;
// elles ne sont jamais affichées dans l'application.
import { describe, expect, it } from "vitest";
import {
  assemblerAnneaux,
  decouperALaLimite,
  distanceM,
  IndexAretes,
  type Coord,
  type Polygone,
} from "@/lib/geo/outils";
import { normaliserNom } from "@/lib/geo/noms";
import { appliquerMemeEndroit, categorieVoie, regrouperEnVoiries, type WayOsm } from "@/lib/geo/voiries";

const carre: Polygone = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
const index = new IndexAretes(carre);

describe("découpe à la limite communale (D6)", () => {
  it("garde intacte une voie entièrement dans la commune", () => {
    const ligne: Coord[] = [[0.2, 0.2], [0.5, 0.4], [0.8, 0.3]];
    const r = decouperALaLimite(ligne, [carre], index);
    expect(r.coupee).toBe(false);
    expect(r.morceaux).toHaveLength(1);
    expect(r.morceaux[0].coords).toEqual(ligne);
    expect(r.morceaux[0].pointsCalcules).toEqual([]);
  });

  it("écarte une voie entièrement hors commune", () => {
    const r = decouperALaLimite([[2, 2], [3, 3]], [carre], index);
    expect(r.morceaux).toHaveLength(0);
  });

  it("coupe une voie qui sort, sans modifier les points d'origine", () => {
    const ligne: Coord[] = [[0.5, 0.5], [0.7, 0.5], [1.5, 0.5]];
    const r = decouperALaLimite(ligne, [carre], index);
    expect(r.coupee).toBe(true);
    expect(r.morceaux).toHaveLength(1);
    const m = r.morceaux[0];
    expect(m.coords.slice(0, 2)).toEqual([[0.5, 0.5], [0.7, 0.5]]);
    expect(m.pointsCalcules).toEqual([2]);
    expect(m.coords[2][0]).toBeCloseTo(1, 12);
    expect(m.coords[2][1]).toBeCloseTo(0.5, 12);
  });

  it("produit deux morceaux pour une voie qui sort puis rentre", () => {
    const ligne: Coord[] = [[0.5, 0.2], [1.5, 0.2], [1.5, 0.8], [0.5, 0.8]];
    const r = decouperALaLimite(ligne, [carre], index);
    expect(r.morceaux).toHaveLength(2);
  });
});

describe("assemblage de la limite", () => {
  it("referme un anneau à partir de morceaux dans le désordre", () => {
    const anneaux = assemblerAnneaux([
      [[1, 0], [1, 1]],
      [[0, 0], [1, 0]],
      [[0, 1], [1, 1]], // à l'envers
      [[0, 1], [0, 0]],
    ]);
    expect(anneaux).toHaveLength(1);
    expect(anneaux[0][0]).toEqual(anneaux[0][anneaux[0].length - 1]);
  });

  it("refuse un anneau ouvert", () => {
    expect(() => assemblerAnneaux([[[0, 0], [1, 0]], [[1, 0], [1, 1]]])).toThrow();
  });
});

const way = (id: number, nodes: number[], coords: Coord[], name?: string, highway = "residential"): WayOsm => ({
  id,
  nodes,
  coords,
  tags: { highway, ...(name ? { name } : {}) },
});

describe("voiries logiques", () => {
  it("réunit les segments de même nom reliés par un nœud", () => {
    const g = regrouperEnVoiries([
      way(1, [10, 11], [[0, 0], [0.001, 0]], "Rue du Test"),
      way(2, [11, 12], [[0.001, 0], [0.002, 0]], "Rue du Test"),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].wayIds).toEqual([1, 2]);
    expect(g[0].alerte).toBeNull();
  });

  it("ne fusionne jamais deux groupes de même nom non reliés", () => {
    const g = regrouperEnVoiries([
      way(1, [10, 11], [[0, 0], [0.001, 0]], "Rue du Test"),
      way(2, [20, 21], [[0.05, 0], [0.051, 0]], "rue du test"),
    ]);
    expect(g).toHaveLength(2);
    expect(g.every((x) => x.alerte === "meme_nom_non_relie")).toBe(true);
    expect(g.map((x) => x.partie?.numero)).toEqual([1, 2]);
  });

  it("signale un trou possible quand les groupes sont à moins de 50 m", () => {
    const g = regrouperEnVoiries([
      way(1, [10, 11], [[0, 0], [0.001, 0]], "Rue du Test"),
      way(2, [20, 21], [[0.0013, 0], [0.002, 0]], "Rue du Test"),
    ]);
    expect(distanceM([0.001, 0], [0.0013, 0])).toBeLessThan(50);
    expect(g.every((x) => x.alerte === "trou_possible")).toBe(true);
  });

  it("fait une voirie par way pour les voies sans nom", () => {
    const g = regrouperEnVoiries([
      way(1, [10, 11], [[0, 0], [0.001, 0]]),
      way(2, [11, 12], [[0.001, 0], [0.002, 0]]),
    ]);
    expect(g.map((x) => x.roadId)).toEqual(["w1", "w2"]);
  });
});

describe("noms et catégories", () => {
  it("normalise accents, apostrophes et tirets", () => {
    expect(normaliserNom("Rue de l’Hospice")).toBe("rue de l'hospice");
    expect(normaliserNom("  Rue  Émile-Fairon ")).toBe("rue emile fairon");
  });

  it("classe les voies", () => {
    expect(categorieVoie("residential", "Rue X")).toBe("voirie");
    expect(categorieVoie("residential", null)).toBe("voirie");
    expect(categorieVoie("primary_link", null)).toBe("voirie");
    expect(categorieVoie("track", null)).toBe("chemin");
    expect(categorieVoie("service", null)).toBe("acces");
    expect(categorieVoie("service", "Parc Y")).toBe("voirie");
  });
});

describe("décision D14 : même endroit = même rue", () => {
  const proches = [
    way(1, [10, 11], [[0, 0], [0.001, 0]], "Rue du Test"),
    way(2, [20, 21], [[0.003, 0], [0.004, 0]], "Rue du Test"), // ~ 220 m
  ];
  const loin = [...proches, way(3, [30, 31], [[0.05, 0], [0.051, 0]], "Rue du Test")]; // ~ 5 km

  it("réunit deux morceaux à moins de 300 m", () => {
    const { groupes, journal } = appliquerMemeEndroit(regrouperEnVoiries(proches), proches);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].wayIds).toEqual([1, 2]);
    expect(groupes[0].partie).toBeNull();
    expect(journal[0].decision).toBe("meme_rue");
  });

  it("garde séparé un homonyme éloigné", () => {
    const { groupes, journal } = appliquerMemeEndroit(regrouperEnVoiries(loin), loin);
    expect(groupes).toHaveLength(2);
    expect(groupes.map((g) => g.wayIds)).toEqual([[1, 2], [3]]);
    expect(journal[0].decision).toBe("homonymes");
  });
});
