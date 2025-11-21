import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Vote {
  classification: string;
  count: number;
  percentage: number;
}

export const useVoting = (profileId: string) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVotes = async () => {
    try {
      // Fetch all votes for this profile
      const { data: allVotes } = await supabase
        .from('votes')
        .select('classification')
        .eq('profile_id', profileId)
        .eq('characteristic_type', 'phenotype');

      // Count votes by classification
      const voteCounts: { [key: string]: number } = {};
      allVotes?.forEach(vote => {
        voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
      });

      // Calculate total and percentages
      const total = allVotes?.length || 0;
      const voteData: Vote[] = Object.entries(voteCounts).map(([classification, count]) => ({
        classification,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })).sort((a, b) => b.count - a.count);

      setVotes(voteData);

      // Check if current user has voted
      if (user) {
        const { data: userVoteData } = await supabase
          .from('votes')
          .select('classification')
          .eq('profile_id', profileId)
          .eq('user_id', user.id)
          .eq('characteristic_type', 'phenotype')
          .single();

        setUserVote(userVoteData?.classification || null);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (classification: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    // Optimistic update - update UI immediately
    const previousVote = userVote;
    const previousVotes = [...votes];
    
    setUserVote(classification);
    
    // Calculate optimistic vote counts
    const updatedVotes = [...votes];
    const existingIndex = updatedVotes.findIndex(v => v.classification === classification);
    
    if (existingIndex >= 0) {
      updatedVotes[existingIndex].count += 1;
    } else {
      updatedVotes.push({ classification, count: 1, percentage: 0 });
    }
    
    // Recalculate percentages
    const total = updatedVotes.reduce((sum, v) => sum + v.count, 0);
    updatedVotes.forEach(v => {
      v.percentage = total > 0 ? (v.count / total) * 100 : 0;
    });
    
    setVotes(updatedVotes.sort((a, b) => b.count - a.count));

    try {
      // Insert or update vote (upsert)
      const { error } = await supabase
        .from('votes')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          classification,
          characteristic_type: 'phenotype'
        });

      if (error) throw error;

      // Refresh to get accurate counts from server
      await fetchVotes();

      toast({
        title: "Vote registered!",
        description: `You voted for ${classification}`,
      });

      return true;
    } catch (error: any) {
      // Rollback optimistic update on error
      setUserVote(previousVote);
      setVotes(previousVotes);
      
      toast({
        title: "Voting error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [profileId, user]);

  const changeVote = async (newClassification: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    // Optimistic update
    const previousVote = userVote;
    const previousVotes = [...votes];
    
    setUserVote(newClassification);
    
    // Calculate optimistic vote counts
    const updatedVotes = [...votes];
    
    // Decrease old classification count
    if (previousVote) {
      const oldIndex = updatedVotes.findIndex(v => v.classification === previousVote);
      if (oldIndex >= 0 && updatedVotes[oldIndex].count > 0) {
        updatedVotes[oldIndex].count -= 1;
      }
    }
    
    // Increase new classification count
    const newIndex = updatedVotes.findIndex(v => v.classification === newClassification);
    if (newIndex >= 0) {
      updatedVotes[newIndex].count += 1;
    } else {
      updatedVotes.push({ classification: newClassification, count: 1, percentage: 0 });
    }
    
    // Recalculate percentages
    const total = updatedVotes.reduce((sum, v) => sum + v.count, 0);
    updatedVotes.forEach(v => {
      v.percentage = total > 0 ? (v.count / total) * 100 : 0;
    });
    
    setVotes(updatedVotes.filter(v => v.count > 0).sort((a, b) => b.count - a.count));

    try {
      // Update existing vote
      const { error } = await supabase
        .from('votes')
        .update({
          classification: newClassification,
        })
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('characteristic_type', 'phenotype');

      if (error) throw error;

      await fetchVotes(); // Refresh vote counts

      toast({
        title: "Vote updated!",
        description: `You changed your vote to ${newClassification}`,
      });

      return true;
    } catch (error: any) {
      // Rollback on error
      setUserVote(previousVote);
      setVotes(previousVotes);
      
      toast({
        title: "Error updating vote",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    votes,
    userVote,
    loading,
    castVote,
    changeVote,
    hasUserVoted: !!userVote
  };
};