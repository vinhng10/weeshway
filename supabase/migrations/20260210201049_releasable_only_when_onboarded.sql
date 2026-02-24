drop trigger if exists "recommend_on_project_insert" on "public"."projects";

drop trigger if exists "manage_project_lifecycle" on "public"."projects";

drop policy "Enable users to view their own data only" on "public"."recommendation_items";

alter table "public"."profiles" add column "onboarding_complete" boolean not null default false;

CREATE INDEX bookings_project_id_idx ON public.bookings USING btree (project_id);

CREATE INDEX projects_location_id_idx ON public.projects USING btree (location_id);

CREATE INDEX projects_song_id_idx ON public.projects USING btree (song_id);

CREATE INDEX projects_user_id_idx ON public.projects USING btree (user_id);

CREATE INDEX recommendation_items_project_id_idx ON public.recommendation_items USING btree (project_id);

CREATE INDEX songs_centroid_id_idx ON public.songs USING btree (centroid_id);

CREATE INDEX watchings_project_id_idx ON public.watchings USING btree (project_id);

CREATE INDEX watchings_user_id_idx ON public.watchings USING btree (user_id);

CREATE INDEX wishes_song_id_idx ON public.wishes USING btree (song_id);

CREATE INDEX wishes_user_id_idx ON public.wishes USING btree (user_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.manage_project_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- UPDATE-only rules (OLD doesn't exist on INSERT)
    IF TG_OP = 'UPDATE' THEN
        -- Canceled projects are immutable
        IF OLD.status = 'Cancel' THEN
            RAISE EXCEPTION 'A Canceled project cannot be modified.';
        END IF;

        -- Released projects can only change status to Cancel
        IF OLD.status = 'Release' THEN
            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'Cannot move a Released project back to Draft.';
            END IF;

            IF NEW::text IS DISTINCT FROM OLD::text AND NEW.status = OLD.status THEN
                RAISE EXCEPTION 'This project is Released. Only the Status can be changed to Cancel.';
            END IF;
        END IF;
    END IF;

    -- Validate required fields before releasing (INSERT or UPDATE Draft -> Release)
    IF NEW.status = 'Release' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
        IF NEW.style IS NULL OR NEW.level IS NULL OR
           NEW.price IS NULL OR NEW.spots IS NULL OR NEW.start_at IS NULL OR
           NEW.end_at IS NULL OR NEW.location_id IS NULL THEN
            RAISE EXCEPTION 'Cannot release: Missing required project details.';
        END IF;

        -- Ensure Stripe onboarding is complete before accepting payments
        IF NOT (SELECT onboarding_complete FROM profiles WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Cannot release: Stripe onboarding incomplete.';
        END IF;
    END IF;

    RETURN NEW;
END;$function$
;


  create policy "Enable delete for users based on user_id"
  on "public"."wishes"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable users to update their own data only"
  on "public"."wishes"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable users to view their own data only"
  on "public"."recommendation_items"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.wishes
  WHERE ((wishes.id = recommendation_items.wish_id) AND (wishes.user_id = ( SELECT auth.uid() AS uid))))));


CREATE TRIGGER recommend_on_project_upsert AFTER INSERT OR UPDATE OF status ON public.projects FOR EACH ROW EXECUTE FUNCTION util.enqueue('project_recommendation_jobs');

CREATE TRIGGER manage_project_lifecycle BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.manage_project_lifecycle();
