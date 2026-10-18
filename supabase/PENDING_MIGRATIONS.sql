-- MIGRATIONS PENDENTES — Phindex
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- Todas as instruções são idempotentes: rodar de novo não causa erro.
--
-- Conferido no banco em 18/10/2026: TUDO ABAIXO JÁ ESTÁ APLICADO —
-- saved_profiles, game_guesses, as colunas subcategory, attraction_ratings
-- (com as três views) e a política de DELETE em votes. Rodar de novo não muda
-- nada. Novas migrations entram no fim deste arquivo e nesta lista.


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


-- ============================================================
-- 20261016_add_attraction_ratings.sql
-- ============================================================
-- ATTRACTION RATINGS
-- Uma nota de 1 a 7 por fenótipo por gênero, por pessoa.
--
-- O QUE ESTA TABELA É, E O QUE NÃO É:
-- Isto mede PREFERÊNCIA DE QUEM OLHA, não propriedade de quem é olhado. Uma
-- média alta num fenótipo diz que a amostra do site gostou daqueles rostos
-- sintéticos — não diz nada sobre as pessoas reais da região. Toda leitura na
-- interface precisa carregar essa distinção.
--
-- Os rostos avaliados são sintéticos. Nenhuma linha aqui se refere a uma
-- pessoa real, o que separa esta tabela de `votes`, que classifica perfis.
--
-- GRANULARIDADE:
-- Uma linha por (user_id, phenotype, gender). Quem avalia os dois gêneros dos
-- 38 fenótipos gera 76 linhas. Essa é a mesma forma de `votes`, onde contar
-- linhas inflou a contagem de votantes 34 vezes — por isso qualquer número de
-- "quantas pessoas" nesta tabela sai de COUNT(DISTINCT user_id), nunca de
-- COUNT(*). As views no fim do arquivo são o caminho certo.

CREATE TABLE IF NOT EXISTS public.attraction_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Grupo principal da taxonomia (src/constants/attractiveness.ts).
  phenotype text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  -- 1 (nada) a 7 (extremamente), com 4 no neutro.
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Reavaliar o mesmo rosto corrige a nota em vez de criar uma segunda linha.
  CONSTRAINT attraction_ratings_unique_face UNIQUE (user_id, phenotype, gender)
);

-- Leitura dos agregados: todas as notas de um rosto.
CREATE INDEX IF NOT EXISTS attraction_ratings_face_idx
  ON public.attraction_ratings (phenotype, gender);

-- A sessão de quem avalia, para montar o resultado pessoal.
CREATE INDEX IF NOT EXISTS attraction_ratings_user_idx
  ON public.attraction_ratings (user_id);

ALTER TABLE public.attraction_ratings ENABLE ROW LEVEL SECURITY;

-- Uma pessoa lê apenas as próprias notas. A comparação com a amostra vem das
-- views agregadas abaixo, que nunca expõem quem votou o quê: preferência de
-- atração é mais sensível que uma classificação de fenótipo, e ninguém deve
-- poder abrir as notas de outra pessoa.
DROP POLICY IF EXISTS "Users read their own ratings" ON public.attraction_ratings;
CREATE POLICY "Users read their own ratings"
  ON public.attraction_ratings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own ratings" ON public.attraction_ratings;
CREATE POLICY "Users insert their own ratings"
  ON public.attraction_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own ratings" ON public.attraction_ratings;
CREATE POLICY "Users update their own ratings"
  ON public.attraction_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own ratings" ON public.attraction_ratings;
CREATE POLICY "Users delete their own ratings"
  ON public.attraction_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at acompanha a correção de uma nota.
CREATE OR REPLACE FUNCTION public.touch_attraction_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attraction_ratings_touch ON public.attraction_ratings;
CREATE TRIGGER attraction_ratings_touch
  BEFORE UPDATE ON public.attraction_ratings
  FOR EACH ROW EXECUTE FUNCTION public.touch_attraction_rating();


-- MÉDIA DA AMOSTRA POR ROSTO
-- Pública e anônima: só a média, o desvio e quantas PESSOAS avaliaram. Sem
-- user_id, nada aqui liga uma nota a alguém.
--
-- `voters` é COUNT(DISTINCT user_id) e não COUNT(*). Nesta tabela a diferença
-- é menor que em `votes` por causa da UNIQUE acima, mas a forma correta fica
-- explícita para quem ler depois.
CREATE OR REPLACE VIEW public.attraction_face_stats
WITH (security_invoker = off) AS
SELECT
  phenotype,
  gender,
  COUNT(DISTINCT user_id)              AS voters,
  ROUND(AVG(rating)::numeric, 3)       AS mean_rating,
  ROUND(STDDEV_POP(rating)::numeric, 3) AS sd_rating
FROM public.attraction_ratings
GROUP BY phenotype, gender;

GRANT SELECT ON public.attraction_face_stats TO anon, authenticated;


-- DISTRIBUIÇÃO DAS NOTAS MÉDIAS DE CADA PESSOA
-- Para responder "em que percentil estou". Cada linha é uma pessoa reduzida a
-- dois números — a média que ela deu e quantos rostos avaliou — sem id e sem
-- qual rosto recebeu o quê. É o mínimo necessário para situar alguém na
-- amostra sem tornar ninguém identificável.
--
-- O corte de 10 rostos tira sessões abandonadas no primeiro cartão, que
-- puxariam a distribuição para os extremos.
CREATE OR REPLACE VIEW public.attraction_voter_means
WITH (security_invoker = off) AS
SELECT
  ROUND(AVG(rating)::numeric, 4) AS mean_rating,
  COUNT(*)                       AS faces_rated
FROM public.attraction_ratings
GROUP BY user_id
HAVING COUNT(*) >= 10;

GRANT SELECT ON public.attraction_voter_means TO anon, authenticated;


-- TOTAL DE PARTICIPANTES
-- Um número só, para a interface dizer se a amostra já é grande o bastante
-- para mostrar percentil (o limite vive em src/constants/attractiveness.ts).
CREATE OR REPLACE VIEW public.attraction_sample_size
WITH (security_invoker = off) AS
SELECT COUNT(DISTINCT user_id) AS voters
FROM public.attraction_ratings;

GRANT SELECT ON public.attraction_sample_size TO anon, authenticated;


-- ============================================================
-- 20261018_votes_delete_own.sql
-- ============================================================
-- VOTOS: QUEM VOTOU PODE APAGAR O PRÓPRIO VOTO
--
-- A tabela tinha políticas de INSERT, SELECT e UPDATE, mas nenhuma de DELETE.
-- Sem ela, tirar a 2ª ou 3ª escolha de região ou fenótipo num novo voto não
-- tinha efeito: o modal deixava de enviar a escolha, e a linha antiga ficava
-- no banco, contando na leitura do perfil. Agora o envio apaga as posições
-- que a pessoa retirou (useGeographicVoting.removeGeographicVote).
--
-- Só as próprias linhas: a condição é a mesma das políticas de INSERT e UPDATE.

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;
CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
