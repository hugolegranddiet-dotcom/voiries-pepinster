import type { Metadata } from "next";
import { COULEUR_BANDE } from "@/components/badges";
import { AvertissementScore, Carte, EnTetePage } from "@/components/blocs";
import {
  COUVERTURE_MINIMALE,
  ECHELLES_PAR_DEFAUT,
  LIBELLES_BANDES,
  LIBELLES_CRITERES,
  POIDS_PAR_DEFAUT,
  SEUILS_PAR_DEFAUT,
  type CritereScore,
} from "@/lib/priority/defaults";

export const metadata: Metadata = { title: "Paramètres" };

const CRITERES = Object.keys(POIDS_PAR_DEFAUT) as CritereScore[];

export default function PageParametres() {
  return (
    <>
      <EnTetePage
        titre="Paramètres"
        description="Règles du score de priorité validées en phase 0. Elles sont affichées en lecture seule ; leur modification sera possible en phase 6."
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 md:px-8">
        <Carte titre="Poids des critères">
          <ul className="space-y-3">
            {CRITERES.map((c) => (
              <li key={c}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink">{LIBELLES_CRITERES[c]}</span>
                  <span className="font-semibold tabular-nums text-ink">{POIDS_PAR_DEFAUT[c]} %</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" role="presentation">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${POIDS_PAR_DEFAUT[c]}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Carte>

        <div className="grid gap-5 md:grid-cols-2">
          {CRITERES.map((c) => (
            <Carte key={c} titre={LIBELLES_CRITERES[c]}>
              <table className="w-full text-sm">
                <caption className="sr-only">Échelle : {LIBELLES_CRITERES[c]}</caption>
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="pb-1.5 text-left font-medium">Valeur</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ECHELLES_PAR_DEFAUT[c].map((e) => (
                    <tr key={e.valeur}>
                      <td className="py-1.5 text-ink">{e.valeur}</td>
                      <td className="py-1.5 text-right tabular-nums text-ink">{e.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Carte>
          ))}
        </div>

        <Carte titre="Couleurs">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SEUILS_PAR_DEFAUT.map((s) => (
              <li key={s.bande} className="flex items-center gap-3 text-sm">
                <span className={`size-4 rounded-full ${COULEUR_BANDE[s.bande]}`} aria-hidden="true" />
                <span className="w-16 tabular-nums text-ink">{s.min} – {s.max}</span>
                <span className="text-muted">{LIBELLES_BANDES[s.bande]}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 text-sm">
              <span className={`size-4 rounded-full ${COULEUR_BANDE.gris}`} aria-hidden="true" />
              <span className="w-16 text-ink">aucun</span>
              <span className="text-muted">Non évalué</span>
            </li>
          </ul>
        </Carte>

        <Carte titre="Règles de fiabilité">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
            <li>Pas de score sans <strong>note d&apos;état validée</strong> (« RAS » seul ne suffit pas).</li>
            <li>Au moins un autre critère doit être renseigné.</li>
            <li>
              Les critères renseignés doivent représenter au moins{" "}
              <strong>{Math.round(COUVERTURE_MINIMALE * 100)} %</strong> des poids.
            </li>
            <li>Score = moyenne pondérée des critères renseignés, arrondie à l&apos;entier.</li>
            <li>Mention « provisoire » tant qu&apos;un critère manque.</li>
            <li>Voiries SPW et d&apos;autres gestionnaires : exclues du classement communal, toujours visibles.</li>
          </ul>
        </Carte>

        <AvertissementScore />
      </div>
    </>
  );
}
