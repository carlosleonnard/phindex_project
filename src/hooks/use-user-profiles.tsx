/**
 * HOOK PARA GERENCIAMENTO DE PERFIS DE USUÁRIO (use-user-profiles.tsx)
 * 
 * Este hook centraliza todo o gerenciamento de perfis de usuário na aplicação Phindex.
 * Permite criar, ler, atualizar e deletar perfis, além de buscar por votos e filtros.
 * Utiliza React Query para cache otimizado e Supabase como backend.
 */

// Hooks do React para estado local
import { useState } from 'react';
// React Query para gerenciamento de estado assíncrono e cache
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Cliente Supabase para interação com o banco de dados
import { supabase } from '@/integrations/supabase/client';
// Hook de autenticação para verificar usuário logado
import { useAuth } from './use-auth';
// Sistema de notificações para feedback do usuário
import { toast } from 'sonner';

/**
 * INTERFACE DO PERFIL DE USUÁRIO
 * 
 * Define a estrutura completa de um perfil armazenado no banco de dados.
 * Todos os campos obrigatórios para classificação fenotípica.
 */
export interface UserProfile {
  id: string;                    // ID único do perfil (UUID)
  user_id: string;               // ID do usuário que criou o perfil
  name: string;                  // Nome da pessoa no perfil
  country: string;               // País de origem (código ISO)
  gender: string;                // Gênero da pessoa
  category: string;              // Categoria (Celebrity, User Profile, etc)
  height: number;                // Altura em centímetros
  ancestry: string;              // Ancestralidade/etnia
  front_image_url: string;       // URL da imagem frontal (obrigatória)
  profile_image_url?: string;    // URL da imagem de perfil (opcional)
  is_anonymous: boolean;         // Se o perfil é anônimo ou não
  slug: string;                  // Slug único para URLs amigáveis
  created_at: string;            // Data de criação
  updated_at: string;            // Data da última atualização
}

/**
 * INTERFACE PARA CRIAÇÃO DE PERFIL
 * 
 * Define os dados necessários para criar um novo perfil.
 * Alguns campos são transformados para match com a interface do banco.
 */
export interface CreateUserProfileData {
  name: string;                  // Nome da pessoa
  country: string;               // País de origem
  gender: string;                // Gênero
  category: string;              // Categoria do perfil
  height: number;                // Altura em centímetros
  ancestry: string;              // Ancestralidade
  frontImageUrl: string;         // URL da imagem frontal
  profileImageUrl?: string;      // URL da imagem de perfil (opcional)
  isAnonymous: boolean;          // Se é perfil anônimo
}

/**
 * HOOK PRINCIPAL PARA GERENCIAMENTO DE PERFIS
 * 
 * Centraliza todas as operações relacionadas a perfis de usuário:
 * - Busca de perfis com contagem de votos
 * - Ordenação por popularidade
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Cache inteligente para performance
 */
export const useUserProfiles = () => {
  // Obtém informações do usuário autenticado
  const { user } = useAuth();
  // Cliente React Query para invalidação de cache
  const queryClient = useQueryClient();

  /**
   * BUSCAR TODOS OS PERFIS COM CONTAGEM DE VOTOS
   * 
   * Query que busca todos os perfis ordenados por data de criação (mais recentes primeiro)
   * e adiciona a contagem de votos para cada perfil.
   */
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['user-profiles'],    // Chave única para cache
    queryFn: async () => {
      // 1. Busca todos os perfis ordenados por data de criação
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')                           // Seleciona todos os campos
        .order('created_at', { ascending: false });  // Mais recentes primeiro

      if (profilesError) throw profilesError;

      // 2. Para cada perfil, conta os votos do Primary Geographic
      const profilesWithVotes = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Busca votos específicos do Primary Geographic
          const { data: votesData } = await supabase
            .from('votes')
            .select('classification')             // Só precisa da classificação
            .eq('profile_id', profile.id)        // Usar profile.id em vez de profile.slug
            .eq('characteristic_type', 'Primary Geographic'); // Só Primary Geographic

          // Busca votos do Primary Phenotype para obter o fenótipo específico mais votado
          const { data: phenotypeVotesData } = await supabase
            .from('votes')
            .select('classification')
            .eq('profile_id', profile.id)
            .eq('characteristic_type', 'Primary Phenotype');

          // Conta votos do Primary Geographic
          const voteCount = votesData?.length || 0;

          // Calcula o fenótipo específico mais votado
          const phenotypeCounts: Record<string, number> = {};
          phenotypeVotesData?.forEach(vote => {
            phenotypeCounts[vote.classification] = (phenotypeCounts[vote.classification] || 0) + 1;
          });

          const mostVotedPhenotype = Object.entries(phenotypeCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

          // Retorna o perfil original + contagem de votos Primary Geographic + fenótipo mais votado
          return {
            ...profile,
            vote_count: voteCount,   // Conta votos do Primary Geographic
            most_voted_phenotype: mostVotedPhenotype // Fenótipo específico mais votado
          };
        })
      );

      return profilesWithVotes;
    },
  });

  // Get profiles ordered by vote count
  const { data: profilesByVotes, isLoading: profilesByVotesLoading } = useQuery({
    queryKey: ['user-profiles-by-votes'],
    queryFn: async () => {
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get vote counts for each profile (Primary Geographic votes only)
      const profilesWithVotes = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: votesData } = await supabase
            .from('votes')
            .select('classification')
            .eq('profile_id', profile.id)    // Usar profile.id em vez de profile.slug
            .eq('characteristic_type', 'Primary Geographic');

          // Busca votos do Primary Phenotype para obter o fenótipo específico mais votado
          const { data: phenotypeVotesData } = await supabase
            .from('votes')
            .select('classification')
            .eq('profile_id', profile.id)
            .eq('characteristic_type', 'Primary Phenotype');

          // Count votes for Primary Geographic
          const voteCount = votesData?.length || 0;

          // Calcula o fenótipo específico mais votado
          const phenotypeCounts: Record<string, number> = {};
          phenotypeVotesData?.forEach(vote => {
            phenotypeCounts[vote.classification] = (phenotypeCounts[vote.classification] || 0) + 1;
          });

          const mostVotedPhenotype = Object.entries(phenotypeCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

          return {
            ...profile,
            vote_count: voteCount,
            most_voted_phenotype: mostVotedPhenotype // Fenótipo específico mais votado
          };
        })
      );

      // Sort by vote count descending
      return profilesWithVotes.sort((a, b) => b.vote_count - a.vote_count);
    },
  });

  // Get user's own profiles
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
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Generate slug from name
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
    mutationFn: async ({ id, profileData }: { id: string; profileData: Partial<CreateUserProfileData> }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      let updateData: any = {
        ...profileData,
        front_image_url: profileData.frontImageUrl,
        profile_image_url: profileData.profileImageUrl,
        is_anonymous: profileData.isAnonymous,
      };

      // Generate new slug if name changed
      if (profileData.name) {
        const { data: slugData, error: slugError } = await supabase
          .rpc('generate_unique_slug', { 
            profile_name: profileData.name,
            profile_id: id 
          });

        if (slugError) throw slugError;
        updateData.slug = slugData;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own profiles
        .select()
        .single();

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
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id); // Ensure user can only delete their own profiles

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