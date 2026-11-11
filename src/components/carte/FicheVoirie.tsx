import { BadgeGestionnaire, BadgePriorite, EtiquetteDemo } from "@/components/badges";
import { AvertissementScore } from "@/components/blocs";
import {
  LIBELLES_DENSITE,
  LIBELLES_ETAT,
  LIBELLES_INTENSITE,
  LIBELLES_STATUT,
} from "@/lib/domaine";
import { donneesManquantes, type VoirieDemo } from "@/lib/demo/voiries-demo";

function Champ({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted">{libelle}</dt>
      <dd className={valeur === null ? "italic text-muted" : "text-ink"}>
        {valeur ?? "non renseigné"}
      </dd>
    </div>
  );
}

/** Fiche d'une voirie (lecture seule en phase 1). */
export function FicheVoirie({ voirie }: { voirie: VoirieDemo }) {
  const manquantes = donneesManquantes(voirie);
  const provisoire = voirie.scoreDemo !== null && voirie.couvertureDemo < 1;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetteDemo />
          <BadgeGestionnaire gestionnaire={voirie.gestionnaire} />
        </div>
        <h2 className="mt-2 text-xl font-semibold text-ink">{voirie.nom}</h2>
        <p className="text-sm text-muted">Statut : {LIBELLES_STATUT[voirie.statut]}</p>
      </div>

      <section aria-label="Priorité" className="rounded-lg border border-line bg-canvas p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Priorité (exemple)</p>
        <div className="mt-1">
          <BadgePriorite score={voirie.scoreDemo} provisoire={provisoire} taille="grande" />
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted">
            <span>Critères renseignés</span>
            <span>{Math.round(voirie.couvertureDemo * 100)} %</span>
          </div>
          <div
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"
            role="presentation"
          >
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${voirie.couvertureDemo * 100}%` }}
            />
          </div>
        </div>
        {manquantes.length > 0 && (
          <p className="mt-2 text-xs text-muted">Manquant : {manquantes.join(", ")}</p>
        )}
      </section>

      <dl className="divide-y divide-line">
        <Champ
          libelle="État de la chaussée"
          valeur={voirie.etatNote === null ? null : LIBELLES_ETAT[voirie.etatNote]}
        />
        <Champ
          libelle="Mention Excel"
          valeur={voirie.mentionEtatSource === "vide" ? null : voirie.mentionEtatSource}
        />
        <Champ libelle="Type d'habitat" valeur={voirie.typeHabitat} />
        <Champ
          libelle="Circulation"
          valeur={voirie.intensite === null ? null : LIBELLES_INTENSITE[voirie.intensite]}
        />
        <Champ
          libelle="Densité d'habitation"
          valeur={voirie.densite === null ? null : LIBELLES_DENSITE[voirie.densite]}
        />
        <Champ
          libelle="Risque sécurité"
          valeur={voirie.risqueSecurite === null ? null : `${voirie.risqueSecurite} / 5`}
        />
        <Champ libelle="Ampleur des travaux" valeur={voirie.ampleurTravaux} />
        <Champ libelle="Échéance (brute)" valeur={voirie.echeanceBrute} />
        <Champ libelle="Particularités" valeur={voirie.particularites} />
      </dl>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Modifier la fiche
        </button>
        <p className="text-center text-xs text-muted">
          La modification sera disponible en phase 5.
        </p>
      </div>

      <AvertissementScore />
    </div>
  );
}
