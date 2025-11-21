import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VoteCount {
  classification: string;
  count: number;
  percentage: number;
}

const fetchVoteCounts = async (profileId: string) => {
  // Fetch both geographic and phenotype votes in parallel
  const [geographicResult, phenotypeResult] = await Promise.all([
    supabase
      .from('votes')
      .select('characteristic_type, classification')
      .eq('profile_id', profileId)
      .in('characteristic_type', ['Primary Geographic', 'Secondary Geographic', 'Tertiary Geographic']),
    supabase
      .from('votes')
      .select('characteristic_type, classification')
      .eq('profile_id', profileId)
      .in('characteristic_type', ['Primary Phenotype', 'Secondary Phenotype', 'Tertiary Phenotype'])
  ]);

  const allGeographicVotes = geographicResult.data;
  const allPhenotypeVotes = phenotypeResult.data;

  // Process geographic votes
  const geographicData: { [key: string]: VoteCount[] } = {};
  ['Primary Geographic', 'Secondary Geographic', 'Tertiary Geographic'].forEach(type => {
    const votesForType = allGeographicVotes?.filter(vote => vote.characteristic_type === type) || [];
    const voteCounts: { [key: string]: number } = {};
    
    votesForType.forEach(vote => {
      voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
    });

    const total = votesForType.length;
    geographicData[type] = Object.entries(voteCounts).map(([classification, count]) => ({
      classification,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  });

  // Process phenotype votes
  const phenotypeData: { [key: string]: VoteCount[] } = {};
  ['Primary Phenotype', 'Secondary Phenotype', 'Tertiary Phenotype'].forEach(type => {
    const votesForType = allPhenotypeVotes?.filter(vote => vote.characteristic_type === type) || [];
    const voteCounts: { [key: string]: number } = {};
    
    votesForType.forEach(vote => {
      voteCounts[vote.classification] = (voteCounts[vote.classification] || 0) + 1;
    });

    const total = votesForType.length;
    phenotypeData[type] = Object.entries(voteCounts).map(([classification, count]) => ({
      classification,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  });

  return { geographicVotes: geographicData, phenotypeVotes: phenotypeData };
};

export const useGeographicVoteCounts = (profileId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vote-counts', profileId],
    queryFn: () => fetchVoteCounts(profileId),
    enabled: !!profileId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  return {
    geographicVotes: data?.geographicVotes || {},
    phenotypeVotes: data?.phenotypeVotes || {},
    loading: isLoading,
    refetchVoteCounts: refetch
  };
};