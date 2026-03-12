import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Keyword } from '@/types/database';

export function useKeywords(projectId: string) {
  return useQuery({
    queryKey: ['keywords', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Keyword[];
    },
    enabled: !!projectId,
  });
}

export function useAddKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      keyword,
      position,
      searchVolume,
    }: {
      projectId: string;
      keyword: string;
      position?: number;
      searchVolume?: number;
    }) => {
      const { data, error } = await supabase
        .from('keywords')
        .insert({
          project_id: projectId,
          keyword,
          position: position ?? null,
          search_volume: searchVolume ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Keyword;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keywords', variables.projectId] });
    },
  });
}

export function useUpdateKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      position,
      searchVolume,
    }: {
      id: string;
      projectId: string;
      position?: number;
      searchVolume?: number;
    }) => {
      const { data, error } = await supabase
        .from('keywords')
        .update({
          position: position ?? null,
          search_volume: searchVolume ?? null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Keyword;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['keywords', variables.projectId] });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      const { error } = await supabase.from('keywords').delete().eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['keywords', params.projectId] });
    },
  });
}
