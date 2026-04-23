import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches comment counts for multiple profiles and keeps them updated
 * in real-time via a Supabase Realtime subscription.
 *
 * @param profileIds - Array of user_profile UUIDs
 * @returns A record mapping each profileId to its comment count
 */
export const useCommentCounts = (profileIds: string[]): Record<string, number> => {
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const idsKey = profileIds.slice().sort().join(',');
  const prevIdsKey = useRef<string>('');

  const fetchCounts = async (ids: string[]) => {
    if (!ids.length) return;

    const { data } = await supabase
      .from('comments')
      .select('profile_id')
      .in('profile_id', ids);

    if (data) {
      const counts: Record<string, number> = {};
      ids.forEach((id) => { counts[id] = 0; });
      data.forEach((row) => {
        counts[row.profile_id] = (counts[row.profile_id] || 0) + 1;
      });
      setCommentCounts(counts);
    }
  };

  useEffect(() => {
    if (!profileIds.length) return;
    if (idsKey === prevIdsKey.current) return;
    prevIdsKey.current = idsKey;

    fetchCounts(profileIds);

    const channel = supabase
      .channel(`comment-counts-${idsKey.slice(0, 40)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => { fetchCounts(profileIds); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idsKey]);

  return commentCounts;
};
