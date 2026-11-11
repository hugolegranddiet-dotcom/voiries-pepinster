"use client";

// Données partagées par la carte et le tableau : chargées une seule fois
// (au premier écran ouvert), puis mises à jour après chaque enregistrement.
// Passer de la carte au tableau ne recharge donc rien et ne perd rien.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DonneesApp, Evaluation, FicheVoirie } from "@/lib/donnees/types";

type Etat =
  | { statut: "chargement" }
  | { statut: "erreur"; message: string }
  | { statut: "pret"; donnees: DonneesApp };

interface Contexte {
  etat: Etat;
  /** Applique localement le résultat d'un enregistrement réussi. */
  majFiche: (roadId: string, maj: { voirie?: Partial<Pick<FicheVoirie, "gestionnaire" | "gestionnaireDetail" | "statutFiche">>; evaluation?: Evaluation | null }) => void;
  /** Après une validation par lot : la note suggérée devient la note d'état, localement. */
  validerSuggestionsLocalement: (ids: string[]) => void;
  /** Relit tout depuis la base (après un changement de paramètres). */
  recharger: () => Promise<void>;
}

const MESSAGES: Record<number, string> = {
  401: "Ta session a expiré : recharge la page pour te reconnecter.",
  403: "Ce compte n'est pas autorisé à consulter les voiries.",
  404: "La base de données est vide : l'import initial n'a pas encore été fait (npm run db:seed).",
  503: "L'application n'est pas encore reliée à sa base de données.",
};

const ContexteDonnees = createContext<Contexte | null>(null);

/** Lit toutes les données depuis /api/carte (sans jamais lever d'erreur). */
async function lireDonnees(): Promise<Etat> {
  try {
    const r = await fetch("/api/carte", { cache: "no-store" });
    if (!r.ok) return { statut: "erreur", message: MESSAGES[r.status] ?? "Impossible de charger les données." };
    return { statut: "pret", donnees: (await r.json()) as DonneesApp };
  } catch {
    return { statut: "erreur", message: "Impossible de joindre le serveur." };
  }
}

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Etat>({ statut: "chargement" });

  useEffect(() => {
    let annule = false;
    lireDonnees().then((e) => {
      if (!annule) setEtat(e);
    });
    return () => {
      annule = true;
    };
  }, []);

  const recharger = useCallback(async () => {
    setEtat(await lireDonnees());
  }, []);

  const validerSuggestionsLocalement = useCallback((ids: string[]) => {
    setEtat((e) => {
      if (e.statut !== "pret") return e;
      const fiches = { ...e.donnees.fiches };
      for (const id of ids) {
        const f = fiches[id];
        const ev = f?.evaluation;
        if (!ev || ev.etat_note !== null || ev.etat_note_suggeree === null) continue;
        fiches[id] = { ...f, evaluation: { ...ev, etat_note: ev.etat_note_suggeree, updated_at: new Date().toISOString() } };
      }
      return { statut: "pret", donnees: { ...e.donnees, fiches } };
    });
  }, []);

  const majFiche = useCallback<Contexte["majFiche"]>((roadId, maj) => {
    setEtat((e) => {
      if (e.statut !== "pret") return e;
      const ancienne = e.donnees.fiches[roadId];
      if (!ancienne) return e;
      const fiche: FicheVoirie = {
        ...ancienne,
        ...(maj.voirie ?? {}),
        evaluation: maj.evaluation === undefined ? ancienne.evaluation : maj.evaluation,
      };
      return { statut: "pret", donnees: { ...e.donnees, fiches: { ...e.donnees.fiches, [roadId]: fiche } } };
    });
  }, []);

  const valeur = useMemo(
    () => ({ etat, majFiche, validerSuggestionsLocalement, recharger }),
    [etat, majFiche, validerSuggestionsLocalement, recharger],
  );
  return <ContexteDonnees.Provider value={valeur}>{children}</ContexteDonnees.Provider>;
}

export function useDonnees(): Contexte {
  const c = useContext(ContexteDonnees);
  if (!c) throw new Error("useDonnees doit être utilisé dans FournisseurDonnees.");
  return c;
}
