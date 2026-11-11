import type { Metadata } from "next";
import { BadgeGestionnaire, BadgePriorite, EtiquetteDemo } from "@/components/badges";
import { EnTetePage } from "@/components/blocs";
import { LIBELLES_DENSITE, LIBELLES_INTENSITE } from "@/lib/domaine";
import { donneesManquantes, VOIRIES_DEMO } from "@/lib/demo/voiries-demo";

export const metadata: Metadata = { title: "Voiries" };

const vide = <span className="italic text-muted">—</span>;

export default function PageVoiries() {
  return (
    <>
      <EnTetePage
        titre="Voiries"
        description={
          <>
            Liste unifiée de toutes les voiries. Recherche, tri et filtres arriveront en
            phase 5 ; la sélection synchronisée avec la carte aussi.
          </>
        }
        actions={<EtiquetteDemo />}
      />

      <div className="px-4 py-5 md:px-8">
        <p className="mb-3 text-sm text-muted">
          {VOIRIES_DEMO.length} voiries de démonstration
        </p>

        {/* Tableau (ordinateur) */}
        <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface lg:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Voiries de démonstration</caption>
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Nom</th>
                <th scope="col" className="px-4 py-3 font-medium">Gestionnaire</th>
                <th scope="col" className="px-4 py-3 font-medium">État</th>
                <th scope="col" className="px-4 py-3 font-medium">Circulation</th>
                <th scope="col" className="px-4 py-3 font-medium">Densité</th>
                <th scope="col" className="px-4 py-3 font-medium">Travaux</th>
                <th scope="col" className="px-4 py-3 font-medium">Échéance</th>
                <th scope="col" className="px-4 py-3 font-medium">Score</th>
                <th scope="col" className="px-4 py-3 font-medium">Manquant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {VOIRIES_DEMO.map((v) => {
                const manquantes = donneesManquantes(v);
                return (
                  <tr key={v.id} className="hover:bg-canvas">
                    <th scope="row" className="whitespace-nowrap px-4 py-3 font-medium text-ink">{v.nom}</th>
                    <td className="px-4 py-3"><BadgeGestionnaire gestionnaire={v.gestionnaire} /></td>
                    <td className="px-4 py-3">{v.etatNote ?? vide}</td>
                    <td className="px-4 py-3">{v.intensite ? LIBELLES_INTENSITE[v.intensite] : vide}</td>
                    <td className="px-4 py-3">{v.densite ? LIBELLES_DENSITE[v.densite] : vide}</td>
                    <td className="px-4 py-3">{v.ampleurTravaux ?? vide}</td>
                    <td className="px-4 py-3">{v.echeanceBrute ?? vide}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BadgePriorite
                        score={v.scoreDemo}
                        provisoire={v.scoreDemo !== null && v.couvertureDemo < 1}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {manquantes.length ? manquantes.join(", ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cartes (téléphone et tablette) */}
        <ul className="flex flex-col gap-3 lg:hidden">
          {VOIRIES_DEMO.map((v) => {
            const manquantes = donneesManquantes(v);
            return (
              <li key={v.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{v.nom}</p>
                    <div className="mt-1">
                      <BadgeGestionnaire gestionnaire={v.gestionnaire} />
                    </div>
                  </div>
                  <BadgePriorite
                    score={v.scoreDemo}
                    provisoire={v.scoreDemo !== null && v.couvertureDemo < 1}
                  />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">État</dt>
                  <dd>{v.etatNote ?? vide}</dd>
                  <dt className="text-muted">Circulation</dt>
                  <dd>{v.intensite ? LIBELLES_INTENSITE[v.intensite] : vide}</dd>
                  <dt className="text-muted">Densité</dt>
                  <dd>{v.densite ? LIBELLES_DENSITE[v.densite] : vide}</dd>
                  <dt className="text-muted">Travaux</dt>
                  <dd>{v.ampleurTravaux ?? vide}</dd>
                </dl>
                {manquantes.length > 0 && (
                  <p className="mt-2 text-xs text-muted">Manquant : {manquantes.join(", ")}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
