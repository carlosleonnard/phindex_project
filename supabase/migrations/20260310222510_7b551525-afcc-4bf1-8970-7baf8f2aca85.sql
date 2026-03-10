
-- Fix UPDATE policy for user_profiles: add WITH CHECK clause so admins can update any profile
DROP POLICY IF EXISTS "Users can update their own profiles or admins can update any" ON public.user_profiles;

CREATE POLICY "Users can update their own profiles or admins can update any"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id) OR public.is_admin());
