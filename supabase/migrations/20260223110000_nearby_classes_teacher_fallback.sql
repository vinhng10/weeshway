-- Fall back to teacher's profile location/country for draft classes without a venue
CREATE OR REPLACE FUNCTION public.get_nearby_classes_for_user(p_user_id uuid)
 RETURNS SETOF public.projects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_location geometry;
  user_country country_code;
BEGIN
  SELECT location, country INTO user_location, user_country
  FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT p.*
  FROM projects p
  LEFT JOIN locations l ON p.location_id = l.id
  JOIN profiles teacher ON p.user_id = teacher.id
  WHERE
    CASE
      WHEN user_location IS NOT NULL AND COALESCE(l.location, teacher.location) IS NOT NULL THEN
        ST_DWithin(COALESCE(l.location, teacher.location), user_location, 1.0)
      WHEN user_country IS NOT NULL THEN
        COALESCE(l.country, teacher.country) = user_country
      ELSE TRUE
    END
  ORDER BY
    (user_location IS NOT NULL AND COALESCE(l.location, teacher.location) IS NOT NULL) DESC,
    COALESCE(l.location, teacher.location) <-> user_location ASC NULLS LAST,
    p.updated_at DESC;
END;
$function$;
