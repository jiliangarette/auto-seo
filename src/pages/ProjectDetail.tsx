import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useKeywords } from '@/hooks/useKeywords';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import KeywordTable from '@/components/KeywordTable';
import CompetitorSection from '@/components/CompetitorSection';
import BacklinkSection from '@/components/BacklinkSection';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const { data: keywords } = useKeywords(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft className="size-4" />
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.url && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <ExternalLink className="size-3" />
                {project.url}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
              <CardDescription>Tracked keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{keywords?.length ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analyses</CardTitle>
              <CardDescription>SEO analyses run</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Score</CardTitle>
              <CardDescription>Average score</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
            </CardContent>
          </Card>
        </div>

        <KeywordTable projectId={id!} />

        <CompetitorSection projectId={id!} projectUrl={project.url} />

        <BacklinkSection projectId={id!} />
      </div>
    </div>
  );
}
