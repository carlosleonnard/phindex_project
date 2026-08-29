-- SAVED PROFILES
-- Allows a signed-in user to save (bookmark) a profile and revisit it later.
-- Backs the "Saved" surface and the heart action in the feed action bar.

CREATE TABLE IF NOT EXISTS public.saved_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_profiles_unique UNIQUE (user_id, profile_id)
);

-- Listing a user's saved items, newest first.
CREATE INDEX IF NOT EXISTS saved_profiles_user_created_idx
  ON public.saved_profiles (user_id, created_at DESC);

-- Counting saves for a given profile.
CREATE INDEX IF NOT EXISTS saved_profiles_profile_idx
  ON public.saved_profiles (profile_id);

ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;

-- Save counts are public so any visitor can see how many people saved a profile.
DROP POLICY IF EXISTS "Saved profiles are viewable by everyone" ON public.saved_profiles;
CREATE POLICY "Saved profiles are viewable by everyone"
  ON public.saved_profiles FOR SELECT
  USING (true);

-- A user may only create and remove their own saves.
DROP POLICY IF EXISTS "Users can save profiles" ON public.saved_profiles;
CREATE POLICY "Users can save profiles"
  ON public.saved_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave their own saves" ON public.saved_profiles;
CREATE POLICY "Users can unsave their own saves"
  ON public.saved_profiles FOR DELETE
  USING (auth.uid() = user_id);
