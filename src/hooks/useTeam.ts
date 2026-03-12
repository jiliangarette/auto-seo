import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

interface ActivityEntry {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export function useTeamMembers(projectId: string) {
  return useQuery({
    queryKey: ['team-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!projectId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: 'admin' | 'editor' | 'viewer' }) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          email,
          role,
          invited_by: user!.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', vars.projectId] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; projectId: string; role: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', vars.projectId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', vars.projectId] });
    },
  });
}

export function useActivityLog(projectId: string) {
  return useQuery({
    queryKey: ['activity-log', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ActivityEntry[];
    },
    enabled: !!projectId,
  });
}

export function useLogActivity() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, action, detail }: { projectId: string; action: string; detail?: string }) => {
      const { error } = await supabase
        .from('activity_log')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          action,
          detail: detail ?? null,
        });
      if (error) throw error;
    },
  });
}
