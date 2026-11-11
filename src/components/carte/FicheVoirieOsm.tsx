import { BadgePriorite } from "@/components/badges";
import { AvertissementScore } from "@/components/blocs";
import type { VoirieLogique } from "@/lib/geo/types";

const LIBELLE_CATEGORIE = {
  voirie: "Voirie carrossable",
  chemin: "Chemin ou sentier",
  acces: "Accès ou parking sans nom",
} as const;

const LIBELLE_INDICE_SPW = {
  oui: "Probablement régionale (SPW)",
  partiel: "En partie le long du réseau régional",
  non: "Non régionale",
  inconnu: "Non vérifié",
} as const;

function Ligne({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted">{libelle}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

const km = (m: number) =>
  m >= 1000 ? `${(m / 1000).toLocaleString("fr-BE", { maximumFractionDigits: 2 })} km` : `${m} m`;

/** Fiche d'une voirie réelle (données OSM). Les critères arrivent en phase 3. */
export function FicheVoirieOsm({ voirie }: { voirie: VoirieLogique }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
            {LIBELLE_CATEGORIE[voirie.categorie]}
          </span>
          <span className="rounded-md bg-demo-bg px-2 py-0.5 text-xs font-medium text-demo-ink">
            À compléter
          </span>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-ink">
          {voirie.nom ?? <span className="italic text-muted">Voie sans nom</span>}
          {voirie.partie && (
            <span className="ml-2 text-base font-normal text-muted">
              partie {voirie.partie.numero}/{voirie.partie.total}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted">{voirie.sections.join(" · ") || "Ancienne commune non déterminée"}</p>
      </div>

      {voirie.alerte && (
        <p role="note" className="rounded-lg border border-demo-line bg-demo-bg px-3 py-2 text-sm text-demo-ink">
          {voirie.alerte === "trou_possible"
            ? `Une autre partie porte le même nom à ${voirie.distanceAutreGroupeM} m : peut-être un morceau manquant dans OpenStreetMap.`
            : `Une autre partie porte le même nom à ${voirie.distanceAutreGroupeM} m, sans lien entre elles. Même rue ou homonyme ? À vérifier.`}
        </p>
      )}

      <section aria-label="Priorité" className="rounded-lg border border-line bg-canvas p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Priorité</p>
        <div className="mt-1">
          <BadgePriorite score={null} taille="grande" />
        </div>
        <p className="mt-2 text-xs text-muted">
          Aucun critère pour l&apos;instant : l&apos;état, la circulation et la densité viendront
          de l&apos;Excel en phase 3, après validation des correspondances.
        </p>
      </section>

      <dl className="divide-y divide-line">
        <Ligne libelle="Longueur">{km(voirie.longueurM)}</Ligne>
        <Ligne libelle="Gestionnaire (indice)">{LIBELLE_INDICE_SPW[voirie.indiceSpw]}{voirie.refsSpw.length ? ` — ${voirie.refsSpw.join(", ")}` : ""}</Ligne>
        <Ligne libelle="Type OSM">{voirie.types.join(", ")}</Ligne>
        <Ligne libelle="Segments">{voirie.segments.length}</Ligne>
        <Ligne libelle="Limite communale">{voirie.traverseLimite ? "Coupée à la limite de la commune" : "Entièrement dans la commune"}</Ligne>
        <Ligne libelle="Source">
          {voirie.ways.slice(0, 4).map((w, i) => (
            <span key={w}>
              {i > 0 && ", "}
              <a
                className="text-brand underline underline-offset-2"
                href={`https://www.openstreetmap.org/way/${w}`}
                target="_blank"
                rel="noreferrer"
              >
                way {w}
              </a>
            </span>
          ))}
          {voirie.ways.length > 4 && ` et ${voirie.ways.length - 4} autres`}
        </Ligne>
      </dl>

      <AvertissementScore />
    </div>
  );
}
