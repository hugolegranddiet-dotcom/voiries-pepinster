// Tests de la phase 1 : garde-fous sur les données de démonstration
// et cohérence des paramètres proposés. Le moteur de score sera testé en phase 6.
import { describe, expect, it } from "vitest";
import { VOIRIES_DEMO, donneesManquantes } from "@/lib/demo/voiries-demo";
import {
  bandeDuScore,
  ECHELLES_PAR_DEFAUT,
  POIDS_PAR_DEFAUT,
  SEUILS_PAR_DEFAUT,
} from "@/lib/priority/defaults";

describe("données de démonstration", () => {
  it("sont toutes marquées « démo » et clairement fictives", () => {
    expect(VOIRIES_DEMO.length).toBeGreaterThan(0);
    for (const v of VOIRIES_DEMO) {
      expect(v.demo).toBe(true);
      expect(v.nom).toMatch(/démo/i);
    }
  });

  it("ne contiennent aucune géométrie (aucun tracé fictif)", () => {
    for (const v of VOIRIES_DEMO) {
      const cles = Object.keys(v).map((k) => k.toLowerCase());
      expect(cles.some((k) => /geom|coord|lat|lng|lon/.test(k))).toBe(false);
    }
  });

  it("n'ont pas de score sans note d'état", () => {
    for (const v of VOIRIES_DEMO) {
      if (v.etatNote === null) expect(v.scoreDemo).toBeNull();
    }
  });

  it("ont des scores entiers entre 0 et 100", () => {
    for (const v of VOIRIES_DEMO) {
      if (v.scoreDemo !== null) {
        expect(Number.isInteger(v.scoreDemo)).toBe(true);
        expect(v.scoreDemo).toBeGreaterThanOrEqual(0);
        expect(v.scoreDemo).toBeLessThanOrEqual(100);
      }
    }
  });

  it("listent correctement les données manquantes", () => {
    const g = VOIRIES_DEMO.find((v) => v.id === "demo-g")!;
    expect(donneesManquantes(g)).toEqual(["état", "risque"]);
  });
});

describe("paramètres proposés (PLAN.md §6)", () => {
  it("ont des poids dont la somme fait 100 %", () => {
    const total = Object.values(POIDS_PAR_DEFAUT).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it("ont des échelles comprises entre 0 et 100", () => {
    for (const echelle of Object.values(ECHELLES_PAR_DEFAUT)) {
      for (const e of echelle) {
        expect(e.points).toBeGreaterThanOrEqual(0);
        expect(e.points).toBeLessThanOrEqual(100);
      }
    }
  });

  it("couvrent chaque score de 0 à 100 par exactement une couleur", () => {
    for (let s = 0; s <= 100; s++) {
      const n = SEUILS_PAR_DEFAUT.filter((t) => s >= t.min && s <= t.max).length;
      expect(n).toBe(1);
    }
  });

  it("attribuent les bonnes couleurs aux bornes", () => {
    expect(bandeDuScore(0)).toBe("vert");
    expect(bandeDuScore(24)).toBe("vert");
    expect(bandeDuScore(25)).toBe("jaune");
    expect(bandeDuScore(49)).toBe("jaune");
    expect(bandeDuScore(50)).toBe("orange");
    expect(bandeDuScore(74)).toBe("orange");
    expect(bandeDuScore(75)).toBe("rouge");
    expect(bandeDuScore(100)).toBe("rouge");
    expect(bandeDuScore(null)).toBe("gris");
  });
});
