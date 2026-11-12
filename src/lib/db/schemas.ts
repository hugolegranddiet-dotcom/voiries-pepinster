// Validation des données envoyées par l'interface avant toute écriture en base.
// La base revérifie ensuite (contraintes + RLS) : double protection.
import { z } from "zod";

const note = z.number().int().min(1).max(5).nullable();
const texteLibre = z
  .string()
  .max(2000, { error: "Texte trop long (2000 caractères maximum)." })
  .transform((t) => t.trim())
  .transform((t) => (t === "" ? null : t))
  .nullable();

export const IdentifiantVoirie = z
  .string()
  .min(1)
  .max(200)
  .regex(/^(n:|w\d|s:)/, { error: "Identifiant de voirie invalide." });

/** Champs d'évaluation modifiables par l'utilisateur (tous facultatifs). */
export const ModificationEvaluation = z
  .object({
    etat_note: note,
    risque_securite: note,
    intensite_circulation: z.enum(["faible", "moyen", "eleve", "transit"]).nullable(),
    densite_habitation: z.enum(["nul", "faible", "moyen_bas", "moyen_eleve", "eleve"]).nullable(),
    ampleur_travaux: z
      .enum(["schlammage", "enduisage", "raclage_partiel", "raclage_complet", "reparation_ponctuelle", "autre"])
      .nullable(),
    echeance_brute: texteLibre,
    annee_prevue: z.number().int().min(1990).max(2100).nullable(),
    mobilite_note: texteLibre,
    particularites: texteLibre,
    statut_validation: z.enum(["non_valide", "partiellement_valide", "valide"]),
    /** Priorité forcée à la main (0 à 100) ; null = revenir au score calculé. */
    priorite_manuelle: z.number().int().min(0).max(100).nullable(),
    priorite_manuelle_motif: z.string().trim().max(500).transform((t) => (t === "" ? null : t)).nullable(),
  })
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, { error: "Aucune modification." })
  .refine((o) => o.priorite_manuelle == null || (o.priorite_manuelle_motif ?? "") !== "", {
    error: "Indique la raison de la priorité forcée.",
  });

export type ModificationEvaluation = z.infer<typeof ModificationEvaluation>;

/** Champs de la voirie modifiables par l'utilisateur. */
export const ModificationVoirie = z
  .object({
    gestionnaire: z.enum(["commune", "spw", "autre", "inconnu"]),
    gestionnaire_detail: texteLibre,
    statut_fiche: z.enum(["a_completer", "importe_excel", "valide", "n_existe_plus", "hors_commune"]),
  })
  .partial()
  .strict();

export type ModificationVoirie = z.infer<typeof ModificationVoirie>;

/** Une modification de fiche : voirie et/ou évaluation. */
export const ModificationFiche = z
  .object({
    voirie: ModificationVoirie.optional(),
    evaluation: ModificationEvaluation.optional(),
  })
  .strict()
  .refine((o) => !!o.evaluation || (!!o.voirie && Object.keys(o.voirie).length > 0), { error: "Aucune modification." });
