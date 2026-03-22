import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameProfile {
  id: string;
  name: string;
  front_image_url: string;
  slug: string;
  mostVotedGeographic: string | null;  // Primary Geographic (e.g. "Southern Europe")
  mostVotedPhenotype: string | null;   // Primary Phenotype (e.g. "North Atlantid")
}

interface GameStats {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

// Maps general phenotype (geographic subregion) → region
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

// All general phenotypes (geographic subregions) for medium mode
const ALL_GENERAL_PHENOTYPES: string[] = Object.values(REGION_MAPPING).flat();

// All specific phenotypes (main groups) for hard mode
const ALL_SPECIFIC_PHENOTYPES: string[] = [
  // Capoid
  "Strandlooper", "Khoid", "Sandawe", "Sanid",
  // Negroid
  "Katangid", "Hadza", "Bantuid", "Bambutid", "Congolid", "Sudanid", "Nilotid",
  // Caucasoid
  "Ethiopid", "Orientalid", "Indid", "Indo Melanid", "Mediterranid", "Nordid",
  "East Europid", "Lappid", "Alpinid", "Dinarid", "Armenoid", "Turanid",
  // Australoid
  "Veddid", "Negritid", "Australid", "Melanesid",
  // Mongoloid
  "Polynesid", "Ainuid", "South Mongolid", "Sinid", "Tungid", "Sibirid",
  "Eskimid", "Pacificid", "Silvid", "Margid", "Centralid", "Amazonid",
  "Lagid", "Patagonid", "Andid"
];

const REGIONS = ["Europe", "Africa", "Middle East", "Asia", "Americas", "Oceania"];

export const useMapGame = () => {
  const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const { toast } = useToast();

  const getQuestionsCount = (diff: Difficulty): number => {
    switch (diff) {
      case 'easy': return 3;
      case 'medium': return 5;
      case 'hard': return 10;
      default: return 5;
    }
  };

  // Get the region for a given geographic subregion
  const getRegionForGeographic = (geographic: string): string | null => {
    for (const [region, subregions] of Object.entries(REGION_MAPPING)) {
      if (subregions.some(sub => sub.toLowerCase() === geographic.toLowerCase())) {
        return region;
      }
    }
    return null;
  };

  // Generate 6 options for the current profile based on difficulty
  const generateOptions = (profile: GameProfile): string[] => {
    let correctAnswer: string | null = null;
    let pool: string[] = [];

    if (difficulty === 'easy') {
      // Easy: regions. Correct = region mapped from mostVotedGeographic
      correctAnswer = profile.mostVotedGeographic
        ? getRegionForGeographic(profile.mostVotedGeographic)
        : null;
      pool = REGIONS;
    } else if (difficulty === 'medium') {
      // Medium: general phenotypes (geographic subregions). Correct = mostVotedGeographic
      correctAnswer = profile.mostVotedGeographic;
      pool = ALL_GENERAL_PHENOTYPES;
    } else {
      // Hard: specific phenotypes. Correct = mostVotedPhenotype
      correctAnswer = profile.mostVotedPhenotype;
      pool = ALL_SPECIFIC_PHENOTYPES;
    }

    if (!correctAnswer) {
      // No votes: return 6 random from pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 6);
    }

    // Build 6 options: correct answer + 5 random distractors
    const distractors = pool.filter(o => o.toLowerCase() !== correctAnswer!.toLowerCase());
    const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 5);
    const finalOptions = [correctAnswer, ...shuffledDistractors];
    // Shuffle the final options
    return finalOptions.sort(() => 0.5 - Math.random());
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

        setStats({ totalGames, totalCorrect, totalQuestions, accuracyPercentage });
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
        .select('id, name, front_image_url, slug')
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

      const profileIds = profiles.map(p => p.id);

      // Fetch ALL geographic and phenotype votes in 2 bulk queries
      const { data: geoVotes } = await supabase
        .from('votes')
        .select('profile_id, classification')
        .in('profile_id', profileIds)
        .eq('characteristic_type', 'Primary Geographic');

      const { data: phenoVotes } = await supabase
        .from('votes')
        .select('profile_id, classification')
        .in('profile_id', profileIds)
        .eq('characteristic_type', 'Primary Phenotype');

      // Aggregate votes per profile
      const geoByProfile: Record<string, Record<string, number>> = {};
      geoVotes?.forEach(v => {
        if (!geoByProfile[v.profile_id]) geoByProfile[v.profile_id] = {};
        geoByProfile[v.profile_id][v.classification] = (geoByProfile[v.profile_id][v.classification] || 0) + 1;
      });

      const phenoByProfile: Record<string, Record<string, number>> = {};
      phenoVotes?.forEach(v => {
        if (!phenoByProfile[v.profile_id]) phenoByProfile[v.profile_id] = {};
        phenoByProfile[v.profile_id][v.classification] = (phenoByProfile[v.profile_id][v.classification] || 0) + 1;
      });

      const getMostVoted = (counts: Record<string, number> | undefined): string | null => {
        if (!counts) return null;
        const entries = Object.entries(counts);
        if (entries.length === 0) return null;
        return entries.sort((a, b) => b[1] - a[1])[0][0];
      };

      const allProfilesWithVotes = profiles.map(profile => ({
        ...profile,
        mostVotedGeographic: getMostVoted(geoByProfile[profile.id]),
        mostVotedPhenotype: getMostVoted(phenoByProfile[profile.id])
      }));

      // Filter: only profiles that have the required votes for the current difficulty
      const eligibleProfiles = allProfilesWithVotes.filter(p => {
        if (difficulty === 'easy' || difficulty === 'medium') {
          return p.mostVotedGeographic !== null;
        } else {
          return p.mostVotedPhenotype !== null;
        }
      });

      if (eligibleProfiles.length === 0) {
        toast({
          title: "No eligible profiles",
          description: "There are no profiles with enough votes to play.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Shuffle and pick the required number
      const shuffled = eligibleProfiles.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(questionsCount, eligibleProfiles.length));

      setGameProfiles(selected);
      setCurrentProfileIndex(0);
      setScore(0);
      setGameEnded(false);
      setFeedback(null);
      setCorrectAnswer(null);

      // Generate options for first profile
      if (profilesWithVotes.length > 0) {
        setOptions(generateOptions(profilesWithVotes[0]));
      }
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

  // Update options when profile changes
  useEffect(() => {
    if (gameProfiles.length > 0 && currentProfileIndex < gameProfiles.length) {
      setOptions(generateOptions(gameProfiles[currentProfileIndex]));
    }
  }, [currentProfileIndex, difficulty]);

  useEffect(() => {
    fetchRandomProfiles();
    fetchUserStats();
  }, [difficulty]);

  const getCorrectAnswerForProfile = (profile: GameProfile): string | null => {
    if (difficulty === 'easy') {
      return profile.mostVotedGeographic
        ? getRegionForGeographic(profile.mostVotedGeographic)
        : null;
    } else if (difficulty === 'medium') {
      return profile.mostVotedGeographic;
    } else {
      return profile.mostVotedPhenotype;
    }
  };

  const checkAnswer = (selected: string) => {
    if (feedback !== null || gameEnded) return;

    const currentProfile = gameProfiles[currentProfileIndex];
    if (!currentProfile) return;

    const correct = getCorrectAnswerForProfile(currentProfile);

    const isCorrect = correct ? selected.toLowerCase() === correct.toLowerCase() : false;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect && correct) {
      setCorrectAnswer(correct);
    } else {
      setCorrectAnswer(null);
    }

    if (isCorrect) {
      setScore(score + 1);
    }

    // Move to next profile after delay
    setTimeout(() => {
      setFeedback(null);
      setCorrectAnswer(null);

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
    setCorrectAnswer(null);

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
    correctAnswer,
    difficulty,
    stats,
    isLoadingStats,
    options,
    setDifficulty,
    checkAnswer,
    resetGame,
    skipProfile
  };
};
