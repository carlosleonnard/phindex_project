import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export const useGeographicVoting = (profileId: string) => {
  const [userGeographicVotes, setUserGeographicVotes] = useState<{ [key: string]: string }>(() => {
    // Load pending votes from localStorage
    if (typeof window !== 'undefined') {
      const pendingVotes = localStorage.getItem(`pendingGeographicVotes_${profileId}`);
      if (pendingVotes) {
        try {
          return JSON.parse(pendingVotes);
        } catch {
          return {};
        }
      }
    }
    return {};
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const geographicCharacteristicTypes = [
    'Primary Geographic',
    'Secondary Geographic', 
    'Tertiary Geographic',
    'Primary Phenotype',
    'Secondary Phenotype',
    'Tertiary Phenotype'
  ];

  const fetchGeographicVotes = async () => {
    try {
      // Fetch user's votes if logged in
      if (user) {
        const { data: userVoteData } = await supabase
          .from('votes')
          .select('characteristic_type, classification')
          .eq('profile_id', profileId)
          .eq('user_id', user.id)
          .in('characteristic_type', geographicCharacteristicTypes);

        const votes: { [key: string]: string } = {};
        userVoteData?.forEach(vote => {
          votes[vote.characteristic_type] = vote.classification;
        });
        
        // Merge with any pending votes from localStorage
        const pendingVotes = localStorage.getItem(`pendingGeographicVotes_${profileId}`);
        if (pendingVotes) {
          try {
            const parsedPendingVotes = JSON.parse(pendingVotes);
            Object.assign(votes, parsedPendingVotes);
          } catch {
            // Invalid JSON, ignore
          }
        }
        
        setUserGeographicVotes(votes);
      }
    } catch (error) {
      console.error('Error fetching geographic votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const castGeographicVote = async (characteristicType: string, classification: string) => {
    if (!user) {
      // Store pending vote in localStorage for non-logged users
      const newVotes = { ...userGeographicVotes, [characteristicType]: classification };
      setUserGeographicVotes(newVotes);
      localStorage.setItem(`pendingGeographicVotes_${profileId}`, JSON.stringify(newVotes));
      
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('votes')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          classification,
          characteristic_type: characteristicType
        }, {
          onConflict: 'user_id,profile_id,characteristic_type'
        });

      if (error) throw error;

      const newVotes = { ...userGeographicVotes, [characteristicType]: classification };
      setUserGeographicVotes(newVotes);
      
      // Update localStorage with current votes
      localStorage.setItem(`pendingGeographicVotes_${profileId}`, JSON.stringify(newVotes));

      return true;
    } catch (error: any) {
      toast({
        title: "Voting error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Apaga uma escolha que a pessoa tirou no modal (uma 2ª ou 3ª região ou
   * fenótipo). Sem isto a linha antiga ficava no banco e continuava contando.
   * Depende da política de DELETE em `votes` (PENDING_MIGRATIONS.sql): sem
   * ela o Supabase não devolve erro, só não apaga nada.
   */
  const removeGeographicVote = async (characteristicType: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('characteristic_type', characteristicType);

      if (error) throw error;

      const newVotes = { ...userGeographicVotes };
      delete newVotes[characteristicType];
      setUserGeographicVotes(newVotes);
      localStorage.setItem(`pendingGeographicVotes_${profileId}`, JSON.stringify(newVotes));
      return true;
    } catch (error) {
      console.error('Error removing vote:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchGeographicVotes();
  }, [profileId, user]);

  return {
    userGeographicVotes,
    loading,
    castGeographicVote,
    removeGeographicVote,
    refetchVotes: fetchGeographicVotes
  };
};