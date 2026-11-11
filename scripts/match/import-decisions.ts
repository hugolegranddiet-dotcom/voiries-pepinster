// Enregistre les décisions HUMAINES de correspondance dans data/matching/decisions.json.
//
// Deux façons de décider :
//   npm run match:import -- chemin/vers/validation_correspondances.xlsx
//       lit la colonne DÉCISION remplie dans Excel ;
//   npm run match:import -- --forte "Hugo, conversation du JJ/MM/AAAA"
//       validation PAR LOT des propositions de confiance « forte » encore sans décision,
//       uniquement sur demande explicite (la source est obligatoire et enregistrée) ;
//   npm run match:import -- --ecarter-sans-voirie "Hugo, conversation du JJ/MM/AAAA"
//       écarte (NON) les lignes sans aucune voirie proposée et encore sans décision.
// Un « OK » posé sur une partie de rue est enregistré comme SECTION (décision D4).
// Puis lancer `npm run match` pour appliquer.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import ExcelJS from "exceljs";
import { normaliserNom } from "@/lib/geo/noms";
import type { DonneesVoiries } from "@/lib/geo/types";
import type { Proposition } from "@/lib/matching/apparier";
import { CHOIX_DECISION, type ChoixDecision, type Decision } from "@/lib/matching/decisions";

const FICHIER_DECISIONS = join("data", "matching", "decisions.json");

function texteCellule(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "text" in v) return String(v.text).trim();
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("").trim();
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim();
  return String(v).trim();
}

async function main() {
  const args = process.argv.slice(2);
  const existantes: Decision[] = existsSync(FICHIER_DECISIONS)
    ? JSON.parse(await readFile(FICHIER_DECISIONS, "utf8"))
    : [];
  const parLigne = new Map(existantes.map((d) => [d.ligne, d]));
  const propositions: Proposition[] = JSON.parse(await readFile(join("data", "matching", "propositions.json"), "utf8"));
  const geo: DonneesVoiries = JSON.parse(await readFile(join("public", "geo", "voiries.json"), "utf8"));
  const ids = new Set(geo.voiries.map((v) => v.id));
  const date = new Date().toISOString();
  const erreurs: string[] = [];
  let ajoutees = 0;

  const methodeParLigne = new Map(propositions.map((p) => [p.ligne, p.methode]));
  if (args[0] === "--ecarter-sans-voirie") {
    const source = args[1]?.trim();
    if (!source) throw new Error("Indiquer qui décide : --ecarter-sans-voirie \"Hugo, …\"");
    for (const p of propositions.filter((x) => !x.propositionId && !parLigne.has(x.ligne))) {
      parLigne.set(p.ligne, {
        ligne: p.ligne,
        decision: "NON",
        voirieId: null,
        commentaire: "aucune voirie trouvée : ligne écartée",
        source: `lignes sans voirie écartées — ${source}`,
        date,
      });
      ajoutees++;
    }
  } else if (args[0] === "--forte") {
    const source = args[1]?.trim();
    if (!source) throw new Error("Indiquer qui valide : --forte \"Hugo, conversation du JJ/MM/AAAA\"");
    for (const p of propositions.filter((x) => x.confiance === "forte" && !parLigne.has(x.ligne))) {
      parLigne.set(p.ligne, {
        ligne: p.ligne,
        decision: "OK",
        voirieId: p.propositionId,
        commentaire: null,
        source: `validation par lot des propositions « forte » — ${source}`,
        date,
      });
      ajoutees++;
    }
  } else {
    const chemin = args[0] ?? join("data", "matching", "validation_correspondances.xlsx");
    const octets = await readFile(chemin);
    const empreinte = createHash("sha256").update(octets).digest("hex").slice(0, 12);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(octets as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("À valider");
    if (!ws) throw new Error("Onglet « À valider » introuvable.");
    const col = new Map<string, number>();
    ws.getRow(1).eachCell((c, i) => col.set(texteCellule(c.value), i));
    const c = (nom: string) => {
      const i = col.get(nom);
      if (!i) throw new Error(`Colonne « ${nom} » introuvable.`);
      return i;
    };
    const nomVersIds = new Map<string, string[]>();
    for (const v of geo.voiries.filter((x) => x.nom)) {
      const k = normaliserNom(v.nom!);
      nomVersIds.set(k, [...(nomVersIds.get(k) ?? []), v.id]);
    }

    ws.eachRow((row, n) => {
      if (n === 1) return;
      const ligne = Number(texteCellule(row.getCell(c("Ligne Excel")).value));
      const brut = texteCellule(row.getCell(c("DÉCISION")).value).toUpperCase();
      if (!brut) return;
      if (!CHOIX_DECISION.includes(brut as ChoixDecision)) {
        erreurs.push(`ligne Excel ${ligne} : décision « ${brut} » inconnue`);
        return;
      }
      let decision = brut as ChoixDecision;
      let note: string | null = null;
      if (decision === "OK" && methodeParLigne.get(ligne) === "section") {
        decision = "SECTION";
        note = "OK sur une partie de rue, enregistré comme SECTION (D4)";
      }
      const propose = texteCellule(row.getCell(c("Identifiant proposé")).value) || null;
      let voirieId: string | null = decision === "OK" || decision === "SECTION" ? propose : null;
      if (decision === "AUTRE") {
        const saisie = texteCellule(row.getCell(c("Si AUTRE : nom ou identifiant")).value);
        if (ids.has(saisie)) voirieId = saisie;
        else {
          const trouves = nomVersIds.get(normaliserNom(saisie.replace(/\s*\[\d+\/\d+\]$/, ""))) ?? [];
          if (trouves.length === 1) voirieId = trouves[0];
          else {
            erreurs.push(`ligne Excel ${ligne} : « ${saisie} » ${trouves.length ? "désigne plusieurs voiries, utiliser l'identifiant" : "introuvable sur la carte"}`);
            return;
          }
        }
      }
      if ((decision === "OK" || decision === "SECTION") && !voirieId) {
        erreurs.push(`ligne Excel ${ligne} : ${decision} sans proposition, utiliser AUTRE ou INTROUVABLE`);
        return;
      }
      parLigne.set(ligne, {
        ligne,
        decision,
        voirieId,
        commentaire: [texteCellule(row.getCell(c("Commentaire")).value), note].filter(Boolean).join(" · ") || null,
        source: `fichier ${basename(chemin)} (empreinte ${empreinte})`,
        date,
      });
      ajoutees++;
    });
  }

  const toutes = [...parLigne.values()].sort((a, b) => a.ligne - b.ligne);
  await writeFile(FICHIER_DECISIONS, JSON.stringify(toutes, null, 1));
  console.log(`✅ ${ajoutees} décision(s) enregistrée(s) ; ${toutes.length} au total → ${FICHIER_DECISIONS}`);
  if (erreurs.length) {
    console.log(`⚠️  ${erreurs.length} ligne(s) ignorée(s) :`);
    for (const e of erreurs) console.log(`   - ${e}`);
  }
  console.log("   Lancer ensuite : npm run match");
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
