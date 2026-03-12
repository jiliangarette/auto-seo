import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Report } from '@/types/database';

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    enabled: !!projectId,
  });
}

export function useReportByToken(token: string) {
  return useQuery({
    queryKey: ['report-public', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return data as Report;
    },
    enabled: !!token,
  });
}

export function useSaveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      userId: string;
      title: string;
      htmlContent: string;
    }) => {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          project_id: params.projectId,
          user_id: params.userId,
          title: params.title,
          html_content: params.htmlContent,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['reports', params.projectId] });
    },
  });
}

export function useToggleReportPublic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('reports')
        .update({ is_public: params.isPublic })
        .eq('id', params.id);

      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['reports', params.projectId] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      const { error } = await supabase.from('reports').delete().eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['reports', params.projectId] });
    },
  });
}
