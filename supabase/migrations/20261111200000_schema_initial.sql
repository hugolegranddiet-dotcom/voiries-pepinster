-- =============================================================================
-- Voiries Pepinster — schéma initial (phase 4)
-- Conforme à DATA_MODEL.md. Toutes les tables ont la sécurité par ligne (RLS) :
-- seul un utilisateur listé dans app_admins peut lire ou écrire.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Vocabulaires
-- ---------------------------------------------------------------------------
create type public.gestionnaire as enum ('commune', 'spw', 'autre', 'inconnu');
create type public.categorie_voirie as enum ('voirie', 'chemin', 'acces', 'section');
create type public.statut_fiche as enum ('a_completer', 'importe_excel', 'valide', 'n_existe_plus', 'hors_commune');
create type public.statut_geo as enum ('trace_osm', 'sans_trace');
create type public.mention_etat as enum ('RAS', 'SPW', 'vide', 'autre');
create type public.intensite_circulation as enum ('faible', 'moyen', 'eleve', 'transit');
create type public.densite_habitation as enum ('nul', 'faible', 'moyen_bas', 'moyen_eleve', 'eleve');
create type public.ampleur_travaux as enum ('schlammage', 'enduisage', 'raclage_partiel', 'raclage_complet', 'reparation_ponctuelle', 'autre');
create type public.statut_validation as enum ('non_valide', 'partiellement_valide', 'valide', 'conflit_a_resoudre');
create type public.statut_correspondance as enum ('a_valider', 'valide', 'rejete', 'section_a_definir', 'introuvable_osm', 'n_existe_plus');

-- ---------------------------------------------------------------------------
-- Administrateurs (une seule personne : le père de Hugo, décision D9)
-- ---------------------------------------------------------------------------
create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now()
);

-- Vrai si l'utilisateur connecté est administrateur.
-- « security definer » : peut lire app_admins sans dépendre de ses propres règles.
create function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Géographie (OSM) — resynchronisable sans toucher aux évaluations
-- ---------------------------------------------------------------------------
create table public.geo_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  date_donnees timestamptz,
  extrait_le date not null,
  licence text not null,
  sha256 text not null unique,
  relation_commune bigint,
  code_ins text,
  limite jsonb,
  stats jsonb,
  cree_le timestamptz not null default now()
);

create table public.roads (
  id text primary key,
  nom text,
  nom_normalise text,
  alias text[] not null default '{}',
  categorie public.categorie_voirie not null,
  parent_road_id text references public.roads (id) on delete set null,
  gestionnaire public.gestionnaire not null default 'inconnu',
  gestionnaire_detail text,
  gestionnaire_source text,
  statut_fiche public.statut_fiche not null default 'a_completer',
  statut_geo public.statut_geo not null default 'trace_osm',
  traverse_limite boolean not null default false,
  sections text[] not null default '{}',
  longueur_m integer check (longueur_m is null or longueur_m >= 0),
  types_osm text[] not null default '{}',
  ways_osm bigint[] not null default '{}',
  indice_spw text check (indice_spw in ('oui', 'partiel', 'non', 'inconnu')),
  refs_spw text[] not null default '{}',
  partie jsonb,
  alerte text,
  distance_autre_groupe_m integer,
  snapshot_id uuid references public.geo_snapshots (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index roads_parent_idx on public.roads (parent_road_id);

create table public.road_segments (
  id text primary key,
  road_id text references public.roads (id) on delete set null,
  snapshot_id uuid not null references public.geo_snapshots (id),
  osm_way_id bigint not null,
  highway text not null,
  categorie public.categorie_voirie not null,
  coupe_limite boolean not null default false,
  indice_spw boolean not null default false,
  geometry jsonb not null check (geometry ->> 'type' = 'LineString'),
  created_at timestamptz not null default now()
);
create index road_segments_road_idx on public.road_segments (road_id);

-- ---------------------------------------------------------------------------
-- Évaluations (critères métier) — une par voirie
-- ---------------------------------------------------------------------------
create table public.road_evaluations (
  road_id text primary key references public.roads (id) on delete cascade,
  etat_note smallint check (etat_note between 1 and 5),
  etat_note_suggeree smallint check (etat_note_suggeree between 1 and 5),
  etat_note_suggeree_origine text,
  mention_etat_source public.mention_etat not null default 'vide',
  type_habitat_brut text,
  type_habitat text,
  type_voirie_source text,
  intensite_circulation public.intensite_circulation,
  densite_habitation public.densite_habitation,
  ampleur_travaux_brut text,
  ampleur_travaux public.ampleur_travaux,
  echeance_brute text,
  annee_prevue smallint check (annee_prevue between 1990 and 2100),
  annee_realisation smallint check (annee_realisation between 1990 and 2100),
  echeance_estimee smallint check (echeance_estimee between 1990 and 2100),
  echeance_estimee_regle text,
  mobilite_note text,
  risque_securite smallint check (risque_securite between 1 and 5),
  particularites text,
  etiquettes text[] not null default '{}',
  statut_validation public.statut_validation not null default 'non_valide',
  source_excel_ligne smallint,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Import de l'Excel et correspondances (mémoire fidèle de la source)
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  fichier text not null,
  sha256 text not null unique,
  feuille text not null,
  plage text not null,
  lignes_attendues integer not null,
  lignes_importees integer not null,
  importe_le timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  excel_ligne smallint not null,
  bloc text not null,
  brut jsonb not null,
  normalise jsonb not null,
  journal jsonb not null default '[]',
  road_id text references public.roads (id) on delete set null,
  statut_correspondance public.statut_correspondance not null default 'a_valider',
  unique (batch_id, excel_ligne)
);

create table public.match_reviews (
  id uuid primary key default gen_random_uuid(),
  import_row_id uuid not null unique references public.import_rows (id) on delete cascade,
  methode text not null,
  confiance text not null,
  candidats jsonb not null default '[]',
  propose_road_id text references public.roads (id) on delete set null,
  decision text check (decision in ('OK', 'NON', 'AUTRE', 'SECTION', 'INTROUVABLE')),
  decided_road_id text references public.roads (id) on delete set null,
  statut public.statut_correspondance not null default 'a_valider',
  source text,
  commentaire text,
  decide_le timestamptz
);

-- ---------------------------------------------------------------------------
-- Paramètres du score (versionnés, une seule version active)
-- ---------------------------------------------------------------------------
create table public.priority_settings (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  actif boolean not null default false,
  poids jsonb not null,
  echelles jsonb not null,
  seuils jsonb not null,
  couverture_min numeric not null check (couverture_min between 0 and 1),
  gestionnaires_classement text[] not null default '{commune}',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
create unique index priority_settings_une_active on public.priority_settings (actif) where actif;

-- ---------------------------------------------------------------------------
-- Journal des modifications (avant / après, auteur, date)
-- ---------------------------------------------------------------------------
create table public.change_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  champ text,
  avant jsonb,
  apres jsonb,
  auteur uuid,
  modifie_le timestamptz not null default now()
);
create index change_log_record_idx on public.change_log (table_name, record_id, modifie_le desc);

-- Date de mise à jour automatique.
create function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger roads_updated_at before update on public.roads
  for each row execute function public.maj_updated_at();
create trigger road_evaluations_updated_at before update on public.road_evaluations
  for each row execute function public.maj_updated_at();

-- Une ligne de journal par champ modifié. L'interface ne peut pas l'oublier.
-- Les créations faites par l'import (sans utilisateur connecté) ne sont pas
-- journalisées : elles sont tracées par import_batches.
create function public.journaliser()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ancien jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  nouveau jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  cle_enr text := coalesce(nouveau ->> 'id', nouveau ->> 'road_id', ancien ->> 'id', ancien ->> 'road_id');
  auteur uuid := (select auth.uid());
  champ text;
begin
  if tg_op = 'UPDATE' then
    for champ in select jsonb_object_keys(nouveau) loop
      if champ not in ('updated_at', 'updated_by') and (ancien -> champ) is distinct from (nouveau -> champ) then
        insert into public.change_log (table_name, record_id, operation, champ, avant, apres, auteur)
        values (tg_table_name, cle_enr, 'UPDATE', champ, ancien -> champ, nouveau -> champ, auteur);
      end if;
    end loop;
    return new;
  elsif tg_op = 'INSERT' then
    if auteur is not null then
      insert into public.change_log (table_name, record_id, operation, apres, auteur)
      values (tg_table_name, cle_enr, 'INSERT', nouveau, auteur);
    end if;
    return new;
  else
    insert into public.change_log (table_name, record_id, operation, avant, auteur)
    values (tg_table_name, cle_enr, 'DELETE', ancien, auteur);
    return old;
  end if;
end;
$$;

create trigger roads_journal after insert or update or delete on public.roads
  for each row execute function public.journaliser();
create trigger road_evaluations_journal after insert or update or delete on public.road_evaluations
  for each row execute function public.journaliser();
create trigger match_reviews_journal after insert or update or delete on public.match_reviews
  for each row execute function public.journaliser();
create trigger priority_settings_journal after insert or update or delete on public.priority_settings
  for each row execute function public.journaliser();

-- ---------------------------------------------------------------------------
-- Sécurité par ligne : TOUT est refusé, sauf à l'administrateur
-- ---------------------------------------------------------------------------
alter table public.app_admins enable row level security;
alter table public.geo_snapshots enable row level security;
alter table public.roads enable row level security;
alter table public.road_segments enable row level security;
alter table public.road_evaluations enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.match_reviews enable row level security;
alter table public.priority_settings enable row level security;
alter table public.change_log enable row level security;

-- Un utilisateur connecté peut seulement vérifier s'il est lui-même administrateur.
create policy "admin : lire sa propre ligne" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "admin : tout" on public.geo_snapshots
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.roads
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.road_segments
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.road_evaluations
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.import_batches
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.import_rows
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.match_reviews
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "admin : tout" on public.priority_settings
  for all to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
-- Le journal se lit, mais ne s'écrit que par les déclencheurs.
create policy "admin : lire le journal" on public.change_log
  for select to authenticated using ((select public.est_admin()));

-- Les visiteurs non connectés (rôle « anon ») n'ont accès à rien.
revoke all on all tables in schema public from anon;
revoke execute on function public.est_admin() from anon, public;
grant execute on function public.est_admin() to authenticated;
