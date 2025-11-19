-- Allow anyone (including unauthenticated users) to view game results for leaderboard
CREATE POLICY "Anyone can view game results for leaderboard"
ON public.game_results
FOR SELECT
USING (true);