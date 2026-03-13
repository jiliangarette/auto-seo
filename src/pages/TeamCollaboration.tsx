import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useTeamMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useActivityLog,
  useLogActivity,
} from '@/hooks/useTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Trash2,
  Activity,
  MessageSquare,
  Send,
  Clock,
  Shield,
  Eye,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

const roleIcons = {
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
};

const roleBadge = {
  admin: 'bg-red-950/30 text-red-400',
  editor: 'bg-blue-950/30 text-blue-400',
  viewer: 'bg-gray-800 text-gray-400',
};

export default function TeamCollaboration() {
  const { id: paramId } = useParams<{ id: string }>();
  const { data: projects } = useProjects();
  const { user } = useAuth();

  const [selectedProject, setSelectedProject] = useState(paramId ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  const projectId = selectedProject;
  const { data: members = [], isLoading: membersLoading } = useTeamMembers(projectId);
  const { data: activity = [], isLoading: activityLoading } = useActivityLog(projectId);
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const logActivity = useLogActivity();

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !projectId) {
      toast.error('Select a project and enter an email');
      return;
    }
    try {
      await inviteMember.mutateAsync({ projectId, email: inviteEmail.trim(), role: inviteRole });
      await logActivity.mutateAsync({ projectId, action: 'Invited member', detail: `${inviteEmail} as ${inviteRole}` });
      setInviteEmail('');
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite');
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateRole.mutateAsync({ id: memberId, projectId, role });
      await logActivity.mutateAsync({ projectId, action: 'Changed role', detail: `Member role updated to ${role}` });
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    try {
      await removeMember.mutateAsync({ id: memberId, projectId });
      await logActivity.mutateAsync({ projectId, action: 'Removed member', detail: email });
      toast.success('Member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: user?.email ?? 'You',
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
    toast.success('Comment added');
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6" />
            Team Collaboration
          </h1>
          <p className="text-muted-foreground">Invite members, manage roles, and track activity</p>
        </div>

        {/* Project selector */}
        <Card>
          <CardContent className="pt-6">
            <label className="mb-1 block text-xs text-muted-foreground">Select Project</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Choose a project...</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {projectId && (
          <>
            {/* Invite */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="size-4" />
                  Invite Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  />
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm w-[120px]"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                    <UserPlus className="size-4" />
                    Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="size-4" />
                  Team Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members yet. Invite someone above.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m, i) => {
                      const RoleIcon = roleIcons[m.role];
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between rounded-md border border-border/50 p-3 ${i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                              {m.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{m.email}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadge[m.role]}`}>
                                  <RoleIcon className="size-2.5" />
                                  {m.role}
                                </span>
                                <span className={`text-[10px] ${m.status === 'accepted' ? 'text-green-400' : m.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {m.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="h-7 rounded-md border border-input bg-background px-2 text-xs w-[100px]"
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                              onClick={() => handleRemove(m.id, m.email)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Activity Log */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="size-4" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {activity.map((a) => (
                        <div key={a.id} className="flex items-start gap-2 rounded-md border border-border/50 p-2.5">
                          <Clock className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{a.action}</p>
                            {a.detail && <p className="text-[10px] text-muted-foreground truncate">{a.detail}</p>}
                            <p className="text-[10px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comment Threads */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
                      <Send className="size-3.5" />
                    </Button>
                  </div>
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Start a discussion.</p>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {comments.map((c) => (
                        <div key={c.id} className="rounded-md border border-border/50 p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{c.author}</p>
                            <p className="text-[10px] text-muted-foreground">{timeAgo(c.timestamp)}</p>
                          </div>
                          <p className="text-xs mt-1">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
