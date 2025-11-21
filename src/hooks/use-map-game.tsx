import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameProfile {
  id: string;
  name: string;
  front_image_url: string;
  profile_image_url: string | null;
  slug: string;
  mostVotedPhenotype: string | null;
}

interface GameStats {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const REGION_MAPPING: Record<string, string[]> = {
  "Europe": [
    "Eastern Europe",
    "Central Europe", 
    "Southern Europe",
    "Northern Europe"
  ],
  "Africa": [
    "North Africa",
    "East Africa",
    "Sub-Saharan Africa"
  ],
  "Middle East": [
    "Levant",
    "Anatolia", 
    "Arabian Peninsula",
    "Persian Plateau"
  ],
  "Asia": [
    "Central Asia",
    "Eastern Asia",
    "Southern Asia",
    "Southeastern Asia"
  ],
  "Americas": [
    "Northern America",
    "Central America",
    "Southern America"
  ],
  "Oceania": [
    "Australia and New Zealand",
    "Melanesia",
    "Polynesia"
  ]
};

export const useMapGame = () => {
  const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctRegion, setCorrectRegion] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  const getQuestionsCount = (diff: Difficulty): number => {
    switch (diff) {
      case 'easy': return 3;
      case 'medium': return 5;
      case 'hard': return 10;
      default: return 5;
    }
  };

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: results, error } = await supabase
        .from('game_results')
        .select('score, total_questions')
        .eq('user_id', user.id);

      if (error) throw error;

      if (results && results.length > 0) {
        const totalGames = results.length;
        const totalCorrect = results.reduce((sum, r) => sum + r.score, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
        const accuracyPercentage = totalQuestions > 0 
          ? Math.round((totalCorrect / totalQuestions) * 100) 
          : 0;

        setStats({
          totalGames,
          totalCorrect,
          totalQuestions,
          accuracyPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchRandomProfiles = async () => {
    try {
      setIsLoading(true);
      
      const questionsCount = getQuestionsCount(difficulty);
      
      // Fetch random profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, front_image_url, profile_image_url, slug')
        .limit(100);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        toast({
          title: "No profiles available",
          description: "There are no profiles to play with yet.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Get random profiles based on difficulty
      const shuffled = profiles.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(questionsCount, profiles.length));

      // Fetch most voted primary geographic for each profile
      const profilesWithVotes = await Promise.all(
        selected.map(async (profile) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('classification')
            .eq('profile_id', profile.id)
            .eq('characteristic_type', 'Primary Geographic');

          // Count votes for each classification
          const voteCounts: Record<string, number> = {};
          votes?.forEach((vote) => {
            voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
          });

          // Get most voted classification
          const mostVoted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

          return {
            ...profile,
            mostVotedPhenotype: mostVoted
          };
        })
      );

      // Use all profiles, even without votes
      setGameProfiles(profilesWithVotes);
      setCurrentProfileIndex(0);
      setScore(0);
      setGameEnded(false);
      setFeedback(null);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error loading game",
        description: "Failed to load profiles for the game.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomProfiles();
    fetchUserStats();
  }, [difficulty]);

  const getCorrectRegion = (phenotype: string): string | null => {
    for (const [region, subregions] of Object.entries(REGION_MAPPING)) {
      if (subregions.some(sub => sub.toLowerCase() === phenotype.toLowerCase())) {
        return region;
      }
    }
    return null;
  };

  const checkAnswer = (selectedRegion: string) => {
    if (feedback !== null || gameEnded) return; // Prevent multiple clicks

    const currentProfile = gameProfiles[currentProfileIndex];
    if (!currentProfile) return;

    // If profile has no votes, accept any answer as correct
    if (!currentProfile.mostVotedPhenotype) {
      setFeedback('correct');
      setCorrectRegion(null);
      setScore(score + 1);
    } else {
      // Check if the selected region contains the profile's phenotype
      const subregions = REGION_MAPPING[selectedRegion] || [];
      const isCorrect = subregions.some(subregion => 
        subregion.toLowerCase() === currentProfile.mostVotedPhenotype?.toLowerCase()
      );

      setFeedback(isCorrect ? 'correct' : 'wrong');
      
      // Store the correct region if wrong
      if (!isCorrect) {
        setCorrectRegion(getCorrectRegion(currentProfile.mostVotedPhenotype));
      } else {
        setCorrectRegion(null);
      }

      if (isCorrect) {
        setScore(score + 1);
      }
    }

    // Move to next profile after delay
    setTimeout(() => {
      setFeedback(null);
      setCorrectRegion(null);
      
      if (currentProfileIndex + 1 >= gameProfiles.length) {
        setGameEnded(true);
      } else {
        setCurrentProfileIndex(currentProfileIndex + 1);
      }
    }, 1500);
  };

  const saveGameResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('game_results')
        .insert({
          user_id: user.id,
          score: score,
          total_questions: gameProfiles.length,
          difficulty: difficulty
        });

      if (error) throw error;
      
      // Refresh stats after saving
      await fetchUserStats();
    } catch (error) {
      console.error('Error saving game result:', error);
      toast({
        title: "Error saving result",
        description: "Failed to save your game result.",
        variant: "destructive"
      });
    }
  };

  const resetGame = () => {
    if (gameEnded && gameProfiles.length > 0) {
      saveGameResult();
    }
    fetchRandomProfiles();
  };

  const skipProfile = () => {
    if (feedback !== null || gameEnded) return;
    
    setFeedback(null);
    setCorrectRegion(null);
    
    if (currentProfileIndex + 1 >= gameProfiles.length) {
      setGameEnded(true);
    } else {
      setCurrentProfileIndex(currentProfileIndex + 1);
    }
  };

  // Save result when game ends
  useEffect(() => {
    if (gameEnded && gameProfiles.length > 0) {
      saveGameResult();
    }
  }, [gameEnded]);

  return {
    currentProfile: gameProfiles[currentProfileIndex] || null,
    currentProfileIndex,
    totalProfiles: gameProfiles.length,
    score,
    gameEnded,
    isLoading,
    feedback,
    correctRegion,
    difficulty,
    stats,
    isLoadingStats,
    setDifficulty,
    checkAnswer,
    resetGame,
    skipProfile
  };
};
