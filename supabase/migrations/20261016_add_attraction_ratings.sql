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
