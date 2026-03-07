import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardPeriod = "week" | "month" | "all";

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

const getDateFilter = (period: LeaderboardPeriod): string | null => {
  const now = new Date();
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return weekAgo.toISOString();
  }
  if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    return monthAgo.toISOString();
  }
  return null;
};

export const useLeaderboard = (period: LeaderboardPeriod = "all") => {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const dateFilter = getDateFilter(period);

      let query = supabase
        .from("game_results")
        .select("user_id, score, total_questions, created_at");

      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const { data: gameResults, error } = await query;
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
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles?.map(p => [p.id, p.nickname]) || []);

      const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries()).map(([userId, stats]) => ({
        userId,
        nickname: profilesMap.get(userId) || "Anonymous Player",
        totalGames: stats.totalGames,
        totalCorrect: stats.totalCorrect,
        totalQuestions: stats.totalQuestions,
        accuracyPercentage: stats.totalQuestions > 0
          ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
          : 0,
      }));

      // Sort by total correct, then accuracy, and limit to top 10
      leaderboard.sort((a, b) => {
        if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
        return b.accuracyPercentage - a.accuracyPercentage;
      });

      return leaderboard.slice(0, 10);
    },
  });
};
