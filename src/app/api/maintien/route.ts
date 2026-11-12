// Appel quotidien automatique (« cron » Vercel, voir vercel.json) qui fait une
// petite requête à la base : l'offre gratuite de Supabase met en pause un projet
// sans activité pendant une semaine (D22). Ne lit ni ne renvoie aucune donnée :
// la requête passe par la sécurité par ligne (RLS) et revient vide.
// Seul Vercel peut l'appeler : il envoie le secret CRON_SECRET dans l'en-tête.
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";

function secretValide(entete: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !entete) return false;
  const attendu = Buffer.from(`Bearer ${secret}`);
  const recu = Buffer.from(entete);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}

export async function GET(requete: Request) {
  await connection();
  const sansCache = { "Cache-Control": "no-store" };
  if (!secretValide(requete.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ erreur: "non_autorise" }, { status: 401, headers: sansCache });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !cle) return Response.json({ erreur: "non_configure" }, { status: 503, headers: sansCache });

  const supabase = createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.from("roads").select("id").limit(1);
  if (error) return Response.json({ ok: false }, { status: 502, headers: sansCache });
  return Response.json({ ok: true, le: new Date().toISOString() }, { headers: sansCache });
}
