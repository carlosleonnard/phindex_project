/**
 * HOOK DE PERFIS SALVOS (use-saved-profiles.tsx)
 *
 * Gerencia a ação de salvar/remover perfis (o ❤️ da action bar) e a listagem
 * da página Saved. As contagens são públicas; salvar exige login.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import type { UserProfile } from './use-user-profiles';
import { attachAggregates, type FeedProfile } from './use-profile-feed';

/**
 * IDs dos perfis salvos pelo usuário logado.
 *
 * Retorna um Set para que o card consulte o estado em O(1) sem uma query por item.
 */
export const useSavedProfileIds = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-profile-ids', user?.id],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('saved_profiles')
        .select('profile_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return new Set((data || []).map((row) => row.profile_id));
    },
    enabled: !!user?.id,
  });

  return { savedIds: data ?? new Set<string>(), isLoading };
};

/**
 * Lista completa dos perfis salvos, com os dados do perfil embutidos e os
 * mesmos agregados do feed (votos, saves, comentários) — assim os selos do
 * card mostram os números reais, e não zeros.
 * Usada pela página Saved.
 */
export const useSavedProfiles = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as FeedProfile[];

      const { data, error } = await supabase
        .from('saved_profiles')
        .select('created_at, user_profiles (*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // A junção pode devolver linhas órfãs se o perfil tiver sido removido.
      const profiles = (data || [])
        .map((row) => (row as unknown as { user_profiles: UserProfile }).user_profiles)
        .filter(Boolean);

      return attachAggregates(profiles);
    },
    enabled: !!user?.id,
  });

  return { savedProfiles: data ?? [], isLoading };
};

/**
 * Alterna o estado salvo de um perfil, com atualização otimista para que
 * o coração responda imediatamente ao toque.
 */
export const useToggleSaved = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, isSaved }: { profileId: string; isSaved: boolean }) => {
      if (!user?.id) throw new Error('NOT_AUTHENTICATED');

      if (isSaved) {
        const { error } = await supabase
          .from('saved_profiles')
          .delete()
          .eq('user_id', user.id)
          .eq('profile_id', profileId);
        if (error) throw error;
        return false;
      }

      const { error } = await supabase
        .from('saved_profiles')
        .insert({ user_id: user.id, profile_id: profileId });
      if (error) throw error;
      return true;
    },

    // Atualização otimista: reflete o novo estado antes da resposta do servidor.
    onMutate: async ({ profileId, isSaved }) => {
      const key = ['saved-profile-ids', user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Set<string>>(key);

      queryClient.setQueryData<Set<string>>(key, (current) => {
        const next = new Set(current ?? []);
        if (isSaved) next.delete(profileId);
        else next.add(profileId);
        return next;
      });

      return { previous, key };
    },

    onError: (error, _variables, context) => {
      // Desfaz a atualização otimista.
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
      if ((error as Error).message === 'NOT_AUTHENTICATED') {
        toast.error('Sign in to save profiles.');
      } else {
        toast.error("Couldn't save this profile. Check your connection and try again.");
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-profile-ids', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['saved-profiles', user?.id] });
      // As contagens de "saved" dos cartões e do perfil vêm do índice.
      queryClient.invalidateQueries({ queryKey: ['index-profiles'] });
    },
  });
};
