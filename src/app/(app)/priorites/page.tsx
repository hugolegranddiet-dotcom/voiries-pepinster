import type { Metadata } from "next";
import { BadgeGestionnaire, BadgePriorite, EtiquetteDemo } from "@/components/badges";
import { AvertissementScore, Carte, EnTetePage } from "@/components/blocs";
import { VOIRIES_DEMO } from "@/lib/demo/voiries-demo";
import { GESTIONNAIRES_CLASSEMENT } from "@/lib/priority/defaults";

export const metadata: Metadata = { title: "Priorités" };

const dansClassement = (g: string) =>
  (GESTIONNAIRES_CLASSEMENT as ReadonlyArray<string>).includes(g);

export default function PagePriorites() {
  const classees = VOIRIES_DEMO.filter(
    (v) => v.scoreDemo !== null && dansClassement(v.gestionnaire),
  ).sort((a, b) => (b.scoreDemo ?? 0) - (a.scoreDemo ?? 0));

  const horsCommune = VOIRIES_DEMO.filter((v) => !dansClassement(v.gestionnaire));
  const nonEvaluees = VOIRIES_DEMO.filter(
    (v) => v.scoreDemo === null && dansClassement(v.gestionnaire),
  );

  return (
    <>
      <EnTetePage
        titre="Priorités"
        description="Classement des interventions communales, de la priorité la plus élevée à la plus faible."
        actions={<EtiquetteDemo />}
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 md:px-8">
        <AvertissementScore />

        <Carte titre="Classement communal">
          <ol className="divide-y divide-line">
            {classees.map((v, i) => (
              <li key={v.id} className="flex items-center gap-4 py-3">
                <span className="w-7 text-right text-lg font-semibold tabular-nums text-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{v.nom}</p>
                  <p className="text-xs text-muted">
                    Critères renseignés : {Math.round(v.couvertureDemo * 100)} %
                  </p>
                </div>
                <BadgePriorite score={v.scoreDemo} provisoire={v.couvertureDemo < 1} />
              </li>
            ))}
          </ol>
        </Carte>

        <div className="grid gap-5 md:grid-cols-2">
          <Carte titre={`Non évaluées (${nonEvaluees.length})`}>
            <p className="mb-2 text-sm text-muted">
              Pas de note d&apos;état validée ou trop peu de critères : pas de score.
            </p>
            <ul className="space-y-1 text-sm">
              {nonEvaluees.map((v) => (
                <li key={v.id} className="text-ink">{v.nom}</li>
              ))}
            </ul>
          </Carte>
          <Carte titre={`Hors classement communal (${horsCommune.length})`}>
            <p className="mb-2 text-sm text-muted">
              Voiries SPW ou d&apos;un autre gestionnaire : visibles sur la carte, exclues de
              ce classement.
            </p>
            <ul className="space-y-1.5 text-sm">
              {horsCommune.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2">
                  <span className="text-ink">{v.nom}</span>
                  <BadgeGestionnaire gestionnaire={v.gestionnaire} />
                </li>
              ))}
            </ul>
          </Carte>
        </div>
      </div>
    </>
  );
}
