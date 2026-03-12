import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Sparkles, FolderOpen } from 'lucide-react';
import type { Analysis } from '@/types/database';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects } = useProjects();

  const { data: allAnalyses } = useQuery({
    queryKey: ['all-analyses', user?.id],
    queryFn: async () => {
      const projectIds = projects?.map((p) => p.id) ?? [];
      if (!projectIds.length) return [];

      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Analysis[];
    },
    enabled: !!projects?.length,
  });

  const { data: keywordCount } = useQuery({
    queryKey: ['keyword-count', user?.id],
    queryFn: async () => {
      const projectIds = projects?.map((p) => p.id) ?? [];
      if (!projectIds.length) return 0;

      const { count, error } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!projects?.length,
  });

  const avgScore = allAnalyses?.length
    ? Math.round(
        allAnalyses.reduce((sum, a) => sum + (a.score ?? 0), 0) / allAnalyses.length,
      )
    : null;

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">AI-powered SEO optimization platform</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{projects?.length ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{keywordCount ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allAnalyses?.length ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg SEO Score</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${avgScore ? scoreColor(avgScore) : ''}`}>
                {avgScore ?? '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate('/projects')}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <FolderOpen className="size-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">New Project</h3>
                <p className="text-sm text-muted-foreground">Add a website to track</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate('/analyzer')}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <Search className="size-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Run Analysis</h3>
                <p className="text-sm text-muted-foreground">Analyze content for SEO</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate('/generator')}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <Sparkles className="size-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Generate Content</h3>
                <p className="text-sm text-muted-foreground">AI-powered SEO writing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {allAnalyses && allAnalyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{analysis.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${scoreColor(analysis.score ?? 0)}`}>
                      {analysis.score ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
