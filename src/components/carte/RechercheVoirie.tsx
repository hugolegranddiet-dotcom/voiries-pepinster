"use client";

// Recherche d'une voirie par son nom (sans accents, sans casse, mots dans n'importe quel ordre).
import { useId, useMemo, useState } from "react";
import type { FicheVoirie } from "@/lib/donnees/types";
import { correspond, versLigne } from "@/lib/voiries/liste";
import { LIBELLES_CATEGORIE } from "@/lib/donnees/libelles";

const MAX = 8;

export function RechercheVoirie({ fiches, onChoisir }: { fiches: Record<string, FicheVoirie>; onChoisir: (id: string) => void }) {
  const [texte, setTexte] = useState("");
  const [actif, setActif] = useState(0);
  const idListe = useId();
  // Seules les voiries nommées (et les parties de rue) sont cherchables.
  const lignes = useMemo(() => Object.values(fiches).filter((f) => f.nom).map(versLigne), [fiches]);
  const resultats = useMemo(
    () => (texte.trim().length < 2 ? [] : lignes.filter((l) => correspond(l, texte)).sort((a, b) => a.nom.localeCompare(b.nom, "fr")).slice(0, MAX)),
    [lignes, texte],
  );

  const choisir = (id: string) => {
    onChoisir(id);
    setTexte("");
    setActif(0);
  };

  return (
    <div className="relative">
      <label htmlFor={`${idListe}-champ`} className="sr-only">
        Chercher une voirie
      </label>
      <input
        id={`${idListe}-champ`}
        type="search"
        role="combobox"
        aria-expanded={resultats.length > 0}
        aria-controls={idListe}
        aria-activedescendant={resultats[actif] ? `${idListe}-${actif}` : undefined}
        autoComplete="off"
        placeholder="Chercher une rue…"
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value);
          setActif(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((a) => Math.min(a + 1, resultats.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && resultats[actif]) {
            e.preventDefault();
            choisir(resultats[actif].id);
          } else if (e.key === "Escape") {
            setTexte("");
          }
        }}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-sm"
      />
      {texte.trim().length >= 2 && (
        <ul id={idListe} role="listbox" className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          {resultats.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Aucune voirie trouvée.</li>
          ) : (
            resultats.map((r, i) => (
              <li
                key={r.id}
                id={`${idListe}-${i}`}
                role="option"
                aria-selected={i === actif}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choisir(r.id);
                }}
                onMouseEnter={() => setActif(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-2 px-3 py-2 text-sm ${i === actif ? "bg-brand-soft" : ""}`}
              >
                <span className="text-ink">{r.nom}</span>
                <span className="shrink-0 text-xs text-muted">
                  {r.categorie === "voirie" ? r.anciennesCommunes : LIBELLES_CATEGORIE[r.categorie]}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
