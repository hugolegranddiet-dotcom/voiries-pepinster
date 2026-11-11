// Données de la carte, lues dans la base avec la session de l'utilisateur.
// Sans connexion : 401 (le proxy l'arrête déjà). Connecté mais non autorisé : 403.
import { connection, NextResponse } from "next/server";
import { lireDonneesCarte } from "@/lib/db/carte";
import { clientServeur, configSupabase, utilisateurConnecte } from "@/lib/supabase/serveur";

export async function GET() {
  // Réponse propre à chaque utilisateur : jamais précalculée ni mise en cache.
  await connection();
  if (!configSupabase()) return NextResponse.json({ erreur: "non_configure" }, { status: 503 });
  const supabase = await clientServeur();
  const utilisateur = await utilisateurConnecte(supabase);
  if (!utilisateur) return NextResponse.json({ erreur: "non_connecte" }, { status: 401 });

  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", utilisateur.id).maybeSingle();
  if (!admin) return NextResponse.json({ erreur: "non_autorise" }, { status: 403 });

  try {
    const donnees = await lireDonneesCarte(supabase);
    return NextResponse.json(donnees, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    const message = (e as Error).message;
    return NextResponse.json(
      { erreur: message === "base_vide" ? "base_vide" : "erreur_lecture" },
      { status: message === "base_vide" ? 404 : 500 },
    );
  }
}
