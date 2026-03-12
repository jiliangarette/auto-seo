import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
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
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div
                    className="flex-1"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.url && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ExternalLink className="size-3" />
                        {project.url}
                      </p>
                    )}
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
