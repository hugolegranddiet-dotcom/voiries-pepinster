// Sauvegarde / restauration (phase 7) : lecture complète, contrôle du fichier, plan sans suppression.
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creerSauvegarde, lireFichierSauvegarde, planifierRestauration, TABLES_SAUVEGARDE, type Ligne } from "../../scripts/db/sauvegarde-outils";

/** Faux client : renvoie les lignes par pages, comme Supabase (1000 au plus). */
function fauxClient(donnees: Partial<Record<string, Ligne[]>>): SupabaseClient {
  return {
    from: (t: string) => ({
      select: () => ({
        order: () => ({
          range: async (de: number, a: number) => ({ data: (donnees[t] ?? []).slice(de, a + 1), error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

const roads = Array.from({ length: 1135 }, (_, i) => ({ id: `n:r${i}`, gestionnaire: "commune", gestionnaire_detail: null, gestionnaire_source: "excel", statut_fiche: "importe_excel", nom: `R${i}` }));
const evals = [
  { road_id: "n:r1", etat_note: 4, particularites: "école", updated_at: "2026-11-11" },
  { road_id: "n:r2", etat_note: 2, particularites: null, updated_at: "2026-11-11" },
];
const reglages = [
  { id: "a", version: 1, actif: false, poids: { etat: 55 }, echelles: {}, seuils: [], couverture_min: 0.7, gestionnaires_classement: ["commune"] },
  { id: "b", version: 2, actif: true, poids: { etat: 45 }, echelles: {}, seuils: [], couverture_min: 0.7, gestionnaires_classement: ["commune"] },
];

describe("sauvegarde", () => {
  it("lit toutes les lignes, au-delà de 1000, et compte chaque table", async () => {
    const s = await creerSauvegarde(fauxClient({ roads, road_evaluations: evals, priority_settings: reglages }), new Date("2026-11-11T22:00:00Z"));
    expect(s.tables.roads).toHaveLength(1135);
    expect(s.comptes).toMatchObject({ roads: 1135, road_evaluations: 2, priority_settings: 2, change_log: 0 });
    expect(Object.keys(s.tables)).toEqual([...TABLES_SAUVEGARDE]);
    expect(lireFichierSauvegarde(JSON.stringify(s)).creeLe).toBe("2026-11-11T22:00:00.000Z");
  });

  it("refuse un fichier qui n'est pas une sauvegarde, ou abîmé", async () => {
    expect(() => lireFichierSauvegarde("{}")).toThrow(/pas une sauvegarde/);
    const s = await creerSauvegarde(fauxClient({ roads, road_evaluations: evals, priority_settings: reglages }));
    s.tables.road_evaluations.pop();
    expect(() => lireFichierSauvegarde(JSON.stringify(s))).toThrow(/incohérent/);
  });
});

describe("plan de restauration", () => {
  it("remet ce qui a changé, ne supprime rien, ignore les voiries disparues", async () => {
    const s = await creerSauvegarde(fauxClient({ roads, road_evaluations: [...evals, { road_id: "n:disparue", etat_note: 3 }], priority_settings: reglages }));
    const actuel = {
      roads: roads.map((r) => (r.id === "n:r5" ? { ...r, gestionnaire: "spw" } : r)),
      road_evaluations: [
        { road_id: "n:r1", etat_note: 5, particularites: "école", updated_at: "2026-12-01" }, // modifiée depuis
        { road_id: "n:r2", etat_note: 2, particularites: null, updated_at: "2026-12-01" }, // identique (date ignorée)
        { road_id: "n:r9", etat_note: 1, updated_at: "2026-12-01" }, // ajoutée depuis : gardée
      ],
      priority_settings: [reglages[0], { ...reglages[1], actif: false }, { id: "c", version: 3, actif: true, poids: { etat: 60 } }],
    };
    const plan = planifierRestauration(actuel, s);
    expect(plan.evaluations).toEqual([{ road_id: "n:r1", etat_note: 4, particularites: "école" }]);
    expect(plan.voiries).toEqual([{ id: "n:r5", gestionnaire: "commune", gestionnaire_detail: null, gestionnaire_source: "excel", statut_fiche: "importe_excel" }]);
    expect(plan.parametres).toHaveLength(0); // versions 1 et 2 identiques ; la 3 n'est pas supprimée
    expect(plan.versionActive).toBe(2);
    expect(plan.voiriesInconnues).toEqual(["n:disparue"]);
  });
});
