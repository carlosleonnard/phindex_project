/**
 * COMENTÁRIOS RECENTES (use-recent-comments.tsx)
 *
 * Últimos comentários da comunidade, com o apelido de quem escreveu e o perfil
 * comentado, para alimentar o "Recent activity" do painel de descoberta.
 *
 * Faz três queries no total (comentários, apelidos, perfis) em vez de uma por
 * comentário.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentComment {
  id: string;
  content: string;
  created_at: string;
  /** Apelido de quem comentou; 'User' quando o perfil não foi encontrado. */
  nickname: string;
  /** Perfil comentado — usado para montar o link. */
  profileName: string;
  profileSlug: string;
}

export const useRecentComments = (limit = 5) =>
  useQuery({
    queryKey: ['recent-comments', limit],
    queryFn: async (): Promise<RecentComment[]> => {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, profile_id')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const profileIds = [...new Set(comments.map((c) => c.profile_id))];

      const [authorsResult, profilesResult] = await Promise.all([
        supabase.from('profiles').select('id, nickname').in('id', userIds),
        supabase.from('user_profiles').select('id, name, slug').in('id', profileIds),
      ]);

      const nicknameById = new Map(
        (authorsResult.data || []).map((row) => [row.id, row.nickname])
      );
      const profileById = new Map(
        (profilesResult.data || []).map((row) => [row.id, row])
      );

      // Um comentário cujo perfil sumiu não tem para onde linkar; é descartado.
      return comments.flatMap((comment) => {
        const profile = profileById.get(comment.profile_id);
        if (!profile) return [];
        return [
          {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            nickname: nicknameById.get(comment.user_id) || 'User',
            profileName: profile.name,
            profileSlug: profile.slug,
          },
        ];
      });
    },
  });
