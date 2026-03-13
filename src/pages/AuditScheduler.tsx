import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledAudit {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: string | null;
  nextRun: string;
  active: boolean;
}

interface AuditComparison {
  category: string;
  previous: number;
  current: number;
  change: number;
}

interface IssueTrack {
  id: string;
  issue: string;
  status: 'resolved' | 'new' | 'recurring';
  firstSeen: string;
  lastSeen: string;
}

export default function AuditScheduler() {
  const { data: projects } = useProjects();
  const [activeTab, setActiveTab] = useState<'schedules' | 'comparison' | 'issues' | 'trends'>('schedules');
  const [schedules, setSchedules] = useState<ScheduledAudit[]>([]);
  const [newProjectId, setNewProjectId] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Sample comparison data
  const [comparisons] = useState<AuditComparison[]>([
    { category: 'Performance', previous: 72, current: 78, change: 6 },
    { category: 'SEO', previous: 85, current: 88, change: 3 },
    { category: 'Accessibility', previous: 90, current: 92, change: 2 },
    { category: 'Best Practices', previous: 80, current: 75, change: -5 },
    { category: 'Security', previous: 95, current: 95, change: 0 },
  ]);

  // Sample issue tracking
  const [issues] = useState<IssueTrack[]>([
    { id: '1', issue: 'Missing alt text on 5 images', status: 'recurring', firstSeen: '2026-02-15', lastSeen: '2026-03-13' },
    { id: '2', issue: 'Render-blocking CSS in header', status: 'resolved', firstSeen: '2026-02-20', lastSeen: '2026-03-01' },
    { id: '3', issue: 'No meta description on /about', status: 'new', firstSeen: '2026-03-13', lastSeen: '2026-03-13' },
    { id: '4', issue: 'Large image files (>500KB)', status: 'recurring', firstSeen: '2026-01-10', lastSeen: '2026-03-13' },
    { id: '5', issue: 'Duplicate title tags', status: 'resolved', firstSeen: '2026-02-01', lastSeen: '2026-02-28' },
    { id: '6', issue: 'Missing canonical tag on /blog', status: 'new', firstSeen: '2026-03-13', lastSeen: '2026-03-13' },
  ]);

  // Sample score history
  const scoreHistory = [65, 68, 70, 72, 75, 73, 78, 80, 82, 85, 83, 88];
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const addSchedule = () => {
    if (!newProjectId || !newUrl.trim()) {
      toast.error('Select a project and enter URL');
      return;
    }
    const project = projects?.find((p) => p.id === newProjectId);
    const now = new Date();
    const next = new Date(now);
    if (newFreq === 'daily') next.setDate(next.getDate() + 1);
    else if (newFreq === 'weekly') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);

    const schedule: ScheduledAudit = {
      id: crypto.randomUUID(),
      projectId: newProjectId,
      projectName: project?.name ?? 'Unknown',
      url: newUrl.trim(),
      frequency: newFreq,
      lastRun: null,
      nextRun: next.toISOString(),
      active: true,
    };
    setSchedules((prev) => [...prev, schedule]);
    setNewUrl('');
    toast.success('Audit scheduled');
  };

  const toggleActive = (id: string) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const removeSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success('Schedule removed');
  };

  const statusConfig = {
    resolved: { color: 'text-green-400', bg: 'bg-green-950/30', icon: CheckCircle2 },
    new: { color: 'text-blue-400', bg: 'bg-blue-950/30', icon: AlertCircle },
    recurring: { color: 'text-yellow-400', bg: 'bg-yellow-950/30', icon: RefreshCw },
  };

  const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6" />
            SEO Audit Scheduler
          </h1>
          <p className="text-muted-foreground">Schedule recurring audits and track issue resolution over time</p>
        </div>

        <div className="flex gap-1 border-b border-border">
          {([
            { key: 'schedules', label: 'Schedules' },
            { key: 'comparison', label: 'Audit Comparison' },
            { key: 'issues', label: 'Issue Tracking' },
            { key: 'trends', label: 'Score Trends' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Schedules */}
        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="size-4" />
                  New Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-4">
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                  >
                    <option value="">Project...</option>
                    {(projects ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Input placeholder="URL to audit" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="font-mono text-xs" />
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value as ScheduledAudit['frequency'])}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <Button onClick={addSchedule}>
                    <Plus className="size-3.5" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {schedules.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No scheduled audits. Create one above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {schedules.map((s) => (
                  <Card key={s.id} className={!s.active ? 'opacity-50' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{s.projectName}</p>
                          <p className="text-xs font-mono text-muted-foreground">{s.url}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="rounded bg-muted px-1.5 py-0.5">{freqLabel[s.frequency]}</span>
                            <span>Next: {new Date(s.nextRun).toLocaleDateString()}</span>
                            {s.lastRun && <span>Last: {new Date(s.lastRun).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleActive(s.id)} className={s.active ? 'text-green-400' : 'text-muted-foreground'}>
                            {s.active ? 'Active' : 'Paused'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => removeSchedule(s.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison */}
        {activeTab === 'comparison' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Previous vs Current Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {comparisons.map((c) => (
                <div key={c.category} className="flex items-center justify-between rounded-md border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32">{c.category}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">Before: {c.previous}</span>
                      <span>→</span>
                      <span className="font-medium">Now: {c.current}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${c.change > 0 ? 'text-green-400' : c.change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {c.change > 0 ? <TrendingUp className="size-4" /> : c.change < 0 ? <TrendingDown className="size-4" /> : null}
                    {c.change > 0 ? '+' : ''}{c.change}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Issue Tracking */}
        {activeTab === 'issues' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Automated Issue Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {issues.map((issue) => {
                const config = statusConfig[issue.status];
                const Icon = config.icon;
                return (
                  <div key={issue.id} className="flex items-center justify-between rounded-md border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-2">
                      <Icon className={`size-4 mt-0.5 ${config.color}`} />
                      <div>
                        <p className="text-xs font-medium">{issue.issue}</p>
                        <p className="text-[10px] text-muted-foreground">
                          First seen: {issue.firstSeen} • Last: {issue.lastSeen}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${config.bg} ${config.color}`}>
                      {issue.status}
                    </span>
                  </div>
                );
              })}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-green-400" /> {issues.filter((i) => i.status === 'resolved').length} resolved</span>
                <span className="flex items-center gap-1"><AlertCircle className="size-3 text-blue-400" /> {issues.filter((i) => i.status === 'new').length} new</span>
                <span className="flex items-center gap-1"><RefreshCw className="size-3 text-yellow-400" /> {issues.filter((i) => i.status === 'recurring').length} recurring</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Trends */}
        {activeTab === 'trends' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="size-4" />
                Audit Score Trend (12 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40 px-2">
                {scoreHistory.map((score, i) => {
                  const max = Math.max(...scoreHistory);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-medium">{score}</span>
                      <div
                        className={`w-full rounded-t transition-colors ${score >= 80 ? 'bg-green-500/60 hover:bg-green-500' : score >= 60 ? 'bg-yellow-500/60 hover:bg-yellow-500' : 'bg-red-500/60 hover:bg-red-500'}`}
                        style={{ height: `${(score / max) * 85}%` }}
                      />
                      <span className="text-[8px] text-muted-foreground">{months[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs">
                <span className="text-muted-foreground">12-month improvement: <span className="text-green-400 font-bold">+{scoreHistory[scoreHistory.length - 1] - scoreHistory[0]} points</span></span>
                <span className="text-muted-foreground">Current: <span className="font-bold">{scoreHistory[scoreHistory.length - 1]}/100</span></span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
