"use client";

// Bouton « Exporter (CSV) » : le fichier est fabriqué dans le navigateur, à partir
// des données déjà chargées. Rien n'est envoyé ailleurs.
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { nomAffiche } from "@/lib/donnees/libelles";
import type { FicheVoirie } from "@/lib/donnees/types";
import { nomFichier, versCsv } from "@/lib/export/csv";

export function BoutonExport({
  fiches,
  prefixe,
  libelle = "Exporter (CSV)",
  rang,
}: {
  fiches: () => FicheVoirie[];
  prefixe: string;
  libelle?: string;
  rang?: (id: string) => number | null;
}) {
  const { etat } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  return (
    <button
      type="button"
      disabled={!donnees}
      onClick={() => {
        if (!donnees) return;
        const texte = versCsv(fiches(), {
          parametres: donnees.parametres,
          nomParent: (id) => (donnees.fiches[id] ? nomAffiche(donnees.fiches[id]) : null),
          rang,
        });
        const url = URL.createObjectURL(new Blob([texte], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = nomFichier(prefixe);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-40"
    >
      {libelle}
    </button>
  );
}
