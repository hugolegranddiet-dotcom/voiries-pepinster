"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { seConnecter, type EtatConnexion } from "@/app/actions/session";

const ETAT_INITIAL: EtatConnexion = { erreur: null };

export function FormulaireConnexion() {
  const suite = useSearchParams().get("suite") ?? "";
  const [etat, action, enCours] = useActionState(seConnecter, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="suite" value={suite} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={etat.email ?? ""}
          key={etat.email ?? ""}
          required
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="motDePasse" className="text-sm font-medium text-ink">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"
        />
      </div>
      {etat.erreur && (
        <p role="alert" className="rounded-lg border border-prio-rouge/30 bg-prio-rouge/5 px-3 py-2 text-sm text-prio-rouge">
          {etat.erreur}
        </p>
      )}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-lg bg-brand px-4 py-2.5 text-base font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
