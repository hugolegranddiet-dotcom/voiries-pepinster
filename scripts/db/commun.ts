// Outils communs aux scripts de base de données, lancés à la main sur le Mac.
// Ils lisent .env.local (jamais versionné). La clé secrète ne sert qu'ici.
import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function chargerEnv(): void {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
}

function requis(nom: string): string {
  const v = process.env[nom]?.trim();
  if (!v) throw new Error(`Variable « ${nom} » absente de .env.local (voir .env.example).`);
  return v;
}

/** Client « service » : contourne la sécurité par ligne. Scripts locaux uniquement. */
export function clientService(): SupabaseClient {
  chargerEnv();
  return createClient(requis("NEXT_PUBLIC_SUPABASE_URL"), requis("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client « public » sans session : celui d'un visiteur non connecté. */
export function clientPublic(): SupabaseClient {
  chargerEnv();
  return createClient(requis("NEXT_PUBLIC_SUPABASE_URL"), requis("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function parLots<T>(elements: T[], taille: number, f: (lot: T[]) => Promise<void>) {
  for (let i = 0; i < elements.length; i += taille) await f(elements.slice(i, i + taille));
}

export function verifier<T>(r: { data: T; error: { message: string } | null }, contexte: string): T {
  if (r.error) throw new Error(`${contexte} : ${r.error.message}`);
  return r.data;
}
