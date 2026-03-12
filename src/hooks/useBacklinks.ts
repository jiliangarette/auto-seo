import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Backlink } from '@/types/database';

export function useBacklinks(projectId: string) {
  return useQuery({
    queryKey: ['backlinks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlinks')
        .select('*')
        .eq('project_id', projectId)
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      return data as Backlink[];
    },
    enabled: !!projectId,
  });
}

export function useAddBacklink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      sourceUrl: string;
      targetUrl: string;
      anchorText?: string;
    }) => {
      const { data, error } = await supabase
        .from('backlinks')
        .insert({
          project_id: params.projectId,
          source_url: params.sourceUrl,
          target_url: params.targetUrl,
          anchor_text: params.anchorText || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Backlink;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['backlinks', params.projectId] });
    },
  });
}

export function useUpdateBacklinkStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string; status: 'active' | 'broken' | 'pending' }) => {
      const { error } = await supabase
        .from('backlinks')
        .update({ status: params.status })
        .eq('id', params.id);

      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['backlinks', params.projectId] });
    },
  });
}

export function useDeleteBacklink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      const { error } = await supabase.from('backlinks').delete().eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['backlinks', params.projectId] });
    },
  });
}
