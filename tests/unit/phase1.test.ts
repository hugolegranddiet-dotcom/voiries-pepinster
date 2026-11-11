// Cohérence des paramètres proposés (phase 1). Les données de démonstration
// ont été retirées en phase 6 ; le moteur de score est testé dans score.test.ts.
import { describe, expect, it } from "vitest";
import {
  bandeDuScore,
  ECHELLES_PAR_DEFAUT,
  POIDS_PAR_DEFAUT,
  SEUILS_PAR_DEFAUT,
} from "@/lib/priority/defaults";

describe("paramètres proposés (PLAN.md §6)", () => {
  it("ont des poids dont la somme fait 100 %", () => {
    const total = Object.values(POIDS_PAR_DEFAUT).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it("ont des échelles comprises entre 0 et 100", () => {
    for (const echelle of Object.values(ECHELLES_PAR_DEFAUT)) {
      for (const points of Object.values(echelle) as number[]) {
        expect(points).toBeGreaterThanOrEqual(0);
        expect(points).toBeLessThanOrEqual(100);
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
