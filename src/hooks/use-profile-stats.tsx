import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProfileStats = () => {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const [totalRes, celebrityRes, communityRes, usersRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_anonymous', false),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_anonymous', true),
        supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
      ]);

      return {
        totalProfiles: totalRes.count || 0,
        celebrities: celebrityRes.count || 0,
        communityProfiles: communityRes.count || 0,
        users: usersRes.count || 0,
      };
    },
    refetchInterval: 30000,
  });
};
