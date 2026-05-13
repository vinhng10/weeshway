DROP POLICY IF EXISTS "Enable insert for wish owner" ON public.wish_teachers;
DROP POLICY IF EXISTS "Enable delete for wish owner" ON public.wish_teachers;

CREATE POLICY "Enable insert for wish owner"
  ON public.wish_teachers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = (select auth.uid()))
  );

CREATE POLICY "Enable delete for wish owner"
  ON public.wish_teachers FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = (select auth.uid()))
  );
