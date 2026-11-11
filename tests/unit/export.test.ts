// Export CSV (phase 7).
import { describe, expect, it } from "vitest";
import type { Evaluation, FicheVoirie } from "@/lib/donnees/types";
import { cellule, nomFichier, versCsv } from "@/lib/export/csv";
import { PARAMETRES_PAR_DEFAUT as P } from "@/lib/priority/defaults";

const ev = (e: Partial<Evaluation>) =>
  ({ etat_note: null, intensite_circulation: null, densite_habitation: null, risque_securite: null, ampleur_travaux: null, echeance_brute: null,
    annee_prevue: null, annee_realisation: null, echeance_estimee: null, mobilite_note: null, particularites: null, updated_at: "2026-11-11T21:00:00Z", ...e }) as Evaluation;
const fiche = (f: Partial<FicheVoirie>): FicheVoirie =>
  ({ id: "n:x", nom: "X", categorie: "voirie", parentId: null, gestionnaire: "commune", gestionnaireDetail: null, statutFiche: "importe_excel",
    anciennesCommunes: ["Pepinster"], longueurM: 312.5, aTrace: true, evaluation: null, origineExcel: [], sousSections: [], ...f }) as FicheVoirie;

describe("export CSV", () => {
  it("protège les cellules : guillemets, séparateur, retours à la ligne, formules", () => {
    expect(cellule(null)).toBe("");
    expect(cellule("Rue du Biez")).toBe("Rue du Biez");
    expect(cellule("cul de sac; école")).toBe('"cul de sac; école"');
    expect(cellule('dit "le Fort"')).toBe('"dit ""le Fort"""');
    expect(cellule("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(cellule("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(cellule("+32 87")).toBe("'+32 87");
    expect(cellule(312.5)).toBe("312,5");
    expect(cellule(true)).toBe("oui");
  });

  it("produit un fichier lisible par Excel (BOM, « ; », une ligne par voirie)", () => {
    const csv = versCsv(
      [
        fiche({ id: "n:rue emile vandervelde", nom: "Rue Emile Vandervelde", evaluation: ev({ etat_note: 5, intensite_circulation: "transit", densite_habitation: "moyen_eleve", particularites: "! Fond de coffre" }) }),
        fiche({ id: "s:134", nom: "Soiron-Centre Place du bac", categorie: "section", parentId: "n:soiron centre", longueurM: null }),
      ],
      { parametres: { ...P, version: 2 }, nomParent: () => "Soiron-Centre" },
    );
    expect(csv.startsWith("﻿")).toBe(true);
    const lignes = csv.slice(1).split("\r\n").filter(Boolean);
    expect(lignes).toHaveLength(3);
    const entetes = lignes[0].split(";");
    const v = Object.fromEntries(lignes[1].split(";").map((x, i) => [entetes[i], x]));
    expect(v).toMatchObject({ Nom: "Rue Emile Vandervelde", Gestionnaire: "Commune", "État (1 à 5)": "5", Score: "96", Priorité: "Priorité très élevée", Provisoire: "oui", "Critères renseignés (%)": "90", "Version des paramètres": "2", Particularités: "! Fond de coffre", "Longueur (m)": "312,5", "Dernière modification": "2026-11-11" });
    const s = Object.fromEntries(lignes[2].split(";").map((x, i) => [entetes[i], x]));
    expect(s).toMatchObject({ Type: "Partie de rue", "Partie de": "Soiron-Centre", Score: "", Priorité: "Non évalué", "Pourquoi pas de score": "état de la chaussée non noté" });
  });

  it("ajoute le rang pour l'export du classement", () => {
    const csv = versCsv([fiche({})], { parametres: P, rang: () => 7 });
    expect(csv.slice(1).split("\r\n")[1].startsWith("7;n:x;X;")).toBe(true);
  });

  it("nomme le fichier avec la date", () => {
    expect(nomFichier("voiries-pepinster", new Date(2026, 10, 11))).toBe("voiries-pepinster-2026-11-11.csv");
  });
});
