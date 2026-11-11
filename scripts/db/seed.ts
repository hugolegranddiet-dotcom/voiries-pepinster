// Import initial (et ré-import sans risque) des données dans Supabase.
//   npm run db:seed
// Idempotent : relancer ne crée pas de doublons.
// Règle 10 : une évaluation existante n'est JAMAIS écrasée (création seulement).
// Les choix faits dans l'application (gestionnaire, statut) ne sont pas écrasés :
// seules les colonnes géographiques des voiries sont mises à jour.
import { clientService, parLots, verifier } from "./commun";
import { construireDonnees } from "./construire";

async function main() {
  const d = await construireDonnees();
  const db = clientService();

  const snap = verifier(
    await db.from("geo_snapshots").upsert(d.snapshot, { onConflict: "sha256" }).select("id").single(),
    "extraction OSM",
  ) as { id: string };
  console.log(`✓ extraction OSM du ${String(d.snapshot.extrait_le)}`);

  await parLots(d.roads, 500, async (lot) => {
    verifier(await db.from("roads").upsert(lot.map((r) => ({ ...r, snapshot_id: snap.id })), { onConflict: "id" }), "voiries");
  });
  console.log(`✓ ${d.roads.length} voiries`);

  await parLots(d.segments, 400, async (lot) => {
    verifier(await db.from("road_segments").upsert(lot.map((s) => ({ ...s, snapshot_id: snap.id })), { onConflict: "id" }), "segments");
  });
  console.log(`✓ ${d.segments.length} segments`);

  verifier(await db.from("roads").upsert(d.sections, { onConflict: "id", ignoreDuplicates: true }), "sections");
  console.log(`✓ ${d.sections.length} parties de rue (sections)`);

  const lot = verifier(
    await db.from("import_batches").upsert(d.lot, { onConflict: "sha256" }).select("id").single(),
    "lot d'import",
  ) as { id: string };
  const lignes = verifier(
    await db
      .from("import_rows")
      .upsert(d.lignesExcel.map((l) => ({ ...l, batch_id: lot.id })), { onConflict: "batch_id,excel_ligne" })
      .select("id, excel_ligne"),
    "lignes Excel",
  ) as Array<{ id: string; excel_ligne: number }>;
  console.log(`✓ ${lignes.length} lignes de l'Excel`);

  const idParLigne = new Map(lignes.map((l) => [l.excel_ligne, l.id]));
  verifier(
    await db.from("match_reviews").upsert(
      d.decisions.map(({ excel_ligne, ...r }) => ({ ...r, import_row_id: idParLigne.get(excel_ligne) })),
      { onConflict: "import_row_id" },
    ),
    "décisions",
  );
  console.log(`✓ ${d.decisions.length} décisions de correspondance`);

  verifier(await db.from("road_evaluations").upsert(d.evaluations, { onConflict: "road_id", ignoreDuplicates: true }), "évaluations");
  console.log(`✓ ${d.evaluations.length} évaluations créées si absentes (jamais écrasées)`);

  for (const g of d.gestionnaires) {
    verifier(await db.from("roads").update(g.valeurs).in("id", g.ids).eq("statut_fiche", "a_completer"), "gestionnaires");
  }

  const { count } = await db.from("priority_settings").select("id", { count: "exact", head: true });
  if (!count) {
    verifier(await db.from("priority_settings").insert(d.parametres), "paramètres");
    console.log("✓ paramètres du score (version 1)");
  }

  console.log("\n✅ Import terminé. Vérifier ensuite : npm run db:verifier");
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
