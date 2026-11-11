// Détail transparent du score d'une voirie (PLAN.md §6.6) : chaque critère,
// sa valeur, ses points, son poids, sa contribution, puis la couverture,
// la version des paramètres et les critères manquants.
import { BadgePriorite } from "@/components/badges";
import { LIBELLES_CRITERES, libelleValeur, LIBELLES_BANDES, type ParametresScore } from "@/lib/priority/defaults";
import { LIBELLES_RAISON, type ResultatScore } from "@/lib/priority/score";

const pourcent = (x: number) => `${Math.round(x * 100)} %`;
const unChiffre = (x: number) => x.toLocaleString("fr-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function DetailScore({
  resultat,
  parametres,
  horsClassement,
}: {
  resultat: ResultatScore;
  parametres: ParametresScore;
  /** Gestionnaire hors commune : visible, mais exclu du classement communal. */
  horsClassement: boolean;
}) {
  const r = resultat;
  const poidsTotal = r.details.reduce((s, d) => s + d.poids, 0) || 1;
  return (
    <section aria-label="Priorité" className="rounded-lg border border-line bg-canvas p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Priorité (score sur 100)</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <BadgePriorite score={r.score} bande={r.bande} provisoire={r.provisoire} taille="grande" />
        {r.score !== null && <span className="text-sm text-muted">{LIBELLES_BANDES[r.bande]}</span>}
      </div>
      {r.raison && (
        <p className="mt-1 text-sm text-ink">
          Pas de score : <strong>{LIBELLES_RAISON[r.raison]}</strong>
          {r.raison === "couverture_insuffisante" && ` (${pourcent(r.couverture)} des poids, il en faut ${pourcent(parametres.couverture_min)})`}.
        </p>
      )}
      {horsClassement && (
        <p className="mt-1 text-xs text-muted">Gestionnaire hors commune : exclue par défaut du classement communal.</p>
      )}

      <details className="group mt-2">
        <summary className="cursor-pointer text-sm font-medium text-brand">Détail du calcul</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Détail du calcul du score</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1 pr-2 font-medium">Critère</th>
                <th scope="col" className="py-1 pr-2 font-medium">Valeur</th>
                <th scope="col" className="py-1 pr-2 text-right font-medium">Points</th>
                <th scope="col" className="py-1 pr-2 text-right font-medium">Poids</th>
                <th scope="col" className="py-1 text-right font-medium">Apport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.details.map((d) => (
                <tr key={d.critere}>
                  <th scope="row" className="py-1 pr-2 font-normal text-ink">{LIBELLES_CRITERES[d.critere]}</th>
                  <td className={`py-1 pr-2 ${d.points === null ? "italic text-muted" : "text-ink"}`}>
                    {d.valeur === null ? "non renseigné" : d.invalide ? `« ${d.valeur} » : valeur inconnue, ignorée` : libelleValeur(d.critere, d.valeur)}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums">{d.points ?? "—"}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{pourcent(d.poids / poidsTotal)}</td>
                  <td className="py-1 text-right tabular-nums">{d.contribution === null ? "—" : unChiffre(d.contribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          <li>
            Critères renseignés : <strong className="text-ink">{pourcent(r.couverture)}</strong> des poids (minimum {pourcent(parametres.couverture_min)}).
          </li>
          {r.score !== null && (
            <li>
              Score = somme des apports = {unChiffre(r.details.reduce((s, d) => s + (d.contribution ?? 0), 0))}, arrondi à {r.score}.
            </li>
          )}
          {r.manquants.length > 0 && <li>Manquant : {r.manquants.map((c) => LIBELLES_CRITERES[c].toLowerCase()).join(", ")}.</li>}
          <li>
            Paramètres : {r.version === null ? "valeurs par défaut" : `version ${r.version}`}. Les travaux, l&apos;échéance et les textes libres
            n&apos;entrent pas dans le score.
          </li>
        </ul>
      </details>
    </section>
  );
}
