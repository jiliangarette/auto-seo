import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Gauge,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  issues: string[];
}

interface WeeklyChange {
  week: string;
  score: number;
}

interface ImprovementItem {
  action: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  estimatedGain: number;
}

interface ScoringResult {
  overallScore: number;
  categories: CategoryScore[];
  weeklyHistory: WeeklyChange[];
  improvements: ImprovementItem[];
  summary: string;
}

const impactColors = {
  high: 'text-red-400 bg-red-950/30',
  medium: 'text-yellow-400 bg-yellow-950/30',
  low: 'text-blue-400 bg-blue-950/30',
};

export default function SeoScoringDashboard() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);

  const analyze = async () => {
    if (!domain.trim()) {
      toast.error('Enter a domain');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO scoring expert. Return JSON only.' },
          { role: 'user', content: `Generate a comprehensive SEO health score for: ${domain}

Return JSON:
{
  "overallScore": number(0-100),
  "categories": [
    { "name": "Technical SEO", "score": number(0-25), "maxScore": 25, "issues": ["issue1"] },
    { "name": "Content Quality", "score": number(0-25), "maxScore": 25, "issues": ["issue1"] },
    { "name": "Link Profile", "score": number(0-25), "maxScore": 25, "issues": ["issue1"] },
    { "name": "Page Speed", "score": number(0-25), "maxScore": 25, "issues": ["issue1"] }
  ],
  "weeklyHistory": [
    { "week": "Week 1", "score": number },
    { "week": "Week 2", "score": number },
    { "week": "Week 3", "score": number },
    { "week": "Week 4", "score": number }
  ],
  "improvements": [
    { "action": "specific action", "impact": "high"|"medium"|"low", "category": "category name", "estimatedGain": number(1-15) }
  ],
  "summary": "brief analysis"
}

Generate 8-12 improvement items sorted by impact. Make scores realistic.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Score calculated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="size-6" />
            SEO Scoring Dashboard
          </h1>
          <p className="text-muted-foreground">Unified SEO health score with actionable improvement roadmap</p>
        </div>

        <Card>
          <CardContent className="pt-6 flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourdomain.com"
              className="font-mono text-xs"
            />
            <Button onClick={analyze} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Calculate Score
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Overall Score */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative size-28 shrink-0">
                    <svg className="size-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="currentColor" strokeWidth="8"
                        strokeDasharray={`${result.overallScore * 2.64} 264`}
                        strokeLinecap="round"
                        className={getScoreColor(result.overallScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}</span>
                      <span className="text-[10px] text-muted-foreground">/100</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Overall SEO Health</p>
                    <p className="text-xs text-muted-foreground">{result.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <div className="grid gap-4 md:grid-cols-4">
              {result.categories.map((cat) => {
                const pct = Math.round((cat.score / cat.maxScore) * 100);
                return (
                  <Card key={cat.name}>
                    <CardContent className="pt-4">
                      <p className="text-xs font-medium mb-2">{cat.name}</p>
                      <div className="flex items-end gap-1 mb-1">
                        <span className={`text-xl font-bold ${getScoreColor(pct)}`}>{cat.score}</span>
                        <span className="text-xs text-muted-foreground mb-0.5">/{cat.maxScore}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30">
                        <div className={`h-full rounded-full ${getScoreBg(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      {cat.issues.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {cat.issues.slice(0, 2).map((issue, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground truncate">• {issue}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Weekly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-24">
                  {result.weeklyHistory.map((week, idx) => {
                    const prev = idx > 0 ? result.weeklyHistory[idx - 1].score : week.score;
                    const change = week.score - prev;
                    return (
                      <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-0.5 text-[10px]">
                          {change > 0 ? (
                            <TrendingUp className="size-2.5 text-green-400" />
                          ) : change < 0 ? (
                            <TrendingDown className="size-2.5 text-red-400" />
                          ) : (
                            <Minus className="size-2.5 text-muted-foreground" />
                          )}
                          <span className={change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        </div>
                        <div className="w-full flex justify-center">
                          <div
                            className={`w-8 rounded-t ${getScoreBg(week.score)}`}
                            style={{ height: `${Math.max(week.score * 0.8, 8)}px` }}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground">{week.week}</p>
                        <p className="text-xs font-medium">{week.score}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Roadmap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Improvement Roadmap (sorted by impact)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.improvements.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.action}</p>
                        <p className="text-[10px] text-muted-foreground">{item.category}</p>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${impactColors[item.impact]}`}>
                        {item.impact}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <ArrowRight className="size-3 text-green-400" />
                        <span className="text-xs font-bold text-green-400">+{item.estimatedGain}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
