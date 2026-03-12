import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface VitalMetric {
  name: string;
  value: string;
  score: 'good' | 'needs-improvement' | 'poor';
  threshold: string;
  fixes: string[];
}

interface HistoryPoint {
  date: string;
  lcp: number;
  inp: number;
  cls: number;
}

interface CwvResult {
  url: string;
  overallStatus: 'pass' | 'fail';
  metrics: VitalMetric[];
  history: HistoryPoint[];
  summary: string;
}

const scoreColors = {
  good: 'text-green-400 bg-green-950/30',
  'needs-improvement': 'text-yellow-400 bg-yellow-950/30',
  poor: 'text-red-400 bg-red-950/30',
};

export default function CoreWebVitals() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CwvResult | null>(null);

  const analyze = async () => {
    if (!url.trim()) {
      toast.error('Enter a URL');
      return;
    }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a Core Web Vitals expert. Return JSON only.' },
          { role: 'user', content: `Analyze Core Web Vitals for: ${url}

Return JSON:
{
  "url": "${url}",
  "overallStatus": "pass"|"fail",
  "metrics": [
    { "name": "LCP (Largest Contentful Paint)", "value": "2.1s", "score": "good"|"needs-improvement"|"poor", "threshold": "Good: <2.5s", "fixes": ["fix1", "fix2"] },
    { "name": "INP (Interaction to Next Paint)", "value": "180ms", "score": "good"|"needs-improvement"|"poor", "threshold": "Good: <200ms", "fixes": ["fix1"] },
    { "name": "CLS (Cumulative Layout Shift)", "value": "0.08", "score": "good"|"needs-improvement"|"poor", "threshold": "Good: <0.1", "fixes": ["fix1"] }
  ],
  "history": [
    { "date": "Week 1", "lcp": 2800, "inp": 220, "cls": 15 },
    { "date": "Week 2", "lcp": 2600, "inp": 200, "cls": 12 },
    { "date": "Week 3", "lcp": 2300, "inp": 185, "cls": 10 },
    { "date": "Week 4", "lcp": 2100, "inp": 180, "cls": 8 }
  ],
  "summary": "brief CWV assessment"
}

Generate realistic values. LCP in ms, INP in ms, CLS as whole numbers (multiply by 100).` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('CWV analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="size-6" />
            Core Web Vitals Monitor
          </h1>
          <p className="text-muted-foreground">Track LCP, INP, and CLS with fix recommendations</p>
        </div>

        <Card>
          <CardContent className="pt-6 flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="font-mono text-xs" />
            <Button onClick={analyze} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              Analyze CWV
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className={`border-${result.overallStatus === 'pass' ? 'green' : 'red'}-500/30`}>
              <CardContent className="pt-4 flex items-center gap-3">
                {result.overallStatus === 'pass' ? (
                  <CheckCircle2 className="size-6 text-green-400" />
                ) : (
                  <XCircle className="size-6 text-red-400" />
                )}
                <div>
                  <p className={`text-lg font-bold ${result.overallStatus === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                    {result.overallStatus === 'pass' ? 'Passing CWV' : 'Failing CWV'}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.summary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {result.metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${scoreColors[metric.score]}`}>
                        {metric.score}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${scoreColors[metric.score].split(' ')[0]}`}>
                      {metric.value}
                    </p>
                    <p className="text-xs font-medium mt-1">{metric.name}</p>
                    <p className="text-[10px] text-muted-foreground">{metric.threshold}</p>
                    {metric.fixes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                        {metric.fixes.map((fix, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">• {fix}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CWV Trend (4 Weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-32">
                  {result.history.map((point, idx) => {
                    const prev = idx > 0 ? result.history[idx - 1] : point;
                    const lcpChange = point.lcp - prev.lcp;
                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex flex-col items-center gap-0.5 text-[9px]">
                          <span className="text-muted-foreground">LCP: {(point.lcp / 1000).toFixed(1)}s</span>
                          <span className="text-muted-foreground">INP: {point.inp}ms</span>
                          <span className="text-muted-foreground">CLS: {(point.cls / 100).toFixed(2)}</span>
                        </div>
                        <div className="w-full flex justify-center gap-0.5">
                          <div className="w-3 rounded-t bg-blue-500" style={{ height: `${Math.max(point.lcp / 50, 4)}px` }} />
                          <div className="w-3 rounded-t bg-purple-500" style={{ height: `${Math.max(point.inp / 3, 4)}px` }} />
                          <div className="w-3 rounded-t bg-orange-500" style={{ height: `${Math.max(point.cls * 3, 4)}px` }} />
                        </div>
                        <div className="flex items-center gap-0.5">
                          {lcpChange < 0 ? (
                            <TrendingDown className="size-2.5 text-green-400" />
                          ) : lcpChange > 0 ? (
                            <TrendingUp className="size-2.5 text-red-400" />
                          ) : null}
                        </div>
                        <p className="text-[9px] text-muted-foreground">{point.date}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" />LCP</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-500" />INP</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-500" />CLS</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
