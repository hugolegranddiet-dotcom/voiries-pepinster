// Restauration à partir d'une sauvegarde :
//   npm run db:restaurer -- sauvegardes/voiries-pepinster-….json              (simulation : rien n'est modifié)
//   npm run db:restaurer -- sauvegardes/voiries-pepinster-….json --confirmer  (applique)
// Remet les évaluations, les champs modifiables des voiries et les paramètres du
// score comme dans la sauvegarde. Ne supprime jamais rien. Chaque changement est
// inscrit dans le journal des modifications par la base.
import { readFileSync } from "node:fs";
import { clientService, parLots, verifier } from "./commun";
import { lireFichierSauvegarde, lireTable, planifierRestauration } from "./sauvegarde-outils";

async function main() {
  const fichier = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const confirmer = process.argv.includes("--confirmer");
  if (!fichier) throw new Error("Indique le fichier : npm run db:restaurer -- sauvegardes/voiries-pepinster-….json");
  const s = lireFichierSauvegarde(readFileSync(fichier, "utf8"));
  const db = clientService();
  const plan = planifierRestauration(
    { roads: await lireTable(db, "roads"), road_evaluations: await lireTable(db, "road_evaluations"), priority_settings: await lireTable(db, "priority_settings") },
    s,
  );

  console.log(`Sauvegarde du ${new Date(s.creeLe).toLocaleString("fr-BE")}`);
  console.log(`  évaluations à remettre : ${plan.evaluations.length}`);
  console.log(`  voiries (gestionnaire / statut) à remettre : ${plan.voiries.length}`);
  console.log(`  versions de paramètres à remettre : ${plan.parametres.length} ; version active : ${plan.versionActive ?? "aucune"}`);
  if (plan.voiriesInconnues.length) console.log(`  ⚠ ${plan.voiriesInconnues.length} voirie(s) absentes de la base, ignorées : ${plan.voiriesInconnues.slice(0, 5).join(", ")}…`);

  if (!confirmer) {
    console.log("\nSimulation uniquement : rien n'a été modifié. Pour appliquer, relance avec --confirmer");
    return;
  }

  await parLots(plan.voiries, 200, async (lot) => {
    for (const v of lot) {
      const { id, ...champs } = v;
      verifier(await db.from("roads").update(champs).eq("id", id as string), `voirie ${id}`);
    }
  });
  await parLots(plan.evaluations, 200, async (lot) => {
    verifier(await db.from("road_evaluations").upsert(lot, { onConflict: "road_id" }), "évaluations");
  });
  if (plan.parametres.length || plan.versionActive !== null) {
    // Une seule version active à la fois : on désactive d'abord, puis on réactive la bonne.
    verifier(await db.from("priority_settings").update({ actif: false }).eq("actif", true), "paramètres");
    for (const p of plan.parametres) {
      // L'identifiant interne n'est pas repris : la version suffit à retrouver la ligne.
      const reste = Object.fromEntries(Object.entries(p).filter(([k]) => k !== "id"));
      verifier(await db.from("priority_settings").upsert({ ...reste, actif: false }, { onConflict: "version" }), `paramètres v${p.version}`);
    }
    if (plan.versionActive !== null) {
      verifier(await db.from("priority_settings").update({ actif: true }).eq("version", plan.versionActive), "version active");
    }
  }
  console.log("\n✓ Restauration terminée. Recharge l'application.");
}

main().catch((e: unknown) => {
  console.error("✗ Restauration impossible :", e instanceof Error ? e.message : e);
  process.exit(1);
});
