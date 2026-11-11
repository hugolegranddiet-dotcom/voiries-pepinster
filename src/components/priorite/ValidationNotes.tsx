"use client";

// Validation PAR LOT des notes d'état suggérées par la couleur de l'Excel (D1).
// Rien n'est validé automatiquement : le père coche, puis confirme.
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { validerNotesSuggerees } from "@/app/actions/priorites";
import { BadgeGestionnaire } from "@/components/badges";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { ErreurDonnees } from "@/components/donnees/ErreurDonnees";
import { LIBELLES_ETAT, type Note1a5 } from "@/lib/domaine";
import { nomAffiche } from "@/lib/donnees/libelles";
import type { FicheVoirie } from "@/lib/donnees/types";

const NOTES: Note1a5[] = [5, 4, 3, 2, 1];
const comparerNom = new Intl.Collator("fr", { sensitivity: "base", numeric: true }).compare;

export function ValidationNotes() {
  const { etat, validerSuggestionsLocalement } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const [choix, setChoix] = useState<Set<string>>(new Set());
  const [confirmer, setConfirmer] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  const groupes = useMemo(() => {
    const g = new Map<Note1a5, FicheVoirie[]>(NOTES.map((n) => [n, []]));
    if (donnees) {
      for (const f of Object.values(donnees.fiches)) {
        const e = f.evaluation;
        if (e && e.etat_note === null && e.etat_note_suggeree !== null) g.get(e.etat_note_suggeree)?.push(f);
      }
    }
    for (const liste of g.values()) liste.sort((a, b) => comparerNom(nomAffiche(a), nomAffiche(b)));
    return g;
  }, [donnees]);
  const total = [...groupes.values()].reduce((s, l) => s + l.length, 0);
  // On ne garde que les choix encore à valider (après une validation, ils disparaissent).
  const enAttente = new Set([...groupes.values()].flat().map((f) => f.id));
  const choisis = [...choix].filter((id) => enAttente.has(id));

  const basculer = (id: string) =>
    setChoix((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const basculerGroupe = (liste: FicheVoirie[], cocher: boolean) =>
    setChoix((c) => {
      const n = new Set(c);
      liste.forEach((f) => (cocher ? n.add(f.id) : n.delete(f.id)));
      return n;
    });

  const valider = () =>
    demarrer(async () => {
      setMessage(null);
      const r = await validerNotesSuggerees(choisis);
      setConfirmer(false);
      if (!r.ok) {
        setMessage({ ok: false, texte: r.erreur });
        return;
      }
      validerSuggestionsLocalement(r.donnees.valides);
      setChoix(new Set());
      const ignorees = choisis.length - r.donnees.valides.length;
      setMessage({
        ok: true,
        texte: `${r.donnees.valides.length} note${r.donnees.valides.length > 1 ? "s" : ""} validée${r.donnees.valides.length > 1 ? "s" : ""} : elles comptent maintenant dans le score.${ignorees > 0 ? ` ${ignorees} voirie(s) avaient déjà une note : elle n'a pas été changée.` : ""}`,
      });
    });

  if (etat.statut === "erreur") return <ErreurDonnees message={etat.message} />;
  if (!donnees) return <p role="status" className="text-sm text-muted">Chargement…</p>;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink">
        <p>
          Dans l&apos;Excel, l&apos;état est donné par la <strong>couleur</strong> de la case. L&apos;application en a tiré une{" "}
          <strong>note suggérée</strong>, selon la légende. Une suggestion ne compte pas dans le score tant que tu ne l&apos;as pas validée.
        </p>
        <p className="mt-2 text-muted">
          Coche les voiries dont la note te semble juste, puis valide. Pour en corriger une, ouvre sa <strong>fiche</strong> et choisis la bonne
          note. Une note déjà saisie n&apos;est jamais remplacée. Les routes sans couleur reconnue (D11) n&apos;ont pas de suggestion.
        </p>
      </div>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-brand/30 bg-brand-soft text-brand-strong" : "border-prio-rouge/30 bg-prio-rouge/5 text-prio-rouge"}`}>
          {message.texte}
        </p>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            Tout accepter d&apos;un coup ? Les corrections se feront ensuite voirie par voirie, dans la fiche.
          </p>
          <button
            type="button"
            disabled={enCours}
            onClick={() => {
              setChoix(new Set(enAttente));
              setConfirmer(true);
            }}
            className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40"
          >
            Tout valider ({total})
          </button>
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink">
          <p>Toutes les notes suggérées ont été validées. Les corrections se font maintenant dans la fiche de chaque voirie.</p>
          <Link href="/priorites" className="mt-2 inline-block font-medium text-brand underline underline-offset-2">
            Voir le classement
          </Link>
        </div>
      ) : (
        NOTES.map((n) => {
          const liste = groupes.get(n)!;
          if (!liste.length) return null;
          const tousCoches = liste.every((f) => choix.has(f.id));
          return (
            <section key={n} aria-labelledby={`groupe-${n}`} className="rounded-xl border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                <h2 id={`groupe-${n}`} className="text-base font-semibold text-ink">
                  Note suggérée {LIBELLES_ETAT[n]} <span className="font-normal text-muted">({liste.length})</span>
                </h2>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={tousCoches} onChange={(e) => basculerGroupe(liste, e.target.checked)} />
                  Tout cocher
                </label>
              </div>
              <ul className="divide-y divide-line">
                {liste.map((f) => {
                  const o = f.origineExcel[0];
                  return (
                    <li key={f.id} className="flex items-center gap-3 px-4 py-2">
                      <input
                        id={`v-${f.id}`}
                        type="checkbox"
                        className="size-4 shrink-0 accent-[var(--brand)]"
                        checked={choix.has(f.id)}
                        onChange={() => basculer(f.id)}
                      />
                      <label htmlFor={`v-${f.id}`} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block truncate text-sm font-medium text-ink">{nomAffiche(f)}</span>
                        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          {o?.couleurEtat && (
                            <span className="inline-block size-3 rounded-sm border border-line" style={{ background: o.couleurEtat }} aria-hidden="true" />
                          )}
                          <span>{f.evaluation?.etat_note_suggeree_origine ?? "suggestion"}</span>
                          {o && <span>· Excel ligne {o.ligne}</span>}
                          {o?.etat && <span>· texte : « {o.etat} »</span>}
                        </span>
                      </label>
                      {f.gestionnaire !== "commune" && <BadgeGestionnaire gestionnaire={f.gestionnaire} />}
                      <Link href={`/voiries?voirie=${encodeURIComponent(f.id)}`} className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand-soft">
                        Fiche
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {total > 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
          <p className="text-sm text-ink" role="status">
            {choisis.length} voirie{choisis.length > 1 ? "s" : ""} cochée{choisis.length > 1 ? "s" : ""} sur {total}
          </p>
          {!confirmer ? (
            <button
              type="button"
              disabled={choisis.length === 0 || enCours}
              onClick={() => setConfirmer(true)}
              className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40"
            >
              Valider la sélection
            </button>
          ) : (
            <span className="ml-auto flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">Valider {choisis.length} note{choisis.length > 1 ? "s" : ""} ?</span>
              <button type="button" disabled={enCours} onClick={valider} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40">
                {enCours ? "Validation…" : "Confirmer"}
              </button>
              <button type="button" disabled={enCours} onClick={() => setConfirmer(false)} className="rounded-lg border border-line px-3 py-2 text-sm text-ink">
                Annuler
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
