"use client";

// Classement des voiries par score, à partir de calculerScore (via classer).
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeGestionnaire, BadgePriorite } from "@/components/badges";
import { AvertissementScore } from "@/components/blocs";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { ErreurDonnees } from "@/components/donnees/ErreurDonnees";
import { BoutonExport } from "@/components/donnees/BoutonExport";
import { IconeCarte } from "@/components/icones";
import { classer, type LigneClassement } from "@/lib/priority/classement";
import { LIBELLES_RAISON } from "@/lib/priority/score";

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

function LiensVoirie({ l, aCarte }: { l: LigneClassement; aCarte: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Link href={`/voiries?voirie=${encodeURIComponent(l.id)}`} className="rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand-soft">
        Fiche
      </Link>
      {aCarte && (
        <Link
          href={`/carte?voirie=${encodeURIComponent(l.id)}`}
          className="inline-flex rounded-md p-1.5 text-brand hover:bg-brand-soft"
          aria-label={`Voir ${l.nom} sur la carte`}
          title="Voir sur la carte"
        >
          <IconeCarte width={18} height={18} />
        </Link>
      )}
    </span>
  );
}

export function ClassementPriorites() {
  const { etat } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const [exclure, setExclure] = useState(true);
  const [tout, setTout] = useState(false);

  const c = useMemo(
    () => (donnees ? classer(Object.values(donnees.fiches), donnees.parametres, { exclureHorsCommune: exclure }) : null),
    [donnees, exclure],
  );
  const aValider = useMemo(
    () => (donnees ? Object.values(donnees.fiches).filter((f) => f.evaluation && f.evaluation.etat_note === null && f.evaluation.etat_note_suggeree !== null).length : 0),
    [donnees],
  );

  if (etat.statut === "erreur") return <ErreurDonnees message={etat.message} />;
  if (!donnees || !c) return <p role="status" className="text-sm text-muted">Chargement du classement…</p>;

  const aCarte = (id: string) => Boolean(donnees.fiches[id]?.aTrace || donnees.fiches[id]?.parentId);
  const affichees = tout ? c.classees : c.classees.slice(0, 30);

  return (
    <div className="flex flex-col gap-5">
      <AvertissementScore />

      {donnees.parametresAvertissement && (
        <p role="alert" className="rounded-lg border border-demo-line bg-demo-bg px-3 py-2 text-sm text-demo-ink">
          Aucune version lisible des paramètres en base : le score utilise les valeurs par défaut du plan.
        </p>
      )}

      {aValider > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            <strong>{aValider} notes d&apos;état suggérées</strong> par la couleur de l&apos;Excel attendent ta validation. Tant
            qu&apos;elles ne sont pas validées, ces voiries restent « Non évalué ».
          </p>
          <Link href="/priorites/validation" className="shrink-0 rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-strong">
            Valider les notes suggérées
          </Link>
        </div>
      )}

      <section aria-labelledby="titre-classement" className="rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="titre-classement" className="text-base font-semibold text-ink">
            Classement {exclure ? "communal" : "de toutes les voiries"} ({c.classees.length})
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={exclure} onChange={(e) => setExclure(e.target.checked)} />
            Exclure les voiries SPW et d&apos;autres gestionnaires
          </label>
          <BoutonExport
            prefixe="voiries-pepinster-classement"
            libelle="Exporter le classement (CSV)"
            fiches={() => c.classees.map((l) => donnees.fiches[l.id])}
            rang={(id) => c.classees.find((l) => l.id === id)?.rang ?? null}
          />
        </div>
        {c.classees.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">
            Aucune voirie n&apos;a encore de score : il faut une note d&apos;état validée et assez de critères renseignés.
          </p>
        ) : (
          <ol className="divide-y divide-line">
            {affichees.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-8 shrink-0 text-right text-lg font-semibold tabular-nums text-muted" aria-label={`Rang ${l.rang}`}>
                  {l.rang}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{l.nom}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span>Critères renseignés : {pourcent(l.resultat.couverture)}</span>
                    {l.gestionnaire !== "commune" && <BadgeGestionnaire gestionnaire={l.gestionnaire} />}
                  </p>
                </div>
                <BadgePriorite score={l.resultat.score} bande={l.resultat.bande} provisoire={l.resultat.provisoire} />
                <LiensVoirie l={l} aCarte={aCarte(l.id)} />
              </li>
            ))}
          </ol>
        )}
        {c.classees.length > 30 && (
          <div className="border-t border-line px-4 py-2 text-center">
            <button type="button" onClick={() => setTout((t) => !t)} className="text-sm font-medium text-brand underline underline-offset-2">
              {tout ? "Afficher les 30 premières" : `Afficher les ${c.classees.length} voiries`}
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <details className="rounded-xl border border-line bg-surface p-4">
          <summary className="cursor-pointer text-base font-semibold text-ink">Évaluées en partie, sans score ({c.nonEvaluees.length})</summary>
          <p className="mt-2 text-sm text-muted">Ces voiries ont des données, mais pas assez pour un score.</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {c.nonEvaluees.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-ink">{l.nom}</span>
                  <span className="text-xs text-muted">{l.resultat.raison && LIBELLES_RAISON[l.resultat.raison]}</span>
                </span>
                <LiensVoirie l={l} aCarte={false} />
              </li>
            ))}
          </ul>
        </details>
        <details className="rounded-xl border border-line bg-surface p-4">
          <summary className="cursor-pointer text-base font-semibold text-ink">Hors classement communal ({c.horsClassement.length})</summary>
          <p className="mt-2 text-sm text-muted">Voiries SPW ou d&apos;un autre gestionnaire : toujours visibles sur la carte, en pointillés.</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {c.horsClassement.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-ink">{l.nom}</span>
                <span className="flex items-center gap-2">
                  <BadgeGestionnaire gestionnaire={l.gestionnaire} />
                  <BadgePriorite score={l.resultat.score} bande={l.resultat.bande} provisoire={l.resultat.provisoire} />
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
