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
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from './use-user-profiles';

export const FEED_PAGE_SIZE = 12;

export type FeedSort = 'recent' | 'popular';

/** Perfil enriquecido com os agregados de voto usados pelo card. */
export interface FeedProfile extends UserProfile {
  vote_count: number;
  most_voted_geographic: string | null;
  most_voted_phenotype: string | null;
  save_count: number;
}

interface VoteRow {
  profile_id: string;
  user_id: string;
  classification: string;
  characteristic_type: string | null;
}

/** Retorna a classificação com mais ocorrências, ou null se não houver votos. */
const topClassification = (counts: Record<string, number>): string | null => {
  let best: string | null = null;
  let bestCount = 0;
  for (const [classification, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = classification;
      bestCount = count;
    }
  }
  return best;
};

/**
 * Anexa contagem de votos, fenótipo/geografia mais votados e contagem de saves
 * a uma lista de perfis, usando duas queries no total (não duas por perfil).
 */
export const attachAggregates = async (profiles: UserProfile[]): Promise<FeedProfile[]> => {
  if (profiles.length === 0) return [];

  const ids = profiles.map((profile) => profile.id);

  const [votesResult, savesResult] = await Promise.all([
    supabase
      .from('votes')
      .select('profile_id, user_id, classification, characteristic_type')
      .in('profile_id', ids),
    supabase.from('saved_profiles').select('profile_id').in('profile_id', ids),
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

  return profiles.map((profile) => ({
    ...profile,
    vote_count: votersByProfile[profile.id]?.size || 0,
    most_voted_geographic: topClassification(geographicByProfile[profile.id] || {}),
    most_voted_phenotype: topClassification(phenotypeByProfile[profile.id] || {}),
    save_count: saveCountByProfile[profile.id] || 0,
  }));
};

/**
 * FEED INFINITO
 *
 * Pagina por offset sobre user_profiles. `sort: 'popular'` ordena pela contagem
 * de votos já materializada na página carregada.
 */
export const useProfileFeed = (sort: FeedSort = 'recent') => {
  const query = useInfiniteQuery({
    queryKey: ['profile-feed', sort],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const to = from + FEED_PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const enriched = await attachAggregates((data || []) as UserProfile[]);

      return {
        profiles: sort === 'popular'
          ? [...enriched].sort((a, b) => b.vote_count - a.vote_count)
          : enriched,
        // Uma página menor que o tamanho pedido significa fim da lista.
        nextOffset: (data || []).length < FEED_PAGE_SIZE ? undefined : from + FEED_PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const profiles = query.data?.pages.flatMap((page) => page.profiles) ?? [];

  return { ...query, profiles };
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
