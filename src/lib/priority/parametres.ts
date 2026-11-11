// Validation et lecture des paramètres du score enregistrés en base.
// La version 1 a été enregistrée avec des échelles « d'affichage » (listes
// valeur/points) : on la relit ici sans la modifier.
import { z } from "zod";
import {
  BANDES,
  CRITERES,
  VALEURS_CRITERE,
  type CritereScore,
  type Echelles,
  type ParametresScore,
  type SeuilCouleur,
} from "@/lib/priority/defaults";

const Points = z.number().int({ error: "Les points doivent être un nombre entier." }).min(0).max(100);

const echelleDe = <C extends CritereScore>(c: C) =>
  z.object(Object.fromEntries(VALEURS_CRITERE[c].map((v) => [v, Points])) as Record<string, typeof Points>).strict();

const SchemaEchelles = z
  .object({ etat: echelleDe("etat"), intensite: echelleDe("intensite"), densite: echelleDe("densite"), risque: echelleDe("risque") })
  .strict();

const SchemaSeuils = z
  .array(z.object({ bande: z.enum(BANDES as [string, ...string[]]), min: Points, max: Points }).strict())
  .length(4)
  .refine(
    (s) =>
      s.length === 4 &&
      s.every((x, i) => x.bande === BANDES[i] && x.min <= x.max) &&
      s[0].min === 0 &&
      s[3].max === 100 &&
      s.every((x, i) => i === 0 || x.min === s[i - 1].max + 1),
    { error: "Les couleurs doivent se suivre sans trou de 0 à 100 (vert, jaune, orange, rouge)." },
  );

/** Paramètres modifiables par le père (sans la version, attribuée par la base). */
export const SchemaParametres = z
  .object({
    poids: z
      .object(Object.fromEntries(CRITERES.map((c) => [c, z.number().int().min(0).max(100)])) as Record<CritereScore, z.ZodNumber>)
      .strict()
      .refine((p) => Object.values(p).reduce((a, b) => a + b, 0) > 0, { error: "Au moins un poids doit être supérieur à 0." })
      .refine((p) => p.etat > 0, { error: "L'état de la chaussée doit garder un poids : pas de score sans état." }),
    echelles: SchemaEchelles,
    seuils: SchemaSeuils,
    couverture_min: z.number().min(0).max(1),
    gestionnaires_classement: z.array(z.enum(["commune", "spw", "autre", "inconnu"])).min(1),
  })
  .strict();

export type SaisieParametres = z.infer<typeof SchemaParametres>;

/** Ancien format (version 1) : pour chaque critère, une liste dans l'ordre des valeurs. */
function convertirEchellesV1(brut: unknown): Echelles | null {
  if (!brut || typeof brut !== "object") return null;
  const sortie: Record<string, Record<string, number>> = {};
  for (const c of CRITERES) {
    const liste = (brut as Record<string, unknown>)[c];
    if (!Array.isArray(liste) || liste.length !== VALEURS_CRITERE[c].length) return null;
    sortie[c] = {};
    VALEURS_CRITERE[c].forEach((v, i) => {
      sortie[c][v] = (liste[i] as { points?: unknown })?.points as number;
    });
  }
  const r = SchemaEchelles.safeParse(sortie);
  return r.success ? (r.data as Echelles) : null;
}

/**
 * Relit une ligne de `priority_settings`. Renvoie null si elle est inutilisable
 * (dans ce cas, l'application affiche les paramètres par défaut avec un avertissement).
 */
export function lireParametres(ligne: {
  version: number;
  poids: unknown;
  echelles: unknown;
  seuils: unknown;
  couverture_min: unknown;
  gestionnaires_classement: unknown;
}): ParametresScore | null {
  const echelles = SchemaEchelles.safeParse(ligne.echelles).success ? ligne.echelles : convertirEchellesV1(ligne.echelles);
  const r = SchemaParametres.safeParse({
    poids: ligne.poids,
    echelles,
    seuils: ligne.seuils,
    couverture_min: Number(ligne.couverture_min),
    gestionnaires_classement: ligne.gestionnaires_classement,
  });
  if (!r.success) return null;
  return { version: ligne.version, ...(r.data as Omit<ParametresScore, "version">) };
}

/** Construit les 4 tranches de couleur à partir des débuts du jaune, de l'orange et du rouge. */
export function seuilsDepuisDebuts(jaune: number, orange: number, rouge: number): SeuilCouleur[] {
  return [
    { bande: "vert", min: 0, max: jaune - 1 },
    { bande: "jaune", min: jaune, max: orange - 1 },
    { bande: "orange", min: orange, max: rouge - 1 },
    { bande: "rouge", min: rouge, max: 100 },
  ];
}
