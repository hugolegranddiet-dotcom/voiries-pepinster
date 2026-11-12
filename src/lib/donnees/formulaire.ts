// Formulaire de fiche : conversion depuis la fiche, et calcul des seules
// modifications à envoyer au serveur. Toutes les valeurs du formulaire sont
// des chaînes ("" = non renseigné).
import type { FicheVoirie } from "@/lib/donnees/types";

export interface Formulaire {
  gestionnaire: string;
  gestionnaire_detail: string;
  statut_fiche: string;
  etat_note: string;
  intensite_circulation: string;
  densite_habitation: string;
  risque_securite: string;
  ampleur_travaux: string;
  echeance_brute: string;
  annee_prevue: string;
  mobilite_note: string;
  particularites: string;
  priorite_manuelle: string;
  priorite_manuelle_motif: string;
}

const CHAMPS_VOIRIE = ["gestionnaire", "gestionnaire_detail", "statut_fiche"] as const;
const CHAMPS_NUMERIQUES = new Set(["etat_note", "risque_securite", "annee_prevue", "priorite_manuelle"]);

export function versFormulaire(f: FicheVoirie): Formulaire {
  const e = f.evaluation;
  const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));
  return {
    gestionnaire: f.gestionnaire,
    gestionnaire_detail: s(f.gestionnaireDetail),
    statut_fiche: f.statutFiche,
    etat_note: s(e?.etat_note),
    intensite_circulation: s(e?.intensite_circulation),
    densite_habitation: s(e?.densite_habitation),
    risque_securite: s(e?.risque_securite),
    ampleur_travaux: s(e?.ampleur_travaux),
    echeance_brute: s(e?.echeance_brute),
    annee_prevue: s(e?.annee_prevue),
    mobilite_note: s(e?.mobilite_note),
    particularites: s(e?.particularites),
    priorite_manuelle: s(e?.priorite_manuelle),
    priorite_manuelle_motif: s(e?.priorite_manuelle_motif),
  };
}

/** Ne garde que les champs modifiés, au format attendu par le serveur. */
export function differences(avant: Formulaire, apres: Formulaire) {
  const voirie: Record<string, unknown> = {};
  const evaluation: Record<string, unknown> = {};
  for (const cle of Object.keys(apres) as Array<keyof Formulaire>) {
    if (avant[cle].trim() === apres[cle].trim()) continue;
    const brut = apres[cle].trim();
    const valeur = brut === "" ? null : CHAMPS_NUMERIQUES.has(cle) ? Number(brut) : brut;
    if ((CHAMPS_VOIRIE as readonly string[]).includes(cle)) voirie[cle] = valeur;
    else evaluation[cle] = valeur;
  }
  // Priorité forcée et motif voyagent toujours ensemble : la base exige un motif
  // dès qu'une priorité est forcée, et les efface ensemble quand on revient au calcul.
  if ("priorite_manuelle" in evaluation || "priorite_manuelle_motif" in evaluation) {
    const force = apres.priorite_manuelle.trim();
    evaluation.priorite_manuelle = force === "" ? null : Number(force);
    evaluation.priorite_manuelle_motif = force === "" ? null : apres.priorite_manuelle_motif.trim() || null;
  }
  return {
    ...(Object.keys(voirie).length ? { voirie } : {}),
    ...(Object.keys(evaluation).length ? { evaluation } : {}),
  };
}

