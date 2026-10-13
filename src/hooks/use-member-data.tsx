import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllRows } from '@/lib/fetch-all';

/**
 * DADOS DA PÁGINA DE MEMBRO (use-member-data.tsx)
 *
 * Perfil público, estatísticas, insígnias (com os limiares de cada nível para
 * desenhar o progresso), comentários recentes com o rosto comentado, curtidas
 * recebidas (total + as últimas, com quem curtiu) e as partidas do jogo.
 */

export interface MemberProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

export interface MemberStats {
  total_votes_cast: number;
  total_comments: number;
  total_profiles_created: number;
  total_games_played: number;
}

export interface MemberBadge {
  badge_id: string;
  earned_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    level: number;
    category: string;
  };
}

export interface BadgeThreshold {
  category: string;
  level: number;
  threshold: number;
  name: string;
}

export interface MemberComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  likes_count: number | null;
  profileName: string | null;
  profileSlug: string | null;
}

export interface MemberLike {
  id: string;
  created_at: string;
  likerNickname: string | null;
}

export interface MemberGame {
  score: number;
  total_questions: number;
  difficulty: string | null;
  created_at: string;
}

export const useMemberData = (userId: string) => {
  const profile = useQuery({
    queryKey: ['member-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, created_at')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as MemberProfile | null) ?? null;
    },
    enabled: !!userId,
  });

  const stats = useQuery({
    queryKey: ['member-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('total_votes_cast, total_comments, total_profiles_created, total_games_played')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as MemberStats | null;
    },
    enabled: !!userId,
  });

  const badges = useQuery({
    queryKey: ['member-badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, badge_definitions(id, name, description, icon, level, category)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        badge_id: row.badge_id,
        earned_at: row.earned_at,
        badge: row.badge_definitions,
      })) as MemberBadge[];
    },
    enabled: !!userId,
  });

  // Limiares de todos os níveis: são os mesmos para todo mundo.
  const thresholds = useQuery({
    queryKey: ['badge-thresholds'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('badge_definitions').select('category, level, threshold, name');
      if (error) throw error;
      return (data || []) as BadgeThreshold[];
    },
  });

  const recentComments = useQuery({
    queryKey: ['member-comments', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, profile_id, likes_count')
        .eq('user_id', userId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      const rows = data || [];
      const profileIds = [...new Set(rows.map((row) => row.profile_id))];
      const { data: profiles } = profileIds.length
        ? await supabase.from('user_profiles').select('id, name, slug').in('id', profileIds)
        : { data: [] as { id: string; name: string; slug: string }[] };
      const byId = new Map((profiles || []).map((row) => [row.id, row]));
      return rows.map((row) => ({
        ...row,
        profileName: byId.get(row.profile_id)?.name ?? null,
        profileSlug: byId.get(row.profile_id)?.slug ?? null,
      })) as MemberComment[];
    },
    enabled: !!userId,
  });

  const likes = useQuery({
    queryKey: ['member-likes-received', userId],
    queryFn: async (): Promise<{ total: number; recent: MemberLike[] }> => {
      const { data: userComments } = await supabase.from('comments').select('id').eq('user_id', userId);
      if (!userComments || userComments.length === 0) return { total: 0, recent: [] };
      const commentIds = userComments.map((comment) => comment.id);

      const [countResult, recentResult] = await Promise.all([
        supabase.from('comment_likes').select('id', { count: 'exact', head: true }).in('comment_id', commentIds),
        supabase
          .from('comment_likes')
          .select('id, created_at, user_id')
          .in('comment_id', commentIds)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (recentResult.error) throw recentResult.error;

      const likerIds = [...new Set((recentResult.data || []).map((row) => row.user_id))];
      const { data: likers } = likerIds.length
        ? await supabase.from('profiles').select('id, nickname').in('id', likerIds)
        : { data: [] as { id: string; nickname: string }[] };
      const nicknameById = new Map((likers || []).map((row) => [row.id, row.nickname]));

      return {
        total: countResult.count ?? (recentResult.data || []).length,
        recent: (recentResult.data || []).map((row) => ({
          id: row.id,
          created_at: row.created_at,
          likerNickname: nicknameById.get(row.user_id) ?? null,
        })),
      };
    },
    enabled: !!userId,
  });

  const games = useQuery({
    queryKey: ['member-games', userId],
    queryFn: async () => {
      const { data, error } = await fetchAllRows<MemberGame>((from, to) =>
        supabase
          .from('game_results')
          .select('score, total_questions, difficulty, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .range(from, to)
      );
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return {
    profile: profile.data,
    stats: stats.data,
    badges: badges.data ?? [],
    thresholds: thresholds.data ?? [],
    recentComments: recentComments.data ?? [],
    likesTotal: likes.data?.total ?? 0,
    recentLikes: likes.data?.recent ?? [],
    games: games.data ?? [],
    isLoading: profile.isLoading,
  };
};
