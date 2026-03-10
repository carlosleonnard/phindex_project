
-- Allow admins to update and delete any complete_profiles record
DROP POLICY IF EXISTS "Admins can update any complete profile" ON public.complete_profiles;
CREATE POLICY "Admins can update any complete profile"
ON public.complete_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any complete profile" ON public.complete_profiles;
CREATE POLICY "Admins can delete any complete profile"
ON public.complete_profiles
FOR DELETE
TO authenticated
USING (public.is_admin());
