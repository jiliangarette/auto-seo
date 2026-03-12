import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Sparkles, FolderOpen, Shield, Calendar, FileText,
  Tags, Link2, Settings2, BarChart3, Globe, Activity,
} from 'lucide-react';
import OnboardingModal from '@/components/OnboardingModal';
import AnimatedNumber from '@/components/AnimatedNumber';
import EmptyState from '@/components/EmptyState';
import type { Analysis } from '@/types/database';

interface ActivityItem {
  type: string;
  label: string;
  detail: string;
  date: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const projectIds = projects?.map((p) => p.id) ?? [];

  const { data: allAnalyses } = useQuery({
    queryKey: ['all-analyses', user?.id],
    queryFn: async () => {
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

  const { data: backlinkStats } = useQuery({
    queryKey: ['backlink-stats', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return { total: 0, active: 0 };
      const { data, error } = await supabase
        .from('backlinks')
        .select('status')
        .in('project_id', projectIds);
      if (error) throw error;
      return {
        total: data.length,
        active: data.filter((b) => b.status === 'active').length,
      };
    },
    enabled: !!projects?.length,
  });

  const { data: auditCount } = useQuery({
    queryKey: ['audit-count', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return 0;
      const { count, error } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!projects?.length,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const items: ActivityItem[] = [];

      const [analyses, audits, content] = await Promise.all([
        supabase.from('analyses').select('url, created_at').in('project_id', projectIds).order('created_at', { ascending: false }).limit(4),
        supabase.from('audits').select('url, created_at').in('project_id', projectIds).order('created_at', { ascending: false }).limit(3),
        supabase.from('content_items').select('title, created_at').in('project_id', projectIds).order('created_at', { ascending: false }).limit(3),
      ]);

      analyses.data?.forEach((a) => items.push({ type: 'analysis', label: 'Analysis', detail: a.url, date: a.created_at }));
      audits.data?.forEach((a) => items.push({ type: 'audit', label: 'Audit', detail: a.url, date: a.created_at }));
      content.data?.forEach((c) => items.push({ type: 'content', label: 'Content', detail: c.title, date: c.created_at }));

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    },
    enabled: !!projects?.length,
  });

  const avgScore = allAnalyses?.length
    ? Math.round(allAnalyses.reduce((sum, a) => sum + (a.score ?? 0), 0) / allAnalyses.length)
    : null;

  // Project health: composite of avg score, keyword density, backlink ratio
  const healthScore = (() => {
    let score = 0;
    let factors = 0;
    if (avgScore !== null) { score += avgScore; factors++; }
    if ((keywordCount ?? 0) > 0) { score += Math.min(100, (keywordCount ?? 0) * 10); factors++; }
    if (backlinkStats && backlinkStats.total > 0) {
      score += Math.round((backlinkStats.active / backlinkStats.total) * 100);
      factors++;
    }
    return factors > 0 ? Math.round(score / factors) : null;
  })();

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const quickActions = [
    { icon: FolderOpen, label: 'New Project', desc: 'Add a website to track', path: '/projects' },
    { icon: Search, label: 'Run Analysis', desc: 'Analyze content for SEO', path: '/analyzer' },
    { icon: Sparkles, label: 'Generate Content', desc: 'AI-powered SEO writing', path: '/generator' },
    { icon: Shield, label: 'Site Audit', desc: 'Technical SEO check', path: '/audit' },
    { icon: Calendar, label: 'Content Calendar', desc: 'Plan & schedule', path: '/calendar' },
    { icon: FileText, label: 'Reports', desc: 'Generate & export', path: '/reports' },
    { icon: Tags, label: 'Meta Tags', desc: 'Generate meta tags', path: '/meta-tags' },
    { icon: Link2, label: 'Internal Links', desc: 'Link suggestions', path: '/internal-links' },
    { icon: Settings2, label: 'Settings', desc: 'Profile & preferences', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <OnboardingModal />
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">AI-powered SEO optimization platform</p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-6">
          <StatCard label="Projects" value={projects?.length ?? 0} gradient="bg-gradient-to-br from-blue-500/30 to-cyan-500/30" />
          <StatCard label="Keywords" value={keywordCount ?? 0} gradient="bg-gradient-to-br from-purple-500/30 to-pink-500/30" />
          <StatCard label="Analyses" value={allAnalyses?.length ?? 0} gradient="bg-gradient-to-br from-amber-500/30 to-orange-500/30" />
          <StatCard label="Backlinks" value={`${backlinkStats?.active ?? 0}/${backlinkStats?.total ?? 0}`} sub="active" gradient="bg-gradient-to-br from-green-500/30 to-emerald-500/30" />
          <StatCard label="Audits" value={auditCount ?? 0} gradient="bg-gradient-to-br from-red-500/30 to-rose-500/30" />
          <StatCard
            label="Health Score"
            value={healthScore !== null ? `${healthScore}` : '—'}
            color={healthScore ? scoreColor(healthScore) : undefined}
            gradient="bg-gradient-to-br from-indigo-500/30 to-violet-500/30"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Card
                key={action.path}
                className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <action.icon className="size-6 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-semibold">{action.label}</h3>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="size-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between border-b border-border/30 pb-2 last:border-0 px-2 py-1.5 rounded transition-colors hover:bg-muted/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          item.type === 'analysis' ? 'bg-blue-950/30 text-blue-400' :
                          item.type === 'audit' ? 'bg-red-950/30 text-red-400' :
                          'bg-green-950/30 text-green-400'
                        }`}>
                          {item.label}
                        </span>
                        <span className="truncate text-sm max-w-[200px]">{item.detail}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(item.date)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Activity} title="No activity yet" description="Start by creating a project and running your first analysis" actionLabel="Get Started" actionPath="/projects" />
              )}
            </CardContent>
          </Card>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="size-4" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allAnalyses && allAnalyses.length > 0 ? (
                <div className="space-y-2">
                  {allAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 px-2 py-1.5 rounded transition-colors hover:bg-muted/50 even:bg-muted/20">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[250px]">{analysis.url}</p>
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
              ) : (
                <EmptyState icon={Search} title="No analyses yet" description="Run your first SEO analysis to see results here" actionLabel="Analyze Content" actionPath="/analyzer" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Health Overview */}
        {projects && projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="size-4" />
                Projects
              </CardTitle>
              <CardDescription>Click a project to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="rounded-lg border border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <p className="font-medium text-sm">{project.name}</p>
                    {project.url && (
                      <p className="text-xs text-muted-foreground truncate">{project.url}</p>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, gradient }: { label: string; value: number | string; sub?: string; color?: string; gradient?: string }) {
  const numValue = typeof value === 'number' ? value : null;
  return (
    <div className={`relative rounded-xl p-[1px] ${gradient ?? 'bg-border'}`}>
      <Card className="rounded-xl border-0">
        <CardHeader className="pb-1">
          <CardDescription className="text-xs">{label}</CardDescription>
        </CardHeader>
        <CardContent>
          {numValue !== null ? (
            <AnimatedNumber value={numValue} className={`text-2xl font-bold ${color ?? ''}`} />
          ) : (
            <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
          )}
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
