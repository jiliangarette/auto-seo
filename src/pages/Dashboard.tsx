import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Sparkles, Shield, Calendar,
  Tags, BarChart3, Globe, Activity, Zap, Loader2,
  CheckCircle2, Circle, ArrowRight, Wand2,
} from 'lucide-react';
import OnboardingModal from '@/components/OnboardingModal';
import AnimatedNumber from '@/components/AnimatedNumber';
import EmptyState from '@/components/EmptyState';
import { auditSite } from '@/lib/site-auditor';
import { useSiteUrl } from '@/contexts/SiteContext';
import type { Analysis } from '@/types/database';

interface AnalyzeAllResult {
  audit?: { score: number; critical: number; warning: number; info: number };
  speed?: { loadTimeMs: number; htmlSize: number; jsScripts: number; cssLinks: number };
  meta?: { title: string; titleLen: number; desc: string; descLen: number };
}

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

  const { siteUrl, setSiteUrl } = useSiteUrl();
  const [quickUrl, setQuickUrl] = useState(siteUrl);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeAll, setAnalyzeAll] = useState(false);
  const [quickResult, setQuickResult] = useState<{ score: number; critical: number; warning: number; info: number } | null>(null);
  const [allResults, setAllResults] = useState<AnalyzeAllResult | null>(null);

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

  const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  // Getting started checklist
  const hasProjects = (projects?.length ?? 0) > 0;
  const hasAnalyses = (allAnalyses?.length ?? 0) > 0;
  const hasAudits = (auditCount ?? 0) > 0;
  const hasKeywords = (keywordCount ?? 0) > 0;
  const checklist = [
    { done: hasProjects, label: 'Create your first project', action: '/projects' },
    { done: hasAudits, label: 'Run a site audit', action: '/audit' },
    { done: hasAnalyses, label: 'Analyze your content', action: '/analyzer' },
    { done: hasKeywords, label: 'Track keywords', action: '/projects' },
  ];
  const completedSteps = checklist.filter(c => c.done).length;
  const showChecklist = completedSteps < checklist.length;

  const handleQuickAnalyze = async () => {
    if (!quickUrl.trim()) return;
    setSiteUrl(quickUrl.trim());
    setAnalyzing(true);
    setQuickResult(null);
    try {
      const result = await auditSite(quickUrl.trim());
      setQuickResult({
        score: result.summary.score,
        critical: result.summary.critical,
        warning: result.summary.warning,
        info: result.summary.info,
      });
    } catch {
      setQuickResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeAll = async () => {
    if (!quickUrl.trim()) return;
    setSiteUrl(quickUrl.trim());
    setAnalyzeAll(true);
    setAllResults(null);
    const results: AnalyzeAllResult = {};
    try {
      const auditPromise = auditSite(quickUrl.trim()).then(r => {
        results.audit = { score: r.summary.score, critical: r.summary.critical, warning: r.summary.warning, info: r.summary.info };
        results.speed = { loadTimeMs: r.siteData.loadTimeMs, htmlSize: r.siteData.htmlSize, jsScripts: r.siteData.jsScripts, cssLinks: r.siteData.cssLinks };
        results.meta = { title: r.siteData.title, titleLen: r.siteData.title.length, desc: r.siteData.metaDescription, descLen: r.siteData.metaDescription.length };
      }).catch(() => {});
      await auditPromise;
      setAllResults(results);
      if (results.audit) setQuickResult(results.audit);
    } catch { /* handled per-promise */ }
    setAnalyzeAll(false);
  };

  const quickActions = [
    { icon: Shield, label: 'Site Audit', desc: 'Full SEO checkup of your website', path: '/audit', gradient: 'from-emerald-500/15 to-cyan-500/15', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
    { icon: Sparkles, label: 'Generate Content', desc: 'AI writes SEO articles for you', path: '/generator', gradient: 'from-violet-500/15 to-fuchsia-500/15', border: 'border-violet-500/20', iconColor: 'text-violet-400' },
    { icon: Zap, label: 'Speed Check', desc: 'Find what slows your site down', path: '/speed-analyzer', gradient: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
    { icon: Tags, label: 'Meta Optimizer', desc: 'Improve your titles & descriptions', path: '/meta-optimizer', gradient: 'from-purple-500/15 to-pink-500/15', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
    { icon: Search, label: 'Keyword Gap', desc: 'Find keywords you\'re missing', path: '/keyword-gap', gradient: 'from-blue-500/15 to-indigo-500/15', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
    { icon: Calendar, label: 'Content Calendar', desc: 'AI plans your content schedule', path: '/calendar', gradient: 'from-rose-500/15 to-pink-500/15', border: 'border-rose-500/20', iconColor: 'text-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <OnboardingModal />
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Here's how your SEO is doing</p>
          </div>
          {healthScore !== null && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overall Health</p>
              <p className={`text-3xl font-bold ${scoreColor(healthScore)}`}>{healthScore}</p>
            </div>
          )}
        </div>

        {/* Quick Analyze — enter URL once */}
        <Card className="border-border/30 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5 shadow-xl shadow-black/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="size-4 text-violet-400" />
              <p className="text-sm font-medium">Quick Analyze — enter your website URL</p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAnalyze()}
                  placeholder="e.g., mybusiness.com"
                  className="pl-10 bg-background/60 border-border/30 h-11"
                />
              </div>
              <Button
                onClick={handleQuickAnalyze}
                disabled={analyzing || analyzeAll}
                variant="outline"
                className="h-11 px-4 border-border/30 rounded-xl"
              >
                {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Quick Scan
              </Button>
              <Button
                onClick={handleAnalyzeAll}
                disabled={analyzing || analyzeAll}
                className="h-11 px-5 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 border-0 text-white rounded-xl"
              >
                {analyzeAll ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {analyzeAll ? 'Analyzing...' : 'Analyze Everything'}
              </Button>
            </div>
            {quickResult && !allResults && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${scoreColor(quickResult.score)}`}>{quickResult.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-red-400">{quickResult.critical} critical</span>
                  <span className="text-amber-400">{quickResult.warning} warnings</span>
                  <span className="text-sky-400">{quickResult.info} info</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border/30" onClick={() => navigate(`/audit?url=${encodeURIComponent(quickUrl)}`)}>
                    Full Audit <ArrowRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            {allResults && (
              <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  {allResults.audit && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="size-3.5 text-emerald-400" />
                        <span className="text-xs font-medium">SEO Audit</span>
                      </div>
                      <p className={`text-2xl font-bold ${scoreColor(allResults.audit.score)}`}>{allResults.audit.score}<span className="text-xs text-muted-foreground">/100</span></p>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <span className="text-red-400">{allResults.audit.critical} critical</span>
                        <span className="text-amber-400">{allResults.audit.warning} warn</span>
                      </div>
                    </div>
                  )}
                  {allResults.speed && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="size-3.5 text-amber-400" />
                        <span className="text-xs font-medium">Speed</span>
                      </div>
                      <p className="text-2xl font-bold">{allResults.speed.loadTimeMs}<span className="text-xs text-muted-foreground">ms</span></p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{Math.round(allResults.speed.htmlSize / 1024)}KB HTML</span>
                        <span>{allResults.speed.jsScripts} scripts</span>
                        <span>{allResults.speed.cssLinks} CSS</span>
                      </div>
                    </div>
                  )}
                  {allResults.meta && (
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Tags className="size-3.5 text-purple-400" />
                        <span className="text-xs font-medium">Meta Tags</span>
                      </div>
                      <p className="text-xs truncate" title={allResults.meta.title}>{allResults.meta.title || <span className="text-red-400">Missing title</span>}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className={allResults.meta.titleLen > 60 ? 'text-amber-400' : allResults.meta.titleLen === 0 ? 'text-red-400' : 'text-emerald-400'}>
                          Title: {allResults.meta.titleLen} chars
                        </span>
                        <span className={allResults.meta.descLen > 160 ? 'text-amber-400' : allResults.meta.descLen === 0 ? 'text-red-400' : 'text-emerald-400'}>
                          Desc: {allResults.meta.descLen} chars
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border/30" onClick={() => navigate(`/audit?url=${encodeURIComponent(quickUrl)}`)}>
                    Full Audit <ArrowRight className="size-3 ml-1" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border/30" onClick={() => navigate('/speed-analyzer')}>
                    Speed Details <ArrowRight className="size-3 ml-1" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border/30" onClick={() => navigate('/meta-optimizer')}>
                    Optimize Meta <ArrowRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <StatCard label="Projects" value={projects?.length ?? 0} gradient="from-blue-500/20 to-cyan-500/20" />
          <StatCard label="Keywords" value={keywordCount ?? 0} gradient="from-purple-500/20 to-pink-500/20" />
          <StatCard label="Analyses" value={allAnalyses?.length ?? 0} gradient="from-amber-500/20 to-orange-500/20" />
          <StatCard label="Backlinks" value={`${backlinkStats?.active ?? 0}/${backlinkStats?.total ?? 0}`} sub="active" gradient="from-green-500/20 to-emerald-500/20" />
          <StatCard label="Audits" value={auditCount ?? 0} gradient="from-red-500/20 to-rose-500/20" />
        </div>

        {/* Getting Started Checklist */}
        {showChecklist && (
          <Card className="border-border/30 bg-card/40">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Getting Started</p>
                <span className="text-[10px] text-muted-foreground">{completedSteps}/{checklist.length} complete</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/20 mb-4 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all" style={{ width: `${(completedSteps / checklist.length) * 100}%` }} />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {checklist.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => !item.done && navigate(item.action)}
                    className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all text-sm ${
                      item.done
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                        : 'border-border/30 hover:border-violet-500/30 hover:bg-violet-500/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.done ? <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> : <Circle className="size-4 shrink-0" />}
                    <span className={item.done ? 'line-through opacity-60' : ''}>{item.label}</span>
                    {!item.done && <ArrowRight className="size-3 ml-auto opacity-40" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">What would you like to do?</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`group relative text-left rounded-2xl border ${action.border} bg-gradient-to-br ${action.gradient} p-4 transition-all hover:shadow-lg hover:scale-[1.01]`}
                >
                  <div className={`inline-flex items-center justify-center size-9 rounded-xl bg-background/60 mb-2`}>
                    <Icon className={`size-4 ${action.iconColor}`} />
                  </div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
                  <ArrowRight className="absolute top-4 right-4 size-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="size-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                          item.type === 'analysis' ? 'bg-blue-500/10 text-blue-400' :
                          item.type === 'audit' ? 'bg-red-500/10 text-red-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {item.label}
                        </span>
                        <span className="truncate text-xs max-w-[200px]">{item.detail}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(item.date)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Activity} title="No activity yet" description="Start by creating a project" actionLabel="Get Started" actionPath="/projects" />
              )}
            </CardContent>
          </Card>

          {/* Recent Analyses */}
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="size-4" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allAnalyses && allAnalyses.length > 0 ? (
                <div className="space-y-1">
                  {allAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-xs font-medium truncate max-w-[220px]">{analysis.url}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(analysis.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-lg font-bold ${scoreColor(analysis.score ?? 0)}`}>
                        {analysis.score ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Search} title="No analyses yet" description="Run your first SEO analysis" actionLabel="Analyze" actionPath="/analyzer" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        {projects && projects.length > 0 && (
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="size-4" />
                Your Projects
              </CardTitle>
              <CardDescription className="text-xs">Click to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="rounded-xl border border-border/30 p-3 text-left transition-all hover:bg-muted/30 hover:border-border/50"
                  >
                    <p className="font-medium text-sm">{project.name}</p>
                    {project.url && <p className="text-[11px] text-muted-foreground truncate">{project.url}</p>}
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
    <Card className="border-border/30 bg-card/40 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient ?? ''} opacity-30`} />
      <CardContent className="relative pt-4 pb-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {numValue !== null ? (
          <AnimatedNumber value={numValue} className={`text-2xl font-bold ${color ?? ''}`} />
        ) : (
          <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
        )}
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
