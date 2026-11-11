// Test « liste témoin » (PLAN.md §7 phase 6, décision D8).
// La feuille « Récap 102026 » est la liste actuelle des priorités du père.
// Scénario testé : toutes les notes SUGGÉRÉES par couleur sont validées telles
// quelles (ce que le père peut faire par lot), avec les paramètres par défaut.
// On vérifie alors que ses 14 voiries prioritaires sortent en tête du
// classement communal. Ce test ne modifie AUCUNE donnée.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construireDonnees } from "../../scripts/db/construire";
import type { FicheVoirie } from "@/lib/donnees/types";
import { classer } from "@/lib/priority/classement";
import { PARAMETRES_PAR_DEFAUT } from "@/lib/priority/defaults";
import recap from "../../data/excel/recap_102026.json";

const racine = join(__dirname, "..", "..");
const dispo = existsSync(join(racine, "data", "geo", "voiries.json")) && existsSync(join(racine, "data", "excel", "feuil1_raw.json"));

describe.runIf(dispo)("liste témoin « Récap 102026 » (D8)", () => {
  async function classementSimule() {
    const d = await construireDonnees(racine);
    const gestionnaire = new Map<string, string>();
    for (const g of d.gestionnaires) for (const id of g.ids) gestionnaire.set(id, g.valeurs.gestionnaire as string);
    const evaluations = new Map(d.evaluations.map((e) => [e.road_id as string, e as Record<string, unknown>]));
    const fiches = [...d.roads, ...d.sections].map((r) => {
      const e = evaluations.get(r.id as string);
      return {
        id: r.id,
        nom: r.nom,
        categorie: r.categorie,
        gestionnaire: (r.categorie === "section" ? r.gestionnaire : gestionnaire.get(r.id as string)) ?? "inconnu",
        statutFiche: "importe_excel",
        // Validation simulée : la note suggérée devient la note d'état.
        evaluation: e ? { ...e, etat_note: e.etat_note ?? e.etat_note_suggeree } : null,
      } as unknown as FicheVoirie;
    });
    return classer(fiches, PARAMETRES_PAR_DEFAUT, { exclureHorsCommune: true });
  }

  it("relie les 14 voiries de la feuille Récap à une fiche chacune", () => {
    expect(recap.voiries).toHaveLength(14);
    expect(new Set(recap.voiries.map((v) => v.roadId)).size).toBe(14);
  });

  it("les place en tête du classement communal", async () => {
    const c = await classementSimule();
    const temoins = new Set(recap.voiries.map((v) => v.roadId));
    const positions = recap.voiries.map((v) => c.classees.findIndex((l) => l.id === v.roadId) + 1);
    // Toutes sont classées (score calculé) et dans la commune.
    expect(positions.every((p) => p > 0)).toBe(true);
    expect(c.classees.length).toBeGreaterThan(100);
    // Les 5 premières places sont toutes des voiries témoins.
    expect(c.classees.slice(0, 5).every((l) => temoins.has(l.id))).toBe(true);
    // Au moins 12 des 14 témoins dans les 15 premières, et toutes dans les 20 premières.
    expect(positions.filter((p) => p <= 15).length).toBeGreaterThanOrEqual(12);
    expect(Math.max(...positions)).toBeLessThanOrEqual(20);
  }, 60_000);
});
