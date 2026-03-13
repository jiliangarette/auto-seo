import { useState } from 'react';
import { useSiteUrlInput } from '@/hooks/useSiteUrlInput';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Gauge,
  Loader2,
  Download,
  Target,
  TrendingUp,
  TrendingDown,
  Bell,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface BenchmarkMetric {
  name: string;
  yourValue: number;
  industryAvg: number;
  topPerformer: number;
  unit: string;
  higherIsBetter: boolean;
}

interface KpiGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  deadline: string;
  alertEnabled: boolean;
}

interface HistoricalPoint {
  month: string;
  score: number;
}

export default function Benchmarking() {
  const [niche, setNiche] = useState('');
  const [siteUrl, setSiteUrl] = useSiteUrlInput();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<BenchmarkMetric[]>([]);
  const [goals, setGoals] = useState<KpiGoal[]>([]);
  const [activeTab, setActiveTab] = useState<'benchmark' | 'history' | 'goals'>('benchmark');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const history: HistoricalPoint[] = [
    { month: 'Oct', score: 55 }, { month: 'Nov', score: 58 }, { month: 'Dec', score: 62 },
    { month: 'Jan', score: 65 }, { month: 'Feb', score: 70 }, { month: 'Mar', score: 75 },
  ];

  const runBenchmark = async () => {
    if (!niche.trim()) {
      toast.error('Enter your industry niche');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO benchmarking expert. Return JSON only.' },
          { role: 'user', content: `Generate SEO benchmark comparison for a ${niche} website${siteUrl ? ` (${siteUrl})` : ''}.

Return JSON array of metrics:
[{ "name": "metric name", "yourValue": number, "industryAvg": number, "topPerformer": number, "unit": "string", "higherIsBetter": boolean }]

Include these metrics: Domain Authority, Page Speed Score, Organic Keywords, Monthly Traffic, Backlinks, Content Score, Average Position, CTR, Bounce Rate, Pages Indexed` },
        ],
      });
      const raw = response.choices[0].message.content ?? '[]';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setMetrics(JSON.parse(cleaned));
      toast.success('Benchmark complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = () => {
    if (!newGoalName.trim() || !newGoalTarget.trim()) return;
    const goal: KpiGoal = {
      id: crypto.randomUUID(),
      name: newGoalName.trim(),
      current: Math.floor(Math.random() * parseInt(newGoalTarget)),
      target: parseInt(newGoalTarget),
      deadline: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      alertEnabled: true,
    };
    setGoals((prev) => [...prev, goal]);
    setNewGoalName('');
    setNewGoalTarget('');
    toast.success('Goal added');
  };

  const toggleAlert = (id: string) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, alertEnabled: !g.alertEnabled } : g));
  };

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const exportReport = () => {
    if (metrics.length === 0) return;
    const rows = metrics.map((m) => `"${m.name}",${m.yourValue},${m.industryAvg},${m.topPerformer},"${m.unit}"`);
    const csv = `Metric,Your Value,Industry Avg,Top Performer,Unit\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benchmark-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getPerformanceLevel = (metric: BenchmarkMetric) => {
    const { yourValue, industryAvg, higherIsBetter } = metric;
    if (higherIsBetter) {
      if (yourValue >= industryAvg * 1.2) return 'above';
      if (yourValue >= industryAvg * 0.8) return 'average';
      return 'below';
    }
    if (yourValue <= industryAvg * 0.8) return 'above';
    if (yourValue <= industryAvg * 1.2) return 'average';
    return 'below';
  };

  const perfColor = { above: 'text-green-400', average: 'text-yellow-400', below: 'text-red-400' };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Gauge className="size-6" />
              Performance Benchmarking
            </h1>
            <p className="text-muted-foreground">Compare your SEO metrics against industry averages</p>
          </div>
          {metrics.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="size-3.5" />
              Export Report
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input placeholder="Industry niche (e.g., SaaS)" value={niche} onChange={(e) => setNiche(e.target.value)} />
              <Input placeholder="Your site URL (optional)" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="font-mono text-xs" />
              <Button onClick={runBenchmark} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
                Run Benchmark
              </Button>
            </div>
          </CardContent>
        </Card>

        {(metrics.length > 0 || goals.length > 0) && (
          <div className="flex gap-1 border-b border-border">
            {([
              { key: 'benchmark', label: 'Benchmark' },
              { key: 'history', label: 'Historical' },
              { key: 'goals', label: `Goals (${goals.length})` },
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
        )}

        {/* Benchmark */}
        {activeTab === 'benchmark' && metrics.length > 0 && (
          <div className="space-y-2">
            {metrics.map((m) => {
              const level = getPerformanceLevel(m);
              const pct = m.higherIsBetter
                ? Math.min((m.yourValue / m.topPerformer) * 100, 100)
                : Math.min((m.topPerformer / m.yourValue) * 100, 100);
              return (
                <Card key={m.name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className={`text-[10px] ${perfColor[level]}`}>
                          {level === 'above' ? '▲ Above avg' : level === 'below' ? '▼ Below avg' : '— Average'}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${perfColor[level]}`}>
                        {m.yourValue.toLocaleString()}{m.unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30 mb-2">
                      <div
                        className={`h-full rounded-full ${level === 'above' ? 'bg-green-500' : level === 'average' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Industry avg: {m.industryAvg.toLocaleString()}{m.unit}</span>
                      <span>Top: {m.topPerformer.toLocaleString()}{m.unit}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card className="border-primary/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Overall Performance</p>
                <p className="text-2xl font-bold">
                  {metrics.filter((m) => getPerformanceLevel(m) === 'above').length}/{metrics.length}
                  <span className="text-sm text-muted-foreground ml-1">metrics above average</span>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Historical */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="size-4" />
                6-Month Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-40 px-2">
                {history.map((h) => {
                  const max = Math.max(...history.map((p) => p.score));
                  const prev = history[history.indexOf(h) - 1];
                  const change = prev ? h.score - prev.score : 0;
                  return (
                    <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-0.5 text-[9px]">
                        {change > 0 ? <TrendingUp className="size-2.5 text-green-400" /> : change < 0 ? <TrendingDown className="size-2.5 text-red-400" /> : null}
                        <span className={change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                          {h.score}
                        </span>
                      </div>
                      <div
                        className={`w-full rounded-t transition-colors ${h.score >= 70 ? 'bg-green-500/60 hover:bg-green-500' : h.score >= 50 ? 'bg-yellow-500/60 hover:bg-yellow-500' : 'bg-red-500/60 hover:bg-red-500'}`}
                        style={{ height: `${(h.score / max) * 85}%` }}
                      />
                      <span className="text-[8px] text-muted-foreground">{h.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-center text-muted-foreground">
                Growth: <span className="text-green-400 font-bold">+{history[history.length - 1].score - history[0].score} points</span> over 6 months
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-4" />
                  Add KPI Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Goal name" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className="flex-1" />
                  <Input placeholder="Target value" type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} className="w-28" />
                  <Button size="sm" onClick={addGoal}>Add</Button>
                </div>
              </CardContent>
            </Card>

            {goals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No goals set. Add KPI targets above.</p>
                </CardContent>
              </Card>
            ) : (
              goals.map((g) => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <Card key={g.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{g.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 ${g.alertEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => toggleAlert(g.id)}
                          >
                            <Bell className="size-3" />
                          </Button>
                          <button onClick={() => removeGoal(g.id)} className="text-red-400 hover:text-red-300 text-xs">×</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-muted/30">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-bold">{pct}%</span>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                        <span>Current: {g.current.toLocaleString()}</span>
                        <span>Target: {g.target.toLocaleString()}</span>
                        <span>Deadline: {g.deadline}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
