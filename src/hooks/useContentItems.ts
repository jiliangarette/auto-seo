import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ContentItem } from '@/types/database';

export function useContentItems(projectId: string) {
  return useQuery({
    queryKey: ['content-items', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!projectId,
  });
}

export function useCreateContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      title: string;
      topic?: string;
      keywords?: string;
      scheduledDate?: string;
      status?: 'plan' | 'draft' | 'published';
    }) => {
      const { data, error } = await supabase
        .from('content_items')
        .insert({
          project_id: params.projectId,
          title: params.title,
          topic: params.topic || null,
          keywords: params.keywords || null,
          scheduled_date: params.scheduledDate || null,
          status: params.status || 'plan',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ContentItem;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', params.projectId] });
    },
  });
}

export function useUpdateContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      projectId: string;
      title?: string;
      status?: 'plan' | 'draft' | 'published';
      scheduledDate?: string;
      content?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (params.title !== undefined) updates.title = params.title;
      if (params.status !== undefined) updates.status = params.status;
      if (params.scheduledDate !== undefined) updates.scheduled_date = params.scheduledDate;
      if (params.content !== undefined) updates.content = params.content;

      const { error } = await supabase
        .from('content_items')
        .update(updates)
        .eq('id', params.id);

      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', params.projectId] });
    },
  });
}

export function useDeleteContentItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      const { error } = await supabase.from('content_items').delete().eq('id', params.id);
      if (error) throw error;
      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['content-items', params.projectId] });
    },
  });
}
