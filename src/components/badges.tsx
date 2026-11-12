import type { Gestionnaire } from "@/lib/domaine";
import { LIBELLES_GESTIONNAIRE } from "@/lib/domaine";
import {
  bandeDuScore,
  LIBELLES_BANDES,
  type BandePriorite,
} from "@/lib/priority/defaults";

export const COULEUR_BANDE: Record<BandePriorite, string> = {
  vert: "bg-prio-vert",
  jaune: "bg-prio-jaune",
  orange: "bg-prio-orange",
  rouge: "bg-prio-rouge",
  gris: "bg-prio-gris",
};

/** Pastille de priorité : couleur + chiffre + texte (jamais la couleur seule). */
export function BadgePriorite({
  score,
  bande: bandeDonnee,
  provisoire = false,
  manuel = false,
  taille = "normale",
}: {
  score: number | null;
  /** Priorité fixée à la main par le père. */
  manuel?: boolean;
  /** Bande calculée par prioriteEffective (sinon : seuils par défaut). */
  bande?: BandePriorite;
  provisoire?: boolean;
  taille?: "normale" | "grande";
}) {
  const bande = bandeDonnee ?? bandeDuScore(score);
  const grande = taille === "grande";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block shrink-0 rounded-full ${COULEUR_BANDE[bande]} ${
          grande ? "size-4" : "size-3"
        }`}
      />
      <span className={grande ? "text-lg font-semibold" : "font-medium"}>
        {score === null ? "Non évalué" : score}
      </span>
      {score !== null && (
        <span className="sr-only">sur 100, {LIBELLES_BANDES[bande]}</span>
      )}
      {manuel && score !== null && (
        <span className="rounded border border-ink/40 bg-canvas px-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink" title="Priorité fixée à la main">
          manuel
        </span>
      )}
      {provisoire && !manuel && score !== null && (
        <span className="rounded border border-line px-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted">
          provisoire
        </span>
      )}
    </span>
  );
}

/** Gestionnaire de la voirie ; SPW et « autre » sont signalés par un pointillé. */
export function BadgeGestionnaire({ gestionnaire }: { gestionnaire: Gestionnaire }) {
  const horsCommune = gestionnaire === "spw" || gestionnaire === "autre";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${
        horsCommune
          ? "border border-dashed border-ink/50 text-ink"
          : gestionnaire === "inconnu"
            ? "bg-canvas text-muted"
            : "bg-brand-soft text-brand-strong"
      }`}
    >
      {LIBELLES_GESTIONNAIRE[gestionnaire]}
    </span>
  );
}
