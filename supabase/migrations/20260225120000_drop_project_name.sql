ALTER TABLE public.projects DROP COLUMN IF EXISTS name;

CREATE OR REPLACE FUNCTION public.create_project_with_song(p_song_data jsonb, p_project_data jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
declare
  v_project_id bigint;
begin
  insert into public.songs (id, name, artist_name, artwork_url, preview_url, genre)
  values (
    p_song_data->>'id',
    p_song_data->>'name',
    p_song_data->>'artist_name',
    p_song_data->>'artwork_url',
    p_song_data->>'preview_url',
    p_song_data->>'genre'
  )
  on conflict (id) do nothing;

  insert into public.projects (status, style, level, price, spots, description, start_at, end_at, location_id, song_id, currency)
  values (
    (p_project_data->>'status')::public.status,
    (p_project_data->>'style')::public.style,
    (p_project_data->>'level')::public.level,
    (p_project_data->>'price')::integer * 100,
    (p_project_data->>'spots')::smallint,
    p_project_data->>'description',
    (p_project_data->>'start_at')::timestamp with time zone,
    (p_project_data->>'end_at')::timestamp with time zone,
    (p_project_data->>'location_id')::text,
    p_song_data->>'id',
    p_project_data->>'currency'
  )
  returning id into v_project_id;

  return v_project_id;
end;$function$;
