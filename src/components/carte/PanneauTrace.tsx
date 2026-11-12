"use client";

// Panneau affiché pendant le choix des morceaux d'une partie de rue (D21).
import { useState, useTransition } from "react";
import { enregistrerTraceSection } from "@/app/actions/sections";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { nomAffiche } from "@/lib/donnees/libelles";

export function PanneauTrace({
  sectionId,
  choisis,
  total,
  pris,
  onVider,
  onTerminer,
}: {
  sectionId: string;
  choisis: ReadonlySet<string>;
  /** Nombre de morceaux de la rue mère. */
  total: number;
  /** Nombre de morceaux déjà pris par les autres parties. */
  pris: number;
  onVider: () => void;
  /** Sortie du mode (enregistré ou annulé). */
  onTerminer: (enregistre: boolean) => void;
}) {
  const { etat, majFiche } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const section = donnees?.fiches[sectionId];
  const parent = section?.parentId ? donnees?.fiches[section.parentId] : undefined;
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!section) return null;
  const enregistrer = () =>
    demarrer(async () => {
      setErreur(null);
      const r = await enregistrerTraceSection({ sectionId, segments: [...choisis] });
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      majFiche(sectionId, { voirie: { segmentsSection: r.donnees.segments, aTrace: r.donnees.segments.length > 0 } });
      onTerminer(true);
    });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tracé d&apos;une partie de rue</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{nomAffiche(section)}</h2>
        {parent && <p className="text-sm text-muted">partie de {nomAffiche(parent)}</p>}
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink">
        <li>
          Sur la carte, clique les morceaux de la rue qui font partie de <strong>{nomAffiche(section)}</strong>. Un morceau choisi devient un{" "}
          <strong>trait plein</strong> ; un nouveau clic le retire.
        </li>
        <li>Les morceaux en <strong>tirets fins gris</strong> appartiennent déjà à une autre partie de la rue.</li>
        <li>Clique « Enregistrer le tracé ».</li>
      </ol>
      <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink" role="status">
        <strong>{choisis.size}</strong> morceau{choisis.size > 1 ? "x" : ""} choisi{choisis.size > 1 ? "s" : ""} sur {total}
        {pris > 0 && ` (${pris} déjà pris par d'autres parties)`}
      </p>
      <p className="text-xs text-muted">
        Les morceaux sont ceux d&apos;OpenStreetMap : on ne peut pas en couper un. Si un morceau dépasse un peu la partie de rue, prends-le ou laisse-le,
        selon ce qui est le plus juste.
      </p>
      {erreur && (
        <p role="alert" className="rounded-lg border border-prio-rouge/30 bg-prio-rouge/5 px-3 py-2 text-sm text-prio-rouge">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={enCours} onClick={enregistrer} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50">
          {enCours ? "Enregistrement…" : "Enregistrer le tracé"}
        </button>
        <button type="button" disabled={enCours} onClick={() => onTerminer(false)} className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-canvas">
          Annuler
        </button>
        {choisis.size > 0 && (
          <button type="button" disabled={enCours} onClick={onVider} className="text-sm text-muted underline underline-offset-2">
            Tout retirer
          </button>
        )}
      </div>
    </div>
  );
}
