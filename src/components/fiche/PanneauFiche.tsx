"use client";

// Fiche d'une voirie, consultable et modifiable. Utilisée sur la carte et dans le tableau.
import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { enregistrerFiche } from "@/app/actions/evaluations";
import { BadgeGestionnaire, BadgePriorite } from "@/components/badges";
import { DetailScore } from "@/components/priorite/DetailScore";
import { dansClassementCommunal } from "@/lib/priority/classement";
import type { ParametresScore } from "@/lib/priority/defaults";
import { calculerScore } from "@/lib/priority/score";
import { AvertissementScore } from "@/components/blocs";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import {
  LIBELLES_DENSITE,
  LIBELLES_ETAT,
  LIBELLES_GESTIONNAIRE,
  LIBELLES_INTENSITE,
  LIBELLES_STATUT,
  type Gestionnaire,
  type StatutFiche,
} from "@/lib/domaine";
import { LIBELLES_CATEGORIE, LIBELLES_RISQUE, LIBELLES_TRAVAUX, nomAffiche } from "@/lib/donnees/libelles";
import { differences, versFormulaire, type Formulaire } from "@/lib/donnees/formulaire";
import type { Evaluation } from "@/lib/donnees/types";

/** Score qu'aurait la voirie avec les valeurs du formulaire (aperçu, rien n'est enregistré). */
function apercu(f: Formulaire, p: ParametresScore) {
  const r = calculerScore(
    {
      etat_note: f.etat_note ? Number(f.etat_note) : null,
      intensite_circulation: f.intensite_circulation || null,
      densite_habitation: f.densite_habitation || null,
      risque_securite: f.risque_securite ? Number(f.risque_securite) : null,
    },
    p,
  );
  return { score: r.score, bande: r.bande, provisoire: r.provisoire };
}

// ---------------------------------------------------------------------------
// Petits composants d'affichage
// ---------------------------------------------------------------------------
function Ligne({ libelle, valeur }: { libelle: string; valeur: ReactNode | null }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted">{libelle}</dt>
      <dd className={valeur === null || valeur === "" ? "italic text-muted" : "text-ink"}>
        {valeur === null || valeur === "" ? "non renseigné" : valeur}
      </dd>
    </div>
  );
}

const classeChamp = "w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-ink";

function Champ({ id, libelle, aide, children }: { id: string; libelle: string; aide?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {libelle}
      </label>
      {children}
      {aide && <p className="text-xs text-muted">{aide}</p>}
    </div>
  );
}

function Choix({ id, valeur, options, onChange }: { id: string; valeur: string; options: Array<[string, string]>; onChange: (v: string) => void }) {
  return (
    <select id={id} value={valeur} onChange={(e) => onChange(e.target.value)} className={classeChamp}>
      <option value="">— non renseigné —</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function echeanceLisible(e: Evaluation | null): string | null {
  if (!e?.echeance_brute && !e?.annee_prevue) return null;
  const morceaux = [e.echeance_brute];
  if (e.annee_realisation) morceaux.push("(réalisé)");
  else if (e.echeance_estimee_regle) morceaux.push(`→ ${e.echeance_estimee_regle}`);
  if (e.annee_prevue && String(e.annee_prevue) !== e.echeance_brute) morceaux.push(`prévue en ${e.annee_prevue}`);
  return morceaux.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Panneau
// ---------------------------------------------------------------------------
export function PanneauFiche({
  roadId,
  contexte,
  onChoisir,
}: {
  roadId: string;
  contexte: "carte" | "liste";
  /** Ouvre une autre fiche (ex. une section). */
  onChoisir?: (id: string) => void;
}) {
  const { etat, majFiche } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const fiche = donnees?.fiches[roadId] ?? null;
  const geo = useMemo(() => donnees?.voiries.voiries.find((v) => v.id === (fiche?.parentId ?? roadId)) ?? null, [donnees, fiche, roadId]);

  const [edition, setEdition] = useState(false);
  const [form, setForm] = useState<Formulaire | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  if (!fiche) return <p className="text-sm text-muted">Voirie introuvable.</p>;
  const initial = versFormulaire(fiche);
  const courant = form ?? initial;
  const modif = differences(initial, courant);
  const modifie = Object.keys(modif).length > 0;
  const e = fiche.evaluation;
  const conflit = e?.statut_validation === "conflit_a_resoudre";
  const set = (cle: keyof Formulaire) => (v: string) => setForm({ ...courant, [cle]: v });

  const commencer = () => {
    setForm(versFormulaire(fiche));
    setMessage(null);
    setEdition(true);
  };
  const annuler = () => {
    setForm(null);
    setEdition(false);
    setMessage(null);
  };
  const enregistrer = () =>
    demarrer(async () => {
      setMessage(null);
      const r = await enregistrerFiche(roadId, modif);
      if (!r.ok) {
        setMessage({ ok: false, texte: r.erreur });
        return;
      }
      majFiche(roadId, {
        ...(r.donnees.voirie
          ? {
              voirie: {
                gestionnaire: r.donnees.voirie.gestionnaire as Gestionnaire,
                gestionnaireDetail: r.donnees.voirie.gestionnaire_detail,
                statutFiche: r.donnees.voirie.statut_fiche as StatutFiche,
              },
            }
          : {}),
        ...(r.donnees.evaluation ? { evaluation: r.donnees.evaluation } : {}),
      });
      setForm(null);
      setEdition(false);
      setMessage({ ok: true, texte: `Modifications enregistrées à ${new Date().toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}.` });
    });

  const lienAutreVue =
    contexte === "carte"
      ? { href: `/voiries?voirie=${encodeURIComponent(roadId)}`, texte: "Voir dans la liste" }
      : fiche.aTrace || fiche.parentId
        ? { href: `/carte?voirie=${encodeURIComponent(roadId)}`, texte: "Voir sur la carte" }
        : null;

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-muted">{LIBELLES_CATEGORIE[fiche.categorie]}</span>
          <BadgeGestionnaire gestionnaire={fiche.gestionnaire} />
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${fiche.statutFiche === "a_completer" ? "bg-demo-bg text-demo-ink" : "bg-canvas text-muted"}`}>
            {LIBELLES_STATUT[fiche.statutFiche]}
          </span>
        </div>
        <h2 className={`mt-2 text-xl font-semibold ${fiche.nom ? "text-ink" : "italic text-muted"}`}>{nomAffiche(fiche)}</h2>
        <p className="text-sm text-muted">
          {fiche.anciennesCommunes.join(" · ") || "Ancienne commune non déterminée"}
          {fiche.parentId && donnees?.fiches[fiche.parentId] && (
            <>
              {" · partie de "}
              <button type="button" className="text-brand underline underline-offset-2" onClick={() => onChoisir?.(fiche.parentId!)}>
                {nomAffiche(donnees.fiches[fiche.parentId])}
              </button>
            </>
          )}
        </p>
        {lienAutreVue && (
          <Link href={lienAutreVue.href} className="mt-1 inline-block text-sm font-medium text-brand underline underline-offset-2">
            {lienAutreVue.texte}
          </Link>
        )}
        {fiche.parentId && <p className="mt-1 text-xs text-muted">Tracé de cette partie de rue à définir : la carte montre la rue entière.</p>}
      </div>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-brand/30 bg-brand-soft text-brand-strong" : "border-prio-rouge/30 bg-prio-rouge/5 text-prio-rouge"}`}>
          {message.texte}
        </p>
      )}
      {conflit && (
        <p role="note" className="rounded-lg border border-demo-line bg-demo-bg px-3 py-2 text-sm text-demo-ink">
          Plusieurs lignes de l&apos;Excel correspondaient à cette voirie : complète l&apos;évaluation à la main.
        </p>
      )}

      {donnees && (
        <DetailScore
          resultat={calculerScore(e, donnees.parametres)}
          parametres={donnees.parametres}
          horsClassement={!dansClassementCommunal(fiche.gestionnaire, donnees.parametres)}
        />
      )}
      {edition && donnees && modifie && (
        <p role="status" className="-mt-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink">
          Avec ces valeurs (pas encore enregistrées) :{" "}
          <BadgePriorite {...apercu(courant, donnees.parametres)} />
        </p>
      )}

      {/* Évaluation : lecture ou modification */}
      {!edition ? (
        <section aria-label="Évaluation">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Évaluation</h3>
            <button type="button" onClick={commencer} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Modifier
            </button>
          </div>
          <dl className="divide-y divide-line">
            <Ligne libelle="Gestionnaire" valeur={LIBELLES_GESTIONNAIRE[fiche.gestionnaire] + (fiche.gestionnaireDetail ? ` — ${fiche.gestionnaireDetail}` : "")} />
            <Ligne
              libelle="État de la chaussée"
              valeur={
                e?.etat_note ? LIBELLES_ETAT[e.etat_note] : null
              }
            />
            <Ligne libelle="Circulation" valeur={e?.intensite_circulation ? LIBELLES_INTENSITE[e.intensite_circulation] : null} />
            <Ligne libelle="Densité" valeur={e?.densite_habitation ? LIBELLES_DENSITE[e.densite_habitation] : null} />
            <Ligne libelle="Risque sécurité" valeur={e?.risque_securite ? LIBELLES_RISQUE[e.risque_securite] : null} />
            <Ligne libelle="Travaux" valeur={e?.ampleur_travaux ? LIBELLES_TRAVAUX[e.ampleur_travaux] : null} />
            <Ligne libelle="Échéance" valeur={echeanceLisible(e)} />
            <Ligne libelle="Sécurisation" valeur={e?.mobilite_note ?? null} />
            <Ligne libelle="Particularités" valeur={e?.particularites ?? null} />
          </dl>
          {e?.updated_at && <p className="mt-1 text-xs text-muted">Dernière modification : {new Date(e.updated_at).toLocaleString("fr-BE")}</p>}
        </section>
      ) : (
        <form
          aria-label="Modifier l'évaluation"
          className="flex flex-col gap-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (modifie) enregistrer();
          }}
        >
          <h3 className="text-sm font-semibold text-ink">Modifier la fiche</h3>
          <Champ id="f-gest" libelle="Gestionnaire">
            <select id="f-gest" value={courant.gestionnaire} onChange={(ev) => set("gestionnaire")(ev.target.value)} className={classeChamp}>
              {Object.entries(LIBELLES_GESTIONNAIRE).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Champ>
          <Champ id="f-gest-detail" libelle="Précision sur le gestionnaire">
            <input id="f-gest-detail" value={courant.gestionnaire_detail} onChange={(ev) => set("gestionnaire_detail")(ev.target.value)} className={classeChamp} maxLength={2000} />
          </Champ>
          <Champ id="f-statut" libelle="Statut de la fiche">
            <select id="f-statut" value={courant.statut_fiche} onChange={(ev) => set("statut_fiche")(ev.target.value)} className={classeChamp}>
              {Object.entries(LIBELLES_STATUT).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Champ>
          <Champ
            id="f-etat"
            libelle="État de la chaussée (1 = bon, 5 = dégradé)"
          >
            <Choix id="f-etat" valeur={courant.etat_note} options={Object.entries(LIBELLES_ETAT)} onChange={set("etat_note")} />
          </Champ>
          <Champ id="f-circ" libelle="Circulation">
            <Choix id="f-circ" valeur={courant.intensite_circulation} options={Object.entries(LIBELLES_INTENSITE)} onChange={set("intensite_circulation")} />
          </Champ>
          <Champ id="f-dens" libelle="Densité d'habitation">
            <Choix id="f-dens" valeur={courant.densite_habitation} options={Object.entries(LIBELLES_DENSITE)} onChange={set("densite_habitation")} />
          </Champ>
          <Champ id="f-risque" libelle="Risque sécurité / mobilité">
            <Choix id="f-risque" valeur={courant.risque_securite} options={Object.entries(LIBELLES_RISQUE)} onChange={set("risque_securite")} />
          </Champ>
          <Champ id="f-travaux" libelle="Ampleur des travaux">
            <Choix id="f-travaux" valeur={courant.ampleur_travaux} options={Object.entries(LIBELLES_TRAVAUX)} onChange={set("ampleur_travaux")} />
          </Champ>
          <div className="grid grid-cols-2 gap-3">
            <Champ id="f-echeance" libelle="Échéance (texte)">
              <input id="f-echeance" value={courant.echeance_brute} onChange={(ev) => set("echeance_brute")(ev.target.value)} className={classeChamp} placeholder="ex. 3 ans, urgent" maxLength={2000} />
            </Champ>
            <Champ id="f-annee" libelle="Année prévue">
              <input id="f-annee" type="number" inputMode="numeric" min={1990} max={2100} value={courant.annee_prevue} onChange={(ev) => set("annee_prevue")(ev.target.value)} className={classeChamp} />
            </Champ>
          </div>
          <Champ id="f-mobilite" libelle="Sécurisation / mobilité">
            <textarea id="f-mobilite" rows={2} value={courant.mobilite_note} onChange={(ev) => set("mobilite_note")(ev.target.value)} className={classeChamp} maxLength={2000} />
          </Champ>
          <Champ id="f-part" libelle="Particularités">
            <textarea id="f-part" rows={3} value={courant.particularites} onChange={(ev) => set("particularites")(ev.target.value)} className={classeChamp} maxLength={2000} />
          </Champ>
          <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-surface py-3">
            <button type="submit" disabled={!modifie || enCours} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50">
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={annuler} disabled={enCours} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas">
              Annuler
            </button>
            {!modifie && <span className="text-xs text-muted">Aucune modification</span>}
          </div>
        </form>
      )}

      {/* Parties de rue évaluées séparément */}
      {fiche.sousSections.length > 0 && (
        <section aria-label="Parties de rue" className="rounded-lg border border-line p-3">
          <h3 className="text-sm font-semibold text-ink">Parties évaluées séparément</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {fiche.sousSections.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onChoisir?.(id)} className="text-brand underline underline-offset-2">
                  {donnees?.fiches[id] ? nomAffiche(donnees.fiches[id]) : id}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Informations OpenStreetMap */}
      {geo && (
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Tracé (OpenStreetMap)</summary>
          <dl className="mt-2 divide-y divide-line">
            <Ligne libelle="Longueur" valeur={geo.longueurM >= 1000 ? `${(geo.longueurM / 1000).toLocaleString("fr-BE", { maximumFractionDigits: 2 })} km` : `${geo.longueurM} m`} />
            <Ligne libelle="Segments" valeur={String(geo.segments.length)} />
            <Ligne libelle="Type OSM" valeur={geo.types.join(", ")} />
            <Ligne libelle="Réseau régional" valeur={{ oui: "probable (indice SPW)", partiel: "en partie (indice SPW)", non: "non", inconnu: "non vérifié" }[geo.indiceSpw]} />
            <Ligne libelle="Limite communale" valeur={geo.traverseLimite ? "coupée à la limite" : "entièrement dans la commune"} />
            <Ligne
              libelle="Source"
              valeur={
                <>
                  {geo.ways.slice(0, 3).map((w, i) => (
                    <span key={w}>
                      {i > 0 && ", "}
                      <a className="text-brand underline underline-offset-2" href={`https://www.openstreetmap.org/way/${w}`} target="_blank" rel="noreferrer">
                        way {w}
                      </a>
                    </span>
                  ))}
                  {geo.ways.length > 3 && ` et ${geo.ways.length - 3} autres`}
                </>
              }
            />
          </dl>
        </details>
      )}

      <AvertissementScore />
    </div>
  );
}
