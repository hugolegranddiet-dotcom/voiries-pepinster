// Validation des données envoyées par l'interface (phase 4).
import { describe, expect, it } from "vitest";
import { IdentifiantVoirie, ModificationEvaluation } from "@/lib/db/schemas";

describe("modification d'une évaluation", () => {
  it("accepte une modification partielle valide", () => {
    const r = ModificationEvaluation.safeParse({ particularites: "  cul de sac  ", etat_note: 3 });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ particularites: "cul de sac", etat_note: 3 });
  });

  it("transforme un texte vide en « non renseigné »", () => {
    expect(ModificationEvaluation.parse({ particularites: "   " })).toEqual({ particularites: null });
  });

  it("refuse une note hors de 1 à 5", () => {
    expect(ModificationEvaluation.safeParse({ etat_note: 6 }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ risque_securite: 0 }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ etat_note: 2.5 }).success).toBe(false);
  });

  it("refuse les champs inconnus ou protégés", () => {
    expect(ModificationEvaluation.safeParse({ road_id: "x" }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ updated_by: "x" }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ etat_note_suggeree: 2 }).success).toBe(false);
  });

  it("refuse une valeur hors liste et une modification vide", () => {
    expect(ModificationEvaluation.safeParse({ intensite_circulation: "énorme" }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({}).success).toBe(false);
  });

  it("limite la longueur des textes", () => {
    expect(ModificationEvaluation.safeParse({ particularites: "x".repeat(2001) }).success).toBe(false);
  });

  it("ne pose jamais un conflit par l'interface", () => {
    expect(ModificationEvaluation.safeParse({ statut_validation: "conflit_a_resoudre" }).success).toBe(false);
  });
});

describe("identifiant de voirie", () => {
  it("accepte les formes connues", () => {
    for (const id of ["n:rue du biez", "w123456", "s:20", "n:route de soiron#2"]) {
      expect(IdentifiantVoirie.safeParse(id).success, id).toBe(true);
    }
  });
  it("refuse le reste", () => {
    for (const id of ["", "'; drop table roads; --", "x".repeat(300)]) {
      expect(IdentifiantVoirie.safeParse(id).success, id).toBe(false);
    }
  });
});
