// Vérifications automatiques sur le VRAI projet Supabase :
//   npm run db:verifier
// 1. un visiteur non connecté ne peut rien lire ni écrire (sécurité par ligne) ;
// 2. les données importées sont toutes présentes ;
// 3. il existe exactement un administrateur.
import { clientPublic, clientService } from "./commun";

let echecs = 0;
const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const ko = (msg: string) => {
  echecs++;
  console.log(`  ❌ ${msg}`);
};

const TABLES = ["roads", "road_segments", "road_evaluations", "import_rows", "match_reviews", "priority_settings", "change_log", "app_admins", "geo_snapshots"];

async function main() {
  console.log("1. Visiteur non connecté");
  const anonyme = clientPublic();
  for (const t of TABLES) {
    const { data, error } = await anonyme.from(t).select("*").limit(1);
    if (error || !data?.length) ok(`${t} : aucune donnée visible`);
    else ko(`${t} : ${data.length} ligne(s) visible(s) SANS connexion`);
  }
  const ecriture = await anonyme.from("road_evaluations").update({ particularites: "test intrusion" }).neq("road_id", "").select();
  if (ecriture.error || !ecriture.data?.length) ok("modification refusée");
  else ko("une modification a été acceptée SANS connexion");
  // Réglage public d'Auth : on lit la configuration, sans créer de compte.
  const reglages = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
  }).then((r) => r.json() as Promise<{ disable_signup?: boolean }>);
  if (reglages.disable_signup) ok("inscription publique désactivée");
  else ko("l'inscription publique est OUVERTE : la désactiver (Authentication → Sign In / Providers → Allow new users to sign up)");

  console.log("2. Données importées");
  const service = clientService();
  const attendus: Record<string, number> = { roads: 1135, road_segments: 1489, import_rows: 180, match_reviews: 180 };
  for (const [t, n] of Object.entries(attendus)) {
    const { count, error } = await service.from(t).select("*", { count: "exact", head: true });
    if (error) ko(`${t} : ${error.message}`);
    else if (count === n) ok(`${t} : ${count}`);
    else ko(`${t} : ${count} (attendu ${n})`);
  }
  const { count: evals } = await service.from("road_evaluations").select("*", { count: "exact", head: true });
  if ((evals ?? 0) > 0) ok(`road_evaluations : ${evals}`);
  else ko("road_evaluations : aucune");

  console.log("3. Administrateur");
  const { count: admins } = await service.from("app_admins").select("*", { count: "exact", head: true });
  if (admins === 1) ok("un seul administrateur");
  else ko(`${admins ?? 0} administrateur(s) (attendu : 1)`);

  console.log(echecs ? `\n❌ ${echecs} problème(s) à corriger.` : "\n✅ Tout est en ordre.");
  process.exit(echecs ? 1 : 0);
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
