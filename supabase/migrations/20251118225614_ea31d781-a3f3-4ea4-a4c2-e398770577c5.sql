-- Create table for game results
CREATE TABLE public.game_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT game_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own game results
CREATE POLICY "Users can view their own game results"
ON public.game_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own game results
CREATE POLICY "Users can insert their own game results"
ON public.game_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_game_results_user_id ON public.game_results(user_id);
CREATE INDEX idx_game_results_created_at ON public.game_results(created_at DESC);