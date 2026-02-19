alter table "public"."profiles"
  add column "policies_agreed_at" timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  insert into public.profiles (id, full_name, avatar_url, policies_agreed_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', now());

  perform util.invoke_edge_function(
    name => 'connect-account',
    body => jsonb_build_object('userId', new.id, 'email', new.email),
    timeout_milliseconds => 30000
  );

  return new;
end;$function$;
