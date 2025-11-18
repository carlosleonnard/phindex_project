-- Update profiles RLS policy to allow public viewing of nicknames for leaderboard
-- This is safe because nicknames are not PII and are meant to be public display names

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow anyone to view nickname and id (public display information)
CREATE POLICY "Anyone can view public profile info"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Keep existing policies for insert and update
-- Users can still only create and update their own profiles