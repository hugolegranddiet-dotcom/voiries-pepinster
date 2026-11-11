// Mot de passe oublié : crée un NOUVEAU mot de passe aléatoire pour un compte.
//   npm run db:mot-de-passe -- adresse@exemple.be
// Le mot de passe s'affiche UNE fois dans le Terminal : donne-le de vive voix
// ou sur papier (jamais par e-mail ni dans un chat), puis ferme le Terminal.
import { randomInt } from "node:crypto";
import { clientService } from "./commun";

// Sans caractères ambigus (0/O, 1/l/I) pour être facile à recopier.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function motDePasseAleatoire(longueur = 16): string {
  return Array.from({ length: longueur }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Usage : npm run db:mot-de-passe -- adresse@exemple.be");
  const db = clientService();
  let trouve: { id: string } | undefined;
  for (let page = 1; !trouve; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    trouve = data.users.find((u) => u.email?.toLowerCase() === email);
    if (data.users.length < 200) break;
  }
  if (!trouve) throw new Error(`Aucun compte « ${email} ».`);
  const mdp = motDePasseAleatoire();
  const { error } = await db.auth.admin.updateUserById(trouve.id, { password: mdp });
  if (error) throw new Error(error.message);
  console.log(`✅ Nouveau mot de passe pour ${email} :\n\n    ${mdp}\n`);
  console.log("Donne-le de vive voix ou sur papier, puis ferme ce Terminal.");
}

if (process.argv[1]?.endsWith("mot-de-passe.ts")) {
  main().catch((e) => {
    console.error(`❌ ${(e as Error).message}`);
    process.exit(1);
  });
}
