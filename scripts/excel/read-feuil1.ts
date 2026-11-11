// Lecture UNIQUE et fidèle de la feuille « Feuil1 » de l'Excel source.
// - Le fichier source n'est jamais modifié (lecture seule).
// - Chaque cellule est gardée telle quelle (espaces compris) avec sa couleur de fond.
// - Lignes de voiries : 2 à 183 ; les lignes vides (151, 169) sont sautées ;
//   la légende (185–189) et la note (191) sont ignorées.
// - Contrôle bloquant : exactement 180 lignes de voiries.
// Sortie : data/excel/feuil1_raw.json

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { CelluleBrute, ExcelBrut, LigneBrute } from "@/lib/excel/types";

const SOURCE = join("source", "etat_voiries_pepinster.xlsx");
const COLONNES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
const LIGNES_ATTENDUES = 180;

function bloc(ligne: number): LigneBrute["bloc"] {
  if (ligne <= 150) return "A_communal";
  if (ligne <= 168) return "B_spw";
  return "C_chemins";
}

function valeur(v: ExcelJS.CellValue): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && "result" in v) return valeur(v.result as ExcelJS.CellValue);
  if (typeof v === "object" && "text" in v) return String(v.text);
  return String(v);
}

function fond(cell: ExcelJS.Cell): string | null {
  const f = cell.fill;
  if (!f || f.type !== "pattern" || f.pattern === "none") return null;
  const c = f.fgColor as { argb?: string; theme?: number; tint?: number } | undefined;
  if (!c) return null;
  if (c.argb) return `#${c.argb.slice(-6).toUpperCase()}`;
  if (c.theme !== undefined) return `theme${c.theme}${c.tint ? `${c.tint > 0 ? "+" : ""}${c.tint.toFixed(2)}` : ""}`;
  return null;
}

async function main() {
  const octets = await readFile(SOURCE);
  const classeur = new ExcelJS.Workbook();
  await classeur.xlsx.load(octets as unknown as ArrayBuffer);
  const feuille = classeur.getWorksheet("Feuil1");
  if (!feuille) throw new Error("Feuille « Feuil1 » introuvable.");

  const entetes = COLONNES.map((c) => valeur(feuille.getCell(`${c}1`).value));
  const lignes: LigneBrute[] = [];
  for (let n = 2; n <= 183; n++) {
    const cellules = Object.fromEntries(
      COLONNES.map((c) => {
        const cell = feuille.getCell(`${c}${n}`);
        return [c, { valeur: valeur(cell.value), fond: fond(cell) } satisfies CelluleBrute];
      }),
    ) as LigneBrute["cellules"];
    if (cellules.A.valeur === null || String(cellules.A.valeur).trim() === "") continue;
    lignes.push({ ligne: n, bloc: bloc(n), cellules });
  }
  if (lignes.length !== LIGNES_ATTENDUES) {
    throw new Error(`Attendu ${LIGNES_ATTENDUES} lignes de voiries, lu ${lignes.length}.`);
  }

  const sortie: ExcelBrut = {
    source: {
      fichier: SOURCE,
      sha256: createHash("sha256").update(octets).digest("hex"),
      feuille: "Feuil1",
      plage: "A1:I191",
      lu_le: new Date().toISOString(),
    },
    entetes: entetes.map((e) => (e === null ? "" : String(e))),
    lignes,
  };
  await mkdir(join("data", "excel"), { recursive: true });
  await writeFile(join("data", "excel", "feuil1_raw.json"), JSON.stringify(sortie, null, 1));
  console.log(`✅ ${lignes.length} lignes lues (légende et lignes vides ignorées) → data/excel/feuil1_raw.json`);
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
