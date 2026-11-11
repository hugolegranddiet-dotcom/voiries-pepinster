"use client";

// Liste unifiée des voiries : recherche, filtres combinables, tri, pagination,
// et sélection partagée avec la carte par l'adresse (?voirie=…).
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeGestionnaire, BadgePriorite, COULEUR_BANDE } from "@/components/badges";
import { LIBELLES_BANDES } from "@/lib/priority/defaults";
import { cleEtat, COULEURS_ETAT, FILTRES_ETAT, LIBELLES_FILTRE_ETAT } from "@/lib/donnees/etat";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { ErreurDonnees } from "@/components/donnees/ErreurDonnees";
import { BoutonExport } from "@/components/donnees/BoutonExport";
import { PanneauFiche } from "@/components/fiche/PanneauFiche";
import { IconeCarte, IconeFermer } from "@/components/icones";
import { LIBELLES_GESTIONNAIRE, LIBELLES_STATUT, LIBELLES_DENSITE, LIBELLES_INTENSITE, type DensiteHabitation, type Gestionnaire, type IntensiteCirculation, type StatutFiche } from "@/lib/domaine";
import { LIBELLES_TRAVAUX } from "@/lib/donnees/libelles";
import type { AmpleurTravaux } from "@/lib/excel/types";
import { filtrer, trier, TYPES_PAR_DEFAUT, versLigne, type ColonneTri, type Filtres, type LigneListe, type TypeListe } from "@/lib/voiries/liste";

const PAR_PAGE = 50;

const TYPES: Array<{ cle: TypeListe; libelle: string }> = [
  { cle: "voiries", libelle: "Voiries nommées" },
  { cle: "sections", libelle: "Parties de rue" },
  { cle: "chemins", libelle: "Chemins et sentiers nommés" },
  { cle: "sans_nom", libelle: "Voies et chemins sans nom" },
  { cle: "acces", libelle: "Accès et parkings sans nom" },
];
const GESTIONNAIRES: Gestionnaire[] = ["commune", "spw", "autre", "inconnu"];
const STATUTS: StatutFiche[] = ["importe_excel", "a_completer", "valide", "n_existe_plus", "hors_commune"];

const COLONNES: Array<{ cle: ColonneTri | null; libelle: string; classe?: string }> = [
  { cle: "nom", libelle: "Nom" },
  { cle: "gestionnaire", libelle: "Gestionnaire" },
  { cle: "etatNote", libelle: "État" },
  { cle: "intensite", libelle: "Circulation" },
  { cle: "densite", libelle: "Densité" },
  { cle: "travaux", libelle: "Travaux" },
  { cle: "echeance", libelle: "Échéance" },
  { cle: "score", libelle: "Score" },
  { cle: "manquants", libelle: "Manquant" },
];

function filtresInitiaux(): Filtres {
  return { recherche: "", types: TYPES_PAR_DEFAUT, gestionnaires: new Set(), statuts: new Set(), etats: new Set(), bandes: new Set() };
}

function basculer<T>(ens: ReadonlySet<T>, v: T): Set<T> {
  const n = new Set(ens);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

const Vide = () => <span className="text-muted">—</span>;

function CelluleEtat({ l }: { l: LigneListe }) {
  if (l.etatNote)
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
        <span className="size-2.5 rounded-full" style={{ background: COULEURS_ETAT[cleEtat(l.etatNote)] }} aria-hidden="true" />
        {l.etatNote}
      </span>
    );
  return <Vide />;
}

const texteIntensite = (v: string | null) => (v ? LIBELLES_INTENSITE[v as IntensiteCirculation] ?? v : null);
const texteDensite = (v: string | null) => (v ? LIBELLES_DENSITE[v as DensiteHabitation] ?? v : null);
const texteTravaux = (v: string | null) => (v ? LIBELLES_TRAVAUX[v as AmpleurTravaux] ?? v : null);

function BlocCase({ legende, children }: { legende: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{legende}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">{children}</div>
    </fieldset>
  );
}

function Case({ coche, onChange, children }: { coche: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink">
      <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={coche} onChange={onChange} />
      {children}
    </label>
  );
}

export function TableauVoiries() {
  const { etat } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const router = useRouter();
  const chemin = usePathname();
  const selection = useSearchParams().get("voirie");

  const [filtres, setFiltres] = useState<Filtres>(filtresInitiaux);
  const [tri, setTri] = useState<{ colonne: ColonneTri; sens: "asc" | "desc" }>({ colonne: "nom", sens: "asc" });
  const [page, setPage] = useState(0);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const refLigne = useRef<HTMLTableRowElement | HTMLLIElement | null>(null);

  const choisir = useCallback(
    (id: string | null) => router.replace(id ? `${chemin}?voirie=${encodeURIComponent(id)}` : chemin, { scroll: false }),
    [router, chemin],
  );

  const lignes = useMemo(() => (donnees ? Object.values(donnees.fiches).map((f) => versLigne(f, donnees.parametres)) : []), [donnees]);
  const triees = useMemo(() => trier(filtrer(lignes, filtres), tri.colonne, tri.sens), [lignes, filtres, tri]);
  const nbPages = Math.max(1, Math.ceil(triees.length / PAR_PAGE));
  const pageCourante = Math.min(page, nbPages - 1);
  const visibles = triees.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE);

  const fiche = selection && donnees ? donnees.fiches[selection] ?? null : null;
  const indexSelection = selection ? triees.findIndex((l) => l.id === selection) : -1;
  const masqueeParFiltres = Boolean(fiche) && indexSelection === -1;

  // Arrivée depuis la carte (ou nouvelle sélection) : on saute à la page de la ligne,
  // une seule fois par voirie (ajustement pendant le rendu, recommandé par React),
  // puis on fait défiler jusqu'à elle.
  const [suivie, setSuivie] = useState<string | null>(null);
  if (selection && indexSelection >= 0 && suivie !== selection) {
    setSuivie(selection);
    setPage(Math.floor(indexSelection / PAR_PAGE));
  }
  useEffect(() => {
    if (suivie) requestAnimationFrame(() => refLigne.current?.scrollIntoView({ block: "nearest" }));
  }, [suivie]);

  const majFiltres = (f: (avant: Filtres) => Filtres) => {
    setFiltres(f);
    setPage(0);
  };

  const trierPar = (c: ColonneTri) =>
    setTri((t) =>
      t.colonne === c
        ? { colonne: c, sens: t.sens === "asc" ? "desc" : "asc" }
        : { colonne: c, sens: c === "score" || c === "etatNote" ? "desc" : "asc" }, // le plus prioritaire d'abord
    );

  const nbFiltresActifs =
    (filtres.gestionnaires.size ? 1 : 0) + (filtres.statuts.size ? 1 : 0) + (filtres.etats.size ? 1 : 0) + (filtres.bandes.size ? 1 : 0) +
    ([...filtres.types].sort().join() !== [...TYPES_PAR_DEFAUT].sort().join() ? 1 : 0);

  if (etat.statut === "erreur") {
    return (
      <div className="m-4 md:m-8">
        <ErreurDonnees message={etat.message} />
      </div>
    );
  }
  if (!donnees) {
    return <p role="status" className="m-4 text-sm text-muted md:m-8">Chargement des voiries…</p>;
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
        {/* Recherche et filtres */}
        <div className="rounded-xl border border-line bg-surface p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="recherche-voiries" className="sr-only">Chercher une voirie</label>
            <input
              id="recherche-voiries"
              type="search"
              value={filtres.recherche}
              onChange={(e) => majFiltres((f) => ({ ...f, recherche: e.target.value }))}
              placeholder="Chercher par nom ou ancienne commune (accents facultatifs)…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink sm:max-w-md"
            />
            <button
              type="button"
              onClick={() => setFiltresOuverts((o) => !o)}
              aria-expanded={filtresOuverts}
              aria-controls="filtres-voiries"
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
            >
              Filtres{nbFiltresActifs ? ` (${nbFiltresActifs} actif${nbFiltresActifs > 1 ? "s" : ""})` : ""}
            </button>
            {nbFiltresActifs > 0 && (
              <button type="button" onClick={() => majFiltres((f) => ({ ...filtresInitiaux(), recherche: f.recherche }))} className="text-sm text-brand underline underline-offset-2">
                Réinitialiser les filtres
              </button>
            )}
            <span className="sm:ml-auto">
              <BoutonExport prefixe="voiries-pepinster-liste" libelle="Exporter la liste (CSV)" fiches={() => triees.map((l) => donnees.fiches[l.id])} />
            </span>
          </div>
          <div id="filtres-voiries" className={`${filtresOuverts ? "grid" : "hidden"} mt-3 gap-4 border-t border-line pt-3 md:grid-cols-2 xl:grid-cols-5`}>
            <BlocCase legende="Types de voies">
              {TYPES.map((t) => (
                <Case key={t.cle} coche={filtres.types.has(t.cle)} onChange={() => majFiltres((f) => ({ ...f, types: basculer(f.types, t.cle) }))}>
                  {t.libelle}
                </Case>
              ))}
            </BlocCase>
            <BlocCase legende="Gestionnaire (tous si rien n'est coché)">
              {GESTIONNAIRES.map((g) => (
                <Case key={g} coche={filtres.gestionnaires.has(g)} onChange={() => majFiltres((f) => ({ ...f, gestionnaires: basculer(f.gestionnaires, g) }))}>
                  {LIBELLES_GESTIONNAIRE[g]}
                </Case>
              ))}
            </BlocCase>
            <BlocCase legende="Statut de la fiche (tous si rien n'est coché)">
              {STATUTS.map((s) => (
                <Case key={s} coche={filtres.statuts.has(s)} onChange={() => majFiltres((f) => ({ ...f, statuts: basculer(f.statuts, s) }))}>
                  {LIBELLES_STATUT[s]}
                </Case>
              ))}
            </BlocCase>
            <BlocCase legende="État de la chaussée (tous si rien n'est coché)">
              {FILTRES_ETAT.map((n) => (
                <Case key={n} coche={filtres.etats.has(n)} onChange={() => majFiltres((f) => ({ ...f, etats: basculer(f.etats, n) }))}>
                  <span className="size-3 rounded-full" style={{ background: COULEURS_ETAT[n] }} aria-hidden="true" />
                  {LIBELLES_FILTRE_ETAT[n]}
                </Case>
              ))}
            </BlocCase>
            <BlocCase legende="Priorité (toutes si rien n'est coché)">
              {(["rouge", "orange", "jaune", "vert", "gris"] as const).map((b) => (
                <Case key={b} coche={filtres.bandes.has(b)} onChange={() => majFiltres((f) => ({ ...f, bandes: basculer(f.bandes, b) }))}>
                  <span className={`size-3 rounded-full ${COULEUR_BANDE[b]}`} aria-hidden="true" />
                  {LIBELLES_BANDES[b]}
                </Case>
              ))}
            </BlocCase>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted" role="status">
          {triees.length} voirie{triees.length > 1 ? "s" : ""} sur {lignes.length}
          {triees.length > PAR_PAGE && ` · page ${pageCourante + 1} / ${nbPages}`}
        </p>

        {masqueeParFiltres && fiche && (
          <p className="mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
            La voirie sélectionnée n&apos;apparaît pas avec les filtres actuels.{" "}
            <button type="button" className="text-brand underline underline-offset-2" onClick={() => majFiltres(() => ({ ...filtresInitiaux(), types: new Set(TYPES.map((t) => t.cle)) }))}>
              Tout afficher
            </button>
          </p>
        )}

        {/* Tableau (ordinateur) */}
        <div className="mt-2 hidden overflow-x-auto rounded-xl border border-line bg-surface lg:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Voiries de Pepinster. Cliquer sur une ligne ouvre sa fiche.</caption>
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                {COLONNES.map((c) => {
                  const actif = c.cle !== null && tri.colonne === c.cle;
                  return (
                    <th key={c.libelle} scope="col" aria-sort={actif ? (tri.sens === "asc" ? "ascending" : "descending") : undefined} className="px-3 py-2.5 font-medium">
                      {c.cle ? (
                        <button type="button" onClick={() => trierPar(c.cle!)} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                          {c.libelle}
                          <span aria-hidden="true" className={actif ? "text-ink" : "opacity-30"}>{actif && tri.sens === "desc" ? "▼" : "▲"}</span>
                        </button>
                      ) : (
                        c.libelle
                      )}
                    </th>
                  );
                })}
                <th scope="col" className="px-3 py-2.5 font-medium"><span className="sr-only">Carte</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibles.map((l) => {
                const choisie = l.id === selection;
                return (
                  <tr
                    key={l.id}
                    ref={choisie ? (el) => { refLigne.current = el; } : undefined}
                    onClick={() => choisir(l.id)}
                    aria-selected={choisie}
                    className={`cursor-pointer ${choisie ? "bg-brand-soft" : "hover:bg-canvas"}`}
                  >
                    <th scope="row" className={`px-3 py-2 font-medium ${choisie ? "border-l-4 border-brand" : "border-l-4 border-transparent"}`}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); choisir(l.id); }} className={`text-left ${l.sansNom ? "italic text-muted" : "text-ink"}`}>
                        {l.nom}
                      </button>
                      {l.anciennesCommunes && <span className="block text-xs font-normal text-muted">{l.anciennesCommunes}</span>}
                    </th>
                    <td className="px-3 py-2"><BadgeGestionnaire gestionnaire={l.gestionnaire} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><CelluleEtat l={l} /></td>
                    <td className="px-3 py-2">{texteIntensite(l.intensite) ?? <Vide />}</td>
                    <td className="px-3 py-2">{texteDensite(l.densite) ?? <Vide />}</td>
                    <td className="px-3 py-2">{texteTravaux(l.travaux) ?? <Vide />}</td>
                    <td className="max-w-40 truncate px-3 py-2" title={l.echeance ?? undefined}>{l.echeance ?? <Vide />}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><BadgePriorite score={l.score} bande={l.bande} provisoire={l.provisoire} /></td>
                    <td className="px-3 py-2 text-xs text-muted">{l.manquants.length ? l.manquants.join(", ") : "—"}</td>
                    <td className="px-3 py-2">
                      {(l.aTrace || donnees.fiches[l.id]?.parentId) && (
                        <Link
                          href={`/carte?voirie=${encodeURIComponent(l.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex rounded-md p-1.5 text-brand hover:bg-surface"
                          aria-label={`Voir ${l.nom} sur la carte`}
                          title="Voir sur la carte"
                        >
                          <IconeCarte width={18} height={18} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cartes (téléphone et tablette) */}
        <div className="mt-2 flex items-center gap-2 lg:hidden">
          <label htmlFor="tri-mobile" className="text-sm text-muted">Trier par</label>
          <select
            id="tri-mobile"
            value={`${tri.colonne}:${tri.sens}`}
            onChange={(e) => {
              const [colonne, sens] = e.target.value.split(":") as [ColonneTri, "asc" | "desc"];
              setTri({ colonne, sens });
            }}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
          >
            <option value="score:desc">Priorité (la plus haute d&apos;abord)</option>
            <option value="nom:asc">Nom (A → Z)</option>
            <option value="etatNote:desc">État (pire d&apos;abord)</option>
            <option value="manquants:desc">Données manquantes</option>
            <option value="gestionnaire:asc">Gestionnaire</option>
          </select>
        </div>
        <ul className="mt-2 flex flex-col gap-2 lg:hidden">
          {visibles.map((l) => {
            const choisie = l.id === selection;
            return (
              <li key={l.id} ref={choisie ? (el) => { refLigne.current = el; } : undefined}>
                <button
                  type="button"
                  onClick={() => choisir(l.id)}
                  aria-current={choisie ? "true" : undefined}
                  className={`w-full rounded-xl border p-3 text-left ${choisie ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={`font-semibold ${l.sansNom ? "italic text-muted" : "text-ink"}`}>{l.nom}</span>
                    <BadgeGestionnaire gestionnaire={l.gestionnaire} />
                  </span>
                  {l.anciennesCommunes && <span className="block text-xs text-muted">{l.anciennesCommunes}</span>}
                  <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                    <BadgePriorite score={l.score} bande={l.bande} provisoire={l.provisoire} />
                    <span><span className="text-muted">État : </span><CelluleEtat l={l} /></span>
                    {l.travaux && <span><span className="text-muted">Travaux : </span>{texteTravaux(l.travaux)}</span>}
                  </span>
                  {l.manquants.length > 0 && <span className="mt-1 block text-xs text-muted">Manquant : {l.manquants.join(", ")}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {visibles.length === 0 && <p className="mt-4 text-sm text-muted">Aucune voirie ne correspond à ces critères.</p>}

        {nbPages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-center gap-3 pb-4">
            <button type="button" disabled={pageCourante === 0} onClick={() => setPage(pageCourante - 1)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm disabled:opacity-40">
              ← Précédente
            </button>
            <span className="text-sm text-muted">Page {pageCourante + 1} / {nbPages}</span>
            <button type="button" disabled={pageCourante >= nbPages - 1} onClick={() => setPage(pageCourante + 1)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm disabled:opacity-40">
              Suivante →
            </button>
          </nav>
        )}
      </div>

      {/* Fiche : colonne de droite (ordinateur) / feuille du bas (téléphone) */}
      {fiche && (
        <aside
          aria-label="Fiche de la voirie"
          className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl lg:static lg:max-h-none lg:w-[26rem] lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">Fiche</p>
            <button type="button" onClick={() => choisir(null)} className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Fermer la fiche">
              <IconeFermer width={18} height={18} />
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            <PanneauFiche key={fiche.id} roadId={fiche.id} contexte="liste" onChoisir={choisir} />
          </div>
        </aside>
      )}
    </div>
  );
}
