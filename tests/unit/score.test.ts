// Moteur de score (PLAN.md §6) : cas vérifiés A–G et cas limites.
import { describe, expect, it } from "vitest";
import { PARAMETRES_PAR_DEFAUT, type ParametresScore } from "@/lib/priority/defaults";
import { lireParametres, SchemaParametres, seuilsDepuisDebuts } from "@/lib/priority/parametres";
import { arrondir, calculerScore } from "@/lib/priority/score";
import { classer } from "@/lib/priority/classement";
import type { Evaluation, FicheVoirie } from "@/lib/donnees/types";

const P = PARAMETRES_PAR_DEFAUT;

describe("cas vérifiés du plan (§6.4)", () => {
  it.each([
    ["A", { etat_note: 4, intensite_circulation: "transit", densite_habitation: "moyen_bas" }, 76, "rouge", 0.9, true],
    ["B", { etat_note: 2, densite_habitation: "eleve" }, 41, "jaune", 0.7, true],
    ["E", { etat_note: 5, densite_habitation: "faible" }, 84, "rouge", 0.7, true],
    ["F", { etat_note: 5, intensite_circulation: "faible", densite_habitation: "faible" }, 65, "orange", 0.9, true],
    ["G", { etat_note: 3, intensite_circulation: "eleve", densite_habitation: "moyen_eleve", risque_securite: 3 }, 57, "orange", 1, false],
  ] as const)("cas %s", (_, entree, score, bande, couverture, provisoire) => {
    const r = calculerScore(entree, P);
    expect(r.score).toBe(score);
    expect(r.bande).toBe(bande);
    expect(r.couverture).toBeCloseTo(couverture, 9);
    expect(r.provisoire).toBe(provisoire);
    expect(r.raison).toBeNull();
  });

  it("cas C : « RAS » sans note validée → Non évalué (état manquant)", () => {
    const r = calculerScore({ etat_note: null, intensite_circulation: "moyen", densite_habitation: "moyen_eleve" }, P);
    expect(r).toMatchObject({ score: null, bande: "gris", raison: "etat_manquant", provisoire: false });
  });

  it("cas D : état seul → Non évalué (aucun autre critère)", () => {
    const r = calculerScore({ etat_note: 5 }, P);
    expect(r).toMatchObject({ score: null, bande: "gris", raison: "aucun_autre_critere" });
    expect(r.couverture).toBeCloseTo(0.55, 9);
  });

  it("le détail additionne exactement le score non arrondi", () => {
    const r = calculerScore({ etat_note: 4, intensite_circulation: "transit", densite_habitation: "moyen_bas" }, P);
    const total = r.details.reduce((s, d) => s + (d.contribution ?? 0), 0);
    expect(total).toBeCloseTo(6875 / 90, 9);
    expect(r.manquants).toEqual(["risque"]);
  });
});

describe("cas limites", () => {
  it("tout vide, ou aucune évaluation : Non évalué, couverture 0 %", () => {
    for (const e of [null, undefined, {}]) {
      const r = calculerScore(e, P);
      expect(r).toMatchObject({ score: null, bande: "gris", couverture: 0, raison: "etat_manquant" });
      expect(r.manquants).toEqual(["etat", "intensite", "densite", "risque"]);
    }
  });

  it("70 % pile : le score est calculé ; juste en dessous : non", () => {
    expect(calculerScore({ etat_note: 3, densite_habitation: "faible" }, P).score).not.toBeNull(); // 55 + 15 = 70
    expect(calculerScore({ etat_note: 3, risque_securite: 2 }, P)).toMatchObject({ score: null, raison: "couverture_insuffisante" }); // 65
    const exigeant: ParametresScore = { ...P, couverture_min: 0.71 };
    expect(calculerScore({ etat_note: 3, densite_habitation: "faible" }, exigeant).raison).toBe("couverture_insuffisante");
  });

  it("une valeur hors bornes est traitée comme manquante et signalée", () => {
    const r = calculerScore({ etat_note: 7, intensite_circulation: "transit", densite_habitation: "eleve" }, P);
    expect(r).toMatchObject({ score: null, raison: "etat_manquant" });
    expect(r.details.find((d) => d.critere === "etat")).toMatchObject({ valeur: "7", points: null, invalide: true });
    const r2 = calculerScore({ etat_note: 3, intensite_circulation: "Lotissement", densite_habitation: "eleve", risque_securite: 0 }, P);
    expect(r2.details.filter((d) => d.invalide).map((d) => d.critere)).toEqual(["intensite", "risque"]);
    expect(r2.couverture).toBeCloseTo(0.7, 9);
    expect(r2.score).toBe(arrondir((55 * 50 + 15 * 100) / 70));
  });

  it("arrondit 0,5 vers le haut et choisit la couleur sur le score arrondi", () => {
    expect(arrondir(24.5)).toBe(25);
    expect(arrondir(24.4999)).toBe(24);
    expect(arrondir(24.4999999999)).toBe(25); // bruit de virgule flottante : traité comme 24,5
    expect(arrondir(74.5)).toBe(75);
    // état 4 (75) + densité nulle (0) → 75×55/70 = 58,93 → 59 orange
    expect(calculerScore({ etat_note: 4, densite_habitation: "nul" }, P)).toMatchObject({ score: 59, bande: "orange" });
    // score brut 74,5 → arrondi 75 → rouge (et non orange)
    const p: ParametresScore = { ...P, poids: { etat: 50, intensite: 50, densite: 0, risque: 0 }, echelles: { ...P.echelles, intensite: { ...P.echelles.intensite, eleve: 74 } } };
    expect(calculerScore({ etat_note: 4, intensite_circulation: "eleve" }, p)).toMatchObject({ score: 75, bande: "rouge" });
  });

  it("les extrêmes donnent 0 et 100", () => {
    const tout = { intensite_circulation: "faible", densite_habitation: "nul", risque_securite: 1 };
    expect(calculerScore({ etat_note: 1, ...tout }, P)).toMatchObject({ score: 0, bande: "vert", provisoire: false });
    expect(calculerScore({ etat_note: 5, intensite_circulation: "transit", densite_habitation: "eleve", risque_securite: 5 }, P)).toMatchObject({ score: 100, bande: "rouge" });
  });

  it("des poids qui ne font pas 100 sont ramenés en proportion", () => {
    const p: ParametresScore = { ...P, poids: { etat: 110, intensite: 40, densite: 30, risque: 20 } };
    const a = calculerScore({ etat_note: 4, intensite_circulation: "transit", densite_habitation: "moyen_bas" }, p);
    expect(a.score).toBe(76);
    expect(a.couverture).toBeCloseTo(0.9, 9);
  });

  it("garde la version des paramètres utilisée", () => {
    expect(calculerScore({ etat_note: 3, densite_habitation: "eleve" }, { ...P, version: 4 }).version).toBe(4);
  });
});

describe("paramètres", () => {
  it("relit la version 1 enregistrée avec l'ancien format", () => {
    const v1 = {
      version: 1,
      poids: { etat: 55, intensite: 20, densite: 15, risque: 10 },
      echelles: {
        etat: [0, 25, 50, 75, 100].map((points, i) => ({ valeur: `${i + 1}`, points })),
        intensite: [0, 33, 67, 100].map((points) => ({ valeur: "x", points })),
        densite: [0, 25, 50, 75, 100].map((points) => ({ valeur: "x", points })),
        risque: [0, 25, 50, 75, 100].map((points) => ({ valeur: "x", points })),
      },
      seuils: P.seuils,
      couverture_min: "0.7",
      gestionnaires_classement: ["commune"],
    };
    expect(lireParametres(v1)).toEqual({ ...P, version: 1 });
  });

  it("refuse des paramètres incohérents", () => {
    const ok = { poids: P.poids, echelles: P.echelles, seuils: P.seuils, couverture_min: 0.7, gestionnaires_classement: ["commune"] };
    expect(SchemaParametres.safeParse(ok).success).toBe(true);
    expect(SchemaParametres.safeParse({ ...ok, poids: { ...P.poids, etat: 0 } }).success).toBe(false);
    expect(SchemaParametres.safeParse({ ...ok, echelles: { ...P.echelles, etat: { ...P.echelles.etat, 3: 120 } } }).success).toBe(false);
    expect(SchemaParametres.safeParse({ ...ok, seuils: seuilsDepuisDebuts(30, 20, 80) }).success).toBe(false);
    expect(SchemaParametres.safeParse({ ...ok, seuils: seuilsDepuisDebuts(20, 40, 80) }).success).toBe(true);
    expect(SchemaParametres.safeParse({ ...ok, couverture_min: 1.2 }).success).toBe(false);
    expect(lireParametres({ version: 9, poids: {}, echelles: {}, seuils: [], couverture_min: 0.7, gestionnaires_classement: [] })).toBeNull();
  });
});

describe("classement communal", () => {
  const ev = (e: Partial<Evaluation>) => ({ etat_note: null, intensite_circulation: null, densite_habitation: null, risque_securite: null, ...e }) as Evaluation;
  const f = (id: string, g: FicheVoirie["gestionnaire"], e: Partial<Evaluation> | null, statut: FicheVoirie["statutFiche"] = "importe_excel") =>
    ({ id, nom: id, categorie: "voirie", parentId: null, gestionnaire: g, gestionnaireDetail: null, statutFiche: statut, anciennesCommunes: [], longueurM: null, aTrace: true, evaluation: e && ev(e), origineExcel: [], sousSections: [] }) as FicheVoirie;
  const fiches = [
    f("Basse", "commune", { etat_note: 1, densite_habitation: "faible", intensite_circulation: "faible" }),
    f("Haute", "commune", { etat_note: 5, densite_habitation: "eleve", intensite_circulation: "transit" }),
    f("Nationale", "spw", { etat_note: 5, densite_habitation: "eleve", intensite_circulation: "transit" }),
    f("À confirmer", "inconnu", { etat_note: 4, densite_habitation: "eleve" }),
    f("Suggestion seule", "commune", { densite_habitation: "eleve" }),
    f("Disparue", "commune", { etat_note: 5, densite_habitation: "eleve" }, "n_existe_plus"),
    f("Sans donnée", "commune", null),
  ];

  it("exclut SPW et autres gestionnaires par défaut, sans les perdre", () => {
    const c = classer(fiches, P, { exclureHorsCommune: true });
    expect(c.classees.map((l) => [l.rang, l.nom])).toEqual([[1, "Haute"], [2, "À confirmer"], [3, "Basse"]]);
    expect(c.horsClassement.map((l) => l.nom)).toEqual(["Nationale"]);
    expect(c.nonEvaluees.map((l) => l.nom)).toEqual(["Suggestion seule"]);
  });

  it("les inclut si l'exclusion est décochée ; égalité = même rang", () => {
    const c = classer(fiches, P, { exclureHorsCommune: false });
    expect(c.classees.slice(0, 2).map((l) => [l.rang, l.nom])).toEqual([[1, "Haute"], [1, "Nationale"]]);
    expect(c.classees[2].rang).toBe(3);
    expect(c.horsClassement).toHaveLength(0);
  });
});
