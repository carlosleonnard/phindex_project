/**
 * ATIVIDADE RECENTE (use-recent-activity.tsx)
 *
 * Os últimos acontecimentos da comunidade numa lista só: comentários (com o
 * perfil comentado) e membros que acabaram de entrar. Cada fonte é buscada
 * separadamente e as duas são intercaladas pela data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  kind: 'comment' | 'joined';
  userId: string;
  nickname: string;
  created_at: string;
  profileName?: string;
  profileSlug?: string;
}

export const useRecentActivity = (limit = 4) =>
  useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const [commentsResult, membersResult] = await Promise.all([
        supabase
          .from('comments')
          .select('id, created_at, user_id, profile_id')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('profiles')
          .select('id, nickname, created_at')
          .not('created_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit),
      ]);

      const comments = commentsResult.data || [];
      const members = membersResult.data || [];

      const userIds = [...new Set(comments.map((comment) => comment.user_id))];
      const profileIds = [...new Set(comments.map((comment) => comment.profile_id))];

      const [authorsResult, profilesResult] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id, nickname').in('id', userIds)
          : Promise.resolve({ data: [] as { id: string; nickname: string }[] }),
        profileIds.length
          ? supabase.from('user_profiles').select('id, name, slug').in('id', profileIds)
          : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
      ]);

      const nicknameById = new Map((authorsResult.data || []).map((row) => [row.id, row.nickname]));
      const profileById = new Map((profilesResult.data || []).map((row) => [row.id, row]));

      const commentItems: ActivityItem[] = comments.flatMap((comment) => {
        const profile = profileById.get(comment.profile_id);
        if (!profile) return [];
        return [
          {
            id: `comment-${comment.id}`,
            kind: 'comment' as const,
            userId: comment.user_id,
            nickname: nicknameById.get(comment.user_id) || 'User',
            created_at: comment.created_at,
            profileName: profile.name,
            profileSlug: profile.slug,
          },
        ];
      });

      const memberItems: ActivityItem[] = members.map((member) => ({
        id: `joined-${member.id}`,
        kind: 'joined' as const,
        userId: member.id,
        nickname: member.nickname || 'User',
        created_at: member.created_at as string,
      }));

      return [...commentItems, ...memberItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
  });
