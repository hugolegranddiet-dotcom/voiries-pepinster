"use server";

// Écritures de la phase 6 : paramètres du score (nouvelle version) et
// validation par lot des notes suggérées. Les deux passent par des fonctions
// SQL « tout ou rien », exécutées avec les droits du père (RLS + journal).
import { z } from "zod";
import { IdentifiantVoirie } from "@/lib/db/schemas";
import { SchemaParametres } from "@/lib/priority/parametres";
import { clientServeur, configSupabase, utilisateurConnecte } from "@/lib/supabase/serveur";
import type { ResultatAction } from "@/app/actions/evaluations";

const SESSION_EXPIREE = "Ta session a expiré : recharge la page pour te reconnecter.";
const MIGRATION_MANQUANTE =
  "La base de données n'a pas encore toutes ses mises à jour. Préviens Hugo (sur le Mac : npx supabase@3.1.0 db push --remote).";

async function contexte() {
  if (!configSupabase()) return null;
  const supabase = await clientServeur();
  const utilisateur = await utilisateurConnecte(supabase);
  return utilisateur ? supabase : null;
}

function messageErreur(e: { code?: string; message?: string }, defaut: string): string {
  if (e.code === "PGRST202" || /could not find the function/i.test(e.message ?? "")) return MIGRATION_MANQUANTE;
  if (e.code === "42501" || /acces_refuse/.test(e.message ?? "")) return "Action réservée à l'administrateur.";
  return defaut;
}

/** Enregistre de nouveaux paramètres : ils deviennent la version active, l'ancienne est gardée. */
export async function publierParametres(saisie: unknown): Promise<ResultatAction<{ version: number }>> {
  const p = SchemaParametres.safeParse(saisie);
  if (!p.success) return { ok: false, erreur: p.error.issues[0]?.message ?? "Paramètres invalides." };
  try {
    const supabase = await contexte();
    if (!supabase) return { ok: false, erreur: SESSION_EXPIREE };
    const { data, error } = await supabase.rpc("publier_parametres", {
      p_poids: p.data.poids,
      p_echelles: p.data.echelles,
      p_seuils: p.data.seuils,
      p_couverture_min: p.data.couverture_min,
      p_gestionnaires: p.data.gestionnaires_classement,
    });
    if (error || typeof data !== "number") return { ok: false, erreur: messageErreur(error ?? {}, "Enregistrement des paramètres impossible.") };
    return { ok: true, donnees: { version: data } };
  } catch {
    return { ok: false, erreur: "Problème de connexion : réessaie dans un instant." };
  }
}

/** Revient à une version précédente des paramètres. */
export async function activerParametres(version: unknown): Promise<ResultatAction<{ version: number }>> {
  const v = z.number().int().positive().safeParse(version);
  if (!v.success) return { ok: false, erreur: "Version inconnue." };
  try {
    const supabase = await contexte();
    if (!supabase) return { ok: false, erreur: SESSION_EXPIREE };
    const { error } = await supabase.rpc("activer_parametres", { p_version: v.data });
    if (error) return { ok: false, erreur: messageErreur(error, "Impossible d'activer cette version.") };
    return { ok: true, donnees: { version: v.data } };
  } catch {
    return { ok: false, erreur: "Problème de connexion : réessaie dans un instant." };
  }
}

const ListeIds = z.array(IdentifiantVoirie).min(1, { error: "Aucune voirie choisie." }).max(500);

/**
 * Valide les notes SUGGÉRÉES des voiries choisies par le père (validation par lot, D1).
 * Une note déjà saisie n'est jamais écrasée. Renvoie les voiries réellement validées.
 */
export async function validerNotesSuggerees(ids: unknown): Promise<ResultatAction<{ valides: string[] }>> {
  const liste = ListeIds.safeParse(ids);
  if (!liste.success) return { ok: false, erreur: liste.error.issues[0]?.message ?? "Liste invalide." };
  try {
    const supabase = await contexte();
    if (!supabase) return { ok: false, erreur: SESSION_EXPIREE };
    const { data, error } = await supabase.rpc("valider_notes_suggerees", { p_ids: liste.data });
    if (error) return { ok: false, erreur: messageErreur(error, "Validation impossible.") };
    return { ok: true, donnees: { valides: (data as string[] | null) ?? [] } };
  } catch {
    return { ok: false, erreur: "Problème de connexion : réessaie dans un instant." };
  }
}
