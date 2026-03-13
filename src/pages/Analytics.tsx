import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity, Calendar } from 'lucide-react';

interface RankEntry { keyword_id: string; position: number; checked_at: string }
interface AnalysisEntry { score: number | null; created_at: string; url: string }

export default function Analytics() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const projectIds = projects?.map((p) => p.id) ?? [];

  const { data: rankHistory } = useQuery({
    queryKey: ['analytics-rank', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_history')
        .select('keyword_id, position, checked_at')
        .order('checked_at', { ascending: true });
      if (error) throw error;
      return data as RankEntry[];
    },
    enabled: !!user,
  });

  const { data: analyses } = useQuery({
    queryKey: ['analytics-analyses', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data, error } = await supabase
        .from('analyses')
        .select('score, created_at, url')
        .in('project_id', projectIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AnalysisEntry[];
    },
    enabled: !!projects?.length,
  });

  const { data: keywords } = useQuery({
    queryKey: ['analytics-keywords', user?.id],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data, error } = await supabase
        .from('keywords')
        .select('id, keyword, position')
        .in('project_id', projectIds);
      if (error) throw error;
      return data as { id: string; keyword: string; position: number | null }[];
    },
    enabled: !!projects?.length,
  });

  // Keyword ranking trends — group by keyword
  const rankTrends = useMemo(() => {
    if (!rankHistory || !keywords) return [];
    const kwMap = new Map(keywords.map((k) => [k.id, k.keyword]));
    const grouped = new Map<string, { date: string; position: number }[]>();

    for (const entry of rankHistory) {
      const name = kwMap.get(entry.keyword_id);
      if (!name) continue;
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push({
        date: new Date(entry.checked_at).toLocaleDateString(),
        position: entry.position,
      });
    }

    return Array.from(grouped.entries())
      .map(([keyword, data]) => ({ keyword, data }))
      .slice(0, 8);
  }, [rankHistory, keywords]);

  // Score vs rank correlation
  const correlation = useMemo(() => {
    if (!analyses) return [];
    return analyses
      .filter((a) => a.score != null)
      .map((a) => ({
        url: a.url,
        score: a.score!,
        date: new Date(a.created_at).toLocaleDateString(),
      }));
  }, [analyses]);

  // Health score timeline
  const healthTimeline = useMemo(() => {
    if (!analyses) return [];
    const byMonth = new Map<string, number[]>();
    for (const a of analyses) {
      if (a.score == null) continue;
      const month = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push(a.score);
    }
    return Array.from(byMonth.entries()).map(([month, scores]) => ({
      month,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));
  }, [analyses]);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = analyses?.filter((a) => now - new Date(a.created_at).getTime() < oneWeek) ?? [];
    const lastWeek = analyses?.filter((a) => {
      const diff = now - new Date(a.created_at).getTime();
      return diff >= oneWeek && diff < 2 * oneWeek;
    }) ?? [];

    const thisRank = rankHistory?.filter((r) => now - new Date(r.checked_at).getTime() < oneWeek) ?? [];
    const lastRank = rankHistory?.filter((r) => {
      const diff = now - new Date(r.checked_at).getTime();
      return diff >= oneWeek && diff < 2 * oneWeek;
    }) ?? [];

    const avgScore = (entries: AnalysisEntry[]) =>
      entries.length
        ? Math.round(entries.reduce((s, e) => s + (e.score ?? 0), 0) / entries.length)
        : null;

    const avgPos = (entries: RankEntry[]) =>
      entries.length
        ? Math.round((entries.reduce((s, e) => s + e.position, 0) / entries.length) * 10) / 10
        : null;

    return {
      thisWeekAnalyses: thisWeek.length,
      lastWeekAnalyses: lastWeek.length,
      thisWeekAvgScore: avgScore(thisWeek),
      lastWeekAvgScore: avgScore(lastWeek),
      thisWeekAvgPos: avgPos(thisRank),
      lastWeekAvgPos: avgPos(lastRank),
      thisWeekCheckins: thisRank.length,
      lastWeekCheckins: lastRank.length,
    };
  }, [analyses, rankHistory]);

  const scoreColor = (s: number) => (s >= 70 ? 'text-green-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">Track trends, correlations, and progress over time</p>
        </div>

        {/* Weekly Summary */}
        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="size-4" />
              Weekly Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Analyses"
                current={weeklySummary.thisWeekAnalyses}
                previous={weeklySummary.lastWeekAnalyses}
              />
              <SummaryCard
                label="Avg SEO Score"
                current={weeklySummary.thisWeekAvgScore}
                previous={weeklySummary.lastWeekAvgScore}
              />
              <SummaryCard
                label="Avg Position"
                current={weeklySummary.thisWeekAvgPos}
                previous={weeklySummary.lastWeekAvgPos}
                lowerIsBetter
              />
              <SummaryCard
                label="Rank Check-ins"
                current={weeklySummary.thisWeekCheckins}
                previous={weeklySummary.lastWeekCheckins}
              />
            </div>
          </CardContent>
        </Card>

        {/* Keyword Ranking Trends */}
        <Card className="border-border/30 bg-card/40">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4" />
              Keyword Ranking Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankTrends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rank history yet. Check in keyword positions to see trends.</p>
            ) : (
              <div className="space-y-3">
                {rankTrends.map(({ keyword, data }) => {
                  const first = data[0]?.position;
                  const last = data[data.length - 1]?.position;
                  const change = first && last ? first - last : 0;
                  return (
                    <div key={keyword} className="rounded-md border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{keyword}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Pos {last ?? '—'}
                          </span>
                          {change !== 0 && (
                            <span className={`text-xs font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {change > 0 ? `+${change}` : change}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Mini bar chart */}
                      <div className="flex items-end gap-px h-8">
                        {data.map((d, i) => {
                          const maxPos = Math.max(...data.map((x) => x.position), 1);
                          const height = Math.max(10, 100 - (d.position / maxPos) * 100);
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition-colors"
                              style={{ height: `${height}%` }}
                              title={`${d.date}: Position ${d.position}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Content Performance */}
          <Card className="border-border/30 bg-card/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="size-4" />
                Content Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {correlation.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run analyses to see performance data.</p>
              ) : (
                <div className="space-y-2">
                  {correlation.slice(-10).map((c, i) => (
                    <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded ${i % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                      <div>
                        <p className="text-xs font-medium truncate max-w-[200px]">{c.url}</p>
                        <p className="text-[10px] text-muted-foreground">{c.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.score >= 70 ? 'bg-green-400' : c.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${scoreColor(c.score)}`}>{c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Score Timeline */}
          <Card className="border-border/30 bg-card/40">
            <CardHeader>
              <CardTitle className="text-sm">SEO Health Score Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {healthTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {healthTimeline.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{h.month}</span>
                      <div className="flex-1 h-5 rounded bg-zinc-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded transition-all ${h.avg >= 70 ? 'bg-green-400/70' : h.avg >= 40 ? 'bg-yellow-400/70' : 'bg-red-400/70'}`}
                          style={{ width: `${h.avg}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                          {h.avg} ({h.count} analyses)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  current,
  previous,
  lowerIsBetter,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  lowerIsBetter?: boolean;
}) {
  const diff = current != null && previous != null ? current - previous : null;
  const improved = diff != null ? (lowerIsBetter ? diff < 0 : diff > 0) : null;

  return (
    <div className="rounded-md border border-border/50 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{current ?? '—'}</p>
      {diff != null && (
        <p className={`text-xs ${improved ? 'text-green-400' : 'text-red-400'}`}>
          {diff > 0 ? '+' : ''}{lowerIsBetter ? (diff * -1 > 0 ? '+' : '') + String(Math.abs(diff)) : diff} vs last week
        </p>
      )}
    </div>
  );
}
