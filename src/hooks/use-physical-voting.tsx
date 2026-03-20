import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface PhysicalVote {
  option: string;
  count: number;
  percentage: number;
}

interface PhysicalCharacteristic {
  name: string;
  votes: PhysicalVote[];
}

interface PhysicalVotesResponse {
  characteristics: PhysicalCharacteristic[];
  userVotes: { [key: string]: string };
}

const fetchPhysicalVotes = async (profileId: string, userId?: string): Promise<PhysicalVotesResponse> => {
  const { data, error } = await supabase.functions.invoke('physical-votes', {
    body: { profileId, userId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch physical votes');
  }

  return data;
};

export const usePhysicalVoting = (profileId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pending votes from localStorage
  const getPendingVotes = (): { [key: string]: string } => {
    if (typeof window !== 'undefined') {
      const pendingVotes = localStorage.getItem(`pendingPhysicalVotes_${profileId}`);
      if (pendingVotes) {
        try {
          return JSON.parse(pendingVotes);
        } catch {
          return {};
        }
      }
    }
    return {};
  };

  // React Query for fetching physical votes
  const { data, isLoading, error } = useQuery({
    queryKey: ['physicalVotes', profileId, user?.id],
    queryFn: () => fetchPhysicalVotes(profileId, user?.id),
    enabled: !!profileId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Merge server data with pending votes
  const userVotes = {
    ...data?.userVotes,
    ...getPendingVotes(),
  };

  // Mutation for casting votes
  const castVoteMutation = useMutation({
    mutationFn: async ({ characteristicType, classification }: { characteristicType: string; classification: string }) => {
      if (!user) {
        throw new Error('User must be logged in to vote');
      }

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

      return { characteristicType, classification };
    },
    onMutate: async ({ characteristicType, classification }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['physicalVotes', profileId, user?.id] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PhysicalVotesResponse>(['physicalVotes', profileId, user?.id]);

      // Optimistically update the cache
      if (previousData) {
        const updatedData = { ...previousData };
        updatedData.userVotes = { ...updatedData.userVotes, [characteristicType]: classification };

        // Update the vote counts optimistically
        updatedData.characteristics = updatedData.characteristics.map(characteristic => {
          if (characteristic.name === characteristicType) {
            const existingVote = previousData.userVotes[characteristicType];
            
            // Create a copy of votes
            let updatedVotes = [...characteristic.votes];
            
            // Remove previous vote if exists
            if (existingVote) {
              updatedVotes = updatedVotes.map(vote => 
                vote.option === existingVote 
                  ? { ...vote, count: Math.max(0, vote.count - 1) }
                  : vote
              );
            }
            
            // Add new vote
            const existingIndex = updatedVotes.findIndex(vote => vote.option === classification);
            if (existingIndex >= 0) {
              updatedVotes[existingIndex] = {
                ...updatedVotes[existingIndex],
                count: updatedVotes[existingIndex].count + 1
              };
            } else {
              updatedVotes.push({ option: classification, count: 1, percentage: 0 });
            }

            // Recalculate percentages
            const total = updatedVotes.reduce((sum, vote) => sum + vote.count, 0);
            updatedVotes = updatedVotes.map(vote => ({
              ...vote,
              percentage: total > 0 ? (vote.count / total) * 100 : 0
            })).sort((a, b) => b.count - a.count);

            return { ...characteristic, votes: updatedVotes };
          }
          return characteristic;
        });

        queryClient.setQueryData(['physicalVotes', profileId, user?.id], updatedData);
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback the optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['physicalVotes', profileId, user?.id], context.previousData);
      }
      
      toast({
        title: "Voting error",
        description: error.message || "Failed to cast vote",
        variant: "destructive",
      });
    },
    onSuccess: ({ characteristicType, classification }) => {
      // Update localStorage
      const newVotes = { ...userVotes, [characteristicType]: classification };
      localStorage.setItem(`pendingPhysicalVotes_${profileId}`, JSON.stringify(newVotes));
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['physicalVotes', profileId, user?.id] });
    },
  });

  const castVote = async (characteristicType: string, classification: string) => {
    if (!user) {
      // Store pending vote in localStorage for non-logged users
      const newVotes = { ...userVotes, [characteristicType]: classification };
      localStorage.setItem(`pendingPhysicalVotes_${profileId}`, JSON.stringify(newVotes));
      
      toast({
        title: "Login required",
        description: "You need to be logged in to vote",
        variant: "destructive",
      });
      return false;
    }

    try {
      await castVoteMutation.mutateAsync({ characteristicType, classification });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    characteristics: data?.characteristics || [],
    userVotes,
    loading: isLoading,
    castVote,
    hasUserVoted: (characteristicType: string) => !!userVotes[characteristicType],
    error,
  };
};