import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Audit } from '@/types/database';

export function useAudits(projectId: string) {
  return useQuery({
    queryKey: ['audits', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Audit[];
    },
    enabled: !!projectId,
  });
}

export function useSaveAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      url: string;
      issuesCount: number;
      criticalCount: number;
      warningCount: number;
      infoCount: number;
      report: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('audits')
        .insert({
          project_id: params.projectId,
          url: params.url,
          issues_count: params.issuesCount,
          critical_count: params.criticalCount,
          warning_count: params.warningCount,
          info_count: params.infoCount,
          report: params.report,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Audit;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['audits', params.projectId] });
    },
  });
}
