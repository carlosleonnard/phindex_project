import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface BadgeDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  level: number;
  icon: string;
  threshold: number;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: BadgeDefinition;
}

export interface UserStats {
  total_votes_cast: number;
  total_profiles_created: number;
  total_comments: number;
  total_games_played: number;
}

const BADGE_CATEGORIES = ['Voter', 'Creator', 'Commentator', 'Gamer'] as const;
export type BadgeCategory = typeof BADGE_CATEGORIES[number];

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  Voter: 'Voting',
  Creator: 'Profile Creation',
  Commentator: 'Comments',
  Gamer: 'Origin Game',
};

export const CATEGORY_STAT_KEY: Record<BadgeCategory, keyof UserStats> = {
  Voter: 'total_votes_cast',
  Creator: 'total_profiles_created',
  Commentator: 'total_comments',
  Gamer: 'total_games_played',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-zinc-400 to-zinc-500',
  2: 'from-green-400 to-emerald-500',
  3: 'from-blue-400 to-indigo-500',
  4: 'from-purple-400 to-violet-500',
  5: 'from-amber-400 to-yellow-500',
  6: 'from-orange-400 to-red-500',
  7: 'from-rose-400 to-pink-500',
  8: 'from-cyan-400 to-teal-500',
  9: 'from-fuchsia-400 to-purple-600',
  10: 'from-yellow-300 to-amber-500',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
  5: 'Diamond',
  6: 'Master',
  7: 'Grandmaster',
  8: 'Titan',
  9: 'Overlord',
  10: 'Godlike',
};

export { BADGE_CATEGORIES, LEVEL_COLORS, LEVEL_NAMES };

export const useBadges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all badge definitions
  const { data: allBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('category')
        .order('level');
      if (error) throw error;
      return data as BadgeDefinition[];
    },
  });

  // Fetch user's earned badges
  const { data: earnedBadges, isLoading: earnedLoading } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('id, badge_id, earned_at, badge_definitions(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map((ub: any) => ({
        id: ub.id,
        badge_id: ub.badge_id,
        earned_at: ub.earned_at,
        badge: ub.badge_definitions as BadgeDefinition,
      })) as UserBadge[];
    },
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserStats | null;
    },
    enabled: !!user?.id,
  });

  // Refresh stats and check for new badges
  const refreshBadges = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Call the DB function to refresh stats and award badges
      const { error: statsError } = await supabase.rpc('check_and_award_badges', {
        p_user_id: user.id,
      });
      if (statsError) throw statsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user?.id] });
    },
  });

  // Group badges by category
  const badgesByCategory = allBadges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeDefinition[]>) || {};

  // Set of earned badge IDs for quick lookup
  const earnedBadgeIds = new Set(earnedBadges?.map(eb => eb.badge_id) || []);

  return {
    allBadges,
    earnedBadges,
    userStats,
    badgesByCategory,
    earnedBadgeIds,
    refreshBadges,
    isLoading: badgesLoading || earnedLoading || statsLoading,
    categories: BADGE_CATEGORIES,
  };
};
