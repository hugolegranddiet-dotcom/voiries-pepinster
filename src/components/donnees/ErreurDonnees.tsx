"use client";

// Message affiché quand les données n'ont pas pu être chargées, avec un bouton pour réessayer.
import { useState } from "react";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";

export function ErreurDonnees({ message }: { message: string }) {
  const { recharger } = useDonnees();
  const [enCours, setEnCours] = useState(false);
  return (
    <div role="alert" className="max-w-md rounded-lg border border-prio-rouge/30 bg-surface px-4 py-3 text-sm shadow-sm">
      <p className="text-prio-rouge">{message}</p>
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          setEnCours(true);
          await recharger();
          setEnCours(false);
        }}
        className="mt-2 rounded-lg border border-line px-3 py-1.5 font-medium text-ink hover:bg-canvas disabled:opacity-50"
      >
        {enCours ? "Nouvel essai…" : "Réessayer"}
      </button>
    </div>
  );
}
