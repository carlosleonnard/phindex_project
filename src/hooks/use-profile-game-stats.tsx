/**
 * ESTATÍSTICAS DE JOGO POR PERFIL (use-profile-game-stats.tsx)
 *
 * Responde a uma pergunta que os votos sozinhos não respondem:
 * "quando ninguém sabia de quem era este rosto, o que as pessoas acharam?"
 *
 * DUAS MEDIDAS DIFERENTES, DE PROPÓSITO:
 *
 *   Voto (tabela `votes`)          -> julgamento DELIBERADO
 *     O usuário vê nome, país, ancestralidade declarada. Pesquisa se quiser.
 *     É a classificação oficial do perfil.
 *
 *   Palpite (tabela `game_guesses`) -> primeira impressão ÀS CEGAS
 *     Só o rosto, dentro de uma partida, sem contexto nenhum.
 *
 * A leitura interessante é a distância entre as duas: um rosto "fácil" é lido
 * do mesmo jeito nas duas medidas; um rosto "enganoso" é classificado de um
 * jeito quando se sabe quem é, e de outro quando não se sabe.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Uma resposta dada no jogo, com quantas vezes apareceu. */
export interface GuessTally {
  guess: string;
  count: number;
  percentage: number;
  /** Se coincide com o gabarito (o voto majoritário do perfil). */
  isCorrect: boolean;
}

export interface ProfileGameStats {
  /** Total de palpites registrados para este perfil. */
  totalGuesses: number;
  /** Quantos acertaram o gabarito. */
  correctGuesses: number;
  /** Percentual de acerto: 100 = todos reconheceram na hora. */
  accuracy: number;
  /** Distribuição das respostas, da mais comum para a menos. */
  distribution: GuessTally[];
  /** O gabarito vigente nos palpites (o voto majoritário congelado). */
  expectedAnswer: string | null;
  /** A resposta mais dada no jogo, que pode divergir do gabarito. */
  topGuess: string | null;
  /** True quando a leitura às cegas discorda da classificação oficial. */
  divergent: boolean;
}

export type GameDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Agrega os palpites de um perfil numa dificuldade.
 *
 * A dificuldade importa porque cada nível usa um vocabulário diferente:
 * região ("Europe"), sub-região ("Southern Europe") ou fenótipo específico
 * ("Nordid"). Misturá-los produziria uma distribuição sem sentido.
 */
export const useProfileGameStats = (
  profileId: string | undefined,
  difficulty: GameDifficulty = 'medium'
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile-game-stats', profileId, difficulty],
    enabled: !!profileId,
    queryFn: async (): Promise<ProfileGameStats> => {
      const empty: ProfileGameStats = {
        totalGuesses: 0,
        correctGuesses: 0,
        accuracy: 0,
        distribution: [],
        expectedAnswer: null,
        topGuess: null,
        divergent: false,
      };

      const { data, error } = await supabase
        .from('game_guesses')
        .select('guess, correct_answer, is_correct')
        .eq('profile_id', profileId!)
        .eq('difficulty', difficulty);

      // A tabela pode ainda não existir (migration não aplicada). Nesse caso a
      // seção simplesmente não aparece, em vez de quebrar o perfil.
      if (error) {
        if (error.code === 'PGRST205') return empty;
        throw error;
      }

      const rows = data || [];
      if (rows.length === 0) return empty;

      const counts: Record<string, number> = {};
      let correctGuesses = 0;

      for (const row of rows) {
        counts[row.guess] = (counts[row.guess] || 0) + 1;
        if (row.is_correct) correctGuesses += 1;
      }

      // O gabarito é o mesmo em todas as linhas da mesma dificuldade, salvo se
      // os votos mudaram no meio; o mais recente é o que vale.
      const expectedAnswer = rows[rows.length - 1].correct_answer ?? null;

      const distribution: GuessTally[] = Object.entries(counts)
        .map(([guess, count]) => ({
          guess,
          count,
          percentage: Math.round((count / rows.length) * 100),
          isCorrect: expectedAnswer
            ? guess.toLowerCase() === expectedAnswer.toLowerCase()
            : false,
        }))
        .sort((a, b) => b.count - a.count);

      const topGuess = distribution[0]?.guess ?? null;

      return {
        totalGuesses: rows.length,
        correctGuesses,
        accuracy: Math.round((correctGuesses / rows.length) * 100),
        distribution,
        expectedAnswer,
        topGuess,
        divergent: Boolean(
          topGuess &&
            expectedAnswer &&
            topGuess.toLowerCase() !== expectedAnswer.toLowerCase()
        ),
      };
    },
  });

  return { stats: data, isLoading, error };
};
