-- Phase 6 — Priorités
-- Deux opérations qui doivent se faire « d'un bloc » (tout ou rien) :
--   1. publier une nouvelle version des paramètres du score (l'ancienne reste
--      conservée, simplement désactivée) ;
--   2. valider par lot des notes d'état SUGGÉRÉES par la couleur de l'Excel.
-- Les fonctions s'exécutent avec les droits de l'utilisateur connecté
-- (« security invoker ») : la sécurité par ligne (RLS) s'applique toujours,
-- et le journal des modifications est rempli par les déclencheurs existants.

-- 1. Nouvelle version des paramètres -----------------------------------------
create function public.publier_parametres(
  p_poids jsonb,
  p_echelles jsonb,
  p_seuils jsonb,
  p_couverture_min numeric,
  p_gestionnaires text[]
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  nouvelle integer;
begin
  if not (select public.est_admin()) then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  select coalesce(max(version), 0) + 1 into nouvelle from public.priority_settings;
  update public.priority_settings set actif = false where actif;
  insert into public.priority_settings
    (version, actif, poids, echelles, seuils, couverture_min, gestionnaires_classement, created_by)
  values
    (nouvelle, true, p_poids, p_echelles, p_seuils, p_couverture_min, p_gestionnaires, (select auth.uid()));
  return nouvelle;
end;
$$;

-- Revenir à une version précédente (aucune version n'est jamais effacée).
create function public.activer_parametres(p_version integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.est_admin()) then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  if not exists (select 1 from public.priority_settings where version = p_version) then
    raise exception 'version_inconnue';
  end if;
  update public.priority_settings set actif = false where actif and version <> p_version;
  update public.priority_settings set actif = true where version = p_version and not actif;
end;
$$;

-- 2. Validation par lot des notes suggérées ----------------------------------
-- Ne touche QUE les voiries choisies, et seulement si aucune note n'a encore
-- été saisie : une note déjà validée ou corrigée par le père n'est jamais écrasée.
create function public.valider_notes_suggerees(p_ids text[])
returns setof text
language sql
security invoker
set search_path = ''
as $$
  update public.road_evaluations
     set etat_note = etat_note_suggeree,
         updated_by = (select auth.uid())
   where road_id = any (p_ids)
     and etat_note is null
     and etat_note_suggeree is not null
  returning road_id;
$$;

revoke execute on function public.publier_parametres(jsonb, jsonb, jsonb, numeric, text[]) from anon, public;
revoke execute on function public.activer_parametres(integer) from anon, public;
revoke execute on function public.valider_notes_suggerees(text[]) from anon, public;
grant execute on function public.publier_parametres(jsonb, jsonb, jsonb, numeric, text[]) to authenticated;
grant execute on function public.activer_parametres(integer) to authenticated;
grant execute on function public.valider_notes_suggerees(text[]) to authenticated;
