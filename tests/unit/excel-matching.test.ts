// Tests de la phase 3 : lecture de l'Excel, normalisation, propositions, décisions.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normaliserLigne, proposerOrdre } from "@/lib/excel/normaliser";
import type { ExcelBrut, FicheExcel, LigneBrute } from "@/lib/excel/types";
import type { DonneesVoiries, VoirieLogique } from "@/lib/geo/types";
import { cle, coeur, proposer, similarite } from "@/lib/matching/apparier";
import { statutDe, type Decision } from "@/lib/matching/decisions";

const racine = join(__dirname, "..", "..");
const brut = JSON.parse(readFileSync(join(racine, "data", "excel", "feuil1_raw.json"), "utf8")) as ExcelBrut;
const fiches = brut.lignes.map(normaliserLigne);
const fiche = (ligne: number) => fiches.find((f) => f.ligne === ligne)!;

describe("lecture de Feuil1", () => {
  it("lit exactement 180 lignes de voiries, sans la légende", () => {
    expect(brut.lignes).toHaveLength(180);
    expect(brut.lignes.every((l) => l.ligne >= 2 && l.ligne <= 183)).toBe(true);
    expect(brut.lignes.map((l) => l.ligne)).not.toContain(151);
    expect(brut.lignes.map((l) => l.ligne)).not.toContain(169);
  });

  it("concorde avec l'audit indépendant de la phase 0 (valeurs et couleurs)", () => {
    const csv = readFileSync(join(racine, "docs", "annexes", "audit_feuil1.csv"), "utf8").replace(/^﻿/, "");
    const [entete, ...lignes] = csv.trim().split(/\r?\n/);
    const cols = entete.split(";");
    const idx = (n: string) => cols.indexOf(n);
    expect(lignes).toHaveLength(180);
    lignes.forEach((l, i) => {
      const v = l.split(";");
      const b = brut.lignes[i];
      expect(String(b.ligne)).toBe(v[idx("ligne")]);
      expect(String(b.cellules.A.valeur)).toBe(v[idx("voirie_brute")]);
      expect(b.cellules.B.valeur ?? "").toBe(v[idx("etat_brut")]);
      if (v[idx("couleur_etat")].startsWith("#")) expect(b.cellules.B.fond).toBe(v[idx("couleur_etat")]);
    });
  });

  it("compte 84 RAS, 17 SPW et 79 états vides", () => {
    const etats = brut.lignes.map((l) => l.cellules.B.valeur);
    expect(etats.filter((e) => e === "RAS")).toHaveLength(84);
    expect(etats.filter((e) => e === "SPW")).toHaveLength(17);
    expect(etats.filter((e) => e === null)).toHaveLength(79);
  });
});

describe("normalisation", () => {
  it("ne crée jamais de note d'état ni de risque (validation requise)", () => {
    expect(fiches.every((f) => f.etatNote === null)).toBe(true);
    expect(fiches.every((f) => f.risqueSecurite === null)).toBe(true);
  });

  it("suggère les notes d'après la couleur (D1, D2, D11)", () => {
    const n = (k: number | null) => fiches.filter((f) => f.etatNoteSuggeree === k).length;
    expect([n(1), n(2), n(3), n(4), n(5)]).toEqual([92, 11, 14, 16, 4]);
    expect(fiche(14).etatNoteSuggeree).toBe(4); // rouge vif (D2)
    expect(fiche(53).etatNoteSuggeree).toBeNull(); // vert #00B050 (D11)
    expect(fiche(18).etatNoteSuggeree).toBeNull(); // jaune (D11)
  });

  it("garde RAS comme mention, sans note", () => {
    expect(fiche(2).mentionEtatSource).toBe("RAS");
    expect(fiche(2).etatNote).toBeNull();
  });

  it("traite SPW comme gestionnaire", () => {
    expect(fiches.filter((f) => f.gestionnaire === "spw")).toHaveLength(17);
    expect(fiches.filter((f) => f.mentionEtatSource === "SPW")).toHaveLength(17);
  });

  it("applique Lotissement = faible (D3) en le traçant", () => {
    const f = fiche(5);
    expect(f.typeVoirieSource).toBe("Lotissement");
    expect(f.intensite).toBe("faible");
    expect(f.journal.some((e) => e.champ === "intensite" && e.regle.includes("D3"))).toBe(true);
  });

  it("applique les règles d'échéance (D5)", () => {
    expect(fiche(17).anneeRealisation).toBe(2023); // année passée
    expect(fiche(24).anneePrevue).toBe(2026);
    expect(fiche(13).echeanceEstimee).toBe(2030); // « 5 ans » depuis mai 2025
    expect(fiche(37).echeanceEstimee).toBeNull(); // « + de 5 ans »
    expect(fiche(37).echeanceEstimeeRegle).toContain("après 2030");
    expect(fiche(54).echeanceBrute).toBe("urgent");
    expect(fiche(32).anneePrevue).toBeNull(); // plage « 2025-2026 » : brut seulement
  });

  it("applique les cas particuliers (D7)", () => {
    expect(fiche(44).statut).toBe("n_existe_plus");
    expect(fiche(94).gestionnaire).toBe("autre");
    expect(fiche(73).etiquettes).toContain("chantier_infrabel");
    expect(fiche(86).etiquettes).toContain("chantier_infrabel");
  });

  it("corrige les fautes de travaux en gardant le brut", () => {
    const f = fiches.find((x) => x.ampleurTravauxBrut === "Racalage/pose complet")!;
    expect(f.ampleurTravaux).toBe("raclage_complet");
  });

  it("propose l'ordre des noms sans les remplacer", () => {
    expect(proposerOrdre("Hospice Rue de l'")).toBe("Rue de l'Hospice");
    expect(proposerOrdre("Biez Rue du")).toBe("Rue du Biez");
    expect(proposerOrdre("Bouhais")).toBeNull();
    expect(fiche(15).nomNettoye).toBe("Biez Rue du");
  });
});

describe("propositions de correspondance", () => {
  const v = (id: string, nom: string, indiceSpw: VoirieLogique["indiceSpw"] = "non"): VoirieLogique => ({
    id, nom, nomNormalise: null, categorie: "voirie", types: [], segments: [], ways: [], longueurM: 100,
    traverseLimite: false, sections: ["Pepinster"], partie: null, alerte: null, distanceAutreGroupeM: null,
    refOsm: [], indiceSpw, refsSpw: [],
  });
  const f = (ligne: number, nom: string, extra: Partial<FicheExcel> = {}): FicheExcel =>
    ({ ...normaliserLigne({ ligne, bloc: "A_communal", cellules: Object.fromEntries("ABCDEFGHI".split("").map((c) => [c, { valeur: c === "A" ? nom : null, fond: null }])) } as LigneBrute), ...extra });

  it("propose (sans décider) une correspondance exacte et réordonnée", () => {
    const p = proposer([f(2, "Hezée"), f(3, "Biez Rue du")], [v("a", "Hezée"), v("b", "Rue du Biez")]);
    expect(p.map((x) => [x.methode, x.confiance, x.propositionId])).toEqual([
      ["exact", "forte", "a"],
      ["exact_reordonne", "forte", "b"],
    ]);
  });

  it("ne donne pas de confiance forte quand deux voiries portent le nom", () => {
    const p = proposer([f(2, "Paix Rue de la")], [v("a", "Rue de la Paix"), v("b", "Rue de la Paix")]);
    expect(p[0].confiance).toBe("moyenne");
    expect(p[0].candidats).toHaveLength(2);
  });

  it("signale les noms en double dans l'Excel", () => {
    const p = proposer([f(29, "Chemin X"), f(176, "Chemin X")], [v("a", "Chemin X")]);
    expect(p.every((x) => x.confiance !== "forte")).toBe(true);
  });

  it("signale un désaccord de gestionnaire", () => {
    const p = proposer([f(2, "Hezée", { gestionnaire: "spw" })], [v("a", "Hezée", "non")]);
    expect(p[0].confiance).toBe("moyenne");
    expect(p[0].alertes.join()).toContain("SPW");
  });

  it("reconnaît les noms proches et les équivalences", () => {
    expect(cle("Avenue Albert Ier")).toBe(cle("Avenue Albert 1er"));
    expect(coeur("Ruelle du Koreux")).toBe("koreux");
    expect(coeur("La Saute")).toBe("saute");
    expect(similarite("leon lepas", "leon le pas")).toBe(1);
  });

  it("propose la voirie mère pour une partie de rue", () => {
    const p = proposer([f(20, "Bouhaye inférieure")], [v("a", "Bouhaye"), v("b", "Route de Bouhaye-sur-mer")]);
    expect(p[0].methode).toBe("section");
    expect(p[0].candidats.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("décisions humaines", () => {
  const p = { ligne: 2, nomExcel: "X", methode: "exact" as const, confiance: "forte" as const, candidats: [], propositionId: "a", alertes: [] };
  const d = (decision: Decision["decision"], voirieId: string | null = null): Decision => ({ ligne: 2, decision, voirieId, commentaire: null, source: "test", date: "" });

  it("ne lie rien sans décision, même en confiance forte", () => {
    expect(statutDe(fiche(2), p, undefined)).toMatchObject({ statut: "a_valider", voirieId: null });
  });

  it("applique chaque type de décision", () => {
    expect(statutDe(fiche(2), p, d("OK", "a")).statut).toBe("valide");
    expect(statutDe(fiche(2), p, d("AUTRE", "z"))).toMatchObject({ statut: "valide", voirieId: "z" });
    expect(statutDe(fiche(2), p, d("SECTION", "a")).statut).toBe("section_a_definir");
    expect(statutDe(fiche(2), p, d("INTROUVABLE")).statut).toBe("introuvable_osm");
    expect(statutDe(fiche(2), p, d("NON"))).toMatchObject({ statut: "rejete", voirieId: null });
  });

  it("utilise des identifiants de voirie existants dans les propositions réelles", () => {
    const geo = JSON.parse(readFileSync(join(racine, "data", "geo", "voiries.json"), "utf8")) as DonneesVoiries;
    const ids = new Set(geo.voiries.map((x) => x.id));
    const reelles = proposer(fiches, geo.voiries);
    expect(reelles).toHaveLength(180);
    for (const r of reelles) for (const c of r.candidats) expect(ids.has(c.id)).toBe(true);
  });
});
