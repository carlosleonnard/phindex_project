import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Vote {
  classification: string;
  count: number;
  percentage: number;
}

const fetchVotes = async (profileId: string, userId?: string) => {
  // Fetch all votes for this profile in a single query
  const { data: allVotes } = await supabase
    .from('votes')
    .select('classification, user_id')
    .eq('profile_id', profileId)
    .eq('characteristic_type', 'phenotype');

  // Count votes by classification
  const voteCounts: { [key: string]: number } = {};
  let userVote: string | null = null;

  allVotes?.forEach(vote => {
    voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
    if (userId && vote.user_id === userId) {
      userVote = vote.classification;
    }
  });

  // Calculate total and percentages
  const total = allVotes?.length || 0;
  const votes: Vote[] = Object.entries(voteCounts).map(([classification, count]) => ({
    classification,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  return { votes, userVote };
};

export const useVoting = (profileId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['votes', profileId, user?.id],
    queryFn: () => fetchVotes(profileId, user?.id),
    enabled: !!profileId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const votes = data?.votes || [];
  const userVote = data?.userVote || null;

  const castVoteMutation = useMutation({
    mutationFn: async (classification: string) => {
      if (!user) throw new Error('User must be logged in to vote');

      const { error } = await supabase
        .from('votes')
        .upsert({
          user_id: user.id,
          profile_id: profileId,
          classification,
          characteristic_type: 'phenotype'
        });

      if (error) throw error;
      return classification;
    },
    onMutate: async (classification) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['votes', profileId, user?.id] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['votes', profileId, user?.id]);

      // Optimistically update
      queryClient.setQueryData(['votes', profileId, user?.id], (old: any) => {
        if (!old) return old;
        
        const updatedVotes = [...old.votes];
        const existingIndex = updatedVotes.findIndex((v: Vote) => v.classification === classification);
        
        if (existingIndex >= 0) {
          updatedVotes[existingIndex].count += 1;
        } else {
          updatedVotes.push({ classification, count: 1, percentage: 0 });
        }
        
        const total = updatedVotes.reduce((sum, v) => sum + v.count, 0);
        updatedVotes.forEach(v => {
          v.percentage = total > 0 ? (v.count / total) * 100 : 0;
        });
        
        return { votes: updatedVotes.sort((a, b) => b.count - a.count), userVote: classification };
      });

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['votes', profileId, user?.id], context.previousData);
      }
      toast({
        title: "Voting error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (classification) => {
      queryClient.invalidateQueries({ queryKey: ['votes', profileId, user?.id] });
      toast({
        title: "Vote registered!",
        description: `You voted for ${classification}`,
      });
    }
  });

  const castVote = async (classification: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    try {
      await castVoteMutation.mutateAsync(classification);
      return true;
    } catch (error) {
      return false;
    }
  };

  const changeVoteMutation = useMutation({
    mutationFn: async (newClassification: string) => {
      if (!user) throw new Error('User must be logged in to vote');

      const { error } = await supabase
        .from('votes')
        .update({ classification: newClassification })
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('characteristic_type', 'phenotype');

      if (error) throw error;
      return newClassification;
    },
    onMutate: async (newClassification) => {
      await queryClient.cancelQueries({ queryKey: ['votes', profileId, user?.id] });
      const previousData = queryClient.getQueryData(['votes', profileId, user?.id]);

      queryClient.setQueryData(['votes', profileId, user?.id], (old: any) => {
        if (!old) return old;
        
        const updatedVotes = [...old.votes];
        
        // Decrease old classification count
        if (old.userVote) {
          const oldIndex = updatedVotes.findIndex((v: Vote) => v.classification === old.userVote);
          if (oldIndex >= 0 && updatedVotes[oldIndex].count > 0) {
            updatedVotes[oldIndex].count -= 1;
          }
        }
        
        // Increase new classification count
        const newIndex = updatedVotes.findIndex((v: Vote) => v.classification === newClassification);
        if (newIndex >= 0) {
          updatedVotes[newIndex].count += 1;
        } else {
          updatedVotes.push({ classification: newClassification, count: 1, percentage: 0 });
        }
        
        const total = updatedVotes.reduce((sum, v) => sum + v.count, 0);
        updatedVotes.forEach(v => {
          v.percentage = total > 0 ? (v.count / total) * 100 : 0;
        });
        
        return { 
          votes: updatedVotes.filter(v => v.count > 0).sort((a, b) => b.count - a.count), 
          userVote: newClassification 
        };
      });

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['votes', profileId, user?.id], context.previousData);
      }
      toast({
        title: "Error updating vote",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (newClassification) => {
      queryClient.invalidateQueries({ queryKey: ['votes', profileId, user?.id] });
      toast({
        title: "Vote updated!",
        description: `You changed your vote to ${newClassification}`,
      });
    }
  });

  const changeVote = async (newClassification: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    try {
      await changeVoteMutation.mutateAsync(newClassification);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    votes,
    userVote,
    loading: isLoading,
    castVote,
    changeVote,
    hasUserVoted: !!userVote
  };
};