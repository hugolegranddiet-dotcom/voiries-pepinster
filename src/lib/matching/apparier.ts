// Propositions de correspondance entre les lignes de l'Excel et les voiries OSM.
// RÈGLE D'OR : ce module PROPOSE, il ne décide jamais. Aucune ligne n'est liée
// à une voirie sans validation humaine (même une correspondance exacte).

import { normaliserNom } from "@/lib/geo/noms";
import type { VoirieLogique } from "@/lib/geo/types";
import type { FicheExcel } from "@/lib/excel/types";

export type Methode = "exact" | "exact_reordonne" | "approchant" | "section" | "aucun";
export type Confiance = "forte" | "moyenne" | "faible" | "aucune";

export interface Candidat {
  id: string;
  nom: string;
  score: number;
  sections: string[];
  longueurM: number;
  indiceSpw: VoirieLogique["indiceSpw"];
}

export interface Proposition {
  ligne: number;
  nomExcel: string;
  methode: Methode;
  confiance: Confiance;
  candidats: Candidat[];
  /** Meilleure proposition (null si aucune). */
  propositionId: string | null;
  alertes: string[];
}

/** Noms de l'Excel qui désignent une partie de rue (DATA_AUDIT.md §6.3, décision D4). */
export const NOMS_SECTIONS = new Set(
  [
    "Goffontaine 1", "Goffontaine 2", "Goffontaine Trasenster", "Bouhaye inférieure",
    "Bouhaye supérieure", "Drolenval descente Cornesse", "Drolenval plat",
    "Quai Ferdinand Nicolaï Hoëgne", "Soiron-Centre cimetière arrière",
    "Soiron-Centre cimetière centre", "Soiron-Centre Place de l'église",
    "Soiron-Centre Place du bac", "Soiron-Centre supérieure", "Soiron-Centre Taverne",
    "Tribomont Bertholet-Verviers Rue", "Tribomont principale Rue",
  ].map(normaliserNom),
);

const TYPE_DEBUT =
  /^(rue|route|avenue|ruelle|ruelles|venelle|val|chemin|place|quai|impasse|voie|clos|cite|dreve)\s+((de la|de l'|du|des|de|d'|la|le|les|l'|aux|au|a la)\s*)?/;

/** Clé de comparaison : nom normalisé + équivalences courantes (Ier/1er, St/Saint). */
export function cle(nom: string): string {
  return normaliserNom(nom)
    .replace(/\bier\b/g, "1er")
    .replace(/\bste\b/g, "sainte")
    .replace(/\bst\b/g, "saint")
    .replace(/'\s+/g, "'")
    .trim();
}

/** Cœur du nom, sans le type de voie (« rue du biez » → « biez »). */
export function coeur(nom: string): string {
  return cle(nom).replace(TYPE_DEBUT, "").replace(/^(la|le|les|l')\s*/, "").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prec = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = tmp;
    }
  }
  return d[n];
}

/** Similarité 0–1 (1 = identique). Les espaces sont ignorés (« Le Pas » ≈ « Lepas »). */
export function similarite(a: string, b: string): number {
  const x = a.replace(/\s/g, "");
  const y = b.replace(/\s/g, "");
  if (!x.length && !y.length) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

const SEUIL_APPROCHANT = 0.8;

function versCandidat(v: VoirieLogique, score: number): Candidat {
  return { id: v.id, nom: v.nom!, score: Math.round(score * 100) / 100, sections: v.sections, longueurM: v.longueurM, indiceSpw: v.indiceSpw };
}

export function proposer(fiches: ReadonlyArray<FicheExcel>, voiries: ReadonlyArray<VoirieLogique>): Proposition[] {
  const nommees = voiries.filter((v) => v.nom);
  const parCle = new Map<string, VoirieLogique[]>();
  for (const v of nommees) {
    const k = cle(v.nom!);
    const l = parCle.get(k);
    if (l) l.push(v);
    else parCle.set(k, [v]);
  }
  const compteNoms = new Map<string, number>();
  for (const f of fiches) compteNoms.set(cle(f.nomNettoye), (compteNoms.get(cle(f.nomNettoye)) ?? 0) + 1);

  const propositions = fiches.map((f): Proposition => {
    const alertes: string[] = [];
    if ((compteNoms.get(cle(f.nomNettoye)) ?? 0) > 1) alertes.push("nom en double dans l'Excel (pas de fusion automatique)");
    if (f.statut === "n_existe_plus") alertes.push("« n'existe plus » selon l'Excel (D7)");

    let methode: Methode = "aucun";
    let candidats: Candidat[] = [];

    // 1. Correspondance exacte (après normalisation), puis avec le nom réordonné.
    const exacts = parCle.get(cle(f.nomNettoye));
    const reordonnes = f.nomPropose ? parCle.get(cle(f.nomPropose)) : undefined;
    if (exacts?.length) {
      methode = "exact";
      candidats = exacts.map((v) => versCandidat(v, 1));
    } else if (reordonnes?.length) {
      methode = "exact_reordonne";
      candidats = reordonnes.map((v) => versCandidat(v, 1));
    } else if (NOMS_SECTIONS.has(normaliserNom(f.nomNettoye))) {
      // 2. Partie de rue : on cherche la voirie « mère » dont le nom est le début.
      methode = "section";
      const k = cle(f.nomPropose ?? f.nomNettoye);
      const kBrut = cle(f.nomNettoye);
      // D'abord les voiries dont le nom COMPLET est le début du nom Excel ;
      // à défaut seulement, celles dont le cœur du nom (sans « Rue ») l'est.
      const stricts = nommees.filter((v) => [k, kBrut].some((x) => x.startsWith(`${cle(v.nom!)} `)));
      const larges = nommees.filter((v) => {
        const co = coeur(v.nom!);
        return co.length >= 4 && [k, kBrut].some((x) => x.startsWith(`${co} `) || coeur(x).startsWith(`${co} `));
      });
      candidats = (stricts.length ? stricts : larges).map((v) => versCandidat(v, 0.9));
    } else {
      // 3. Noms approchants (fautes, espaces, type de voie différent).
      const variantes = [f.nomNettoye, f.nomPropose].filter((x): x is string => !!x);
      candidats = nommees
        .map((v) => {
          let s = 0;
          for (const x of variantes) {
            s = Math.max(s, similarite(cle(x), cle(v.nom!)));
            const cx = coeur(x);
            const cv = coeur(v.nom!);
            if (cx.length >= 3 && cv.length >= 3) s = Math.max(s, similarite(cx, cv) - 0.03);
          }
          return versCandidat(v, s);
        })
        .filter((c) => c.score >= SEUIL_APPROCHANT)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (candidats.length) methode = "approchant";
    }

    candidats.sort((a, b) => b.score - a.score || b.longueurM - a.longueurM);
    const meilleur = candidats[0] ?? null;

    // Cohérence du gestionnaire : SPW dans l'Excel ↔ indice régional sur la carte.
    if (meilleur) {
      if (f.gestionnaire === "spw" && meilleur.indiceSpw === "non") alertes.push("Excel : SPW, mais la carte ne la situe pas sur le réseau régional");
      if (f.gestionnaire === "commune" && meilleur.indiceSpw === "oui") alertes.push("Excel : communale, mais la carte la situe sur le réseau régional");
    }
    if (candidats.length > 1 && methode !== "section") alertes.push(`${candidats.length} voiries possibles : choisir la bonne`);

    let confiance: Confiance = "aucune";
    if (meilleur) {
      const exacte = methode === "exact" || methode === "exact_reordonne";
      if (exacte && candidats.length === 1 && alertes.length === 0) confiance = "forte";
      else if (exacte || (methode === "approchant" && meilleur.score >= 0.9)) confiance = "moyenne";
      else confiance = "faible";
    }

    return {
      ligne: f.ligne,
      nomExcel: f.nomNettoye,
      methode,
      confiance,
      candidats,
      propositionId: meilleur?.id ?? null,
      alertes,
    };
  });

  // Une même voirie proposée pour plusieurs lignes : signalé, jamais tranché.
  const parVoirie = new Map<string, number[]>();
  for (const p of propositions) {
    if (p.propositionId && p.methode !== "section") {
      const l = parVoirie.get(p.propositionId);
      if (l) l.push(p.ligne);
      else parVoirie.set(p.propositionId, [p.ligne]);
    }
  }
  for (const p of propositions) {
    const lignes = p.propositionId ? parVoirie.get(p.propositionId) : undefined;
    if (lignes && lignes.length > 1 && p.methode !== "section") {
      p.alertes.push(`voirie aussi proposée pour la/les ligne(s) ${lignes.filter((x) => x !== p.ligne).join(", ")}`);
      if (p.confiance === "forte") p.confiance = "moyenne";
    }
  }
  return propositions;
}
