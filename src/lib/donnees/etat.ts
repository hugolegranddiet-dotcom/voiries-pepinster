// État de la chaussée (note 1 à 5) : couleurs et filtres, partagés par la carte et la liste.
import { LIBELLES_ETAT, type Note1a5 } from "@/lib/domaine";

/** Valeur de filtre : une note, ou « pas encore notée ». */
export type FiltreEtat = "1" | "2" | "3" | "4" | "5" | "non_note";

/** Ordre d'affichage : du plus dégradé au meilleur, puis « non noté ». */
export const FILTRES_ETAT: readonly FiltreEtat[] = ["5", "4", "3", "2", "1", "non_note"];

/**
 * Dégradé vert → rouge (choix de Hugo, 11/11/2026). La clarté baisse
 * régulièrement de 1 à 5 : les notes restent distinguables pour la plupart
 * des personnes daltoniennes, et le chiffre est toujours écrit à côté.
 */
export const COULEURS_ETAT: Record<FiltreEtat, string> = {
  "1": "#1a9850",
  "2": "#7fbc41",
  "3": "#d9a400",
  "4": "#e8590c",
  "5": "#a50026",
  non_note: "#8a9499",
};

export const LIBELLES_FILTRE_ETAT: Record<FiltreEtat, string> = {
  ...(Object.fromEntries(Object.entries(LIBELLES_ETAT)) as Record<Exclude<FiltreEtat, "non_note">, string>),
  non_note: "Pas encore noté",
};

export function cleEtat(note: Note1a5 | number | null | undefined): FiltreEtat {
  return note && note >= 1 && note <= 5 ? (String(note) as FiltreEtat) : "non_note";
}
