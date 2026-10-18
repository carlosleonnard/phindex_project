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
