import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useKeywords } from '@/hooks/useKeywords';
import { Button } from '@/components/ui/button';

import KeywordTable from '@/components/KeywordTable';
import CompetitorSection from '@/components/CompetitorSection';
import BacklinkSection from '@/components/BacklinkSection';
import RankTracker from '@/components/RankTracker';
import { ArrowLeft, ExternalLink, Star } from 'lucide-react';
import { useSiteContext } from '@/contexts/SiteContext';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { PageSkeleton } from '@/components/LoadingSkeleton';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const { data: keywords } = useKeywords(id!);
  const { selectedProjectId, selectProject } = useSiteContext();
  const isActive = selectedProjectId === id;

  if (isLoading) return <PageSkeleton />;

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft className="size-4" />
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.url && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <ExternalLink className="size-3" />
                {project.url}
              </p>
            )}
          </div>
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => selectProject(id!)}
            className={isActive ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-border/30'}
          >
            <Star className={`size-4 ${isActive ? 'fill-violet-400' : ''}`} />
            {isActive ? 'Active' : 'Set as Active'}
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <MagicCard className="rounded-xl" gradientColor="#1a1a2e" gradientOpacity={0.6}>
            <div className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Keywords</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tracked keywords</p>
              {(keywords?.length ?? 0) > 0 ? (
                <NumberTicker value={keywords?.length ?? 0} className="text-2xl font-bold mt-1" />
              ) : (
                <p className="text-2xl font-bold mt-1">0</p>
              )}
            </div>
          </MagicCard>

          <MagicCard className="rounded-xl" gradientColor="#1a1a2e" gradientOpacity={0.6}>
            <div className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Analyses</p>
              <p className="text-xs text-muted-foreground mt-0.5">SEO analyses run</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
          </MagicCard>

          <MagicCard className="rounded-xl" gradientColor="#1a1a2e" gradientOpacity={0.6}>
            <div className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">SEO Score</p>
              <p className="text-xs text-muted-foreground mt-0.5">Average score</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
          </MagicCard>
        </div>

        <KeywordTable projectId={id!} />

        <RankTracker projectId={id!} />

        <CompetitorSection projectId={id!} projectUrl={project.url} />

        <BacklinkSection projectId={id!} />
      </div>
    </div>
  );
}
