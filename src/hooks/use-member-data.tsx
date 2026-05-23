import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export interface MemberComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  likes_count: number | null;
}

export const useMemberData = (userId: string) => {
  const profile = useQuery({
    queryKey: ['member-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, created_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as MemberProfile;
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
      return data as MemberComment[];
    },
    enabled: !!userId,
  });

  const likesReceived = useQuery({
    queryKey: ['member-likes-received', userId],
    queryFn: async () => {
      // Get the user's comment IDs first
      const { data: userComments } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', userId);

      if (!userComments || userComments.length === 0) return [];

      const commentIds = userComments.map(c => c.id);

      const { data, error } = await supabase
        .from('comment_likes')
        .select('id, created_at, comment_id')
        .in('comment_id', commentIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  return {
    profile: profile.data,
    stats: stats.data,
    badges: badges.data ?? [],
    recentComments: recentComments.data ?? [],
    likesReceived: likesReceived.data ?? [],
    isLoading: profile.isLoading,
  };
};
