"use client";

// Erreur inattendue dans une page de l'application : message simple, sans détail technique,
// avec un bouton pour réessayer. Le détail reste dans la console du navigateur.
import Link from "next/link";
import { useEffect } from "react";

export default function ErreurPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-prio-rouge">Erreur</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Un problème est survenu</h1>
      <p className="mt-2 text-muted">
        Aucune donnée n&apos;a été perdue : ce qui était enregistré l&apos;est toujours. Réessaie ; si le problème revient, recharge la page.
      </p>
      {digest && <p className="mt-2 text-xs text-muted">Référence : {digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => retry()} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
          Réessayer
        </button>
        <Link href="/carte" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas">
          Retour à la carte
        </Link>
      </div>
    </div>
  );
}
