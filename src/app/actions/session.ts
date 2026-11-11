"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clientServeur, configSupabase } from "@/lib/supabase/serveur";

const SchemaConnexion = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }),
  motDePasse: z.string().min(1, { error: "Mot de passe requis." }),
  suite: z.string().optional(),
});

export interface EtatConnexion {
  erreur: string | null;
  /** Adresse saisie, réaffichée après une erreur. */
  email?: string;
}

/** Évite les redirections vers un autre site : seul un chemin interne est accepté. */
function cheminSur(suite: string | undefined): string {
  if (!suite || !suite.startsWith("/") || suite.startsWith("//") || suite.startsWith("/connexion")) return "/carte";
  return suite;
}

export async function seConnecter(_precedent: EtatConnexion, donnees: FormData): Promise<EtatConnexion> {
  const email = String(donnees.get("email") ?? "");
  if (!configSupabase()) return { erreur: "L'application n'est pas encore reliée à sa base de données.", email };
  const lu = SchemaConnexion.safeParse({
    email: donnees.get("email"),
    motDePasse: donnees.get("motDePasse"),
    suite: donnees.get("suite") ?? undefined,
  });
  if (!lu.success) return { erreur: lu.error.issues[0]?.message ?? "Formulaire incomplet.", email };

  const supabase = await clientServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email: lu.data.email,
    password: lu.data.motDePasse,
  });
  if (error) {
    // Message volontairement neutre : on ne dit pas si l'adresse existe.
    return { erreur: "Adresse e-mail ou mot de passe incorrect.", email };
  }
  redirect(cheminSur(lu.data.suite));
}

export async function seDeconnecter() {
  if (configSupabase()) {
    const supabase = await clientServeur();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}
