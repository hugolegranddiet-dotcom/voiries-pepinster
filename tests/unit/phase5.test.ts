// Phase 5 : liste (recherche, filtres, tri), formulaire de fiche, styles de carte.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apparenceDe, COULEURS_BANDE, styleSegment, stylesSelection } from "@/components/carte/styles-carte";
import { PARAMETRES_PAR_DEFAUT as P } from "@/lib/priority/defaults";
import { COULEURS_ETAT } from "@/lib/donnees/etat";
import { ModificationFiche, ModificationVoirie } from "@/lib/db/schemas";
import { differences, versFormulaire } from "@/lib/donnees/formulaire";
import type { Evaluation, FicheVoirie } from "@/lib/donnees/types";
import type { SegmentProps } from "@/lib/geo/types";
import { correspond, filtrer, trier, TYPES_PAR_DEFAUT, typeDeFiche, versLigne, type Filtres } from "@/lib/voiries/liste";

function evaluation(e: Partial<Evaluation> = {}): Evaluation {
  return {
    road_id: "x", etat_note: null, etat_note_suggeree: null, etat_note_suggeree_origine: null, mention_etat_source: "vide",
    type_habitat_brut: null, type_habitat: null, type_voirie_source: null, intensite_circulation: null, densite_habitation: null,
    ampleur_travaux_brut: null, ampleur_travaux: null, echeance_brute: null, annee_prevue: null, annee_realisation: null,
    echeance_estimee: null, echeance_estimee_regle: null, mobilite_note: null, risque_securite: null, particularites: null,
    etiquettes: [], statut_validation: "non_valide", source_excel_ligne: null, updated_at: "2026-11-11T00:00:00Z", ...e,
  };
}

function fiche(f: Partial<FicheVoirie> = {}): FicheVoirie {
  return {
    id: "n:rue du biez", nom: "Rue du Biez", categorie: "voirie", parentId: null, gestionnaire: "commune",
    gestionnaireDetail: null, statutFiche: "importe_excel", anciennesCommunes: ["Pepinster"], longueurM: 300,
    aTrace: true, evaluation: null, origineExcel: [], sousSections: [], ...f,
  };
}

const filtresBase: Filtres = { recherche: "", types: TYPES_PAR_DEFAUT, gestionnaires: new Set(), statuts: new Set(), etats: new Set(), bandes: new Set() };

describe("liste des voiries", () => {
  const lignes = [
    fiche({ id: "a", nom: "Rue du Biez", evaluation: evaluation({ etat_note: 4 }) }),
    fiche({ id: "b", nom: "Rue de l'Église", anciennesCommunes: ["Soiron"], gestionnaire: "spw" }),
    fiche({ id: "c", nom: "Bouhaye inférieure", categorie: "section", parentId: "n:bouhaye", aTrace: false }),
    fiche({ id: "d", nom: null, categorie: "chemin" }),
    fiche({ id: "e", nom: "Sentier des Écoliers", categorie: "chemin", evaluation: evaluation({ etat_note: 2 }) }),
    fiche({ id: "f", nom: null, categorie: "acces" }),
  ].map((x) => versLigne(x));

  it("classe chaque fiche dans le bon type (les voies sans nom à part)", () => {
    expect(lignes.map((l) => l.type)).toEqual(["voiries", "voiries", "sections", "sans_nom", "chemins", "acces"]);
    expect(typeDeFiche(fiche({ nom: null, categorie: "voirie" }))).toBe("sans_nom");
    expect(lignes[3].nom).toBe("Chemin sans nom");
  });

  it("cherche sans accents, sans casse et dans n'importe quel ordre", () => {
    expect(correspond(lignes[0], "biez rue du")).toBe(true);
    expect(correspond(lignes[1], "EGLISE")).toBe(true);
    expect(correspond(lignes[1], "soiron")).toBe(true); // ancienne commune
    expect(correspond(lignes[0], "biez soiron")).toBe(false);
  });

  it("par défaut, ne montre que les voiries nommées et les parties de rue", () => {
    expect(filtrer(lignes, filtresBase).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("combine les filtres", () => {
    expect(filtrer(lignes, { ...filtresBase, gestionnaires: new Set(["spw"]) }).map((l) => l.id)).toEqual(["b"]);
    expect(filtrer(lignes, { ...filtresBase, etats: new Set(["non_note"] as const) }).map((l) => l.id)).toEqual(["b", "c"]);
    expect(filtrer(lignes, { ...filtresBase, types: new Set(["chemins", "sans_nom"]), etats: new Set(["non_note"] as const) }).map((l) => l.id)).toEqual(["d"]);
    expect(filtrer(lignes, { ...filtresBase, recherche: "eglise", gestionnaires: new Set(["commune"]) })).toHaveLength(0);
  });

  it("filtre par note d'état (plusieurs notes possibles)", () => {
    const tous = { ...filtresBase, types: new Set(["voiries", "sections", "chemins", "sans_nom", "acces"] as const) };
    expect(filtrer(lignes, { ...tous, etats: new Set(["4"] as const) }).map((l) => l.id)).toEqual(["a"]);
    expect(filtrer(lignes, { ...tous, etats: new Set(["4", "2"] as const) }).map((l) => l.id)).toEqual(["a", "e"]);
  });

  it("trie, en gardant toujours les valeurs vides à la fin", () => {
    const tous = { ...filtresBase, types: new Set(["voiries", "sections", "chemins", "sans_nom", "acces"] as const) };
    const vis = filtrer(lignes, tous);
    expect(trier(vis, "etatNote", "desc").slice(0, 2).map((l) => l.id)).toEqual(["a", "e"]);
    expect(trier(vis, "etatNote", "asc").slice(0, 2).map((l) => l.id)).toEqual(["e", "a"]);
    expect(trier(vis, "nom", "asc")[0].nom).toBe("Accès sans nom");
  });

  it("liste les données manquantes", () => {
    expect(lignes[0].manquants).toEqual(["circulation", "densité", "risque"]);
    expect(lignes[1].manquants).toContain("état");
  });
});

describe("formulaire de fiche", () => {
  const f = fiche({ evaluation: evaluation({ etat_note_suggeree: 4, particularites: "Ecole, trottois HS" }) });

  it("n'envoie que les champs modifiés", () => {
    const avant = versFormulaire(f);
    expect(differences(avant, { ...avant })).toEqual({});
    expect(differences(avant, { ...avant, etat_note: "4" })).toEqual({ evaluation: { etat_note: 4 } });
    expect(differences(avant, { ...avant, gestionnaire: "spw", risque_securite: "3" })).toEqual({
      voirie: { gestionnaire: "spw" },
      evaluation: { risque_securite: 3 },
    });
  });

  it("vider un champ l'envoie à NULL (inconnu), jamais à 0", () => {
    const avant = versFormulaire(f);
    expect(differences(avant, { ...avant, particularites: "  " })).toEqual({ evaluation: { particularites: null } });
  });

  it("la note suggérée n'est jamais recopiée seule dans la note d'état", () => {
    expect(versFormulaire(f).etat_note).toBe("");
  });

  it("les schémas refusent les valeurs hors domaine", () => {
    expect(ModificationVoirie.safeParse({ gestionnaire: "spw" }).success).toBe(true);
    expect(ModificationVoirie.safeParse({ gestionnaire: "province" }).success).toBe(false);
    expect(ModificationVoirie.safeParse({ inconnu: 1 }).success).toBe(false);
    expect(ModificationFiche.safeParse({}).success).toBe(false);
    expect(ModificationFiche.safeParse({ evaluation: { etat_note: 6 } }).success).toBe(false);
    expect(ModificationFiche.safeParse({ evaluation: { etat_note: 3 }, voirie: { statut_fiche: "valide" } }).success).toBe(true);
  });
});

describe("une voirie, une seule couleur pour tous ses segments", () => {
  const racine = join(__dirname, "..", "..");
  const fichier = join(racine, "data", "geo", "voies.geojson");
  const segments: SegmentProps[] = existsSync(fichier)
    ? (JSON.parse(readFileSync(fichier, "utf8")) as { features: Array<{ properties: SegmentProps }> }).features.map((x) => x.properties)
    : [];

  const couleurs = (rid: string, f: FicheVoirie, selection = false) =>
    new Set(
      segments
        .filter((s) => s.rid === rid)
        .map((s) => (selection ? stylesSelection(s, apparenceDe(f, s.spw, P)).trait : styleSegment(s, apparenceDe(f, s.spw, P))).color),
    );

  it.runIf(segments.length > 0).each(["n:grande fontaine", "n:rue du paire", "n:rue neuve"])("%s", (rid) => {
    const n = segments.filter((s) => s.rid === rid).length;
    expect(n).toBeGreaterThan(1);
    const sansNote = fiche({ id: rid, evaluation: evaluation({ etat_note_suggeree: 4, intensite_circulation: "transit" }) });
    const notee = fiche({ id: rid, evaluation: evaluation({ etat_note: 4, intensite_circulation: "transit", densite_habitation: "moyen_bas" }) });
    expect([...couleurs(rid, sansNote)]).toEqual([COULEURS_BANDE.gris]); // une suggestion ne colore pas
    expect([...couleurs(rid, notee)]).toEqual([COULEURS_BANDE.rouge]); // score 76 : tout rouge, ensemble
    expect([...couleurs(rid, notee, true)]).toEqual([COULEURS_BANDE.rouge]); // sélection : même couleur, avec contour
  });

  it.runIf(segments.length > 0)("mode « état » : tous les segments prennent la couleur de la note", () => {
    const rid = "n:rue du paire";
    const notee = fiche({ id: rid, evaluation: evaluation({ etat_note: 4 }) }); // pas de score (état seul), mais une note
    const traits = segments.filter((s) => s.rid === rid);
    expect(new Set(traits.map((s) => styleSegment(s, apparenceDe(notee, s.spw, P, "etat")).color))).toEqual(new Set([COULEURS_ETAT["4"]]));
    expect(new Set(traits.map((s) => styleSegment(s, apparenceDe(notee, s.spw, P, "priorite")).color))).toEqual(new Set([COULEURS_BANDE.gris]));
    const sansNote = fiche({ id: rid, evaluation: evaluation({ etat_note_suggeree: 4 }) });
    expect(styleSegment(traits[0], apparenceDe(sansNote, false, P, "etat")).color).toBe(COULEURS_ETAT.non_note);
  });

  it("SPW : pointillés, jamais une couleur forcée", () => {
    const s: SegmentProps = { sid: "1", rid: "r", w: 1, hw: "primary", cat: "voirie", clip: false, spw: true };
    const ev = evaluation({ etat_note: 3, intensite_circulation: "eleve", densite_habitation: "moyen_eleve", risque_securite: 3 });
    const spw = styleSegment(s, apparenceDe(fiche({ gestionnaire: "spw", evaluation: ev }), true, P));
    expect(spw.color).toBe(COULEURS_BANDE.orange); // score 57, comme une voirie communale
    expect(spw.dashArray).toBeTruthy();
    const commune = styleSegment(s, apparenceDe(fiche({ gestionnaire: "commune", evaluation: ev }), true, P));
    expect(commune.color).toBe(spw.color);
    expect(commune.dashArray).toBeUndefined(); // gestionnaire connu : l'indice SPW ne compte plus
  });
});
