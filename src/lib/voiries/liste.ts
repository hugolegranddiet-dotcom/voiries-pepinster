// Liste des voiries : construction des lignes, recherche, filtres et tri.
// Fonctions pures, partagées par le tableau et la recherche de la carte.
import type { Gestionnaire, StatutFiche } from "@/lib/domaine";
import { normaliserNom } from "@/lib/geo/noms";
import { nomAffiche } from "@/lib/donnees/libelles";
import type { CategorieFiche, FicheVoirie } from "@/lib/donnees/types";
import { PARAMETRES_PAR_DEFAUT, type BandePriorite, type ParametresScore } from "@/lib/priority/defaults";
import { calculerScore } from "@/lib/priority/score";

/** Types de voies proposés dans les filtres. */
export type TypeListe = "voiries" | "sections" | "chemins" | "sans_nom" | "acces";

export interface LigneListe {
  id: string;
  nom: string;
  sansNom: boolean;
  categorie: CategorieFiche;
  type: TypeListe;
  anciennesCommunes: string;
  gestionnaire: Gestionnaire;
  statutFiche: StatutFiche;
  etatNote: number | null;
  intensite: string | null;
  densite: string | null;
  travaux: string | null;
  echeance: string | null;
  risque: number | null;
  manquants: string[];
  /** Score calculé par calculerScore (null = Non évalué). */
  score: number | null;
  bande: BandePriorite;
  provisoire: boolean;
  aTrace: boolean;
  /** Texte de recherche normalisé (nom + anciennes communes). */
  cle: string;
}

export function typeDeFiche(f: FicheVoirie): TypeListe {
  if (f.categorie === "section") return "sections";
  if (f.categorie === "acces") return "acces";
  if (!f.nom) return "sans_nom";
  if (f.categorie === "chemin") return "chemins";
  return "voiries";
}

export function versLigne(f: FicheVoirie, parametres: ParametresScore = PARAMETRES_PAR_DEFAUT): LigneListe {
  const e = f.evaluation;
  const r = calculerScore(e, parametres);
  const manquants: string[] = [];
  if (!e?.etat_note) manquants.push("état");
  if (!e?.intensite_circulation) manquants.push("circulation");
  if (!e?.densite_habitation) manquants.push("densité");
  if (!e?.risque_securite) manquants.push("risque");
  const nom = nomAffiche(f);
  return {
    id: f.id,
    nom,
    sansNom: !f.nom,
    categorie: f.categorie,
    type: typeDeFiche(f),
    anciennesCommunes: f.anciennesCommunes.join(", "),
    gestionnaire: f.gestionnaire,
    statutFiche: f.statutFiche,
    etatNote: e?.etat_note ?? null,
    intensite: e?.intensite_circulation ?? null,
    densite: e?.densite_habitation ?? null,
    travaux: e?.ampleur_travaux ?? null,
    echeance: e?.echeance_brute ?? (e?.annee_prevue ? String(e.annee_prevue) : null),
    risque: e?.risque_securite ?? null,
    manquants,
    score: r.score,
    bande: r.bande,
    provisoire: r.provisoire,
    aTrace: f.aTrace,
    cle: normaliserNom(`${nom} ${f.anciennesCommunes.join(" ")}`),
  };
}

/**
 * Recherche insensible aux accents, à la casse et à l'ordre des mots :
 * « biez rue du » trouve « Rue du Biez ».
 */
export function correspond(ligne: Pick<LigneListe, "cle">, recherche: string): boolean {
  const mots = normaliserNom(recherche).split(" ").filter(Boolean);
  return mots.every((m) => ligne.cle.includes(m));
}

export interface Filtres {
  recherche: string;
  types: ReadonlySet<TypeListe>;
  gestionnaires: ReadonlySet<Gestionnaire>;
  statuts: ReadonlySet<StatutFiche>;
  /** Seulement les voiries dont l'état n'est pas encore noté. */
  etatManquant: boolean;
  /** Couleurs de priorité (vide = toutes). */
  bandes: ReadonlySet<BandePriorite>;
}

export const TYPES_PAR_DEFAUT: ReadonlySet<TypeListe> = new Set(["voiries", "sections"]);

export function filtrer(lignes: readonly LigneListe[], f: Filtres): LigneListe[] {
  return lignes.filter(
    (l) =>
      f.types.has(l.type) &&
      (f.gestionnaires.size === 0 || f.gestionnaires.has(l.gestionnaire)) &&
      (f.statuts.size === 0 || f.statuts.has(l.statutFiche)) &&
      (!f.etatManquant || l.etatNote === null) &&
      (f.bandes.size === 0 || f.bandes.has(l.bande)) &&
      (!f.recherche.trim() || correspond(l, f.recherche)),
  );
}

export type ColonneTri = "score" | "nom" | "anciennesCommunes" | "gestionnaire" | "etatNote" | "intensite" | "densite" | "travaux" | "echeance" | "manquants";

const RANG_INTENSITE: Record<string, number> = { faible: 1, moyen: 2, eleve: 3, transit: 4 };
const RANG_DENSITE: Record<string, number> = { nul: 0, faible: 1, moyen_bas: 2, moyen_eleve: 3, eleve: 4 };
const RANG_TRAVAUX: Record<string, number> = { reparation_ponctuelle: 1, schlammage: 2, enduisage: 3, raclage_partiel: 4, raclage_complet: 5, autre: 6 };
const comparateurTexte = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

function valeurTri(l: LigneListe, c: ColonneTri): string | number | null {
  switch (c) {
    case "intensite":
      return l.intensite ? RANG_INTENSITE[l.intensite] : null;
    case "densite":
      return l.densite ? RANG_DENSITE[l.densite] : null;
    case "travaux":
      return l.travaux ? RANG_TRAVAUX[l.travaux] : null;
    case "manquants":
      return l.manquants.length;
    default:
      return l[c] === "" ? null : (l[c] as string | number | null);
  }
}

/** Tri stable ; les valeurs vides vont toujours à la fin, quel que soit le sens. */
export function trier(lignes: readonly LigneListe[], colonne: ColonneTri, sens: "asc" | "desc"): LigneListe[] {
  const facteur = sens === "asc" ? 1 : -1;
  return [...lignes].sort((a, b) => {
    const va = valeurTri(a, colonne);
    const vb = valeurTri(b, colonne);
    if (va === null && vb === null) return comparateurTexte.compare(a.nom, b.nom);
    if (va === null) return 1;
    if (vb === null) return -1;
    const r = typeof va === "number" && typeof vb === "number" ? va - vb : comparateurTexte.compare(String(va), String(vb));
    return r !== 0 ? r * facteur : comparateurTexte.compare(a.nom, b.nom);
  });
}
