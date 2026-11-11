// Phase 3 — de l'Excel à la carte, en passant par une validation humaine.
//   1. normalise les 180 lignes (data/excel/feuil1_normalise.json)
//   2. propose des correspondances (data/matching/propositions.json)
//   3. applique UNIQUEMENT les décisions humaines (data/matching/decisions.json)
//   4. écrit le fichier de validation (data/matching/validation_correspondances.xlsx)
//   5. écrit MATCHING_REPORT.md (les données vont ensuite en base : npm run db:seed)

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { normaliserLigne } from "@/lib/excel/normaliser";
import type { ExcelBrut, FicheExcel } from "@/lib/excel/types";
import type { DonneesVoiries, VoirieLogique } from "@/lib/geo/types";
import { proposer, type Proposition } from "@/lib/matching/apparier";
import {
  CHOIX_DECISION,
  statutDe,
  type Correspondance,
  type Decision,
  type DonneesExcelCarte,
} from "@/lib/matching/decisions";

const URL_CARTE = "http://localhost:3000/carte?voirie=";
const LIBELLE_METHODE: Record<string, string> = {
  exact: "nom identique",
  exact_reordonne: "nom identique une fois remis dans l'ordre",
  approchant: "nom proche",
  section: "partie d'une rue",
  aucun: "aucune voirie trouvée",
};
const ORDRE_CONFIANCE = { forte: 0, moyenne: 1, faible: 2, aucune: 3 } as const;

async function lireJson<T>(chemin: string): Promise<T> {
  return JSON.parse(await readFile(chemin, "utf8")) as T;
}

async function main() {
  const brut = await lireJson<ExcelBrut>(join("data", "excel", "feuil1_raw.json"));
  const geo = await lireJson<DonneesVoiries>(join("data", "geo", "voiries.json"));
  const voirieParId = new Map(geo.voiries.map((v) => [v.id, v]));

  // 1. Normalisation
  const fiches = brut.lignes.map(normaliserLigne);
  await mkdir(join("data", "excel"), { recursive: true });
  await writeFile(join("data", "excel", "feuil1_normalise.json"), JSON.stringify(fiches, null, 1));

  // 2. Propositions
  const propositions = proposer(fiches, geo.voiries);
  await mkdir(join("data", "matching"), { recursive: true });
  await writeFile(join("data", "matching", "propositions.json"), JSON.stringify(propositions, null, 1));

  // 3. Décisions humaines
  const fichierDecisions = join("data", "matching", "decisions.json");
  const decisions: Decision[] = existsSync(fichierDecisions) ? await lireJson<Decision[]>(fichierDecisions) : [];
  const decisionParLigne = new Map(decisions.map((d) => [d.ligne, d]));
  const propositionParLigne = new Map(propositions.map((p) => [p.ligne, p]));
  const correspondances: Correspondance[] = fiches.map((f) =>
    statutDe(f, propositionParLigne.get(f.ligne)!, decisionParLigne.get(f.ligne)),
  );
  for (const c of correspondances) {
    if (c.voirieId && !voirieParId.has(c.voirieId)) {
      throw new Error(`Ligne ${c.ligne} : la voirie « ${c.voirieId} » n'existe pas sur la carte.`);
    }
  }

  // 4. Fichier de validation
  await ecrireClasseur(fiches, propositions, decisionParLigne, geo.voiries);

  // 5. Données de la carte + rapport
  const carte: DonneesExcelCarte = {
    meta: {
      sha256Excel: brut.source.sha256,
      genereLe: new Date().toISOString(),
      aValider: correspondances.filter((c) => c.statut === "a_valider").length,
      validees: correspondances.filter((c) => c.statut === "valide").length,
    },
    parVoirie: {},
  };
  const entree = (id: string) =>
    (carte.parVoirie[id] ??= { validees: [], sections: [], propositions: [] });
  for (const f of fiches) {
    const c = correspondances.find((x) => x.ligne === f.ligne)!;
    const p = propositionParLigne.get(f.ligne)!;
    // Le journal détaillé reste dans data/excel ; la carte n'en a pas besoin.
    if (c.statut === "valide" && c.voirieId) entree(c.voirieId).validees.push({ ...f, journal: [] });
    else if (c.statut === "section_a_definir" && c.voirieId) entree(c.voirieId).sections.push({ ligne: f.ligne, nom: f.nomNettoye });
    else if (c.statut === "a_valider" && p.propositionId) {
      entree(p.propositionId).propositions.push({ ligne: f.ligne, nomExcel: f.nomNettoye, methode: p.methode, confiance: p.confiance });
    }
  }
  void carte; // résumé utilisé pour le rapport ; la carte lit désormais la base
  await writeFile(join("data", "matching", "correspondances.json"), JSON.stringify(correspondances, null, 1));
  await writeFile("MATCHING_REPORT.md", rapport(fiches, propositions, correspondances, geo, decisions));

  const compte = (s: string) => correspondances.filter((c) => c.statut === s).length;
  console.log(`✅ ${fiches.length} lignes : ${compte("valide")} validées, ${compte("a_valider")} à valider, ${compte("section_a_definir")} sections, ${compte("introuvable_osm")} introuvables, ${compte("rejete")} rejetées, ${compte("n_existe_plus")} n'existe plus.`);
  console.log("   → data/matching/validation_correspondances.xlsx · MATCHING_REPORT.md");
}

async function ecrireClasseur(
  fiches: FicheExcel[],
  propositions: Proposition[],
  decisions: Map<number, Decision>,
  voiries: VoirieLogique[],
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Voiries Pepinster";
  const TEAL = "FF0D6B69";
  const entete = (ws: ExcelJS.Worksheet) => {
    const r = ws.getRow(1);
    r.font = { bold: true, color: { argb: "FFFFFFFF" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    r.alignment = { vertical: "middle", wrapText: true };
    r.height = 32;
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  // Feuille 1 : à valider
  const ws = wb.addWorksheet("À valider");
  ws.columns = [
    { header: "Ligne Excel", key: "ligne", width: 8 },
    { header: "Nom dans l'Excel", key: "nom", width: 30 },
    { header: "Gestionnaire (Excel)", key: "gest", width: 12 },
    { header: "Proposition sur la carte", key: "prop", width: 30 },
    { header: "Ancienne commune", key: "sec", width: 16 },
    { header: "Pourquoi", key: "meth", width: 26 },
    { header: "Confiance", key: "conf", width: 10 },
    { header: "Remarques", key: "rem", width: 42 },
    { header: "Autres possibilités", key: "autres", width: 30 },
    { header: "Voir sur la carte", key: "lien", width: 16 },
    { header: "DÉCISION", key: "dec", width: 13 },
    { header: "Si AUTRE : nom ou identifiant", key: "autre", width: 28 },
    { header: "Commentaire", key: "com", width: 30 },
    { header: "Identifiant proposé", key: "id", width: 24 },
  ];
  entete(ws);
  const tri = [...propositions].sort(
    (a, b) => ORDRE_CONFIANCE[a.confiance] - ORDRE_CONFIANCE[b.confiance] || a.ligne - b.ligne,
  );
  const ficheParLigne = new Map(fiches.map((f) => [f.ligne, f]));
  const couleurConfiance = { forte: "FFE3F1EF", moyenne: "FFFFF3D1", faible: "FFFBE3D3", aucune: "FFF1F1F1" };
  for (const p of tri) {
    const f = ficheParLigne.get(p.ligne)!;
    const m = p.candidats[0];
    const d = decisions.get(p.ligne);
    const row = ws.addRow({
      ligne: p.ligne,
      nom: f.nomNettoye,
      gest: f.gestionnaire === "spw" ? "SPW" : f.gestionnaire === "autre" ? "autre" : "commune",
      prop: m ? m.nom : "—",
      sec: m ? m.sections.join(", ") : "",
      meth: LIBELLE_METHODE[p.methode],
      conf: p.confiance,
      rem: p.alertes.join(" · "),
      autres: p.candidats.slice(1).map((c) => `${c.nom} (${c.sections.join("/") || "?"})`).join(" ; "),
      lien: m ? { text: "ouvrir", hyperlink: URL_CARTE + encodeURIComponent(m.id) } : "",
      dec: d?.decision ?? null,
      autre: d?.decision === "AUTRE" ? d.voirieId : null,
      com: d?.commentaire ?? null,
      id: m?.id ?? "",
    });
    row.alignment = { vertical: "top", wrapText: true };
    row.getCell("conf").fill = { type: "pattern", pattern: "solid", fgColor: { argb: couleurConfiance[p.confiance] } };
    if (m) row.getCell("lien").font = { color: { argb: TEAL }, underline: true };
    row.getCell("dec").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEA" } };
    row.getCell("dec").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${CHOIX_DECISION.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Valeur non prévue",
      error: `Choisir : ${CHOIX_DECISION.join(", ")}`,
    };
    row.getCell("id").font = { color: { argb: "FF8A9499" } };
  }
  ws.autoFilter = { from: "A1", to: "N1" };

  // Feuille 2 : mode d'emploi
  const aide = wb.addWorksheet("Mode d'emploi");
  aide.getColumn(1).width = 110;
  [
    "COMMENT VALIDER LES CORRESPONDANCES",
    "",
    "Chaque ligne relie une ligne de l'Excel d'origine à une voirie de la carte (OpenStreetMap).",
    "Rien n'est appliqué tant que la colonne DÉCISION est vide.",
    "",
    "Dans la colonne DÉCISION, choisir dans la liste :",
    "  OK           la proposition est la bonne voirie",
    "  NON          la proposition est fausse (la ligne restera sans voirie)",
    "  AUTRE        une autre voirie : écrire son nom exact ou son identifiant dans la colonne suivante (voir l'onglet « Voiries de la carte »)",
    "  SECTION      la ligne décrit une partie de la voirie proposée (son tracé sera défini plus tard)",
    "  INTROUVABLE  la voirie n'existe pas sur la carte (elle aura une fiche sans tracé)",
    "",
    "Astuce : les lignes « forte » sont en haut. Pour toutes les valider d'un coup, sélectionner leurs cases DÉCISION,",
    "taper OK puis appuyer sur Ctrl + Entrée (Mac : Ctrl + Retour) pour remplir toute la sélection.",
    "",
    "Le lien « ouvrir » montre la voirie sur la carte : l'application doit être lancée (npm run dev).",
    "",
    "Confiance : forte = nom identique et une seule voirie possible ; moyenne = à regarder ; faible = partie de rue ;",
    "aucune = rien trouvé (chemin absent d'OpenStreetMap, nom très différent…).",
  ].forEach((t, i) => {
    const c = aide.getCell(`A${i + 1}`);
    c.value = t;
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: TEAL } };
  });

  // Feuille 3 : voiries de la carte (pour la décision AUTRE)
  const vs = wb.addWorksheet("Voiries de la carte");
  vs.columns = [
    { header: "Nom", key: "nom", width: 34 },
    { header: "Identifiant", key: "id", width: 34 },
    { header: "Ancienne commune", key: "sec", width: 20 },
    { header: "Type", key: "cat", width: 12 },
    { header: "Longueur (m)", key: "lg", width: 12 },
    { header: "Voir sur la carte", key: "lien", width: 16 },
  ];
  entete(vs);
  for (const v of voiries.filter((x) => x.nom)) {
    const r = vs.addRow({
      nom: v.nom + (v.partie ? ` [${v.partie.numero}/${v.partie.total}]` : ""),
      id: v.id,
      sec: v.sections.join(", "),
      cat: v.categorie,
      lg: v.longueurM,
      lien: { text: "ouvrir", hyperlink: URL_CARTE + encodeURIComponent(v.id) },
    });
    r.getCell("lien").font = { color: { argb: TEAL }, underline: true };
  }
  vs.autoFilter = { from: "A1", to: "F1" };

  await wb.xlsx.writeFile(join("data", "matching", "validation_correspondances.xlsx"));
}

function rapport(
  fiches: FicheExcel[],
  propositions: Proposition[],
  corr: Correspondance[],
  geo: DonneesVoiries,
  decisions: Decision[],
): string {
  const L: string[] = [];
  const ficheParLigne = new Map(fiches.map((f) => [f.ligne, f]));
  const n = (pred: (p: Proposition) => boolean) => propositions.filter(pred).length;
  const nc = (s: string) => corr.filter((c) => c.statut === s).length;

  L.push("# MATCHING_REPORT — Correspondances Excel ↔ carte", "");
  L.push("> Phase 3 — généré par `npm run match`. Ne pas modifier à la main.", "");
  L.push("## 1. Résumé", "");
  L.push(`- Lignes lues dans \`Feuil1\` : **${fiches.length}** (contrôle : 180 attendues). Légende et lignes vides ignorées.`);
  L.push(`- Voiries sur la carte : ${geo.voiries.length}, dont ${geo.voiries.filter((v) => v.nom).length} nommées.`);
  L.push(`- Décisions humaines enregistrées : **${decisions.length}**.`, "");
  L.push("| Statut | Lignes |", "|---|---:|");
  for (const [s, lib] of [["valide", "validées"], ["a_valider", "à valider"], ["section_a_definir", "sections à tracer"], ["introuvable_osm", "introuvables sur la carte (fiche sans tracé)"], ["rejete", "rejetées"], ["n_existe_plus", "n'existe plus"]] as const) {
    L.push(`| ${lib} | ${nc(s)} |`);
  }
  L.push("", "## 2. Propositions par confiance", "");
  L.push("| Confiance | Signification | Lignes |", "|---|---|---:|");
  L.push(`| forte | nom identique (après remise en ordre éventuelle), une seule voirie possible, gestionnaire cohérent | ${n((p) => p.confiance === "forte")} |`);
  L.push(`| moyenne | nom proche, plusieurs voiries possibles, ou incohérence à vérifier | ${n((p) => p.confiance === "moyenne")} |`);
  L.push(`| faible | partie de rue (section) | ${n((p) => p.confiance === "faible")} |`);
  L.push(`| aucune | aucune voirie trouvée | ${n((p) => p.confiance === "aucune")} |`, "");
  L.push("Rien n'est appliqué automatiquement, même en confiance « forte » : chaque ligne attend une décision (validation par lot permise).", "");

  const tableau = (titre: string, liste: Proposition[], expl?: string) => {
    L.push(`## ${titre} (${liste.length})`, "");
    if (expl) L.push(expl, "");
    if (!liste.length) return L.push("_Aucune._", "");
    L.push("| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |", "|---:|---|---|---|---|---|");
    for (const p of liste) {
      const c = corr.find((x) => x.ligne === p.ligne)!;
      L.push(`| ${p.ligne} | ${p.nomExcel} | ${p.candidats[0]?.nom ?? "—"}${p.candidats[0] ? ` (${p.candidats[0].sections.join("/") || "?"})` : ""} | ${p.candidats.slice(1).map((x) => x.nom).join(" ; ") || ""} | ${p.alertes.join(" · ")} | ${c.statut} |`);
    }
    L.push("");
  };
  tableau("3. À regarder en priorité : confiance moyenne", propositions.filter((p) => p.confiance === "moyenne"));
  tableau("4. Parties de rue (sections, décision D4)", propositions.filter((p) => p.methode === "section"),
    "La voirie « mère » est proposée. Le tracé exact de chaque section (quels segments) sera défini sur la carte lors de la phase d'édition.");
  tableau("5. Aucune voirie trouvée sur la carte", propositions.filter((p) => p.confiance === "aucune"),
    "Causes possibles : chemin absent ou sans nom dans OpenStreetMap, nom très différent, voirie disparue. Ces lignes auront une fiche **sans tracé** (rien n'est dessiné).");
  tableau("6. Confiance forte (validation par lot possible)", propositions.filter((p) => p.confiance === "forte"));

  L.push("## 7. Voiries de la carte sans ligne Excel", "");
  const proposees = new Set(propositions.flatMap((p) => p.candidats.map((c) => c.id)));
  const sansExcel = geo.voiries.filter((v) => v.nom && v.categorie === "voirie" && !proposees.has(v.id));
  L.push(`${sansExcel.length} voiries carrossables nommées n'ont aucune ligne Excel proposée. Elles restent visibles, en gris, avec le statut « à compléter » :`, "");
  L.push(sansExcel.map((v) => `${v.nom}${v.partie ? ` [${v.partie.numero}/${v.partie.total}]` : ""} _(${v.sections.join("/") || "?"})_`).join(" · "), "");

  L.push("## 8. Normalisations appliquées (traçabilité)", "");
  const regles = new Map<string, number>();
  for (const f of fiches) for (const e of f.journal) regles.set(`${e.champ} — ${e.regle}`, (regles.get(`${e.champ} — ${e.regle}`) ?? 0) + 1);
  L.push("| Champ — règle | Lignes concernées |", "|---|---:|");
  for (const [r, k] of [...regles.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"))) L.push(`| ${r} | ${k} |`);
  L.push("", "Le détail ligne par ligne (avant → après) est dans `data/excel/feuil1_normalise.json`, champ `journal`.", "");

  L.push("## 9. Notes d'état suggérées par la couleur (D1, D2, D11)", "");
  const sugg = new Map<string, number>();
  for (const f of fiches) sugg.set(f.etatNoteSuggeree === null ? "aucune" : String(f.etatNoteSuggeree), (sugg.get(f.etatNoteSuggeree === null ? "aucune" : String(f.etatNoteSuggeree)) ?? 0) + 1);
  L.push("| Note suggérée | Lignes |", "|---|---:|");
  for (const k of ["1", "2", "3", "4", "5", "aucune"]) L.push(`| ${k} | ${sugg.get(k) ?? 0} |`);
  L.push("", "Ces notes restent des **suggestions** : elles ne deviennent des notes d'état qu'après validation par le père (écran prévu en phase 6).", "");
  void ficheParLigne;
  return L.join("\n") + "\n";
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
