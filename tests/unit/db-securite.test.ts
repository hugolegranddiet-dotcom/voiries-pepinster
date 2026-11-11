// Tests de la base de données (phase 4) sur un vrai Postgres local (PGlite).
// On reproduit ce que Supabase fournit : le schéma « auth », la fonction
// auth.uid(), les rôles « anon » (visiteur) et « authenticated » (connecté),
// et les droits par défaut accordés à ces rôles. On applique ensuite la
// migration RÉELLE, puis on vérifie les refus d'accès et la persistance.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PARAMETRES_PAR_DEFAUT } from "@/lib/priority/defaults";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const INTRUS = "22222222-2222-4222-8222-222222222222";

const SIMULATION_SUPABASE = `
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

let db: PGlite;

async function commeService<T>(f: () => Promise<T>): Promise<T> {
  await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
  return f();
}
async function comme(role: "anon" | "authenticated", sub = "") {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub}', false); set role ${role};`);
}
async function erreur(sql: string): Promise<string | null> {
  try {
    await db.exec(sql);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(SIMULATION_SUPABASE);
  const dossier = join(__dirname, "..", "..", "supabase", "migrations");
  for (const f of readdirSync(dossier).filter((x) => x.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dossier, f), "utf8"));
  }
  // Données minimales créées par l'« import » (sans utilisateur connecté).
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'pere@example.test'), ('${INTRUS}', 'autre@example.test');
    insert into public.app_admins (user_id) values ('${ADMIN}');
    insert into public.geo_snapshots (id, source, extrait_le, licence, sha256)
      values ('33333333-3333-4333-8333-333333333333', 'osm', '2026-11-11', 'ODbL', 'abc');
    insert into public.roads (id, nom, categorie) values ('n:rue du test', 'Rue du Test', 'voirie');
    insert into public.road_evaluations (road_id, particularites, etat_note_suggeree)
      values ('n:rue du test', 'cul de sac', 3);
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

beforeEach(async () => {
  await db.exec("reset role;");
});

describe("visiteur non connecté (anon)", () => {
  it("ne peut rien lire", async () => {
    await comme("anon");
    expect(await erreur("select * from public.roads")).toMatch(/permission denied/);
    expect(await erreur("select * from public.road_evaluations")).toMatch(/permission denied/);
    expect(await erreur("select * from public.change_log")).toMatch(/permission denied/);
  });

  it("ne peut rien écrire", async () => {
    await comme("anon");
    expect(await erreur("update public.road_evaluations set particularites = 'piraté'")).toMatch(/permission denied/);
    expect(await erreur("insert into public.app_admins (user_id) values (gen_random_uuid())")).toMatch(/permission denied/);
  });
});

describe("utilisateur connecté mais non autorisé", () => {
  it("ne voit aucune donnée", async () => {
    await comme("authenticated", INTRUS);
    for (const t of ["roads", "road_evaluations", "road_segments", "import_rows", "change_log", "priority_settings"]) {
      const r = await db.query(`select count(*)::int as n from public.${t}`);
      expect((r.rows[0] as { n: number }).n, t).toBe(0);
    }
  });

  it("ne peut ni modifier, ni créer, ni supprimer", async () => {
    await comme("authenticated", INTRUS);
    const maj = await db.query("update public.road_evaluations set particularites = 'piraté' returning road_id");
    expect(maj.rows).toHaveLength(0);
    expect(await erreur("insert into public.roads (id, categorie) values ('x', 'voirie')")).toMatch(/row-level security/);
    const sup = await db.query("delete from public.roads returning id");
    expect(sup.rows).toHaveLength(0);
    await commeService(async () => {
      const r = await db.query("select particularites from public.road_evaluations");
      expect(r.rows[0]).toEqual({ particularites: "cul de sac" });
    });
  });

  it("ne peut pas se déclarer administrateur", async () => {
    await comme("authenticated", INTRUS);
    expect(await erreur(`insert into public.app_admins (user_id) values ('${INTRUS}')`)).toMatch(/row-level security/);
  });
});

describe("administrateur (le père)", () => {
  it("lit les données", async () => {
    await comme("authenticated", ADMIN);
    const r = await db.query("select nom from public.roads");
    expect(r.rows).toEqual([{ nom: "Rue du Test" }]);
  });

  it("modifie, et la modification persiste avec son historique", async () => {
    await comme("authenticated", ADMIN);
    await db.exec("update public.road_evaluations set particularites = 'cul de sac, école', etat_note = 3 where road_id = 'n:rue du test'");
    await db.exec("reset role;");
    await comme("authenticated", ADMIN); // « rafraîchissement » : nouvelle lecture
    const r = await db.query("select particularites, etat_note from public.road_evaluations");
    expect(r.rows[0]).toEqual({ particularites: "cul de sac, école", etat_note: 3 });
    const j = await db.query(
      "select champ, avant, apres, auteur::text from public.change_log where record_id = 'n:rue du test' and operation = 'UPDATE' order by id",
    );
    expect(j.rows).toEqual([
      { champ: "etat_note", avant: null, apres: 3, auteur: ADMIN },
      { champ: "particularites", avant: "cul de sac", apres: "cul de sac, école", auteur: ADMIN },
    ]);
  });

  it("refuse une note hors de 1 à 5", async () => {
    await comme("authenticated", ADMIN);
    expect(await erreur("update public.road_evaluations set etat_note = 6")).toMatch(/check constraint/);
  });

  it("crée et supprime une évaluation (CRUD), avec journal", async () => {
    await comme("authenticated", ADMIN);
    await db.exec("insert into public.roads (id, nom, categorie) values ('n:nouvelle', 'Nouvelle', 'voirie')");
    await db.exec("insert into public.road_evaluations (road_id, risque_securite) values ('n:nouvelle', 2)");
    await db.exec("delete from public.road_evaluations where road_id = 'n:nouvelle'");
    const j = await db.query(
      "select operation from public.change_log where record_id = 'n:nouvelle' and table_name = 'road_evaluations' order by id",
    );
    expect(j.rows.map((x) => (x as { operation: string }).operation)).toEqual(["INSERT", "DELETE"]);
  });

  it("ne peut pas réécrire le journal", async () => {
    await comme("authenticated", ADMIN);
    expect(await erreur("insert into public.change_log (table_name, record_id, operation) values ('x', 'y', 'UPDATE')")).toMatch(/row-level security/);
    const sup = await db.query("delete from public.change_log returning id");
    expect(sup.rows).toHaveLength(0);
  });

  it("n'a qu'une version active des paramètres", async () => {
    await comme("authenticated", ADMIN);
    await db.exec(`insert into public.priority_settings (version, actif, poids, echelles, seuils, couverture_min) values (1, true, '{}', '{}', '[]', 0.7)`);
    expect(await erreur(`insert into public.priority_settings (version, actif, poids, echelles, seuils, couverture_min) values (2, true, '{}', '{}', '[]', 0.7)`)).toMatch(/duplicate key/);
  });
});

describe("phase 6 : paramètres versionnés et validation des notes suggérées", () => {
  const APPEL = `select public.publier_parametres('{"etat":60,"intensite":20,"densite":10,"risque":10}', '{}', '[]', 0.7, '{commune}') as v`;

  it("refuse la publication de paramètres aux visiteurs et aux intrus", async () => {
    await comme("anon");
    expect(await erreur(APPEL)).toMatch(/permission denied/);
    await comme("authenticated", INTRUS);
    expect(await erreur(APPEL)).toMatch(/acces_refuse/);
  });

  it("publie une nouvelle version active et garde l'ancienne", async () => {
    await comme("authenticated", ADMIN);
    const r = await db.query<{ v: number }>(APPEL);
    expect(r.rows[0].v).toBe(2);
    const versions = await db.query("select version, actif, created_by::text from public.priority_settings order by version");
    expect(versions.rows).toEqual([
      { version: 1, actif: false, created_by: null },
      { version: 2, actif: true, created_by: ADMIN },
    ]);
    // Retour à la version 1 : toujours une seule version active.
    await db.exec("select public.activer_parametres(1)");
    const actives = await db.query<{ version: number }>("select version from public.priority_settings where actif");
    expect(actives.rows).toEqual([{ version: 1 }]);
    expect(await erreur("select public.activer_parametres(99)")).toMatch(/version_inconnue/);
    const j = await db.query<{ n: number }>("select count(*)::int n from public.change_log where table_name = 'priority_settings'");
    expect(j.rows[0].n).toBeGreaterThanOrEqual(3);
  });

  it("valide par lot les seules notes suggérées encore vides", async () => {
    await commeService(() =>
      db.exec(`
        insert into public.roads (id, nom, categorie) values ('n:a', 'A', 'voirie'), ('n:b', 'B', 'voirie'), ('n:c', 'C', 'voirie');
        insert into public.road_evaluations (road_id, etat_note_suggeree, etat_note) values ('n:a', 4, null), ('n:b', 2, 5), ('n:c', null, null);
      `),
    );
    // Un intrus ne valide rien (sécurité par ligne).
    await comme("authenticated", INTRUS);
    expect((await db.query("select public.valider_notes_suggerees(array['n:a'])")).rows).toHaveLength(0);
    await comme("authenticated", ADMIN);
    const r = await db.query<{ id: string }>("select public.valider_notes_suggerees(array['n:a', 'n:b', 'n:c']) as id");
    expect(r.rows).toEqual([{ id: "n:a" }]);
    const notes = await db.query("select road_id, etat_note from public.road_evaluations where road_id in ('n:a', 'n:b', 'n:c') order by road_id");
    expect(notes.rows).toEqual([
      { road_id: "n:a", etat_note: 4 },
      { road_id: "n:b", etat_note: 5 }, // note déjà saisie : jamais écrasée
      { road_id: "n:c", etat_note: null },
    ]);
    const j = await db.query("select champ, avant, apres, auteur::text from public.change_log where record_id = 'n:a' and operation = 'UPDATE'");
    expect(j.rows).toEqual([{ champ: "etat_note", avant: null, apres: 4, auteur: ADMIN }]);
  });
});

describe("import des vraies données dans le vrai schéma", () => {
  it("respecte toutes les contraintes (clés, valeurs, champs obligatoires)", async () => {
    const { construireDonnees } = await import("../../scripts/db/construire");
    const d = await construireDonnees(join(__dirname, "..", ".."));
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);");
    // Insertion « à la manière de l'API » : colonnes fournies, les autres prennent leur valeur par défaut.
    const inserer = async (table: string, lignes: Array<Record<string, unknown>>) => {
      const cols = Object.keys(lignes[0]);
      for (const l of lignes) expect(Object.keys(l).sort(), `${table} : colonnes homogènes`).toEqual([...cols].sort());
      const liste = cols.map((c) => `"${c}"`).join(", ");
      await db.query(
        `insert into public.${table} (${liste}) select ${liste} from json_populate_recordset(null::public.${table}, $1::json)`,
        [JSON.stringify(lignes)],
      );
    };
    await db.exec("delete from public.road_evaluations; delete from public.roads; delete from public.priority_settings;");
    const snap = await db.query<{ id: string }>(
      `insert into public.geo_snapshots (source, date_donnees, extrait_le, licence, sha256, relation_commune, code_ins, limite, stats)
       select source, date_donnees, extrait_le, licence, sha256, relation_commune, code_ins, limite, stats
       from json_populate_record(null::public.geo_snapshots, $1::json) returning id`,
      [JSON.stringify(d.snapshot)],
    );
    const snapshotId = snap.rows[0].id;
    await inserer("roads", d.roads.map((r) => ({ ...r, snapshot_id: snapshotId })));
    await inserer("road_segments", d.segments.map((s) => ({ ...s, snapshot_id: snapshotId })));
    await inserer("roads", d.sections);
    const lot = await db.query<{ id: string }>(
      `insert into public.import_batches (fichier, sha256, feuille, plage, lignes_attendues, lignes_importees)
       select fichier, sha256, feuille, plage, lignes_attendues, lignes_importees from json_populate_record(null::public.import_batches, $1::json) returning id`,
      [JSON.stringify(d.lot)],
    );
    await inserer("import_rows", d.lignesExcel.map((l) => ({ ...l, batch_id: lot.rows[0].id })));
    const ids = await db.query<{ id: string; excel_ligne: number }>("select id, excel_ligne from public.import_rows");
    const idParLigne = new Map(ids.rows.map((r) => [r.excel_ligne, r.id]));
    await inserer("match_reviews", d.decisions.map(({ excel_ligne, ...r }) => ({ ...r, import_row_id: idParLigne.get(excel_ligne) })));
    await inserer("road_evaluations", d.evaluations);
    await inserer("priority_settings", [d.parametres]);
    // Comme le seed : gestionnaire repris de l'Excel, sur les fiches encore « à compléter ».
    for (const g of d.gestionnaires) {
      await db.query(
        `update public.roads set gestionnaire = $1, gestionnaire_detail = $2, gestionnaire_source = 'excel', statut_fiche = 'importe_excel'
         where id in (select json_array_elements_text($3::json)) and statut_fiche = 'a_completer'`,
        [g.valeurs.gestionnaire, g.valeurs.gestionnaire_detail, JSON.stringify(g.ids)],
      );
    }

    const n = async (sql: string) => ((await db.query<{ n: number }>(sql)).rows[0].n);
    expect(await n("select count(*)::int n from public.roads")).toBe(1135);
    expect(await n("select count(*)::int n from public.road_segments")).toBe(1489);
    expect(await n("select count(*)::int n from public.import_rows")).toBe(180);
    expect(await n("select count(*)::int n from public.road_evaluations where statut_validation = 'conflit_a_resoudre'")).toBe(0); // D17
    expect(await n("select count(*)::int n from public.road_evaluations where etat_note is not null")).toBe(0);
    expect(await n("select count(*)::int n from public.road_segments s left join public.roads r on r.id = s.road_id where r.id is null")).toBe(0);
  }, 60_000);
});

describe("lecture de la carte depuis la base", () => {
  // Petit substitut du client Supabase : traduit les appels utilisés en SQL sur PGlite.
  function clientSql() {
    const requete = (table: string) => {
      const etat: { filtres: Array<[string, unknown[]]>; ordres: string[]; de?: number; a?: number; limite?: number } = { filtres: [], ordres: [] };
      const executer = async () => {
        const where = etat.filtres.map(([c], i) => `"${c}"::text in (select json_array_elements_text($${i + 1}::json))`).join(" and ");
        let sql = `select * from public.${table}${where ? ` where ${where}` : ""}${etat.ordres.length ? ` order by ${etat.ordres.join(", ")}` : ""}`;
        if (etat.de !== undefined) sql += ` offset ${etat.de} limit ${etat.a! - etat.de + 1}`;
        else if (etat.limite) sql += ` limit ${etat.limite}`;
        const r = await db.query(sql, etat.filtres.map(([, v]) => JSON.stringify(v)));
        return r.rows;
      };
      const api = {
        select: () => api,
        order: (c: string, o?: { ascending?: boolean }) => (etat.ordres.push(`"${c}" ${o?.ascending === false ? "desc" : "asc"}`), api),
        in: (c: string, v: unknown[]) => (etat.filtres.push([c, v]), api),
        eq: (c: string, v: unknown) => (etat.filtres.push([c, [v]]), api),
        limit: (n: number) => ((etat.limite = n), api),
        range: (de: number, a: number) => {
          etat.de = de;
          etat.a = a;
          return executer().then((data) => ({ data, error: null }));
        },
        maybeSingle: () => executer().then((data) => ({ data: data[0] ?? null, error: null })),
      };
      return api;
    };
    return { from: requete } as unknown as import("@supabase/supabase-js").SupabaseClient;
  }

  it("reconstruit la carte et les fiches à partir des tables", async () => {
    const { lireDonneesApp } = await import("@/lib/db/carte");
    await db.exec("reset role;");
    const d = await lireDonneesApp(clientSql());
    expect(d.voies.features).toHaveLength(1489);
    expect(d.voiries.voiries).toHaveLength(1119); // voiries tracées (sans les sections)
    expect(Object.keys(d.fiches)).toHaveLength(1135); // toutes les fiches, sections comprises
    expect(d.voiries.meta.codeIns).toBe("63058");
    expect(d.limite.features.some((f) => f.properties.type === "commune")).toBe(true);
    // Une voirie validée : évaluation issue de l'Excel, note seulement suggérée.
    const biez = d.fiches["n:rue du biez"];
    expect(biez.origineExcel.map((o) => o.ligne)).toEqual([15]);
    expect(biez.origineExcel[0].couleurEtat).toBe("#FF0000");
    expect(biez.evaluation?.etat_note_suggeree).toBe(4);
    expect(biez.evaluation?.etat_note).toBeNull();
    expect(biez.evaluation?.particularites).toBe("Ecole, trottois HS");
    expect(biez.aTrace).toBe(true);
    expect(biez.statutFiche).toBe("importe_excel");
    expect(Object.values(d.fiches).filter((f) => f.statutFiche === "importe_excel")).toHaveLength(165); // 149 + 16 sections
    // Les parties de rue sont des fiches à part, rattachées à leur voirie mère.
    const bouhaye = d.fiches["n:bouhaye"];
    expect(bouhaye.sousSections.map((id) => d.fiches[id].nom).sort()).toEqual(["Bouhaye inférieure", "Bouhaye supérieure"]);
    const section = d.fiches[bouhaye.sousSections[0]];
    expect(section.categorie).toBe("section");
    expect(section.aTrace).toBe(false);
    expect(section.anciennesCommunes).toEqual(bouhaye.anciennesCommunes);
    // Paramètres du score : la version 1 importée, relue telle quelle.
    expect(d.parametresAvertissement).toBeNull();
    expect(d.parametres).toEqual({ ...PARAMETRES_PAR_DEFAUT, version: 1 });
    expect(d.versionsParametres.map((v) => [v.version, v.actif, v.lisible])).toEqual([[1, true, true]]);
    // Conflit tranché (D17) : seule la ligne 103 reste sur la Rue du Paire.
    expect(d.fiches["n:rue du paire"].origineExcel.map((o) => o.ligne)).toEqual([103]);
    // Une voirie sans ligne Excel reste « à compléter ».
    expect(Object.values(d.fiches).some((f) => f.statutFiche === "a_completer" && !f.evaluation)).toBe(true);
  }, 60_000);
});
