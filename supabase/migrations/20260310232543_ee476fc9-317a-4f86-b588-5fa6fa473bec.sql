
-- Drop potentially RESTRICTIVE policies blocking admins
DROP POLICY IF EXISTS "Admins can update any complete profile" ON public.complete_profiles;
DROP POLICY IF EXISTS "Users can update their own complete profiles" ON public.complete_profiles;

-- Recreate as PERMISSIVE so PostgreSQL uses OR logic:
-- access is granted if ANY permissive policy passes
CREATE POLICY "Users can update their own complete profiles"
ON public.complete_profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any complete profile"
ON public.complete_profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
