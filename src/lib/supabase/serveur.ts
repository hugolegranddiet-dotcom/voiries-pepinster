// Client Supabase côté serveur (pages, actions, routes).
// La session de l'utilisateur est lue dans les cookies : toutes les requêtes
// passent donc par la sécurité par ligne (RLS) de la base.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function configSupabase(): { url: string; cle: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && cle ? { url, cle } : null;
}

export async function clientServeur() {
  const config = configSupabase();
  if (!config) throw new Error("Configuration Supabase manquante : voir .env.example.");
  const magasin = await cookies();
  return createServerClient(config.url, config.cle, {
    cookies: {
      getAll() {
        return magasin.getAll();
      },
      setAll(aEcrire) {
        try {
          aEcrire.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le proxy se charge du rafraîchissement.
        }
      },
    },
  });
}

/** Utilisateur connecté (identité vérifiée), ou null. */
export async function utilisateurConnecte(supabase: Awaited<ReturnType<typeof clientServeur>>) {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub as string, email: (data.claims.email as string | undefined) ?? null };
}
