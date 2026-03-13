import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects';
import { useSiteContext } from '@/contexts/SiteContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { Plus, Trash2, ExternalLink, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();
  const { selectedProjectId, selectProject } = useSiteContext();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject.mutateAsync({ name: name.trim(), url: url.trim() || undefined });
      toast.success('Project created');
      setName('');
      setUrl('');
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleSetActive = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    selectProject(projectId);
    toast.success('Active project updated');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage your SEO projects</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Project</CardTitle>
              <CardDescription>Add a new website to track</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="flex gap-3">
                <Input
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  placeholder="https://example.com (optional)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending ? 'Creating...' : 'Create'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <p className="text-muted-foreground">Loading projects...</p>
        ) : !projects?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const isActive = selectedProjectId === project.id;
              return (
                <MagicCard
                  key={project.id}
                  className={cn(
                    'rounded-xl transition-all duration-300',
                    isActive && 'border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                  )}
                  gradientFrom={isActive ? '#8b5cf6' : '#9E7AFF'}
                  gradientTo={isActive ? '#a78bfa' : '#FE8BBB'}
                >
                  <Card className="border-0 bg-transparent shadow-none">
                    <CardContent className="flex flex-col gap-3 p-5">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Star className="size-4 fill-violet-500 text-violet-500" />
                          )}
                          <h3 className="font-semibold">{project.name}</h3>
                        </div>
                        {project.url && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <ExternalLink className="size-3" />
                            {project.url}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <Button
                          variant={isActive ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={(e) => handleSetActive(e, project.id)}
                          disabled={isActive}
                          className={cn(
                            'text-xs',
                            isActive && 'bg-violet-500/10 text-violet-500'
                          )}
                        >
                          {isActive ? (
                            <>
                              <Check className="size-3" />
                              Active
                            </>
                          ) : (
                            'Set Active'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project.id);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </MagicCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
