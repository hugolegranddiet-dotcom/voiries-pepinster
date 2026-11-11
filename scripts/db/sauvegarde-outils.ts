// Sauvegarde et restauration des données SAISIES dans l'application.
// Les tracés (road_segments, geo_snapshots) ne sont pas sauvegardés ici : ils se
// reconstruisent à l'identique depuis data/geo avec « npm run db:seed ».
import type { SupabaseClient } from "@supabase/supabase-js";

/** Tables sauvegardées, dans l'ordre. */
export const TABLES_SAUVEGARDE = [
  "roads",
  "road_evaluations",
  "priority_settings",
  "import_batches",
  "import_rows",
  "match_reviews",
  "change_log",
  "app_admins",
] as const;
export type TableSauvegarde = (typeof TABLES_SAUVEGARDE)[number];

const CLE_TRI: Record<TableSauvegarde, string> = {
  roads: "id",
  road_evaluations: "road_id",
  priority_settings: "version",
  import_batches: "id",
  import_rows: "excel_ligne",
  match_reviews: "id",
  change_log: "id",
  app_admins: "user_id",
};

export type Ligne = Record<string, unknown>;

export interface Sauvegarde {
  format: "voiries-pepinster-sauvegarde";
  version: 1;
  creeLe: string;
  comptes: Record<TableSauvegarde, number>;
  tables: Record<TableSauvegarde, Ligne[]>;
}

const PAGE = 1000;

export async function lireTable(client: SupabaseClient, table: TableSauvegarde): Promise<Ligne[]> {
  const lignes: Ligne[] = [];
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await client.from(table).select("*").order(CLE_TRI[table]).range(de, de + PAGE - 1);
    if (error) throw new Error(`${table} : ${error.message}`);
    lignes.push(...((data as Ligne[]) ?? []));
    if (!data || data.length < PAGE) return lignes;
  }
}

export async function creerSauvegarde(client: SupabaseClient, maintenant = new Date()): Promise<Sauvegarde> {
  const tables = {} as Record<TableSauvegarde, Ligne[]>;
  for (const t of TABLES_SAUVEGARDE) tables[t] = await lireTable(client, t);
  return {
    format: "voiries-pepinster-sauvegarde",
    version: 1,
    creeLe: maintenant.toISOString(),
    comptes: Object.fromEntries(TABLES_SAUVEGARDE.map((t) => [t, tables[t].length])) as Record<TableSauvegarde, number>,
    tables,
  };
}

export function lireFichierSauvegarde(texte: string): Sauvegarde {
  const s = JSON.parse(texte) as Partial<Sauvegarde>;
  if (s.format !== "voiries-pepinster-sauvegarde" || s.version !== 1 || !s.tables) throw new Error("Ce fichier n'est pas une sauvegarde Voiries Pepinster.");
  for (const t of ["roads", "road_evaluations", "priority_settings"] as const) {
    if (!Array.isArray(s.tables[t])) throw new Error(`Sauvegarde incomplète : table « ${t} » absente.`);
    if (s.comptes && s.comptes[t] !== s.tables[t].length) throw new Error(`Sauvegarde abîmée : nombre de lignes incohérent pour « ${t} ».`);
  }
  return s as Sauvegarde;
}

/** Champs d'une voirie que l'application permet de modifier (le reste vient d'OSM). */
export const CHAMPS_VOIRIE_MODIFIABLES = ["gestionnaire", "gestionnaire_detail", "gestionnaire_source", "statut_fiche"] as const;
/** Champs techniques recalculés par la base : jamais restaurés. */
const CHAMPS_IGNORES = new Set(["updated_at"]);

const egal = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export interface PlanRestauration {
  /** Évaluations à recréer ou à remettre comme dans la sauvegarde. */
  evaluations: Ligne[];
  /** Voiries dont un champ modifiable diffère. */
  voiries: Ligne[];
  /** Versions de paramètres absentes ou différentes. */
  parametres: Ligne[];
  versionActive: number | null;
  /** Voiries de la sauvegarde qui n'existent plus dans la base (non restaurées). */
  voiriesInconnues: string[];
}

/**
 * Compare la base actuelle à la sauvegarde et liste ce qui serait remis en place.
 * Ne supprime JAMAIS rien : ce qui a été ajouté depuis la sauvegarde reste.
 */
export function planifierRestauration(
  actuel: { roads: Ligne[]; road_evaluations: Ligne[]; priority_settings: Ligne[] },
  s: Sauvegarde,
): PlanRestauration {
  const roads = new Map(actuel.roads.map((r) => [r.id as string, r]));
  const evals = new Map(actuel.road_evaluations.map((e) => [e.road_id as string, e]));
  const reglages = new Map(actuel.priority_settings.map((p) => [p.version as number, p]));
  const voiriesInconnues = new Set<string>();

  const evaluations = s.tables.road_evaluations.filter((e) => {
    if (!roads.has(e.road_id as string)) {
      voiriesInconnues.add(e.road_id as string);
      return false;
    }
    const a = evals.get(e.road_id as string);
    return !a || Object.keys(e).some((k) => !CHAMPS_IGNORES.has(k) && !egal(a[k], e[k]));
  }).map((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !CHAMPS_IGNORES.has(k))));

  const voiries = s.tables.roads
    .filter((r) => {
      const a = roads.get(r.id as string);
      if (!a) {
        voiriesInconnues.add(r.id as string);
        return false;
      }
      return CHAMPS_VOIRIE_MODIFIABLES.some((k) => !egal(a[k], r[k]));
    })
    .map((r) => Object.fromEntries([["id", r.id], ...CHAMPS_VOIRIE_MODIFIABLES.map((k) => [k, r[k]])]));

  const comparables = ["poids", "echelles", "seuils", "couverture_min", "gestionnaires_classement"];
  const parametres = s.tables.priority_settings.filter((p) => {
    const a = reglages.get(p.version as number);
    return !a || comparables.some((k) => !egal(a[k], p[k]));
  });
  const active = s.tables.priority_settings.find((p) => p.actif);

  return { evaluations, voiries, parametres, versionActive: (active?.version as number) ?? null, voiriesInconnues: [...voiriesInconnues].sort() };
}
