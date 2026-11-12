// Parties de rue (D21) : quels morceaux de la rue mère appartiennent à quelle partie.
import type { FicheVoirie } from "@/lib/donnees/types";
import type { SegmentProps } from "@/lib/geo/types";

/** Morceau → partie de rue qui le contient (seulement les morceaux choisis par le père). */
export function attributionSegments(fiches: Record<string, FicheVoirie>): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of Object.values(fiches)) {
    if (f.categorie !== "section") continue;
    for (const sid of f.segmentsSection) if (!m.has(sid)) m.set(sid, f.id);
  }
  return m;
}

/** Fiche qui « possède » un morceau sur la carte : sa partie de rue si elle existe, sinon sa rue. */
export function ficheDuSegment(p: Pick<SegmentProps, "sid" | "rid">, attribution: ReadonlyMap<string, string>): string {
  return attribution.get(p.sid) ?? p.rid;
}

/** Morceaux de la rue mère déjà pris par les AUTRES parties de la même rue. */
export function segmentsPrisParAutres(sectionId: string, fiches: Record<string, FicheVoirie>): Set<string> {
  const parent = fiches[sectionId]?.parentId;
  const pris = new Set<string>();
  if (!parent) return pris;
  for (const id of fiches[parent]?.sousSections ?? []) {
    if (id === sectionId) continue;
    for (const sid of fiches[id]?.segmentsSection ?? []) pris.add(sid);
  }
  return pris;
}
