/**
 * HOOK DO JOGO "GUESS THE PHENOTYPE" (use-map-game.tsx)
 *
 * Três fases: setup (nível + baralho) → rodada (um rosto por vez, revelação
 * manual) → resultado. O gabarito de cada rosto é a resposta da comunidade:
 *
 *   easy   — o continente, somando os votos geográficos por continente;
 *   medium — a sub-região mais votada;
 *   hard   — o grupo fenotípico (um dos 42), somando os votos de cada subgrupo
 *            no grupo a que pertence.
 *
 * Só entra no baralho quem tem voto no nível E um vencedor único: num empate
 * não existe "a resposta da comunidade" para comparar.
 *
 * Os dados vêm do índice compartilhado (use-index), que já traz as contagens
 * de voto de cada perfil — nenhuma consulta extra para montar o baralho.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useIndexProfiles } from '@/hooks/use-index';
import type { FeedProfile } from '@/hooks/use-profile-feed';
import { CONTINENT_ORDER, continentOf } from '@/constants/regions';
import { ALL_SUBREGIONS, PHENOTYPE_GROUPS, PHENOTYPE_TAXONOMY, phenotypeGroupOf } from '@/constants/taxonomy';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePool = 'all' | 'famous' | 'community';
export type GamePhase = 'setup' | 'round' | 'result';

export interface LevelInfo {
  label: string;
  name: string;
  detail: string;
  question: string;
  help: string;
  count: number;
}

export const LEVELS: Record<Difficulty, LevelInfo> = {
  easy: {
    label: 'easy',
    name: 'Region',
    detail: 'Pick the continent.',
    question: 'Where is this face from?',
    help: 'Pick the continent most voters chose.',
    count: 3,
  },
  medium: {
    label: 'medium',
    name: 'Sub-region',
    detail: `Six of ${ALL_SUBREGIONS.length} sub-regions.`,
    question: 'Which sub-region is this face from?',
    help: 'Pick the sub-region most voters chose.',
    count: 5,
  },
  hard: {
    label: 'hard',
    name: 'Phenotype',
    detail: `Six of ${PHENOTYPE_GROUPS.length} groups.`,
    question: 'Which phenotype group?',
    help: 'Pick the group most voters chose.',
    count: 10,
  },
};

export const LEVEL_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
export const NEXT_LEVEL: Record<Difficulty, Difficulty> = { easy: 'medium', medium: 'hard', hard: 'easy' };

export const DECKS: Record<GamePool, string> = { all: 'Everyone', famous: 'Famous', community: 'Community' };

export interface GameFace {
  profile: FeedProfile;
  /** A resposta da comunidade neste nível. */
  answer: string;
  /** Parcela dos votos do nível que foi para a resposta, 0–100. */
  answerPct: number;
  /** Votos do nível para este rosto. */
  votes: number;
  /** Seis alternativas, já embaralhadas (no fácil, os seis continentes em ordem fixa). */
  options: string[];
}

export interface GamePick {
  /** Alternativa escolhida; null quando pulou. */
  label: string | null;
  correct: boolean;
  skip: boolean;
}

export interface GameRecordStats {
  games: number;
  correct: number;
  questions: number;
}

const DIVISION_OF = new Map(
  Object.entries(PHENOTYPE_TAXONOMY).flatMap(([division, groups]) => Object.keys(groups).map((group) => [group, division]))
);

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

/**
 * Sorteio sem reposição com peso √votos (Efraimidis–Spirakis): um rosto lido
 * por muitos votantes tem gabarito mais confiável e aparece mais, mas os de
 * poucos votos continuam entrando — senão toda partida repetiria os mesmos.
 */
const weightedSample = <T extends { votes: number }>(list: T[], count: number): T[] =>
  list
    .map((item) => ({ item, key: Math.random() ** (1 / Math.sqrt(Math.max(1, item.votes))) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(({ item }) => item);

/** Votos do nível, agrupados no vocabulário do nível. */
const countsForLevel = (profile: FeedProfile, level: Difficulty): Record<string, number> => {
  const counts: Record<string, number> = {};
  if (level === 'hard') {
    Object.entries(profile.pheno_counts || {}).forEach(([name, count]) => {
      const group = phenotypeGroupOf(name);
      counts[group] = (counts[group] || 0) + count;
    });
    return counts;
  }
  Object.entries(profile.geo_counts || {}).forEach(([subregion, count]) => {
    const key = level === 'easy' ? continentOf(subregion) : subregion;
    if (key) counts[key] = (counts[key] || 0) + count;
  });
  return counts;
};

/** Vencedor único do nível, ou null (sem votos ou empate no topo). */
const communityAnswer = (profile: FeedProfile, level: Difficulty) => {
  const ranked = Object.entries(countsForLevel(profile, level)).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null;
  const votes = ranked.reduce((sum, [, count]) => sum + count, 0);
  return { answer: ranked[0][0], answerPct: Math.round((ranked[0][1] / votes) * 100), votes };
};

/**
 * Cinco distratores: até três "vizinhos" (mesmo continente, mesma divisão
 * da taxonomia) para a pergunta não se resolver por eliminação, e o resto
 * sorteado do vocabulário inteiro.
 */
const buildOptions = (answer: string, level: Difficulty): string[] => {
  if (level === 'easy') return [...CONTINENT_ORDER];
  const vocabulary = level === 'medium' ? ALL_SUBREGIONS : PHENOTYPE_GROUPS;
  const isNeighbour =
    level === 'medium'
      ? (option: string) => continentOf(option) === continentOf(answer)
      : (option: string) => DIVISION_OF.get(option) === DIVISION_OF.get(answer);
  const others = vocabulary.filter((option) => option !== answer);
  const neighbours = shuffle(others.filter(isNeighbour)).slice(0, 3);
  const rest = shuffle(others.filter((option) => !neighbours.includes(option))).slice(0, 5 - neighbours.length);
  return shuffle([answer, ...neighbours, ...rest]);
};

const inPool = (profile: FeedProfile, pool: GamePool) => {
  if (pool === 'community') return profile.category === 'User Profiles';
  if (pool === 'famous') return profile.category !== 'User Profiles';
  return true;
};

/** Rostos jogáveis neste nível e baralho (sem alternativas ainda). */
const eligibleFaces = (profiles: FeedProfile[], level: Difficulty, pool: GamePool) =>
  profiles.flatMap((profile) => {
    if (!inPool(profile, pool) || !profile.front_image_url) return [];
    const read = communityAnswer(profile, level);
    return read ? [{ profile, ...read }] : [];
  });

export const useMapGame = (initialLevel: Difficulty = 'medium') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profiles, isLoading, isError } = useIndexProfiles();

  const [level, setLevel] = useState<Difficulty>(initialLevel);
  const [pool, setPool] = useState<GamePool>('all');
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [faces, setFaces] = useState<GameFace[]>([]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<GamePick[]>([]);
  /** Alternativa escolhida no rosto atual: índice, -1 se pulou, null antes de responder. */
  const [picked, setPicked] = useState<number | null>(null);
  const savedRef = useRef(false);
  /** Recorde no início da partida: o resultado soma esta partida a ele. */
  const [baseRecord, setBaseRecord] = useState<GameRecordStats | null>(null);

  /** Quantos rostos cada nível tem disponíveis no baralho escolhido. */
  const available = useMemo(
    () =>
      Object.fromEntries(LEVEL_ORDER.map((key) => [key, eligibleFaces(profiles, key, pool).length])) as Record<
        Difficulty,
        number
      >,
    [profiles, pool]
  );

  const record = useQuery({
    queryKey: ['game-record', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<GameRecordStats> => {
      const { data, error } = await supabase.from('game_results').select('score, total_questions').eq('user_id', user!.id);
      if (error) throw error;
      return (data || []).reduce(
        (stats, row) => ({
          games: stats.games + 1,
          correct: stats.correct + row.score,
          questions: stats.questions + row.total_questions,
        }),
        { games: 0, correct: 0, questions: 0 }
      );
    },
  });

  const start = useCallback(
    (nextLevel: Difficulty = level) => {
      const deck = weightedSample(eligibleFaces(profiles, nextLevel, pool), LEVELS[nextLevel].count)
        .map((face) => ({ ...face, options: buildOptions(face.answer, nextLevel) }));
      if (deck.length === 0) return false;
      savedRef.current = false;
      setBaseRecord(record.data ?? null);
      setLevel(nextLevel);
      setFaces(deck);
      setIndex(0);
      setPicks([]);
      setPicked(null);
      setPhase('round');
      return true;
    },
    [level, pool, profiles, record.data]
  );

  const current = faces[index] ?? null;

  /**
   * Grava o palpite para que o perfil possa mostrar como foi lido às cegas.
   * Falha silenciosa: um erro de rede não pode interromper a partida.
   */
  const recordGuess = async (face: GameFace, guess: string, isCorrect: boolean) => {
    if (!user) return;
    try {
      await supabase.from('game_guesses').insert({
        user_id: user.id,
        profile_id: face.profile.id,
        difficulty: level,
        guess,
        correct_answer: face.answer,
        is_correct: isCorrect,
      });
    } catch (error) {
      console.error('Error recording guess:', error);
    }
  };

  const pick = (optionIndex: number) => {
    if (phase !== 'round' || picked !== null || !current) return;
    const label = current.options[optionIndex];
    if (!label) return;
    const correct = label === current.answer;
    setPicked(optionIndex);
    setPicks((list) => {
      const next = [...list];
      next[index] = { label, correct, skip: false };
      return next;
    });
    recordGuess(current, label, correct);
  };

  /** Pular revela a resposta e conta como erro. */
  const skip = () => {
    if (phase !== 'round' || picked !== null || !current) return;
    setPicked(-1);
    setPicks((list) => {
      const next = [...list];
      next[index] = { label: null, correct: false, skip: true };
      return next;
    });
  };

  const next = () => {
    if (phase !== 'round' || picked === null) return;
    if (index + 1 < faces.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setPicked(null);
      setPhase('result');
    }
  };

  const quit = () => {
    setPhase('setup');
    setPicked(null);
  };

  const score = picks.filter((entry) => entry?.correct).length;

  // Grava a partida uma única vez, ao entrar no resultado.
  useEffect(() => {
    if (phase !== 'result' || savedRef.current || !user || faces.length === 0) return;
    savedRef.current = true;
    supabase
      .from('game_results')
      .insert({ user_id: user.id, score, total_questions: faces.length, difficulty: level })
      .then(({ error }) => {
        if (error) {
          console.error('Error saving game result:', error);
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['game-record', user.id] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard-full'] });
      });
  }, [phase, user, faces.length, score, level, queryClient]);

  // Carrega a próxima foto enquanto o jogador pensa na atual.
  useEffect(() => {
    const upcoming = faces[index + 1]?.profile.front_image_url;
    if (upcoming) {
      const image = new Image();
      image.src = upcoming;
    }
  }, [faces, index]);

  return {
    phase,
    level,
    pool,
    setLevel,
    setPool,
    available,
    isLoading,
    isError,
    faces,
    index,
    current,
    picks,
    picked,
    revealed: phase === 'round' && picked !== null,
    score,
    record: record.data ?? null,
    baseRecord,
    start,
    pick,
    skip,
    next,
    quit,
  };
};
