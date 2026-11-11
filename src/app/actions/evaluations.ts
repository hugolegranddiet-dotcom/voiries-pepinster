"use server";

// Écritures (CRUD) sur les fiches. Chaque appel :
// 1. vérifie la connexion, 2. valide les données (Zod), 3. écrit sous RLS.
// Le journal des modifications est rempli automatiquement par la base.
import type { Evaluation } from "@/lib/donnees/types";
import { IdentifiantVoirie, ModificationEvaluation, ModificationFiche } from "@/lib/db/schemas";
import { clientServeur, configSupabase, utilisateurConnecte } from "@/lib/supabase/serveur";

export type ResultatAction<T = null> = { ok: true; donnees: T } | { ok: false; erreur: string };

async function contexte() {
  if (!configSupabase()) return { supabase: null, utilisateur: null };
  const supabase = await clientServeur();
  const utilisateur = await utilisateurConnecte(supabase);
  return { supabase, utilisateur };
}

const SESSION_EXPIREE = "Ta session a expiré : recharge la page pour te reconnecter.";

export interface VoirieModifiee {
  gestionnaire: string;
  gestionnaire_detail: string | null;
  statut_fiche: string;
}

/** Enregistrer une fiche : champs de la voirie et/ou de l'évaluation (seuls les champs fournis changent). */
export async function enregistrerFiche(
  roadId: string,
  modification: unknown,
): Promise<ResultatAction<{ voirie: VoirieModifiee | null; evaluation: Evaluation | null }>> {
  const id = IdentifiantVoirie.safeParse(roadId);
  const champs = ModificationFiche.safeParse(modification);
  if (!id.success) return { ok: false, erreur: "Voirie inconnue." };
  if (!champs.success) return { ok: false, erreur: champs.error.issues[0]?.message ?? "Données invalides." };

  try {
    const { supabase, utilisateur } = await contexte();
    if (!supabase || !utilisateur) return { ok: false, erreur: SESSION_EXPIREE };

    let voirie: VoirieModifiee | null = null;
    if (champs.data.voirie && Object.keys(champs.data.voirie).length) {
      const maj = { ...champs.data.voirie, ...(champs.data.voirie.gestionnaire ? { gestionnaire_source: "manuel" } : {}) };
      const { data, error } = await supabase
        .from("roads")
        .update(maj)
        .eq("id", id.data)
        .select("gestionnaire, gestionnaire_detail, statut_fiche")
        .maybeSingle();
      if (error || !data) return { ok: false, erreur: "Enregistrement refusé ou impossible (voirie)." };
      voirie = data as VoirieModifiee;
    }

    let evaluation: Evaluation | null = null;
    if (champs.data.evaluation) {
      const { data, error } = await supabase
        .from("road_evaluations")
        .upsert({ road_id: id.data, ...champs.data.evaluation, updated_by: utilisateur.id }, { onConflict: "road_id" })
        .select("*")
        .maybeSingle();
      if (error || !data) return { ok: false, erreur: "Enregistrement refusé ou impossible (évaluation)." };
      evaluation = data as Evaluation;
    }
    return { ok: true, donnees: { voirie, evaluation } };
  } catch {
    return { ok: false, erreur: "Impossible de joindre la base de données. Vérifie la connexion internet." };
  }
}

/** Enregistrer seulement des champs d'évaluation. */
export async function enregistrerEvaluation(roadId: string, modification: unknown) {
  const champs = ModificationEvaluation.safeParse(modification);
  if (!champs.success) return { ok: false as const, erreur: champs.error.issues[0]?.message ?? "Données invalides." };
  return enregistrerFiche(roadId, { evaluation: champs.data });
}

/** Supprimer l'évaluation d'une voirie (la voirie elle-même reste). */
export async function supprimerEvaluation(roadId: string): Promise<ResultatAction> {
  const id = IdentifiantVoirie.safeParse(roadId);
  if (!id.success) return { ok: false, erreur: "Voirie inconnue." };
  const { supabase, utilisateur } = await contexte();
  if (!supabase || !utilisateur) return { ok: false, erreur: SESSION_EXPIREE };
  const { error } = await supabase.from("road_evaluations").delete().eq("road_id", id.data);
  if (error) return { ok: false, erreur: "Suppression impossible." };
  return { ok: true, donnees: null };
}
