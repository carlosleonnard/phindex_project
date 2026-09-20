/**
 * HOOK DO FEED DE DESCOBERTA (use-profile-feed.tsx)
 *
 * Alimenta o feed vertical infinito da home e a grade do Explore.
 *
 * Diferente de use-user-profiles, que dispara duas queries de votos POR perfil
 * (N+1), aqui os votos da página inteira são buscados em UMA query com `.in()`
 * e agregados em memória. Isso mantém o custo constante conforme o feed cresce.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from './use-user-profiles';

export const FEED_PAGE_SIZE = 12;

export type FeedSort = 'recent' | 'popular' | 'needs-votes';

/** Perfil enriquecido com os agregados de voto usados pelo card. */
export interface FeedProfile extends UserProfile {
  vote_count: number;
  most_voted_geographic: string | null;
  most_voted_phenotype: string | null;
  save_count: number;
  comment_count: number;
  /**
   * Os dois fenótipos mais votados, em ordem. O card mostra ambos porque a
   * classificação raramente é unânime: ver o segundo lugar diz mais sobre o
   * rosto do que só o vencedor.
   */
  top_phenotypes: string[];
  /**
   * Proporção de votos de fenótipo que caíram na opção vencedora, de 0 a 100.
   * É o "consenso": 100 significa que todo mundo classificou igual.
   * `null` quando ainda não há voto de fenótipo — nesse caso não há o que medir.
   */
  agreement: number | null;
}

interface VoteRow {
  profile_id: string;
  user_id: string;
  classification: string;
  characteristic_type: string | null;
}

/** Classificações da mais votada para a menos votada. */
const rankClassifications = (counts: Record<string, number>): string[] =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([classification]) => classification);

/** Retorna a classificação com mais ocorrências, ou null se não houver votos. */
const topClassification = (counts: Record<string, number>): string | null =>
  rankClassifications(counts)[0] ?? null;

/**
 * Percentual de votos concentrados na classificação vencedora.
 * Retorna null sem votos, para distinguir "ninguém votou" de "0% de acordo".
 */
const agreementRatio = (counts: Record<string, number>): number | null => {
  const values = Object.values(counts);
  const total = values.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  return Math.round((Math.max(...values) / total) * 100);
};

/**
 * Anexa contagem de votos, fenótipo/geografia mais votados, contagem de saves e
 * contagem de comentários a uma lista de perfis, usando três queries no total
 * (não três por perfil).
 */
export const attachAggregates = async (profiles: UserProfile[]): Promise<FeedProfile[]> => {
  if (profiles.length === 0) return [];

  const ids = profiles.map((profile) => profile.id);

  const [votesResult, savesResult, commentsResult] = await Promise.all([
    supabase
      .from('votes')
      .select('profile_id, user_id, classification, characteristic_type')
      .in('profile_id', ids),
    supabase.from('saved_profiles').select('profile_id').in('profile_id', ids),
    supabase.from('comments').select('profile_id').in('profile_id', ids),
  ]);

  // Falha nos agregados não deve derrubar o feed: os perfis ainda aparecem,
  // apenas com contagens zeradas.
  if (votesResult.error) {
    console.error('Feed: failed to load votes', votesResult.error);
  }
  // PGRST205 = tabela ausente no schema, esperado até a migration
  // 20260805_add_saved_profiles.sql ser aplicada. As contagens ficam em zero
  // e o resto do feed segue normalmente.
  if (savesResult.error && savesResult.error.code !== 'PGRST205') {
    console.error('Feed: failed to load saves', savesResult.error);
  }
  if (commentsResult.error) {
    console.error('Feed: failed to load comments', commentsResult.error);
  }

  const geographicByProfile: Record<string, Record<string, number>> = {};
  const phenotypeByProfile: Record<string, Record<string, number>> = {};

  // vote_count é quantas PESSOAS votaram no perfil, não quantas linhas de voto
  // existem. Cada pessoa vota em várias características (geográfica, fenótipo,
  // e cada traço físico), então contar linhas multiplicava o número por perfil
  // e não batia com o total mostrado na página do perfil.
  const votersByProfile: Record<string, Set<string>> = {};

  for (const vote of (votesResult.data || []) as VoteRow[]) {
    (votersByProfile[vote.profile_id] ||= new Set()).add(vote.user_id);

    // Os buckets abaixo continuam por tipo: cada um responde a uma pergunta
    // diferente ("de onde é" vs "qual o fenótipo").
    if (vote.characteristic_type === 'Primary Geographic') {
      const bucket = (geographicByProfile[vote.profile_id] ||= {});
      bucket[vote.classification] = (bucket[vote.classification] || 0) + 1;
    } else if (vote.characteristic_type === 'Primary Phenotype') {
      const bucket = (phenotypeByProfile[vote.profile_id] ||= {});
      bucket[vote.classification] = (bucket[vote.classification] || 0) + 1;
    }
  }

  const saveCountByProfile: Record<string, number> = {};
  for (const save of savesResult.data || []) {
    saveCountByProfile[save.profile_id] = (saveCountByProfile[save.profile_id] || 0) + 1;
  }

  // Conta todos os comentários do perfil, respostas incluídas — o mesmo
  // critério de useCommentCounts, usado na RegionPage.
  const commentCountByProfile: Record<string, number> = {};
  for (const comment of commentsResult.data || []) {
    commentCountByProfile[comment.profile_id] =
      (commentCountByProfile[comment.profile_id] || 0) + 1;
  }

  return profiles.map((profile) => {
    const phenotypeCounts = phenotypeByProfile[profile.id] || {};
    const rankedPhenotypes = rankClassifications(phenotypeCounts);

    return {
      ...profile,
      vote_count: votersByProfile[profile.id]?.size || 0,
      most_voted_geographic: topClassification(geographicByProfile[profile.id] || {}),
      most_voted_phenotype: rankedPhenotypes[0] ?? null,
      top_phenotypes: rankedPhenotypes.slice(0, 2),
      agreement: agreementRatio(phenotypeCounts),
      save_count: saveCountByProfile[profile.id] || 0,
      comment_count: commentCountByProfile[profile.id] || 0,
    };
  });
};

/**
 * Teto de perfis considerados no ranking de "Most voted".
 *
 * Ordenar por votos exige conhecer a contagem de TODOS os perfis antes de
 * cortar a página — ordenar depois de paginar por data deixaria de fora um
 * perfil antigo e muito votado. Como o ranking é feito no cliente, este é o
 * limite do que se busca de uma vez; a página Explore já usa a mesma escala.
 */
export const POPULAR_POOL_SIZE = 300;

/**
 * FEED INFINITO
 *
 * `sort: 'recent'` pagina por data direto no banco.
 *
 * `sort: 'popular'` busca o conjunto de perfis de uma vez, ranqueia por votos
 * (famosos e perfis da comunidade juntos, sem distinção) e só então pagina
 * sobre a lista já ordenada — assim quem tem mais votos fica em primeiro,
 * independentemente de quando o perfil foi criado.
 */
export const useProfileFeed = (sort: FeedSort = 'recent') => {
  // O ranking completo é buscado uma vez e reaproveitado por todas as páginas;
  // o React Query mantém em cache enquanto o sort for 'popular'.
  const popularQuery = useQuery({
    queryKey: ['profile-feed-popular-pool', POPULAR_POOL_SIZE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(POPULAR_POOL_SIZE);

      if (error) throw error;

      const enriched = await attachAggregates((data || []) as UserProfile[]);

      // O pool é devolvido sem ordem imposta: cada sort do cliente ordena
      // como precisa, sobre a mesma lista em cache.
      return enriched;
    },
    // 'popular' e 'needs-votes' ranqueiam a base inteira no cliente, então
    // ambos dependem deste pool. 'recent' pagina direto no banco.
    enabled: sort === 'popular' || sort === 'needs-votes',
  });

  const recentQuery = useInfiniteQuery({
    queryKey: ['profile-feed', 'recent'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + FEED_PAGE_SIZE - 1);

      if (error) throw error;

      const rows = (data || []) as UserProfile[];

      return {
        profiles: await attachAggregates(rows),
        // Uma página menor que o tamanho pedido significa fim da lista.
        nextOffset: rows.length < FEED_PAGE_SIZE ? undefined : from + FEED_PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: sort === 'recent',
  });

  // Quantas páginas da lista ordenada já foram reveladas. A rolagem infinita
  // consome a lista em memória, sem novas idas ao banco.
  const [popularPages, setPopularPages] = useState(1);

  // Trocar de aba recomeça a contagem, para não herdar o scroll da anterior.
  useEffect(() => {
    if (sort !== 'recent') setPopularPages(1);
  }, [sort]);

  // Identidade estável: o observer do scroll infinito tem fetchNextPage nas
  // dependências, e uma função nova a cada render o recriaria sem parar.
  const revealMorePopular = useCallback(() => {
    setPopularPages((pages) => pages + 1);
  }, []);

  if (sort === 'popular' || sort === 'needs-votes') {
    const pool = popularQuery.data ?? [];

    // Desempate estável em ambos os casos: sem ele, perfis empatados trocam de
    // posição entre páginas e acabam duplicados ou omitidos na rolagem.
    const byNewest = (a: FeedProfile, b: FeedProfile) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    const ranked =
      sort === 'popular'
        ? [...pool].sort((a, b) =>
            b.vote_count !== a.vote_count
              ? b.vote_count - a.vote_count
              : byNewest(a, b)
          )
        : // Menos votados primeiro: é onde um voto novo pesa mais.
          [...pool].sort((a, b) =>
            a.vote_count !== b.vote_count
              ? a.vote_count - b.vote_count
              : byNewest(a, b)
          );

    const visible = ranked.slice(0, popularPages * FEED_PAGE_SIZE);
    const hasNextPage = visible.length < ranked.length;

    return {
      profiles: visible,
      isLoading: popularQuery.isLoading,
      isError: popularQuery.isError,
      refetch: popularQuery.refetch,
      hasNextPage,
      // A "próxima página" é só revelar mais itens da lista já carregada.
      // O observer só chama isto quando hasNextPage é true.
      fetchNextPage: revealMorePopular,
      isFetchingNextPage: false,
    };
  }

  return {
    ...recentQuery,
    profiles: recentQuery.data?.pages.flatMap((page) => page.profiles) ?? [],
  };
};

/**
 * PERFIS EM DESTAQUE
 *
 * Conjunto pequeno e não paginado usado pelos carrosséis do topo da home.
 */
export const useHighlightProfiles = (limit = 40) => {
  const { data, isLoading } = useQuery({
    queryKey: ['highlight-profiles', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return attachAggregates((data || []) as UserProfile[]);
    },
  });

  return { profiles: data ?? [], isLoading };
};
