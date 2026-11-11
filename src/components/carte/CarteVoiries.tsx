"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COULEUR_BANDE } from "@/components/badges";
import { IconeFermer } from "@/components/icones";
import { FicheVoirieOsm } from "@/components/carte/FicheVoirieOsm";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { DonneesCarte } from "@/lib/db/carte";

// Leaflet a besoin du navigateur : pas de rendu côté serveur.
const CarteLeaflet = dynamic(() => import("@/components/carte/CarteLeaflet"), {
  ssr: false,
  loading: () => <EtatCarte texte="Chargement de la carte…" />,
});

function EtatCarte({ texte, erreur = false }: { texte: string; erreur?: boolean }) {
  return (
    <div className="carte-attente flex h-full items-center justify-center p-6">
      <p role={erreur ? "alert" : "status"} className={`rounded-lg bg-surface px-4 py-3 text-sm shadow-sm ${erreur ? "text-prio-rouge" : "text-muted"}`}>
        {texte}
      </p>
    </div>
  );
}

const FILTRES: Array<{ cle: CategorieVoie; libelle: string }> = [
  { cle: "voirie", libelle: "Voiries" },
  { cle: "chemin", libelle: "Chemins et sentiers" },
  { cle: "acces", libelle: "Accès et parkings sans nom" },
];

function Legende() {
  return (
    <ul className="space-y-1.5 text-xs">
      <li className="flex items-center gap-2">
        <span className={`h-1.5 w-6 rounded-full ${COULEUR_BANDE.gris}`} aria-hidden="true" />
        <span className="text-ink">Non évalué</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="h-1.5 w-6 rounded-full bg-brand" aria-hidden="true" />
        <span className="text-ink">Voirie sélectionnée</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-ink" aria-hidden="true" />
        <span className="text-ink">Réseau régional SPW (indice)</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-ink" aria-hidden="true" />
        <span className="text-ink">Limite de la commune</span>
      </li>
    </ul>
  );
}

const MESSAGES_ERREUR: Record<number, string> = {
  401: "Ta session a expiré : recharge la page pour te reconnecter.",
  403: "Ce compte n'est pas autorisé à consulter les voiries.",
  404: "La base de données est vide : l'import initial n'a pas encore été fait (npm run db:seed).",
};

export function CarteVoiries() {
  // Ouverture directe d'une voirie : /carte?voirie=<identifiant> (fichier de validation).
  const voirieDemandee = useSearchParams().get("voirie");
  const [donnees, setDonnees] = useState<DonneesCarte | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(voirieDemandee);
  const [visibles, setVisibles] = useState<Record<CategorieVoie, boolean>>({
    voirie: true,
    chemin: true,
    acces: false,
  });
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  useEffect(() => {
    let annule = false;
    // Toutes les données viennent de la base, lues avec la session de l'utilisateur.
    fetch("/api/carte", { cache: "no-store" })
      .then(async (r) => {
        if (annule) return;
        if (!r.ok) {
          setErreur(MESSAGES_ERREUR[r.status] ?? "Impossible de charger les données de la carte.");
          return;
        }
        setDonnees((await r.json()) as DonneesCarte);
      })
      .catch(() => !annule && setErreur("Impossible de joindre le serveur."));
    return () => {
      annule = true;
    };
  }, []);

  const voirieParId = useMemo(
    () => new Map(donnees?.voiries.voiries.map((v) => [v.id, v]) ?? []),
    [donnees],
  );
  const comptes = useMemo(() => {
    const c: Record<CategorieVoie, number> = { voirie: 0, chemin: 0, acces: 0 };
    donnees?.voiries.voiries.forEach((v) => c[v.categorie]++);
    return c;
  }, [donnees]);
  const selectionnee = selection ? voirieParId.get(selection) ?? null : null;
  const choisir = useCallback((id: string) => setSelection(id), []);
  // Après un enregistrement, on met à jour la copie locale (sans tout recharger).
  const noteEnregistree = useCallback((roadId: string, particularites: string | null, majLe: string) => {
    setDonnees((d) => (d ? { ...d, notes: { ...d.notes, [roadId]: { particularites, majLe } } } : d));
  }, []);

  return (
    <div className="relative flex h-full">
      <section aria-label="Carte des voiries" className="relative min-w-0 flex-1">
        {erreur ? (
          <EtatCarte texte={erreur} erreur />
        ) : !donnees ? (
          <EtatCarte texte="Chargement des voiries…" />
        ) : (
          <CarteLeaflet
            limite={donnees.limite}
            voies={donnees.voies}
            categoriesVisibles={visibles}
            selection={selection}
            onSelection={choisir}
          />
        )}

        {/* Panneau filtres + légende */}
        <div className="absolute right-3 top-3 z-[1000] w-64 max-w-[calc(100%-1.5rem)]">
          <button
            type="button"
            onClick={() => setPanneauOuvert((o) => !o)}
            aria-expanded={panneauOuvert}
            className="ml-auto block rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm md:hidden"
          >
            {panneauOuvert ? "Masquer filtres et légende" : "Filtres et légende"}
          </button>
          <div className={`${panneauOuvert ? "block" : "hidden"} mt-2 rounded-xl border border-line bg-surface/95 p-3 shadow-sm backdrop-blur md:mt-0 md:block`}>
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Types de voies</legend>
              {FILTRES.map((f) => (
                <label key={f.cle} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={visibles[f.cle]}
                    onChange={(e) => setVisibles((v) => ({ ...v, [f.cle]: e.target.checked }))}
                  />
                  <span className="flex-1">{f.libelle}</span>
                  <span className="tabular-nums text-xs text-muted">{comptes[f.cle] || ""}</span>
                </label>
              ))}
            </fieldset>
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Légende</p>
              <Legende />
            </div>
            {donnees && (
              <p className="mt-3 border-t border-line pt-2 text-[0.7rem] leading-snug text-muted">
                Données OSM du {new Date(donnees.voiries.meta.dateDonneesOsm).toLocaleDateString("fr-BE")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Fiche : panneau latéral (ordinateur) / feuille du bas (téléphone) */}
      <aside
        aria-label="Fiche de la voirie"
        className={`${selectionnee ? "flex" : "hidden"} absolute inset-x-0 bottom-0 z-[1100] max-h-[55%] flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl md:static md:flex md:max-h-none md:w-[24rem] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-sm font-semibold text-ink">Fiche</p>
          {selectionnee && (
            <button
              type="button"
              onClick={() => setSelection(null)}
              className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink"
              aria-label="Fermer la fiche"
            >
              <IconeFermer width={18} height={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-4">
          {selectionnee ? (
            <FicheVoirieOsm
              key={selectionnee.id}
              voirie={selectionnee}
              excel={donnees?.excel.parVoirie[selectionnee.id]}
              note={donnees?.notes[selectionnee.id] ?? null}
              onNoteEnregistree={noteEnregistree}
            />
          ) : (
            <p className="text-sm text-muted">Clique sur une voie de la carte pour afficher sa fiche.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
