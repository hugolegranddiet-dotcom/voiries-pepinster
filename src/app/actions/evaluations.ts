"use server";

// Écritures sur les évaluations (CRUD). Chaque appel :
// 1. vérifie la connexion, 2. valide les données (Zod), 3. écrit sous RLS.
// Le journal des modifications est rempli automatiquement par la base.
import { IdentifiantVoirie, ModificationEvaluation } from "@/lib/db/schemas";
import { clientServeur, utilisateurConnecte } from "@/lib/supabase/serveur";

export type ResultatAction<T = null> = { ok: true; donnees: T } | { ok: false; erreur: string };

async function contexte() {
  const supabase = await clientServeur();
  const utilisateur = await utilisateurConnecte(supabase);
  return { supabase, utilisateur };
}

/** Lire l'évaluation d'une voirie. */
export async function lireEvaluation(roadId: string): Promise<ResultatAction<Record<string, unknown> | null>> {
  const id = IdentifiantVoirie.safeParse(roadId);
  if (!id.success) return { ok: false, erreur: "Voirie inconnue." };
  const { supabase, utilisateur } = await contexte();
  if (!utilisateur) return { ok: false, erreur: "Session expirée : reconnecte-toi." };
  const { data, error } = await supabase.from("road_evaluations").select("*").eq("road_id", id.data).maybeSingle();
  if (error) return { ok: false, erreur: "Lecture impossible." };
  return { ok: true, donnees: data };
}

/** Créer ou modifier l'évaluation d'une voirie (seuls les champs fournis changent). */
export async function enregistrerEvaluation(
  roadId: string,
  modification: unknown,
): Promise<ResultatAction<{ majLe: string }>> {
  const id = IdentifiantVoirie.safeParse(roadId);
  const champs = ModificationEvaluation.safeParse(modification);
  if (!id.success) return { ok: false, erreur: "Voirie inconnue." };
  if (!champs.success) return { ok: false, erreur: champs.error.issues[0]?.message ?? "Données invalides." };

  const { supabase, utilisateur } = await contexte();
  if (!utilisateur) return { ok: false, erreur: "Session expirée : reconnecte-toi." };

  const { data, error } = await supabase
    .from("road_evaluations")
    .upsert({ road_id: id.data, ...champs.data, updated_by: utilisateur.id }, { onConflict: "road_id" })
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return { ok: false, erreur: "Enregistrement refusé ou impossible." };
  return { ok: true, donnees: { majLe: data.updated_at as string } };
}

/** Supprimer l'évaluation d'une voirie (la voirie elle-même reste). */
export async function supprimerEvaluation(roadId: string): Promise<ResultatAction> {
  const id = IdentifiantVoirie.safeParse(roadId);
  if (!id.success) return { ok: false, erreur: "Voirie inconnue." };
  const { supabase, utilisateur } = await contexte();
  if (!utilisateur) return { ok: false, erreur: "Session expirée : reconnecte-toi." };
  const { error } = await supabase.from("road_evaluations").delete().eq("road_id", id.data);
  if (error) return { ok: false, erreur: "Suppression impossible." };
  return { ok: true, donnees: null };
}
