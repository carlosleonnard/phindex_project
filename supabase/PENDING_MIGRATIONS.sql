-- MIGRATIONS PENDENTES — Phindex
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- Todas as instruções são idempotentes: rodar de novo não causa erro.
--
-- Até isto rodar, o site funciona normalmente, mas:
--   * 'Saved' fica sempre vazio (tabela saved_profiles ausente)
--   * as estatísticas do jogo por perfil ficam vazias (game_guesses ausente)
--   * subcategorias não são salvas


-- ============================================================
-- 20260328_add_subcategory_column.sql
-- ============================================================
-- Add subcategory column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;

-- Add subcategory column to complete_profiles
ALTER TABLE complete_profiles ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;


-- ============================================================
-- 20260805_add_saved_profiles.sql
-- ============================================================
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


-- ============================================================
-- 20260806_add_game_guesses.sql
-- ============================================================
-- GAME GUESSES
-- Registra cada palpite individual do "Guess the phenotype", por perfil.
--
-- POR QUE UMA TABELA NOVA:
-- game_results guarda apenas o placar agregado da partida (score, total,
-- dificuldade). Não diz QUAL perfil foi mostrado nem O QUE o jogador chutou,
-- então é impossível responder "como as pessoas classificaram este rosto
-- quando não sabiam quem era?".
--
-- A distinção que isto torna possível:
--   votes        -> classificação DELIBERADA. O usuário vê o nome, o país, a
--                   ancestralidade declarada, e vota com todo o contexto.
--   game_guesses -> primeira impressão ÀS CEGAS. Só o rosto, sob pressão de
--                   tempo, sem saber de quem se trata.
-- Comparar as duas é a leitura interessante: onde o olhar puro diverge do
-- julgamento informado.

CREATE TABLE IF NOT EXISTS public.game_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  -- 'easy' | 'medium' | 'hard' — define o vocabulário do palpite:
  -- região, sub-região geográfica ou fenótipo específico.
  difficulty text NOT NULL,
  -- O que o jogador escolheu.
  guess text NOT NULL,
  -- A resposta esperada no momento do palpite, congelada aqui: os votos do
  -- perfil podem mudar depois, e o histórico não deve mudar junto.
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leitura principal: todos os palpites de um perfil, por dificuldade.
CREATE INDEX IF NOT EXISTS game_guesses_profile_idx
  ON public.game_guesses (profile_id, difficulty);

-- Histórico do jogador.
CREATE INDEX IF NOT EXISTS game_guesses_user_idx
  ON public.game_guesses (user_id, created_at DESC);

ALTER TABLE public.game_guesses ENABLE ROW LEVEL SECURITY;

-- Os agregados são públicos: qualquer visitante vê como o rosto foi lido no
-- jogo. Nenhuma identidade de jogador é exposta na interface.
DROP POLICY IF EXISTS "Game guesses are viewable by everyone" ON public.game_guesses;
CREATE POLICY "Game guesses are viewable by everyone"
  ON public.game_guesses FOR SELECT
  USING (true);

-- Um jogador só grava os próprios palpites.
DROP POLICY IF EXISTS "Users can record their own guesses" ON public.game_guesses;
CREATE POLICY "Users can record their own guesses"
  ON public.game_guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Palpites são imutáveis: sem UPDATE e sem DELETE por design, para que o
-- histórico de primeiras impressões não possa ser reescrito.

