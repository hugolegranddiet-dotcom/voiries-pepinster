"use client";

// Champ « Particularités » modifiable : premier usage réel de l'enregistrement
// en base (phase 4). Le panneau entièrement éditable arrive en phase 5.
import { useState, useTransition } from "react";
import { enregistrerEvaluation } from "@/app/actions/evaluations";

export function NoteParticularites({
  roadId,
  valeur,
  majLe,
  onEnregistree,
}: {
  roadId: string;
  valeur: string | null;
  majLe: string | null;
  onEnregistree: (roadId: string, particularites: string | null, majLe: string) => void;
}) {
  const [texte, setTexte] = useState(valeur ?? "");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const modifie = (texte.trim() || null) !== (valeur?.trim() || null);

  const enregistrer = () =>
    demarrer(async () => {
      setMessage(null);
      const r = await enregistrerEvaluation(roadId, { particularites: texte });
      if (r.ok) {
        onEnregistree(roadId, texte.trim() || null, r.donnees.majLe);
        setMessage({ ok: true, texte: `Enregistré à ${new Date(r.donnees.majLe).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}.` });
      } else {
        setMessage({ ok: false, texte: r.erreur });
      }
    });

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`particularites-${roadId}`} className="text-sm font-semibold text-ink">
        Particularités
      </label>
      <textarea
        id={`particularites-${roadId}`}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        maxLength={2000}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        placeholder="Ex. : cul de sac, école, trottoir abîmé…"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={!modifie || enCours}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        {modifie && !enCours && (
          <button type="button" onClick={() => setTexte(valeur ?? "")} className="text-sm text-muted underline underline-offset-2">
            Annuler
          </button>
        )}
      </div>
      {message ? (
        <p role={message.ok ? "status" : "alert"} className={`text-xs ${message.ok ? "text-brand-strong" : "text-prio-rouge"}`}>
          {message.texte}
        </p>
      ) : (
        majLe && <p className="text-xs text-muted">Dernière modification : {new Date(majLe).toLocaleString("fr-BE")}</p>
      )}
    </div>
  );
}
