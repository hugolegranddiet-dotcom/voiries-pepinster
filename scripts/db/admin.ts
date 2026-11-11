// Déclare l'administrateur unique de l'application.
//   npm run db:admin -- adresse@exemple.be
// Le compte doit d'abord être créé dans Supabase (Authentication → Users → Add user).
import { clientService, verifier } from "./commun";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Usage : npm run db:admin -- adresse@exemple.be");
  const db = clientService();

  let trouve: { id: string; email?: string } | undefined;
  for (let page = 1; !trouve; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    trouve = data.users.find((u) => u.email?.toLowerCase() === email);
    if (data.users.length < 200) break;
  }
  if (!trouve) throw new Error(`Aucun compte « ${email} » dans Supabase. Crée-le d'abord (Authentication → Users → Add user).`);

  verifier(await db.from("app_admins").upsert({ user_id: trouve.id }, { onConflict: "user_id" }), "administrateur");
  const admins = verifier(await db.from("app_admins").select("user_id"), "lecture") as Array<{ user_id: string }>;
  console.log(`✅ ${email} est administrateur.`);
  if (admins.length > 1) {
    console.log(`⚠️  Il y a ${admins.length} administrateurs. La décision D9 prévoit un seul compte : vérifie la table app_admins.`);
  }
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
