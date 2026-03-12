import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Analysis } from '@/types/database';

export function useAnalyses(projectId: string) {
  return useQuery({
    queryKey: ['analyses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Analysis[];
    },
    enabled: !!projectId,
  });
}

export function useSaveAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      url: string;
      score: number;
      suggestions: Record<string, unknown>;
      rawResponse: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          project_id: params.projectId,
          url: params.url,
          score: params.score,
          suggestions: params.suggestions,
          raw_response: params.rawResponse,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Analysis;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['analyses', params.projectId] });
    },
  });
}
