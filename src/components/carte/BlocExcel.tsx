import {
  LIBELLES_DENSITE,
  LIBELLES_GESTIONNAIRE,
  LIBELLES_INTENSITE,
} from "@/lib/domaine";
import type { FicheExcel } from "@/lib/excel/types";
import type { DonneesExcelCarte } from "@/lib/matching/decisions";

type EntreeVoirie = DonneesExcelCarte["parVoirie"][string];

const LIBELLE_CONFIANCE: Record<string, string> = {
  forte: "confiance forte",
  moyenne: "confiance moyenne",
  faible: "partie de rue",
  aucune: "aucune",
};

function Champ({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted">{libelle}</dt>
      <dd className={valeur ? "text-ink" : "italic text-muted"}>{valeur ?? "non renseigné"}</dd>
    </div>
  );
}

const LIBELLES_TRAVAUX: Record<string, string> = {
  schlammage: "Schlammage",
  enduisage: "Enduisage",
  raclage_partiel: "Raclage/pose partiel",
  raclage_complet: "Raclage/pose complet",
  reparation_ponctuelle: "Réparation ponctuelle",
};

function travaux(f: FicheExcel): string | null {
  if (!f.ampleurTravaux) return null;
  const propre = LIBELLES_TRAVAUX[f.ampleurTravaux] ?? f.ampleurTravauxBrut?.trim() ?? null;
  const brut = f.ampleurTravauxBrut?.trim();
  return brut && brut !== propre ? `${propre} (Excel : « ${brut} »)` : propre;
}

function echeance(f: FicheExcel): string | null {
  if (!f.echeanceBrute) return null;
  if (f.anneeRealisation) return `${f.echeanceBrute} (réalisé)`;
  if (f.echeanceEstimeeRegle) return `${f.echeanceBrute} → ${f.echeanceEstimeeRegle}`;
  return f.echeanceBrute;
}

function DonneesValidees({ f }: { f: FicheExcel }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Excel, ligne {f.ligne} — correspondance validée
      </p>
      <dl className="mt-1 divide-y divide-line">
        <Champ libelle="Nom dans l'Excel" valeur={f.nomNettoye} />
        <Champ
          libelle="État (note)"
          valeur={
            f.etatNote
              ? `${f.etatNote} / 5`
              : f.etatNoteSuggeree
                ? `à valider — suggestion : ${f.etatNoteSuggeree} / 5 (couleur Excel)`
                : null
          }
        />
        <Champ libelle="Mention Excel" valeur={f.mentionEtatSource === "vide" ? null : f.mentionEtatSource} />
        <Champ libelle="Gestionnaire" valeur={LIBELLES_GESTIONNAIRE[f.gestionnaire] + (f.gestionnaireDetail ? ` — ${f.gestionnaireDetail}` : "")} />
        <Champ libelle="Type d'habitat" valeur={f.typeHabitatBrut} />
        <Champ
          libelle="Circulation"
          valeur={f.intensite ? `${LIBELLES_INTENSITE[f.intensite]}${f.typeVoirieSource === "Lotissement" ? " (Lotissement)" : ""}` : null}
        />
        <Champ libelle="Densité" valeur={f.densite ? LIBELLES_DENSITE[f.densite] : null} />
        <Champ libelle="Travaux" valeur={travaux(f)} />
        <Champ libelle="Échéance" valeur={echeance(f)} />
        <Champ libelle="Sécurisation" valeur={f.mobiliteNote} />
        <Champ libelle="Particularités" valeur={f.particularites} />
        {f.etiquettes.length > 0 && (
          <Champ libelle="Étiquettes" valeur={f.etiquettes.map((e) => e.replaceAll("_", " ")).join(", ")} />
        )}
      </dl>
    </div>
  );
}

/** Partie « Excel » de la fiche : rien n'est montré comme acquis sans validation. */
export function BlocExcel({ entree }: { entree: EntreeVoirie | undefined }) {
  if (!entree || (!entree.validees.length && !entree.propositions.length && !entree.sections.length)) {
    return (
      <p className="rounded-lg border border-line px-3 py-2.5 text-sm text-muted">
        Aucune ligne de l&apos;Excel ne correspond à cette voirie : elle reste « à compléter ».
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {entree.validees.length > 1 && (
        <p role="note" className="rounded-lg border border-demo-line bg-demo-bg px-3 py-2 text-sm text-demo-ink">
          Plusieurs lignes de l&apos;Excel ont été validées pour cette voirie : à vérifier.
        </p>
      )}
      {entree.validees.map((f) => (
        <DonneesValidees key={f.ligne} f={f} />
      ))}
      {entree.propositions.map((p) => (
        <div key={p.ligne} className="rounded-lg border border-dashed border-demo-line bg-demo-bg/50 px-3 py-2.5 text-sm">
          <p className="font-medium text-demo-ink">Correspondance proposée, à valider</p>
          <p className="text-ink">
            Excel, ligne {p.ligne} : « {p.nomExcel} »{" "}
            <span className="text-muted">({LIBELLE_CONFIANCE[p.confiance] ?? p.confiance})</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Ses données ne seront affichées qu&apos;après validation (fichier de validation des correspondances).
          </p>
        </div>
      ))}
      {entree.sections.length > 0 && (
        <div className="rounded-lg border border-line px-3 py-2.5 text-sm">
          <p className="font-medium text-ink">Parties évaluées séparément dans l&apos;Excel</p>
          <ul className="mt-1 list-disc pl-5 text-ink">
            {entree.sections.map((s) => (
              <li key={s.ligne}>
                {s.nom} <span className="text-muted">(ligne {s.ligne}, tracé à définir)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
