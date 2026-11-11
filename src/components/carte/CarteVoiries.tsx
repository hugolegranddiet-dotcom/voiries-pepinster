"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconeFermer } from "@/components/icones";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { PanneauFiche } from "@/components/fiche/PanneauFiche";
import { RechercheVoirie } from "@/components/carte/RechercheVoirie";
import { COULEURS_BANDE, type ModeCouleur } from "@/components/carte/styles-carte";
import { cleEtat, COULEURS_ETAT, FILTRES_ETAT, LIBELLES_FILTRE_ETAT, type FiltreEtat } from "@/lib/donnees/etat";
import { LIBELLES_BANDES, type ParametresScore } from "@/lib/priority/defaults";
import { LIBELLES_GESTIONNAIRE, type Gestionnaire } from "@/lib/domaine";
import type { CategorieVoie } from "@/lib/geo/voiries";

// Leaflet a besoin du navigateur : pas de rendu côté serveur.
const CarteLeaflet = dynamic(() => import("@/components/carte/CarteLeaflet"), {
  ssr: false,
  loading: () => <EtatCarte texte="Chargement de la carte…" />,
});

function EtatCarte({ texte, erreur = false }: { texte: string; erreur?: boolean }) {
  return (
    <div className="carte-attente flex h-full items-center justify-center p-6">
      <p role={erreur ? "alert" : "status"} className={`max-w-md rounded-lg bg-surface px-4 py-3 text-sm shadow-sm ${erreur ? "text-prio-rouge" : "text-muted"}`}>
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

function Legende({ parametres, mode }: { parametres: ParametresScore; mode: ModeCouleur }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {mode === "priorite" && parametres.seuils.map((t) => (
        <li key={t.bande} className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full" style={{ background: COULEURS_BANDE[t.bande] }} aria-hidden="true" />
          <span className="w-14 tabular-nums text-ink">{t.min} – {t.max}</span>
          <span className="text-muted">{LIBELLES_BANDES[t.bande]}</span>
        </li>
      ))}
      {mode === "priorite" && (
        <li className="flex items-center gap-2">
          <span className="h-1 w-6 rounded-full" style={{ background: COULEURS_BANDE.gris }} aria-hidden="true" />
          <span className="text-ink">Non évalué</span>
        </li>
      )}
      {mode === "etat" && (
        <li className="text-muted">Couleurs des notes : voir « État de la chaussée » ci-dessus.</li>
      )}
      <li className="flex items-center gap-2">
        <span className="h-2 w-6 rounded-full border-2 border-ink" style={{ background: COULEURS_BANDE.orange }} aria-hidden="true" />
        <span className="text-ink">Voirie sélectionnée (contour)</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-dashed border-ink" aria-hidden="true" />
        <span className="text-ink">SPW ou autre gestionnaire</span>
      </li>
      <li className="flex items-center gap-2">
        <span className="w-6 border-t-2 border-ink" aria-hidden="true" />
        <span className="text-ink">Limite de la commune</span>
      </li>
    </ul>
  );
}

export function CarteVoiries() {
  const { etat } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const router = useRouter();
  const chemin = usePathname();
  // La voirie sélectionnée vit dans l'adresse (?voirie=…) : partageable, et le bouton « retour » fonctionne.
  const selection = useSearchParams().get("voirie");
  const [visibles, setVisibles] = useState<Record<CategorieVoie, boolean>>({ voirie: true, chemin: true, acces: false });
  const [gestionnaire, setGestionnaire] = useState<Gestionnaire | null>(null);
  const [modeCouleur, setModeCouleur] = useState<ModeCouleur>("priorite");
  const [etats, setEtats] = useState<ReadonlySet<FiltreEtat>>(() => new Set(FILTRES_ETAT));
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  const choisir = useCallback(
    (id: string | null) => {
      router.replace(id ? `${chemin}?voirie=${encodeURIComponent(id)}` : chemin, { scroll: false });
    },
    [router, chemin],
  );

  const fiche = selection && donnees ? donnees.fiches[selection] ?? null : null;
  // Une partie de rue (section) n'a pas encore de tracé : on montre sa voirie mère.
  const selectionGeo = fiche?.parentId ?? (fiche ? selection : null);

  // Nombre de voiries tracées par note d'état (pour les cases du filtre).
  const comptesEtat = useMemo(() => {
    const c = Object.fromEntries(FILTRES_ETAT.map((n) => [n, 0])) as Record<FiltreEtat, number>;
    donnees?.voiries.voiries.forEach((v) => c[cleEtat(donnees.fiches[v.id]?.evaluation?.etat_note)]++);
    return c;
  }, [donnees]);

  const comptes = useMemo(() => {
    const c: Record<CategorieVoie, number> = { voirie: 0, chemin: 0, acces: 0 };
    donnees?.voiries.voiries.forEach((v) => c[v.categorie]++);
    return c;
  }, [donnees]);

  return (
    <div className="relative flex h-full">
      <section aria-label="Carte des voiries" className="relative min-w-0 flex-1">
        {etat.statut === "erreur" ? (
          <EtatCarte texte={etat.message} erreur />
        ) : !donnees ? (
          <EtatCarte texte="Chargement des voiries…" />
        ) : (
          <CarteLeaflet
            limite={donnees.limite}
            voies={donnees.voies}
            categoriesVisibles={visibles}
            gestionnaireVisible={gestionnaire}
            fiches={donnees.fiches}
            parametres={donnees.parametres}
            modeCouleur={modeCouleur}
            etatsVisibles={etats}
            selection={selectionGeo}
            onSelection={choisir}
          />
        )}

        {/* Recherche */}
        {donnees && (
          <div className="absolute left-14 right-3 top-3 z-[1000] max-w-sm md:right-auto md:w-80">
            <RechercheVoirie fiches={donnees.fiches} onChoisir={choisir} />
          </div>
        )}

        {/* Filtres + légende */}
        <div className="absolute right-3 top-16 z-[1000] w-64 max-w-[calc(100%-1.5rem)] md:top-3">
          <button
            type="button"
            onClick={() => setPanneauOuvert((o) => !o)}
            aria-expanded={panneauOuvert}
            className="ml-auto block rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink shadow-sm md:hidden"
          >
            {panneauOuvert ? "Masquer filtres et légende" : "Filtres et légende"}
          </button>
          <div className={`${panneauOuvert ? "block" : "hidden"} mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-surface/95 p-3 shadow-sm backdrop-blur md:mt-0 md:block`}>
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
            <fieldset className="mt-3 border-t border-line pt-3">
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Gestionnaire</legend>
              {([null, "commune", "spw", "autre", "inconnu"] as const).map((g) => (
                <label key={g ?? "toutes"} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink">
                  <input
                    type="radio"
                    name="gestionnaire"
                    className="size-4 accent-[var(--brand)]"
                    checked={gestionnaire === g}
                    onChange={() => setGestionnaire(g)}
                  />
                  {g === null ? "Toutes" : g === "inconnu" ? "Gestionnaire inconnu" : LIBELLES_GESTIONNAIRE[g]}
                </label>
              ))}
            </fieldset>
            <fieldset className="mt-3 border-t border-line pt-3">
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Couleur des routes</legend>
              {(
                [
                  ["priorite", "Priorité (score)"],
                  ["etat", "État de la chaussée"],
                ] as const
              ).map(([m, libelle]) => (
                <label key={m} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink">
                  <input type="radio" name="mode-couleur" className="size-4 accent-[var(--brand)]" checked={modeCouleur === m} onChange={() => setModeCouleur(m)} />
                  {libelle}
                </label>
              ))}
            </fieldset>
            <fieldset className="mt-3 border-t border-line pt-3">
              <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">État de la chaussée</legend>
              {FILTRES_ETAT.map((n) => (
                <label key={n} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--brand)]"
                    checked={etats.has(n)}
                    onChange={() =>
                      setEtats((e) => {
                        const x = new Set(e);
                        if (x.has(n)) x.delete(n);
                        else x.add(n);
                        return x;
                      })
                    }
                  />
                  {modeCouleur === "etat" && <span className="h-1.5 w-4 rounded-full" style={{ background: COULEURS_ETAT[n] }} aria-hidden="true" />}
                  <span className="flex-1">{LIBELLES_FILTRE_ETAT[n]}</span>
                  <span className="tabular-nums text-xs text-muted">{comptesEtat[n] || ""}</span>
                </label>
              ))}
              {etats.size < FILTRES_ETAT.length && (
                <button type="button" onClick={() => setEtats(new Set(FILTRES_ETAT))} className="mt-1 text-xs text-brand underline underline-offset-2">
                  Tout afficher
                </button>
              )}
            </fieldset>
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {modeCouleur === "priorite" ? "Priorité (score sur 100)" : "Légende"}
              </p>
              {donnees && <Legende parametres={donnees.parametres} mode={modeCouleur} />}
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
        className={`${fiche ? "flex" : "hidden"} absolute inset-x-0 bottom-0 z-[1100] max-h-[60%] flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl md:static md:flex md:max-h-none md:w-[26rem] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-sm font-semibold text-ink">Fiche</p>
          {fiche && (
            <button type="button" onClick={() => choisir(null)} className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Fermer la fiche">
              <IconeFermer width={18} height={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-4">
          {fiche ? (
            <PanneauFiche key={fiche.id} roadId={fiche.id} contexte="carte" onChoisir={choisir} />
          ) : (
            <p className="text-sm text-muted">Clique sur une voie de la carte, ou cherche-la par son nom.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
