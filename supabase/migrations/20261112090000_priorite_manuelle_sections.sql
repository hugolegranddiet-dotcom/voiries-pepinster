-- Demandes de Hugo du 11/11/2026 (décisions D19 à D21)
--   1. Priorité forcée à la main, avec un motif obligatoire.
--   2. Tracé des parties de rue : le père choisit les morceaux (segments OSM
--      réels) de la rue mère. Rien n'est dessiné à la main.
-- Les colonnes existantes, les données et la sécurité (RLS) ne changent pas ;
-- le journal des modifications enregistre ces nouveaux champs comme les autres.

-- 1. Priorité forcée ---------------------------------------------------------
alter table public.road_evaluations
  add column priorite_manuelle smallint
    check (priorite_manuelle between 0 and 100),
  add column priorite_manuelle_motif text
    check (priorite_manuelle_motif is null or length(priorite_manuelle_motif) <= 500),
  add constraint priorite_manuelle_avec_motif
    check (priorite_manuelle is null or length(trim(coalesce(priorite_manuelle_motif, ''))) > 0);

comment on column public.road_evaluations.priorite_manuelle is
  'Priorité (0-100) fixée à la main par l''utilisateur ; remplace le score calculé à l''affichage, qui reste visible.';

-- 2. Morceaux d'une partie de rue --------------------------------------------
alter table public.roads
  add column segments_section text[] not null default '{}';

comment on column public.roads.segments_section is
  'Pour une partie de rue (categorie = section) : identifiants des segments OSM de la rue mère qui la composent, choisis par l''utilisateur.';

-- Un morceau n'appartient qu'à une seule partie de rue, et seulement une partie
-- de rue peut en avoir. (Le lien avec la rue mère est vérifié par l'application.)
create function public.verifier_segments_section()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(array_length(new.segments_section, 1), 0) = 0 then
    return new;
  end if;
  if new.categorie <> 'section' then
    raise exception 'segments_reserves_aux_sections';
  end if;
  if exists (
    select 1 from public.road_segments s
     where s.id = any (new.segments_section)
       and s.road_id is distinct from new.parent_road_id
  ) or (
    select count(*) from public.road_segments s where s.id = any (new.segments_section)
  ) <> (select count(distinct x) from unnest(new.segments_section) x) then
    raise exception 'segment_hors_rue_mere';
  end if;
  if exists (
    select 1 from public.roads r
     where r.id <> new.id
       and r.parent_road_id = new.parent_road_id
       and r.segments_section && new.segments_section
  ) then
    raise exception 'segment_deja_attribue';
  end if;
  return new;
end;
$$;

create trigger verifier_segments_section
  before insert or update of segments_section on public.roads
  for each row execute function public.verifier_segments_section();
