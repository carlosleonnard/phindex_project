import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all";

export type LeaderboardPeriod = "week" | "month" | "all";

export interface GameRecord {
  score: number;
  total: number;
  created_at: string;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
  /** Posição na classificação completa do período (1 = primeiro). */
  rank: number;
  /** Últimas dez partidas, da mais antiga para a mais recente. */
  recent: GameRecord[];
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

/**
 * Classificação COMPLETA do período — todos os jogadores, com posição e as
 * últimas partidas de cada um. A página do ranking corta nos dez primeiros e
 * usa a lista inteira para achar a posição de quem está logado.
 *
 * Ordem: acertos, depois precisão.
 */
export const useLeaderboardData = (period: LeaderboardPeriod = "all") =>
  useQuery({
    queryKey: ["leaderboard-full", period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const dateFilter = getDateFilter(period);

      const { data: gameResults, error } = await fetchAllRows<{
        user_id: string;
        score: number;
        total_questions: number;
        created_at: string;
      }>((from, to) => {
        let query = supabase
          .from("game_results")
          .select("user_id, score, total_questions, created_at")
          .order("created_at", { ascending: true })
          .order("id", { ascending: true });
        if (dateFilter) query = query.gte("created_at", dateFilter);
        return query.range(from, to);
      });
      if (error) throw error;

      const userStats = new Map<
        string,
        { totalGames: number; totalCorrect: number; totalQuestions: number; games: GameRecord[] }
      >();

      gameResults.forEach((result) => {
        const existing = userStats.get(result.user_id) || {
          totalGames: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          games: [],
        };
        existing.totalGames += 1;
        existing.totalCorrect += result.score;
        existing.totalQuestions += result.total_questions;
        existing.games.push({ score: result.score, total: result.total_questions, created_at: result.created_at });
        userStats.set(result.user_id, existing);
      });

      const userIds = Array.from(userStats.keys());
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", userIds);
      if (profilesError) throw profilesError;

      const nicknames = new Map(profiles?.map((profile) => [profile.id, profile.nickname]) || []);

      const leaderboard = Array.from(userStats.entries()).map(([userId, stats]) => ({
        userId,
        nickname: nicknames.get(userId) || "Anonymous Player",
        totalGames: stats.totalGames,
        totalCorrect: stats.totalCorrect,
        totalQuestions: stats.totalQuestions,
        accuracyPercentage:
          stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0,
        rank: 0,
        recent: stats.games.slice(-10),
      }));

      leaderboard.sort((a, b) => {
        if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
        return b.accuracyPercentage - a.accuracyPercentage;
      });
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    },
  });

/** Os dez primeiros do período — o recorte usado nos painéis. */
export const useLeaderboard = (period: LeaderboardPeriod = "all") => {
  const query = useLeaderboardData(period);
  return { ...query, data: query.data?.slice(0, 10) };
};
