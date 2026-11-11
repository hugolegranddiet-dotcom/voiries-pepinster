// Sauvegarde complète des données saisies :
//   npm run db:sauvegarde
// Crée sauvegardes/voiries-pepinster-AAAA-MM-JJ_HHhMM.json (dossier NON envoyé sur GitHub).
// Copie ensuite ce fichier dans un endroit sûr (iCloud, clé USB…).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { clientService } from "./commun";
import { creerSauvegarde, TABLES_SAUVEGARDE } from "./sauvegarde-outils";

async function main() {
  const s = await creerSauvegarde(clientService());
  const d = new Date(s.creeLe);
  const j = (n: number) => String(n).padStart(2, "0");
  const nom = `voiries-pepinster-${d.getFullYear()}-${j(d.getMonth() + 1)}-${j(d.getDate())}_${j(d.getHours())}h${j(d.getMinutes())}.json`;
  mkdirSync("sauvegardes", { recursive: true });
  const chemin = join("sauvegardes", nom);
  writeFileSync(chemin, JSON.stringify(s));
  console.log("✓ Sauvegarde créée :", chemin);
  for (const t of TABLES_SAUVEGARDE) console.log(`   ${t.padEnd(18)} ${s.comptes[t]} ligne(s)`);
  console.log("Copie ce fichier dans un endroit sûr (iCloud, clé USB…). Il n'est pas envoyé sur GitHub.");
}

main().catch((e: unknown) => {
  console.error("✗ Sauvegarde impossible :", e instanceof Error ? e.message : e);
  process.exit(1);
});
