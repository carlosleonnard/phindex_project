/**
 * O ÍNDICE INTEIRO (use-index.tsx)
 *
 * Categoria, região, explore, busca do cabeçalho e jogo precisam da mesma coisa:
 * todos os perfis com seus agregados de voto. Em vez de cada página buscar do
 * seu jeito (a busca antiga fazia duas consultas POR perfil), o índice é
 * carregado uma vez, em quatro consultas paginadas, e fica em cache para todas.
 *
 * O volume é pequeno: perfis + os votos das duas características obrigatórias.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllRows } from '@/lib/fetch-all';
import { buildAggregates, PRIMARY_TYPES, type FeedProfile } from './use-profile-feed';
import type { UserProfile } from './use-user-profiles';

export const INDEX_QUERY_KEY = ['index-profiles'];

export const useIndexProfiles = () => {
  const query = useQuery({
    queryKey: INDEX_QUERY_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<FeedProfile[]> => {
      const profilesResult = await fetchAllRows<UserProfile>((from, to) =>
        supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
          .range(from, to)
      );
      if (profilesResult.error) throw profilesResult.error;

      const [votesResult, savesResult, commentsResult] = await Promise.all([
        fetchAllRows<{
          profile_id: string;
          user_id: string;
          classification: string;
          characteristic_type: string | null;
        }>((from, to) =>
          supabase
            .from('votes')
            .select('profile_id, user_id, classification, characteristic_type')
            .in('characteristic_type', PRIMARY_TYPES)
            .order('id', { ascending: true })
            .range(from, to)
        ),
        fetchAllRows<{ profile_id: string }>((from, to) =>
          supabase.from('saved_profiles').select('profile_id').range(from, to)
        ),
        fetchAllRows<{ profile_id: string }>((from, to) =>
          supabase
            .from('comments')
            .select('profile_id')
            .order('id', { ascending: true })
            .range(from, to)
        ),
      ]);

      if (votesResult.error) console.error('Index: failed to load votes', votesResult.error);
      if (savesResult.error && savesResult.error.code !== 'PGRST205') {
        console.error('Index: failed to load saves', savesResult.error);
      }
      if (commentsResult.error) console.error('Index: failed to load comments', commentsResult.error);

      return buildAggregates(
        profilesResult.data,
        votesResult.data,
        savesResult.data,
        commentsResult.data
      );
    },
  });

  return {
    profiles: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

/** Abaixo disto o perfil ainda "precisa de voto": um voto novo muda o resultado. */
export const LOW_VOTE_THRESHOLD = 10;
