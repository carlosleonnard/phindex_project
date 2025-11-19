import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Fetch all game results with user profiles
      const { data: gameResults, error } = await supabase
        .from("game_results")
        .select("user_id, score, total_questions");

      if (error) throw error;

      // Aggregate by user_id
      const userStats = new Map<string, { totalGames: number; totalCorrect: number; totalQuestions: number }>();

      gameResults?.forEach((result) => {
        const existing = userStats.get(result.user_id) || { totalGames: 0, totalCorrect: 0, totalQuestions: 0 };
        userStats.set(result.user_id, {
          totalGames: existing.totalGames + 1,
          totalCorrect: existing.totalCorrect + result.score,
          totalQuestions: existing.totalQuestions + result.total_questions,
        });
      });

      // Fetch user nicknames
      const userIds = Array.from(userStats.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.id, p.nickname]) || []);

      // Create leaderboard entries for all users, even those without profiles
      const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries()).map(([userId, stats]) => {
        const nickname = profilesMap.get(userId) || `Player ${userId.slice(0, 8)}`;
        return {
          userId,
          nickname,
          totalGames: stats.totalGames,
          totalCorrect: stats.totalCorrect,
          totalQuestions: stats.totalQuestions,
          accuracyPercentage: stats.totalQuestions > 0 
            ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
            : 0,
        };
      });

      // Sort by total correct answers first, then by accuracy percentage
      leaderboard.sort((a, b) => {
        if (b.totalCorrect !== a.totalCorrect) {
          return b.totalCorrect - a.totalCorrect;
        }
        return b.accuracyPercentage - a.accuracyPercentage;
      });

      return leaderboard;
    },
  });
};
