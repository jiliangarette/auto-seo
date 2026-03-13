import { useState } from 'react';
import { openai } from '@/integrations/openai/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Trend {
  topic: string;
  momentum: 'rising' | 'stable' | 'declining';
  opportunity: 'high' | 'medium' | 'low';
  description: string;
  actionItem: string;
}

interface SeasonalPattern {
  period: string;
  trend: string;
  recommendation: string;
}

interface TrendResult {
  niche: string;
  summary: string;
  trends: Trend[];
  seasonalPatterns: SeasonalPattern[];
  competitorComparison: { competitor: string; trendAdoption: string; gap: string }[];
  predictions: string[];
}

const momentumColors: Record<string, string> = {
  rising: 'text-green-400',
  stable: 'text-yellow-400',
  declining: 'text-red-400',
};

export default function SeoTrendAnalyzer() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrendResult | null>(null);

  const analyze = async () => {
    if (!niche.trim()) { toast.error('Enter niche'); return; }
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an SEO trend analysis expert. Return JSON only.' },
          { role: 'user', content: `Analyze SEO trends for niche: ${niche}\n\nReturn JSON:\n{\n  "niche": "${niche}",\n  "summary": "trend analysis overview",\n  "trends": [\n    { "topic": "trend topic", "momentum": "rising"|"stable"|"declining", "opportunity": "high"|"medium"|"low", "description": "trend details", "actionItem": "what to do" }\n  ],\n  "seasonalPatterns": [\n    { "period": "time period", "trend": "what happens", "recommendation": "how to capitalize" }\n  ],\n  "competitorComparison": [\n    { "competitor": "competitor name", "trendAdoption": "how they use this trend", "gap": "your opportunity" }\n  ],\n  "predictions": ["prediction 1", "prediction 2", "prediction 3"]\n}\n\nGenerate 6 trends, 4 seasonal patterns, 3 competitor comparisons, and 4 predictions.` },
        ],
      });
      const raw = response.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      setResult(JSON.parse(cleaned));
      toast.success('Trend analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-6" />
            SEO Trend Analyzer
          </h1>
          <p className="text-muted-foreground">Identify emerging SEO trends and seasonal opportunities</p>
        </div>

        <Card className="border-border/30 bg-card/40">
          <CardContent className="pt-6 space-y-3">
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Industry or niche (e.g., E-commerce fashion)" />
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Analyze Trends
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-primary/20">
              <CardContent className="pt-4">
                <h2 className="text-sm font-bold">Trends: {result.niche}</h2>
                <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Emerging Trends ({result.trends.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.trends.map((t, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">{t.topic}</span>
                        <span className={`text-[9px] font-medium ${momentumColors[t.momentum]}`}>{t.momentum}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.opportunity === 'high' ? 'bg-green-950/30 text-green-400' : t.opportunity === 'medium' ? 'bg-yellow-950/30 text-yellow-400' : 'bg-muted/30 text-muted-foreground'}`}>{t.opportunity} opportunity</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <p className="text-[10px] text-primary/80 mt-1">{t.actionItem}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Seasonal Patterns</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.seasonalPatterns.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-md border border-border/50 p-2.5">
                      <span className="text-xs font-bold text-primary shrink-0">{s.period}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{s.trend}</p>
                        <p className="text-[10px] text-muted-foreground">{s.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Competitor Trend Comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.competitorComparison.map((c, idx) => (
                    <div key={idx} className="rounded-md border border-border/50 p-2.5">
                      <p className="text-xs font-bold">{c.competitor}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{c.trendAdoption}</p>
                      <p className="text-[10px] text-green-400 mt-1">Gap: {c.gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Predictions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.predictions.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
