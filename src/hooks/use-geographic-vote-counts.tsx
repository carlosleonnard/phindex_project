import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoteCount {
  classification: string;
  count: number;
  percentage: number;
}

export const useGeographicVoteCounts = (profileId: string) => {
  const [geographicVotes, setGeographicVotes] = useState<{ [key: string]: VoteCount[] }>({});
  const [phenotypeVotes, setPhenotypeVotes] = useState<{ [key: string]: VoteCount[] }>({});
  const [loading, setLoading] = useState(true);

  const fetchVoteCounts = async () => {
    try {
      // Fetch all geographic votes for this profile
      const { data: allGeographicVotes } = await supabase
        .from('votes')
        .select('characteristic_type, classification')
        .eq('profile_id', profileId)
        .in('characteristic_type', ['Primary Geographic', 'Secondary Geographic', 'Tertiary Geographic']);

      // Fetch all phenotype votes for this profile
      const { data: allPhenotypeVotes } = await supabase
        .from('votes')
        .select('characteristic_type, classification')
        .eq('profile_id', profileId)
        .in('characteristic_type', ['Primary Phenotype', 'Secondary Phenotype', 'Tertiary Phenotype']);

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

      setGeographicVotes(geographicData);
      setPhenotypeVotes(phenotypeData);
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteCounts();
  }, [profileId]);

  return {
    geographicVotes,
    phenotypeVotes,
    loading,
    refetchVoteCounts: fetchVoteCounts
  };
};