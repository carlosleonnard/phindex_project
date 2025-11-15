import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameProfile {
  id: string;
  name: string;
  front_image_url: string;
  slug: string;
  mostVotedPhenotype: string | null;
}

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
  const { toast } = useToast();

  const fetchRandomProfiles = async () => {
    try {
      setIsLoading(true);
      
      // Fetch 5 random profiles
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

      // Get random 5 profiles
      const shuffled = profiles.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(5, profiles.length));

      // Fetch most voted primary geographic for each profile
      const profilesWithVotes = await Promise.all(
        selected.map(async (profile) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('classification')
            .eq('profile_id', profile.slug)
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
  }, []);

  const checkAnswer = (selectedRegion: string) => {
    if (feedback !== null || gameEnded) return; // Prevent multiple clicks

    const currentProfile = gameProfiles[currentProfileIndex];
    if (!currentProfile) return;

    // If profile has no votes, accept any answer as correct
    if (!currentProfile.mostVotedPhenotype) {
      setFeedback('correct');
      setScore(score + 1);
    } else {
      // Check if the selected region contains the profile's phenotype
      const subregions = REGION_MAPPING[selectedRegion] || [];
      const isCorrect = subregions.some(subregion => 
        currentProfile.mostVotedPhenotype?.toLowerCase().includes(subregion.toLowerCase())
      );

      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore(score + 1);
      }
    }

    // Move to next profile after delay
    setTimeout(() => {
      setFeedback(null);
      
      if (currentProfileIndex + 1 >= gameProfiles.length) {
        setGameEnded(true);
      } else {
        setCurrentProfileIndex(currentProfileIndex + 1);
      }
    }, 1500);
  };

  const resetGame = () => {
    fetchRandomProfiles();
  };

  return {
    currentProfile: gameProfiles[currentProfileIndex] || null,
    currentProfileIndex,
    totalProfiles: gameProfiles.length,
    score,
    gameEnded,
    isLoading,
    feedback,
    checkAnswer,
    resetGame
  };
};
