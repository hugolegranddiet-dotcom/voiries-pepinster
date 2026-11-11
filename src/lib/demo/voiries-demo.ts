// ⚠️ DONNÉES DE DÉMONSTRATION — PHASE 1 UNIQUEMENT ⚠️
// Ces voiries sont FICTIVES. Elles servent seulement à montrer la mise en page.
// - Aucun nom de rue réel de Pepinster n'est utilisé.
// - Aucun tracé géographique n'est associé (aucune coordonnée).
// - Les scores sont des valeurs d'exemple écrites à la main ; le vrai moteur
//   de calcul arrive en phase 6.
// Ce fichier sera supprimé quand les vraies données seront importées (phase 3).

import type {
  DensiteHabitation,
  Gestionnaire,
  IntensiteCirculation,
  MentionEtatSource,
  Note1a5,
  StatutFiche,
} from "@/lib/domaine";

export interface VoirieDemo {
  readonly demo: true;
  id: string;
  nom: string;
  gestionnaire: Gestionnaire;
  etatNote: Note1a5 | null;
  mentionEtatSource: MentionEtatSource;
  typeHabitat: string | null;
  intensite: IntensiteCirculation | null;
  densite: DensiteHabitation | null;
  ampleurTravaux: string | null;
  echeanceBrute: string | null;
  risqueSecurite: Note1a5 | null;
  particularites: string | null;
  statut: StatutFiche;
  /** Valeur d'exemple, pas un calcul. */
  scoreDemo: number | null;
  /** Part des critères renseignés (0 à 1), valeur d'exemple. */
  couvertureDemo: number;
}

export const VOIRIES_DEMO: ReadonlyArray<VoirieDemo> = [
  {
    demo: true,
    id: "demo-a",
    nom: "Voirie démo A",
    gestionnaire: "commune",
    etatNote: 5,
    mentionEtatSource: "vide",
    typeHabitat: "Village",
    intensite: "transit",
    densite: "eleve",
    ampleurTravaux: "Raclage/pose complet",
    echeanceBrute: "urgent",
    risqueSecurite: 4,
    particularites: "Exemple : affaissement d'un côté.",
    statut: "valide",
    scoreDemo: 98,
    couvertureDemo: 1,
  },
  {
    demo: true,
    id: "demo-b",
    nom: "Voirie démo B",
    gestionnaire: "commune",
    etatNote: 4,
    mentionEtatSource: "vide",
    typeHabitat: "4 façades",
    intensite: "eleve",
    densite: "moyen_bas",
    ampleurTravaux: "Raclage/pose partiel",
    echeanceBrute: "3 ans",
    risqueSecurite: null,
    particularites: null,
    statut: "importe_excel",
    scoreDemo: 69,
    couvertureDemo: 0.9,
  },
  {
    demo: true,
    id: "demo-c",
    nom: "Voirie démo C",
    gestionnaire: "commune",
    etatNote: 3,
    mentionEtatSource: "vide",
    typeHabitat: "Jointives / 4 façades",
    intensite: "moyen",
    densite: "moyen_eleve",
    ampleurTravaux: "Enduisage",
    echeanceBrute: "5 ans",
    risqueSecurite: null,
    particularites: null,
    statut: "importe_excel",
    scoreDemo: 50,
    couvertureDemo: 0.9,
  },
  {
    demo: true,
    id: "demo-d",
    nom: "Voirie démo D",
    gestionnaire: "autre",
    etatNote: 4,
    mentionEtatSource: "vide",
    typeHabitat: "Lotissement 4 façades",
    intensite: null,
    densite: "faible",
    ampleurTravaux: "Raclage/pose complet",
    echeanceBrute: null,
    risqueSecurite: null,
    particularites: "Exemple : voirie non communale.",
    statut: "importe_excel",
    scoreDemo: 64,
    couvertureDemo: 0.7,
  },
  {
    demo: true,
    id: "demo-e",
    nom: "Voirie démo E",
    gestionnaire: "commune",
    etatNote: 2,
    mentionEtatSource: "vide",
    typeHabitat: "Lotissement 3 façades",
    intensite: "faible",
    densite: "eleve",
    ampleurTravaux: "Schlammage",
    echeanceBrute: "2026",
    risqueSecurite: null,
    particularites: null,
    statut: "importe_excel",
    scoreDemo: 32,
    couvertureDemo: 0.9,
  },
  {
    demo: true,
    id: "demo-f",
    nom: "Voirie démo F",
    gestionnaire: "commune",
    etatNote: 1,
    mentionEtatSource: "RAS",
    typeHabitat: "Campagne",
    intensite: "faible",
    densite: "faible",
    ampleurTravaux: null,
    echeanceBrute: null,
    risqueSecurite: null,
    particularites: "Exemple : cul de sac.",
    statut: "valide",
    scoreDemo: 4,
    couvertureDemo: 0.9,
  },
  {
    demo: true,
    id: "demo-g",
    nom: "Voirie démo G",
    gestionnaire: "commune",
    etatNote: null,
    mentionEtatSource: "RAS",
    typeHabitat: "Lotissement 4 façades",
    intensite: "faible",
    densite: "moyen_bas",
    ampleurTravaux: null,
    echeanceBrute: null,
    risqueSecurite: null,
    particularites: "Exemple : « RAS » sans note validée → pas de score.",
    statut: "importe_excel",
    scoreDemo: null,
    couvertureDemo: 0.35,
  },
  {
    demo: true,
    id: "demo-h",
    nom: "Voirie démo H",
    gestionnaire: "spw",
    etatNote: null,
    mentionEtatSource: "SPW",
    typeHabitat: null,
    intensite: null,
    densite: null,
    ampleurTravaux: null,
    echeanceBrute: "2025",
    risqueSecurite: null,
    particularites: "Exemple : route régionale gérée par le SPW.",
    statut: "importe_excel",
    scoreDemo: null,
    couvertureDemo: 0,
  },
  {
    demo: true,
    id: "demo-i",
    nom: "Voirie démo I",
    gestionnaire: "inconnu",
    etatNote: null,
    mentionEtatSource: "vide",
    typeHabitat: null,
    intensite: null,
    densite: null,
    ampleurTravaux: null,
    echeanceBrute: null,
    risqueSecurite: null,
    particularites: "Exemple : voirie présente sur la carte mais absente de l'Excel.",
    statut: "a_completer",
    scoreDemo: null,
    couvertureDemo: 0,
  },
];

/** Liste des informations manquantes, affichée dans le tableau. */
export function donneesManquantes(v: VoirieDemo): string[] {
  const manquantes: string[] = [];
  if (v.etatNote === null) manquantes.push("état");
  if (v.intensite === null) manquantes.push("circulation");
  if (v.densite === null) manquantes.push("densité");
  if (v.risqueSecurite === null) manquantes.push("risque");
  return manquantes;
}
