import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RankHistory } from '@/types/database';

export function useRankHistory(keywordId: string) {
  return useQuery({
    queryKey: ['rank-history', keywordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_history')
        .select('*')
        .eq('keyword_id', keywordId)
        .order('checked_at', { ascending: true });

      if (error) throw error;
      return data as RankHistory[];
    },
    enabled: !!keywordId,
  });
}

export function useProjectRankHistory(projectId: string) {
  return useQuery({
    queryKey: ['rank-history-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_history')
        .select('*')
        .eq('project_id', projectId)
        .order('checked_at', { ascending: true });

      if (error) throw error;
      return data as RankHistory[];
    },
    enabled: !!projectId,
  });
}

export function useCheckInRank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      keywordId: string;
      projectId: string;
      userId: string;
      position: number;
    }) => {
      const { data, error } = await supabase
        .from('rank_history')
        .insert({
          keyword_id: params.keywordId,
          project_id: params.projectId,
          user_id: params.userId,
          position: params.position,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RankHistory;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['rank-history', params.keywordId] });
      queryClient.invalidateQueries({ queryKey: ['rank-history-project', params.projectId] });
    },
  });
}
