// Priorité forcée (D20) et parties de rue (D21) : formulaire, schéma, attribution des morceaux.
import { describe, expect, it } from "vitest";
import { ModificationEvaluation, ModificationFiche } from "@/lib/db/schemas";
import { differences, type Formulaire } from "@/lib/donnees/formulaire";
import type { FicheVoirie } from "@/lib/donnees/types";
import { attributionSegments, ficheDuSegment, segmentsPrisParAutres } from "@/lib/geo/sections";

const vide: Formulaire = {
  gestionnaire: "commune", gestionnaire_detail: "", statut_fiche: "importe_excel", etat_note: "3", intensite_circulation: "", densite_habitation: "",
  risque_securite: "", ampleur_travaux: "", echeance_brute: "", annee_prevue: "", mobilite_note: "", particularites: "", priorite_manuelle: "", priorite_manuelle_motif: "",
};

describe("priorité forcée : formulaire et contrôle", () => {
  it("envoie toujours la priorité et sa raison ensemble", () => {
    expect(differences(vide, { ...vide, priorite_manuelle: "85", priorite_manuelle_motif: " École " })).toEqual({
      evaluation: { priorite_manuelle: 85, priorite_manuelle_motif: "École" },
    });
    const force = { ...vide, priorite_manuelle: "85", priorite_manuelle_motif: "École" };
    // Seul le chiffre change : la raison est renvoyée aussi.
    expect(differences(force, { ...force, priorite_manuelle: "70" })).toEqual({ evaluation: { priorite_manuelle: 70, priorite_manuelle_motif: "École" } });
    // Revenir au calcul efface les deux.
    expect(differences(force, { ...force, priorite_manuelle: "", priorite_manuelle_motif: "" })).toEqual({ evaluation: { priorite_manuelle: null, priorite_manuelle_motif: null } });
  });

  it("refuse une priorité forcée sans raison, ou hors de 0 à 100", () => {
    expect(ModificationEvaluation.safeParse({ priorite_manuelle: 80, priorite_manuelle_motif: "école" }).success).toBe(true);
    expect(ModificationEvaluation.safeParse({ priorite_manuelle: 80, priorite_manuelle_motif: "  " }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ priorite_manuelle: 80 }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ priorite_manuelle: 101, priorite_manuelle_motif: "x" }).success).toBe(false);
    expect(ModificationEvaluation.safeParse({ priorite_manuelle: null, priorite_manuelle_motif: null }).success).toBe(true);
    expect(ModificationFiche.safeParse({ evaluation: { priorite_manuelle: 10, priorite_manuelle_motif: "chemin privé" } }).success).toBe(true);
  });
});

describe("parties de rue : morceaux choisis", () => {
  const f = (x: Partial<FicheVoirie>) => ({ categorie: "voirie", parentId: null, sousSections: [], segmentsSection: [], ...x }) as FicheVoirie;
  const fiches: Record<string, FicheVoirie> = {
    "n:soiron centre": f({ id: "n:soiron centre", sousSections: ["s:134", "s:135", "s:136"] }),
    "s:134": f({ id: "s:134", categorie: "section", parentId: "n:soiron centre", segmentsSection: ["a", "b"] }),
    "s:135": f({ id: "s:135", categorie: "section", parentId: "n:soiron centre", segmentsSection: ["c"] }),
    "s:136": f({ id: "s:136", categorie: "section", parentId: "n:soiron centre" }),
  };

  it("un morceau choisi appartient à sa partie de rue, les autres à la rue", () => {
    const a = attributionSegments(fiches);
    expect(ficheDuSegment({ sid: "a", rid: "n:soiron centre" }, a)).toBe("s:134");
    expect(ficheDuSegment({ sid: "c", rid: "n:soiron centre" }, a)).toBe("s:135");
    expect(ficheDuSegment({ sid: "z", rid: "n:soiron centre" }, a)).toBe("n:soiron centre");
  });

  it("liste les morceaux déjà pris par les autres parties", () => {
    expect([...segmentsPrisParAutres("s:136", fiches)].sort()).toEqual(["a", "b", "c"]);
    expect([...segmentsPrisParAutres("s:134", fiches)]).toEqual(["c"]);
    expect(segmentsPrisParAutres("n:soiron centre", fiches).size).toBe(0);
  });
});
