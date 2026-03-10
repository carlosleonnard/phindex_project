/**
 * HOOK PARA GERENCIAMENTO DE PERFIS DE USUÁRIO (use-user-profiles.tsx)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  country: string;
  gender: string;
  category: string;
  height: number;
  ancestry: string;
  front_image_url: string;
  profile_image_url?: string;
  is_anonymous: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfileData {
  name: string;
  country: string;
  gender: string;
  category: string;
  height: number;
  ancestry: string;
  frontImageUrl: string;
  profileImageUrl?: string;
  isAnonymous: boolean;
}

/**
 * Helper: fetch votes for a list of profile IDs in 2 batch queries (no N+1).
 * Returns maps: geoMap[profileId] = count, phenoMap[profileId] = mostVoted
 */
async function fetchVotesForProfiles(profileIds: string[]) {
  if (profileIds.length === 0) return { geoMap: new Map<string, number>(), phenoMap: new Map<string, string | null>() };

  // Batch query 1: Primary Geographic votes
  const { data: geoVotes } = await supabase
    .from('votes')
    .select('profile_id, classification')
    .in('profile_id', profileIds)
    .eq('characteristic_type', 'Primary Geographic');

  // Batch query 2: Primary Phenotype votes
  const { data: phenoVotes } = await supabase
    .from('votes')
    .select('profile_id, classification')
    .in('profile_id', profileIds)
    .eq('characteristic_type', 'Primary Phenotype');

  // Build geoMap: profileId -> count
  const geoMap = new Map<string, number>();
  geoVotes?.forEach(v => {
    geoMap.set(v.profile_id, (geoMap.get(v.profile_id) || 0) + 1);
  });

  // Build phenoMap: profileId -> most voted classification
  const phenoCounts = new Map<string, Record<string, number>>();
  phenoVotes?.forEach(v => {
    if (!phenoCounts.has(v.profile_id)) phenoCounts.set(v.profile_id, {});
    const counts = phenoCounts.get(v.profile_id)!;
    counts[v.classification] = (counts[v.classification] || 0) + 1;
  });

  const phenoMap = new Map<string, string | null>();
  phenoCounts.forEach((counts, profileId) => {
    const best = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
    phenoMap.set(profileId, best);
  });

  return { geoMap, phenoMap };
}

export const useUserProfiles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os perfis com contagem de votos (sem N+1)
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const profileIds = (profilesData || []).map(p => p.id);
      const { geoMap, phenoMap } = await fetchVotesForProfiles(profileIds);

      return (profilesData || []).map(profile => ({
        ...profile,
        vote_count: geoMap.get(profile.id) || 0,
        most_voted_phenotype: phenoMap.get(profile.id) || null,
      }));
    },
  });

  // Perfis ordenados por votos (sem N+1)
  const { data: profilesByVotes, isLoading: profilesByVotesLoading } = useQuery({
    queryKey: ['user-profiles-by-votes'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const profileIds = (profilesData || []).map(p => p.id);
      const { geoMap, phenoMap } = await fetchVotesForProfiles(profileIds);

      const withVotes = (profilesData || []).map(profile => ({
        ...profile,
        vote_count: geoMap.get(profile.id) || 0,
        most_voted_phenotype: phenoMap.get(profile.id) || null,
      }));

      return withVotes.sort((a, b) => b.vote_count - a.vote_count);
    },
  });

  // Perfis do próprio utilizador
  const { data: myProfiles, isLoading: myProfilesLoading } = useQuery({
    queryKey: ['my-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!user?.id,
  });

  // Get single profile by slug
  const getProfileBySlug = async (slug: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  // Create profile mutation
  const createProfile = useMutation({
    mutationFn: async (profileData: CreateUserProfileData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug', { profile_name: profileData.name });

      if (slugError) throw slugError;

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          name: profileData.name,
          country: profileData.country,
          gender: profileData.gender,
          category: profileData.category,
          height: profileData.height,
          ancestry: profileData.ancestry,
          front_image_url: profileData.frontImageUrl,
          profile_image_url: profileData.profileImageUrl,
          is_anonymous: profileData.isAnonymous,
          slug: slugData,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-profiles'] });
      toast.success('Profile created successfully!');
      return data;
    },
    onError: (error) => {
      console.error('Error when creating profile:', error);
      toast.error('Error when creating profile. Try again!.');
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async ({ id, profileData, isAdminEdit }: { id: string; profileData: Partial<CreateUserProfileData>; isAdminEdit?: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let updateData: any = {
        ...profileData,
        front_image_url: profileData.frontImageUrl,
        profile_image_url: profileData.profileImageUrl,
        is_anonymous: profileData.isAnonymous,
      };

      if (profileData.name) {
        const { data: slugData, error: slugError } = await supabase
          .rpc('generate_unique_slug', { 
            profile_name: profileData.name,
            profile_id: id 
          });

        if (slugError) throw slugError;
        updateData.slug = slugData;
      }

      let query = supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id);

      if (!isAdminEdit) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-profiles'] });
      toast.success('Profile updated with success!');
    },
    onError: (error) => {
      console.error('W:', error);
      toast.error('Error updating profile. Try again.');
    },
  });

  // Delete profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-profiles'] });
      toast.success('Profile successfully deleted!');
    },
    onError: (error) => {
      console.error('Error deleting profile:', error);
      toast.error('Error deleting profile. Try again.');
    },
  });

  return {
    profiles,
    profilesLoading,
    profilesByVotes,
    profilesByVotesLoading,
    myProfiles,
    myProfilesLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileBySlug,
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
    isDeleting: deleteProfile.isPending,
  };
};
