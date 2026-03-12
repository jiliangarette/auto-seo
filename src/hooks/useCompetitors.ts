import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Competitor, CompetitorAnalysis } from '@/types/database';

export function useCompetitors(projectId: string) {
  return useQuery({
    queryKey: ['competitors', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Competitor[];
    },
    enabled: !!projectId,
  });
}

export function useAddCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { projectId: string; name: string; url: string }) => {
      const { data, error } = await supabase
        .from('competitors')
        .insert({
          project_id: params.projectId,
          name: params.name,
          url: params.url,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Competitor;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', params.projectId] });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      const { error } = await supabase.from('competitors').delete().eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', params.projectId] });
    },
  });
}

export function useCompetitorAnalyses(competitorId: string) {
  return useQuery({
    queryKey: ['competitor-analyses', competitorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data as CompetitorAnalysis[];
    },
    enabled: !!competitorId,
  });
}

export function useSaveCompetitorAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      competitorId: string;
      projectId: string;
      comparison: Record<string, unknown>;
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      score: number;
    }) => {
      const { data, error } = await supabase
        .from('competitor_analyses')
        .insert({
          competitor_id: params.competitorId,
          project_id: params.projectId,
          comparison: params.comparison,
          strengths: params.strengths,
          weaknesses: params.weaknesses,
          opportunities: params.opportunities,
          score: params.score,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CompetitorAnalysis;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['competitor-analyses', params.competitorId] });
    },
  });
}
