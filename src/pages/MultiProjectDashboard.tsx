import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  BarChart3,
  ArrowUpRight,
  Archive,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface ProjectStats {
  projectId: string;
  keywords: number;
  avgPosition: number | null;
  backlinks: number;
  activeBacklinks: number;
  analyses: number;
  avgScore: number | null;
  audits: number;
  contentItems: number;
  healthScore: number;
}

function calcHealth(s: ProjectStats): number {
  let score = 0;
  if (s.keywords > 0) score += 15;
  if (s.keywords >= 5) score += 10;
  if (s.avgScore && s.avgScore >= 60) score += 20;
  else if (s.avgScore && s.avgScore >= 40) score += 10;
  if (s.backlinks > 0) score += 10;
  if (s.activeBacklinks > 0) score += 10;
  if (s.audits > 0) score += 10;
  if (s.contentItems > 0) score += 10;
  if (s.avgPosition && s.avgPosition <= 10) score += 15;
  else if (s.avgPosition && s.avgPosition <= 30) score += 5;
  return Math.min(100, score);
}

function healthColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function healthBg(score: number) {
  if (score >= 70) return 'bg-green-400';
  if (score >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

export default function MultiProjectDashboard() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const [archived, setArchived] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('archived_projects');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showArchived, setShowArchived] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Fetch aggregate stats for all projects
  const { data: allStats } = useQuery({
    queryKey: ['multi-project-stats', user?.id],
    queryFn: async () => {
      const [kw, bl, an, au, ci] = await Promise.all([
        supabase.from('keywords').select('project_id, position'),
        supabase.from('backlinks').select('project_id, status'),
        supabase.from('analyses').select('project_id, score'),
        supabase.from('audits').select('project_id'),
        supabase.from('content_items').select('project_id'),
      ]);

      const stats = new Map<string, ProjectStats>();

      const ensure = (pid: string) => {
        if (!stats.has(pid)) {
          stats.set(pid, {
            projectId: pid,
            keywords: 0,
            avgPosition: null,
            backlinks: 0,
            activeBacklinks: 0,
            analyses: 0,
            avgScore: null,
            audits: 0,
            contentItems: 0,
            healthScore: 0,
          });
        }
        return stats.get(pid)!;
      };

      // Keywords
      const kwByProject = new Map<string, number[]>();
      for (const row of kw.data ?? []) {
        const r = row as { project_id: string; position: number | null };
        const s = ensure(r.project_id);
        s.keywords++;
        if (r.position != null) {
          if (!kwByProject.has(r.project_id)) kwByProject.set(r.project_id, []);
          kwByProject.get(r.project_id)!.push(r.position);
        }
      }
      for (const [pid, positions] of kwByProject) {
        const s = ensure(pid);
        s.avgPosition = Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10;
      }

      // Backlinks
      for (const row of bl.data ?? []) {
        const r = row as { project_id: string; status: string };
        const s = ensure(r.project_id);
        s.backlinks++;
        if (r.status === 'active') s.activeBacklinks++;
      }

      // Analyses
      const scoreByProject = new Map<string, number[]>();
      for (const row of an.data ?? []) {
        const r = row as { project_id: string; score: number | null };
        const s = ensure(r.project_id);
        s.analyses++;
        if (r.score != null) {
          if (!scoreByProject.has(r.project_id)) scoreByProject.set(r.project_id, []);
          scoreByProject.get(r.project_id)!.push(r.score);
        }
      }
      for (const [pid, scores] of scoreByProject) {
        const s = ensure(pid);
        s.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }

      // Audits
      for (const row of au.data ?? []) {
        const r = row as { project_id: string };
        ensure(r.project_id).audits++;
      }

      // Content items
      for (const row of ci.data ?? []) {
        const r = row as { project_id: string };
        ensure(r.project_id).contentItems++;
      }

      // Calculate health scores
      for (const s of stats.values()) {
        s.healthScore = calcHealth(s);
      }

      return stats;
    },
    enabled: !!user,
  });

  const toggleArchive = (id: string) => {
    setArchived((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('archived_projects', JSON.stringify([...next]));
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => (showArchived ? archived.has(p.id) : !archived.has(p.id))),
    [projects, archived, showArchived]
  );

  // Aggregate stats
  const totals = useMemo(() => {
    if (!allStats || !projects) return null;
    let keywords = 0, backlinks = 0, analyses = 0, totalHealth = 0, count = 0;
    for (const p of projects) {
      const s = allStats.get(p.id);
      if (s) {
        keywords += s.keywords;
        backlinks += s.backlinks;
        analyses += s.analyses;
        totalHealth += s.healthScore;
        count++;
      }
    }
    return {
      projects: projects.length,
      keywords,
      backlinks,
      analyses,
      avgHealth: count ? Math.round(totalHealth / count) : 0,
    };
  }, [allStats, projects]);

  const compareProjects = useMemo(
    () => (projects ?? []).filter((p) => compareIds.includes(p.id)),
    [projects, compareIds]
  );

  if (isLoading) return <div className="min-h-screen bg-background p-4 md:p-8"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutGrid className="size-6" />
              Multi-Project Dashboard
            </h1>
            <p className="text-muted-foreground">Overview and comparison of all your SEO projects</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="size-4" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
        </div>

        {/* Aggregate stats */}
        {totals && (
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard label="Total Projects" value={totals.projects} />
            <StatCard label="Total Keywords" value={totals.keywords} />
            <StatCard label="Total Backlinks" value={totals.backlinks} />
            <StatCard label="Total Analyses" value={totals.analyses} />
            <StatCard label="Avg Health" value={totals.avgHealth} suffix="%" color={healthColor(totals.avgHealth)} />
          </div>
        )}

        {/* Project grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => {
            const stats = allStats?.get(project.id);
            const health = stats?.healthScore ?? 0;
            const isComparing = compareIds.includes(project.id);
            return (
              <Card key={project.id} className={`transition-all ${isComparing ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <CardTitle className="text-sm flex items-center gap-1">
                        {project.name}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </CardTitle>
                      {project.url && <p className="text-xs text-muted-foreground truncate">{project.url}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`text-lg font-bold ${healthColor(health)}`}>{health}</div>
                    </div>
                  </div>
                  {/* Health bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${healthBg(health)}`} style={{ width: `${health}%` }} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <MiniStat label="Keywords" value={stats?.keywords ?? 0} />
                    <MiniStat label="Avg Position" value={stats?.avgPosition ?? '—'} />
                    <MiniStat label="Backlinks" value={stats?.backlinks ?? 0} />
                    <MiniStat label="Avg Score" value={stats?.avgScore ?? '—'} />
                    <MiniStat label="Audits" value={stats?.audits ?? 0} />
                    <MiniStat label="Content" value={stats?.contentItems ?? 0} />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => toggleCompare(project.id)}>
                      <Eye className="size-3" />
                      {isComparing ? 'Remove' : 'Compare'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleArchive(project.id)}>
                      <Archive className="size-3" />
                      {archived.has(project.id) ? 'Restore' : 'Archive'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {activeProjects.length === 0 && (
          <Card className="border-border/30 bg-card/40">
            <CardContent className="py-12 text-center text-muted-foreground">
              {showArchived ? 'No archived projects.' : 'No active projects.'}
            </CardContent>
          </Card>
        )}

        {/* Side-by-side comparison */}
        {compareProjects.length >= 2 && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="size-4" />
                Project Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-xs text-muted-foreground">Metric</th>
                      {compareProjects.map((p) => (
                        <th key={p.id} className="text-center py-2 px-3 text-xs font-medium">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {[
                      { label: 'Health Score', key: 'healthScore' },
                      { label: 'Keywords', key: 'keywords' },
                      { label: 'Avg Position', key: 'avgPosition' },
                      { label: 'Backlinks', key: 'backlinks' },
                      { label: 'Avg SEO Score', key: 'avgScore' },
                      { label: 'Audits', key: 'audits' },
                      { label: 'Content Items', key: 'contentItems' },
                    ].map((metric) => {
                      const values = compareProjects.map((p) => {
                        const s = allStats?.get(p.id);
                        return s ? (s as unknown as Record<string, unknown>)[metric.key] as number | null : null;
                      });
                      const best = values.reduce<number | null>((b, v) => {
                        if (v == null) return b;
                        if (b == null) return v;
                        if (metric.key === 'avgPosition') return v < b ? v : b;
                        return v > b ? v : b;
                      }, null);

                      return (
                        <tr key={metric.key} className="border-b border-border/30">
                          <td className="py-2 pr-4 text-muted-foreground">{metric.label}</td>
                          {compareProjects.map((p, i) => {
                            const val = values[i];
                            const isBest = val != null && val === best && compareProjects.length > 1;
                            return (
                              <td key={p.id} className={`text-center py-2 px-3 ${isBest ? 'text-green-400 font-medium' : ''}`}>
                                {val ?? '—'}
                                {isBest && val != null && <WinIndicator metric={metric.key} />}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => setCompareIds([])}>
                Clear comparison
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color?: string }) {
  return (
    <Card className="border-border/30 bg-card/40">
      <CardContent className="pt-4 text-center">
        <p className={`text-2xl font-bold ${color ?? ''}`}>
          {value}{suffix}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function WinIndicator({ metric }: { metric: string }) {
  if (metric === 'avgPosition') return <ArrowUpRight className="inline size-3 ml-0.5" />;
  return <ArrowUpRight className="inline size-3 ml-0.5" />;
}
